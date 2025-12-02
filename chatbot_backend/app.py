# chatbot_backend/app.py
# pyright: reportCallIssue=false

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import logging
import time
from datetime import datetime, timedelta

# ==== AUTH / DB IMPORTS ====
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    decode_token,  # for WebSocket JWT decoding
)
from werkzeug.utils import secure_filename
from flask_socketio import SocketIO, emit, join_room
from sqlalchemy import func

from models import (
    db,
    User,
    RevokedToken,
    ChatThread,
    ChatMessage,
    AiConversation,
    AiMessage,
)
from test import Assistant  # type: ignore

# -------------------------------------------------
# APP + CORS + SOCKET.IO
# -------------------------------------------------
app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------------------------------
# UPLOAD CONFIG
# -------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
PROFILE_DIR = os.path.join(UPLOAD_ROOT, "profiles")
CARD_DIR = os.path.join(UPLOAD_ROOT, "student_cards")

os.makedirs(PROFILE_DIR, exist_ok=True)
os.makedirs(CARD_DIR, exist_ok=True)

# --- PER-USER CHAT-HISTORY FILES ROOT ---
CHAT_HISTORY_DIR = os.path.join(BASE_DIR, "chat_histories")
os.makedirs(CHAT_HISTORY_DIR, exist_ok=True)

# -------------------------------------------------
# DB & JWT CONFIG
# -------------------------------------------------
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "change-this-secret-key"

# Access tokens last 8 hours (session-like)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ---------------------------------------
# ROLE MAPPING (Frontend → DB role)
# ---------------------------------------
ROLE_MAPPING = {
    "student": "STUDENT",
    "student-organizer": "STUDENT_ORGANIZER",
    "society-head": "SOCIETY_HEAD",
    "social-media-manager": "SOCIAL_MEDIA",
    "consultant": "CONSULTANT",
    "sub-admin": "SUB_ADMIN",
}


# ---------------------------------------
# HELPER: JOINT ROLE CHECKER
# ---------------------------------------
def require_roles(*allowed_roles):
    """
    Decorator to restrict route access by roles.
    Usage:
        @require_roles("ADMIN", "SUB_ADMIN")
        def route_fn():
            ...
    """

    def wrapper(fn):
        from functools import wraps

        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            jwt_data = get_jwt()
            caller_role = jwt_data.get("role")

            if caller_role not in allowed_roles:
                return jsonify({"error": "Not authorized"}), 403

            return fn(*args, **kwargs)

        return decorated

    return wrapper


# ---- JWT blacklist / blocklist check ----
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    if not jti:
        return False
    return RevokedToken.query.filter_by(jti=jti).first() is not None


# -------------------------------------------------
# LOGGING
# -------------------------------------------------
logging.basicConfig(
    filename="api_errors.log",
    level=logging.WARNING,
    format="%(asctime)s - %(message)s",
)

# -------------------------------------------------
# CHATBOT INIT
# -------------------------------------------------
chatbot = Assistant()

# Load ONLY the university knowledge here
uni_data = None
try:
    uni_data = chatbot.load_file("university_data.txt")
    print("Data file 'university_data.txt' loaded successfully")
except Exception as e:  # noqa: BLE001
    logging.error(f"Data loading error: {str(e)}")
    print(f"Error loading data file: {str(e)}")


# -------------------------------------------------
# CREATE TABLES + DEFAULT ADMIN
# -------------------------------------------------
with app.app_context():
    db.create_all()

    admin_email = "admin@pafiast.com"
    existing_admin = User.query.filter_by(email=admin_email).first()
    if not existing_admin:
        admin = User(
            full_name="Main Admin",
            email=admin_email,
            password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
            role="ADMIN",
            is_approved=True,
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Default admin created: admin@pafiast.com / admin123")
    else:
        print("✅ Admin already exists")


# -------------------------------------------------
# SIMPLE HEALTH CHECK FOR FRONTEND BANNER
# -------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    """Used by the React app to know if the API is alive."""
    return jsonify({"status": "ok"}), 200


# -------------------------------------------------
# HELPERS: USER-SPECIFIC CHAT CONTEXT + FILE HISTORY
# -------------------------------------------------
def build_user_history_context(user_id: int, max_pairs: int = 10) -> str:
    """
    Build a short textual history for this user from AiMessage DB,
    to be used as extra context for the Assistant.

    We fetch the last ~max_pairs user+ai messages and format them like:

      User: ...
      Assistant: ...
    """
    if not user_id:
        return ""

    msgs = (
        db.session.query(AiMessage)
        .join(AiConversation, AiConversation.id == AiMessage.conversation_id)
        .filter(AiConversation.user_id == user_id)
        .order_by(AiMessage.created_at.desc(), AiMessage.id.desc())
        .limit(max_pairs * 2)
        .all()
    )

    if not msgs:
        return ""

    # Reverse → chronological order
    msgs = list(reversed(msgs))

    lines = []
    for m in msgs:
        role = "User" if m.sender == "user" else "Assistant"
        text = (m.text or "").strip()
        if len(text) > 400:
            text = text[:400] + "…"
        lines.append(f"{role}: {text}")

    return "\n".join(lines)


def append_user_history_file(user_id: int, user_text: str, ai_text: str) -> None:
    """
    Append this exchange to a per-user chat history text file:
      chat_histories/chat_history_<user_id>.txt
    """
    if not user_id:
        return

    try:
        os.makedirs(CHAT_HISTORY_DIR, exist_ok=True)
        path = os.path.join(CHAT_HISTORY_DIR, f"chat_history_{user_id}.txt")

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        with open(path, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] USER: {user_text}\n")
            f.write(f"[{timestamp}] AI  : {ai_text}\n\n")
    except Exception as exc:  # noqa: BLE001
        logging.warning(f"Failed to append user history file: {exc}")


# -------------------------------------------------
# CHATBOT ENDPOINT (AI BOT) + PER-USER HISTORY
# -------------------------------------------------
@app.route("/api/chat", methods=["POST"])
@jwt_required(optional=True)
def chat():
    """
    Main AI chat endpoint.

    Reply sources (as you requested):
      1) University data (university_data.txt) via semantic search.
      2) The app's own DB – current user's profile (name, role, dept, semester).
      3) Per-user conversation history stored in AiConversation/AiMessage (and a
         per-user chat_history_<user_id>.txt file).

    No other .txt persona files are used for context here.
    """
    try:
        data = request.get_json(force=True) or {}
        if "message" not in data:
            return jsonify({"error": "Missing 'message' in request"}), 400

        user_message = (data.get("message") or "").strip()
        if not user_message:
            return jsonify({"error": "Empty message"}), 400

        conversation_id = data.get("conversationId")
        identity = get_jwt_identity()
        user_id = int(identity) if identity is not None else None

        # Current user object from DB (if logged in)
        current_user = User.query.get(user_id) if user_id else None

        conversation = None

        # ---------- For logged-in users: prepare conversation + save user message ----------
        if user_id:
            if conversation_id:
                conversation = (
                    AiConversation.query.filter_by(
                        id=conversation_id, user_id=user_id
                    ).first()
                )

            if conversation is None:
                # Create new conversation; first user message is used as title
                conversation = AiConversation(
                    user_id=user_id,
                    title=user_message[:80],
                )
                db.session.add(conversation)
                db.session.flush()  # so conversation.id exists

            # save user message (not committed yet)
            db.session.add(
                AiMessage(
                    conversation_id=conversation.id,
                    sender="user",
                    text=user_message,
                )
            )

        # ---------- CONTEXT: SYSTEM INSTRUCTION + UNIVERSITY DATA + USER PROFILE + USER HISTORY ----------

        # 1) Strong system-level context to avoid "Haseeb" issue
        system_context_lines = [
            "You are the official Ask-PAFIAST AI assistant.",
            "Use ONLY these sources when answering:",
            "  1) University knowledge from PAF-IAST (provided below).",
            "  2) The current user's profile and role from the database (if given).",
            "  3) The previous conversation history shown below, which belongs ONLY to this logged-in user.",
            "",
            "Important:",
            "  - If any older notes or texts claim the user's name is 'Haseeb', IGNORE them completely.",
            "  - Never assume the user is 'Haseeb' unless it is explicitly stated in the current user profile.",
            "  - Prefer the user's profile (name, role, department, semester) from the DB over any other source.",
        ]
        system_context = "\n".join(system_context_lines)

        # 2) University data knowledge via semantic search
        kb_context = ""
        try:
            kb_context = chatbot.semantic_search(user_message)
        except Exception as exc:  # noqa: BLE001
            logging.warning(f"semantic_search error: {exc}")
            kb_context = ""

        # 3) User profile context from DB
        user_profile_context = ""
        if current_user:
            parts = (current_user.full_name or "").split()
            first_name = parts[0] if len(parts) > 0 else ""
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

            user_profile_context_lines = [
                "Current user profile from database:",
                f"- Full name: {current_user.full_name or 'N/A'}",
                f"- First name (preferred to use): {first_name or 'N/A'}",
                f"- Last name: {last_name or 'N/A'}",
                f"- Role: {current_user.role or 'N/A'}",
                f"- Department: {current_user.department or 'N/A'}",
                f"- Semester: {current_user.semester or 'N/A'}",
                "",
                "When you need the user's name, call them by their first name above.",
            ]
            user_profile_context = "\n".join(user_profile_context_lines)

        # 4) Per-user conversational history (only for logged-in users)
        history_context = build_user_history_context(user_id) if user_id else ""

        # Compose final context
        full_context_parts = [system_context]

        if kb_context:
            full_context_parts.append("University knowledge:\n" + kb_context)
        if user_profile_context:
            full_context_parts.append(user_profile_context)
        if history_context:
            full_context_parts.append(
                "Previous conversation with this user:\n" + history_context
            )

        full_context = "\n\n".join(full_context_parts)

        # ---------- Get AI response ----------
        response = chatbot.get_response(user_message, full_context)

        # ---------- Save AI reply to DB + per-user txt ----------
        if user_id and conversation:
            db.session.add(
                AiMessage(
                    conversation_id=conversation.id,
                    sender="ai",
                    text=response,
                )
            )
            db.session.commit()

            # also keep a per-user chat_history_<id>.txt file
            append_user_history_file(user_id, user_message, response)

        # NOTE: We no longer call chatbot.save_conversation(...) here,
        # to avoid polluting a global text file with old persona/name info.

        return jsonify(
            {
                "response": response,
                "answer": response,
                "reply": response,
                "message": response,
                "text": response,
                "conversationId": conversation.id if conversation else None,
            }
        )

    except Exception as e:  # noqa: BLE001
        db.session.rollback()
        logging.error(f"API error: {str(e)}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# -------------------------------------------------
# AI CHAT HISTORY ENDPOINTS (for 1 year) – OLD (per conversation)
# -------------------------------------------------
@app.route("/api/ai/conversations", methods=["GET"])
@jwt_required()
def list_ai_conversations():
    """List current user's AI conversations from last 1 year."""
    identity = get_jwt_identity()
    user_id = int(identity)

    one_year_ago = datetime.utcnow() - timedelta(days=365)

    conversations = (
        AiConversation.query.filter(
            AiConversation.user_id == user_id,
            AiConversation.created_at >= one_year_ago,
        )
        .order_by(AiConversation.updated_at.desc())
        .all()
    )

    result = []
    for c in conversations:
        last_msg = (
            AiMessage.query.filter_by(conversation_id=c.id)
            .order_by(AiMessage.created_at.desc())
            .first()
        )
        result.append(
            {
                "id": c.id,
                "title": c.title or "Conversation",
                "createdAt": c.created_at.isoformat()
                if c.created_at
                else None,
                "updatedAt": c.updated_at.isoformat()
                if c.updated_at
                else None,
                "lastSnippet": (last_msg.text[:120] + "…") if last_msg else "",
            }
        )

    return jsonify({"conversations": result})


@app.route("/api/ai/conversations/<int:conv_id>", methods=["GET"])
@jwt_required()
def get_ai_conversation(conv_id: int):
    """Full messages for a single AI conversation."""
    identity = get_jwt_identity()
    user_id = int(identity)

    conversation = (
        AiConversation.query.filter_by(id=conv_id, user_id=user_id).first()
    )
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    messages = (
        AiMessage.query.filter_by(conversation_id=conversation.id)
        .order_by(AiMessage.created_at.asc())
        .all()
    )

    return jsonify(
        {
            "conversationId": conversation.id,
            "title": conversation.title,
            "messages": [m.to_dict() for m in messages],
        }
    )


# -------------------------------------------------
# NEW: DATE-GROUPED AI HISTORY
# -------------------------------------------------
@app.route("/api/ai/history/dates", methods=["GET"])
@jwt_required()
def list_ai_history_dates():
    """
    Returns grouped history by date for current user.

    Response:
    {
      "dates": [
        {
          "date": "2025-11-29",
          "count": 12,
          "firstAt": "...",
          "lastAt": "...",
          "snippet": "First question of that day…"
        },
        ...
      ]
    }
    """
    identity = get_jwt_identity()
    user_id = int(identity)

    one_year_ago = datetime.utcnow() - timedelta(days=365)

    rows = (
        db.session.query(
            func.date(AiMessage.created_at).label("day"),
            func.count(AiMessage.id),
            func.min(AiMessage.created_at),
            func.max(AiMessage.created_at),
        )
        .join(AiConversation, AiConversation.id == AiMessage.conversation_id)
        .filter(
            AiConversation.user_id == user_id,
            AiMessage.created_at >= one_year_ago,
        )
        .group_by(func.date(AiMessage.created_at))
        .order_by(func.date(AiMessage.created_at).desc())
        .all()
    )

    result = []
    for day, count, first_at, last_at in rows:
        # normalize day to string
        if hasattr(day, "isoformat"):
            day_str = day.isoformat()
        else:
            day_str = str(day)

        # first user message of that day for snippet
        first_user_msg = (
            db.session.query(AiMessage)
            .join(AiConversation, AiConversation.id == AiMessage.conversation_id)
            .filter(
                AiConversation.user_id == user_id,
                func.date(AiMessage.created_at) == day,
                AiMessage.sender == "user",
            )
            .order_by(AiMessage.created_at.asc(), AiMessage.id.asc())
            .first()
        )
        snippet = (first_user_msg.text[:120] + "…") if first_user_msg else ""

        result.append(
            {
                "date": day_str,
                "count": int(count),
                "firstAt": first_at.isoformat() if first_at else None,
                "lastAt": last_at.isoformat() if last_at else None,
                "snippet": snippet,
            }
        )

    return jsonify({"dates": result})


@app.route("/api/ai/history/dates/<string:date_str>", methods=["GET"])
@jwt_required()
def get_ai_history_for_date(date_str: str):
    """
    Returns Q&A pairs for a given date.

    Response:
    {
      "date": "2025-11-29",
      "pairs": [
        {
          "id": 123,                 # prompt (user message) id
          "prompt": "user text",
          "reply": "assistant text",
          "promptCreatedAt": "...",
          "replyCreatedAt": "..."
        },
        ...
      ]
    }
    """
    identity = get_jwt_identity()
    user_id = int(identity)

    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)

    msgs = (
        db.session.query(AiMessage)
        .join(AiConversation, AiConversation.id == AiMessage.conversation_id)
        .filter(
            AiConversation.user_id == user_id,
            AiMessage.created_at >= start,
            AiMessage.created_at < end,
        )
        .order_by(AiMessage.created_at.asc(), AiMessage.id.asc())
        .all()
    )

    pairs = []
    i = 0
    while i < len(msgs):
        m = msgs[i]
        if m.sender == "user":
            reply_text = None
            reply_at = None

            if (
                i + 1 < len(msgs)
                and msgs[i + 1].sender == "ai"
                and msgs[i + 1].conversation_id == m.conversation_id
            ):
                reply_msg = msgs[i + 1]
                reply_text = reply_msg.text
                reply_at = (
                    reply_msg.created_at.isoformat()
                    if reply_msg.created_at
                    else None
                )

            pairs.append(
                {
                    "id": m.id,
                    "prompt": m.text,
                    "reply": reply_text,
                    "promptCreatedAt": m.created_at.isoformat()
                    if m.created_at
                    else None,
                    "replyCreatedAt": reply_at,
                }
            )
        i += 1

    return jsonify({"date": date_str, "pairs": pairs})


@app.route("/api/ai/history/dates/<string:date_str>", methods=["DELETE"])
@jwt_required()
def delete_ai_history_for_date(date_str: str):
    """
    Delete ALL AI messages for the current user for the given date.
    Also cleans up empty AiConversation rows afterwards.
    """
    identity = get_jwt_identity()
    user_id = int(identity)

    try:
        day = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)

    msgs = (
        AiMessage.query.join(AiConversation, AiConversation.id == AiMessage.conversation_id)
        .filter(
            AiConversation.user_id == user_id,
            AiMessage.created_at >= start,
            AiMessage.created_at < end,
        )
        .all()
    )

    if not msgs:
        return jsonify({"message": "No messages for that date"}), 200

    conv_ids = {m.conversation_id for m in msgs}

    for m in msgs:
        db.session.delete(m)

    db.session.flush()

    # Remove empty conversations
    for cid in conv_ids:
        remaining = AiMessage.query.filter_by(conversation_id=cid).first()
        if not remaining:
            conv = AiConversation.query.get(cid)
            if conv and conv.user_id == user_id:
                db.session.delete(conv)

    db.session.commit()
    return jsonify({"message": "All chats for that date deleted"})


@app.route("/api/ai/pairs/<int:prompt_id>", methods=["DELETE"])
@jwt_required()
def delete_ai_pair(prompt_id: int):
    """
    Delete one Q&A pair:
      - The user message with id = prompt_id (must be sender='user')
      - The immediate assistant reply message (if any) that comes after it
    Also deletes conversation if it becomes empty.
    """
    identity = get_jwt_identity()
    user_id = int(identity)

    prompt_msg = AiMessage.query.get(prompt_id)
    if not prompt_msg:
        return jsonify({"error": "Message not found"}), 404

    if prompt_msg.sender != "user":
        return jsonify({"error": "Only user prompts can be deleted via this endpoint"}), 400

    conv = AiConversation.query.get(prompt_msg.conversation_id)
    if not conv or conv.user_id != user_id:
        return jsonify({"error": "Not authorized for this message"}), 403

    # Find immediate assistant reply in same conversation after prompt
    reply_msg = (
        AiMessage.query.filter(
            AiMessage.conversation_id == conv.id,
            AiMessage.created_at >= prompt_msg.created_at,
            AiMessage.id != prompt_msg.id,
        )
        .order_by(AiMessage.created_at.asc(), AiMessage.id.asc())
        .first()
    )

    if reply_msg and reply_msg.sender == "ai":
        db.session.delete(reply_msg)

    db.session.delete(prompt_msg)
    db.session.flush()

    remaining = AiMessage.query.filter_by(conversation_id=conv.id).first()
    if not remaining:
        db.session.delete(conv)

    db.session.commit()
    return jsonify({"message": "Chat pair deleted"})


# -------------------------------------------------
# IMAGE HELPERS
# -------------------------------------------------
def save_image(file_storage, target_dir, prefix):
    if not file_storage:
        return None

    filename = secure_filename(file_storage.filename)
    if not filename:
        return None

    _, ext = os.path.splitext(filename)
    unique_name = f"{prefix}_{int(time.time())}{ext}"

    rel_path = os.path.join(os.path.basename(target_dir), unique_name)
    abs_path = os.path.join(UPLOAD_ROOT, rel_path)

    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    file_storage.save(abs_path)

    return rel_path.replace("\\", "/")


def delete_image(rel_path):
    """Delete an existing image file if present."""
    if not rel_path:
        return
    try:
        abs_path = os.path.join(UPLOAD_ROOT, rel_path)
        if os.path.exists(abs_path):
            os.remove(abs_path)
    except Exception as exc:  # noqa: BLE001
        logging.warning(f"Failed to delete image {rel_path}: {exc}")


# -------------------------------------------------
# SERVE UPLOADS
# -------------------------------------------------
@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_ROOT, filename)


# -------------------------------------------------
# AUTH: REGISTER (Student self-signup)
# -------------------------------------------------
@app.route("/api/register", methods=["POST"])
def register():
    profile_path = None
    card_path = None

    # Handle FormData (multipart) or JSON
    if request.content_type and "multipart/form-data" in request.content_type:
        form = request.form
        files = request.files

        full_name = form.get("full_name")
        email = form.get("email")
        password = form.get("password")
        department = form.get("department")
        semester = form.get("semester")
        cnic = form.get("cnic")
        contact = form.get("contact")
        student_id = form.get("student_id") or form.get("studentId")

        profile_file = files.get("profile_image")
        card_file = files.get("student_card_image")

        profile_path = save_image(profile_file, PROFILE_DIR, "profile")
        card_path = save_image(card_file, CARD_DIR, "card")

    else:
        data = request.get_json(force=True) or {}
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        department = data.get("department")
        semester = data.get("semester")
        cnic = data.get("cnic")
        contact = data.get("contact")
        student_id = data.get("student_id") or data.get("studentId")

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400

    # Optional: enforce unique student_id if provided
    if student_id and User.query.filter_by(student_id=student_id).first():
        return jsonify({"error": "Student ID already exists"}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        role="STUDENT",
        is_approved=False,
        department=department,
        semester=semester,
        cnic=cnic,
        contact=contact,
        student_id=student_id,
        profile_image_path=profile_path,
        student_card_image_path=card_path,
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration successful. Pending approval."}), 201


# -------------------------------------------------
# AUTH: LOGIN
# -------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_approved:
        return jsonify({"error": "Your account is pending approval."}), 403

    if user.is_blocked:
        return jsonify({"error": "Your account has been blocked."}), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role},
    )

    return jsonify(
        {"message": "Login successful", "token": access_token, "user": user.to_dict()}
    )


# -------------------------------------------------
# AUTH: ME
# -------------------------------------------------
@app.route("/api/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Split name safely
    parts = user.full_name.split()
    first_name = parts[0] if len(parts) > 0 else ""
    last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

    data = user.to_dict()
    data["firstName"] = first_name
    data["lastName"] = last_name
    data["position"] = user.position_post  # expose simple key frontend expects

    return jsonify({"user": data})


# -------------------------------------------------
# AUTH: UPDATE PROFILE
# -------------------------------------------------
@app.route("/api/me/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user:
        return jsonify({"error": "User not found"}), 404

    is_multipart = request.content_type and "multipart/form-data" in request.content_type

    if is_multipart:
        form = request.form
        files = request.files

        first = (form.get("firstName") or "").strip()
        last = (form.get("lastName") or "").strip()
        email = (form.get("email") or "").strip() or user.email

        department = form.get("department")
        semester = form.get("semester")
        cnic = form.get("cnic")
        contact = form.get("contact")
        student_id = form.get("studentId") or form.get("student_id")
        employee_id = form.get("employeeId") or form.get("employee_id")
        position = form.get("position")

        profile_file = files.get("profile_image")
    else:
        data = request.get_json(force=True) or {}
        first = (data.get("firstName") or "").strip()
        last = (data.get("lastName") or "").strip()
        email = (data.get("email") or "").strip() or user.email

        department = data.get("department")
        semester = data.get("semester")
        cnic = data.get("cnic")
        contact = data.get("contact")
        student_id = data.get("studentId") or data.get("student_id")
        employee_id = data.get("employeeId") or data.get("employee_id")
        position = data.get("position")
        profile_file = None

    # Update full name
    if first or last:
        full_name = f"{first} {last}".strip()
        if full_name:
            user.full_name = full_name

    # Update email (unique)
    if email and email != user.email:
        if User.query.filter(User.email == email, User.id != user.id).first():
            return jsonify({"error": "Email already in use"}), 409
        user.email = email

    # Optional fields
    user.department = department or None
    user.semester = semester or None
    user.cnic = cnic or None
    user.contact = contact or None

    # IDs + position
    user.student_id = student_id or None
    user.employee_id = employee_id or None
    user.position_post = position or None

    # Optional new profile image
    if profile_file:
        delete_image(user.profile_image_path)
        new_path = save_image(profile_file, PROFILE_DIR, "profile")
        user.profile_image_path = new_path

    db.session.commit()

    return jsonify({"message": "Profile updated", "user": user.to_dict()})


# -------------------------------------------------
# AUTH: CHANGE PASSWORD
# -------------------------------------------------
@app.route("/api/me/password", methods=["POST"])
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(force=True) or {}
    current = data.get("currentPassword")
    new = data.get("newPassword")
    confirm = data.get("confirmPassword")

    if not current or not new or not confirm:
        return jsonify({"error": "All password fields required"}), 400

    if not bcrypt.check_password_hash(user.password_hash, current):
        return jsonify({"error": "Current password incorrect"}), 400

    if new != confirm:
        return jsonify({"error": "Password confirmation mismatch"}), 400

    if len(new) < 6:
        return jsonify({"error": "Password too short"}), 400

    user.password_hash = bcrypt.generate_password_hash(new).decode("utf-8")
    db.session.commit()

    return jsonify({"message": "Password updated successfully"})


# -------------------------------------------------
# AUTH: LOGOUT
# -------------------------------------------------
@app.route("/api/logout", methods=["POST"])
@jwt_required()
def logout():
    jwt_data = get_jwt()
    jti = jwt_data.get("jti")

    if jti and not RevokedToken.query.filter_by(jti=jti).first():
        revoked = RevokedToken(jti=jti)
        db.session.add(revoked)
        db.session.commit()

    return jsonify({"message": "Logged out successfully"})


# ====================================================================================
# ========== ADMIN & SUB-ADMIN & STUDENT ORGANIZER – USER MANAGEMENT RULES ==========
# ====================================================================================

def can_user_manage(caller_role, target_role):
    """
    RULESET:

    ADMIN:
        - Can manage everyone except main ADMIN

    SUB_ADMIN:
        - Can manage all EXCEPT:
            * Admin
            * Cannot create another SUB_ADMIN

    STUDENT_ORGANIZER:
        - Can ONLY manage STUDENT accounts.
    """

    if caller_role == "ADMIN":
        return target_role != "ADMIN"

    if caller_role == "SUB_ADMIN":
        if target_role == "ADMIN":
            return False
        return True

    if caller_role == "STUDENT_ORGANIZER":
        return target_role == "STUDENT"

    return False


# -------------------------------------------------
# ADMIN / SUBADMIN / STUDENT ORGANIZER: CREATE USER
# -------------------------------------------------
@app.route("/api/admin/users", methods=["POST"])
@jwt_required()
def create_user():
    jwt_data = get_jwt()
    caller_role = jwt_data.get("role")

    if caller_role not in ("ADMIN", "SUB_ADMIN", "STUDENT_ORGANIZER"):
        return jsonify({"error": "Not authorized"}), 403

    data = request.get_json(force=True) or {}
    first = (data.get("firstName") or "").strip()
    last = (data.get("lastName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role_key = data.get("role")

    if not first or not last or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    if role_key not in ROLE_MAPPING:
        return jsonify({"error": "Invalid role"}), 400

    if caller_role == "SUB_ADMIN" and role_key == "sub-admin":
        return jsonify({"error": "Sub-Admin cannot create another Sub-Admin"}), 403

    if caller_role == "STUDENT_ORGANIZER" and role_key != "student":
        return jsonify({"error": "Student Organizer can only create students"}), 403

    db_role = ROLE_MAPPING[role_key]

    department = data.get("department") or None
    semester = data.get("semester") or None
    cnic = data.get("cnic") or None
    contact_number = data.get("contactNumber") or None

    student_id = (data.get("studentId") or "").strip()
    employee_id = (data.get("employeeId") or "").strip()
    position = (data.get("position") or "").strip()

    employee_roles = {
        "STUDENT_ORGANIZER",
        "SOCIETY_HEAD",
        "SOCIAL_MEDIA",
        "CONSULTANT",
        "SUB_ADMIN",
    }

    if db_role == "STUDENT":
        if not student_id:
            return jsonify({"error": "Student ID is required for students"}), 400
    elif db_role in employee_roles:
        if not employee_id or not position:
            return jsonify(
                {"error": "Employee ID and position are required for staff users"}
            ), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    if student_id and User.query.filter_by(student_id=student_id).first():
        return jsonify({"error": "Student ID already exists"}), 409
    if employee_id and User.query.filter_by(employee_id=employee_id).first():
        return jsonify({"error": "Employee ID already exists"}), 409

    password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
    full_name = f"{first} {last}"

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=password_hash,
        role=db_role,
        is_approved=True,
        department=department,
        semester=semester if db_role == "STUDENT" else None,
        cnic=cnic,
        contact=contact_number,
        student_id=student_id if db_role == "STUDENT" else None,
        employee_id=employee_id if db_role in employee_roles else None,
        position_post=position if db_role in employee_roles else None,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created", "user": new_user.to_dict()})


# -------------------------------------------------
# USER LIST — FILTERED BY ROLE
# -------------------------------------------------
@app.route("/api/admin/users", methods=["GET"])
@jwt_required()
def list_users():
    jwt_data = get_jwt()
    caller_role = jwt_data.get("role")

    if caller_role in ("ADMIN", "SUB_ADMIN"):
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({"users": [u.to_dict() for u in users]})

    if caller_role == "STUDENT_ORGANIZER":
        users = User.query.filter_by(role="STUDENT").all()
        return jsonify({"users": [u.to_dict() for u in users]})

    return jsonify({"error": "Not authorized"}), 403


# -------------------------------------------------
# APPROVE USER
# -------------------------------------------------
@app.route("/api/admin/users/<int:user_id>/approve", methods=["POST"])
@jwt_required()
def approve_user(user_id):
    jwt_data = get_jwt()
    caller_role = jwt_data.get("role")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_user_manage(caller_role, user.role):
        return jsonify({"error": "Not authorized for this operation"}), 403

    user.is_approved = True
    db.session.commit()
    return jsonify({"message": "User approved", "user": user.to_dict()})


# -------------------------------------------------
# BLOCK / UNBLOCK USER
# -------------------------------------------------
@app.route("/api/admin/users/<int:user_id>/block", methods=["POST"])
@jwt_required()
def block_user(user_id):
    jwt_data = get_jwt()
    caller_role = jwt_data.get("role")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_user_manage(caller_role, user.role):
        return jsonify({"error": "Not authorized"}), 403

    user.is_blocked = not user.is_blocked
    db.session.commit()
    status = "blocked" if user.is_blocked else "unblocked"

    return jsonify({"message": f"User {status}", "user": user.to_dict()})


# -------------------------------------------------
# DELETE USER
# -------------------------------------------------
@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def delete_user(user_id):
    jwt_data = get_jwt()
    caller_role = jwt_data.get("role")

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if not can_user_manage(caller_role, user.role):
        return jsonify({"error": "Not authorized"}), 403

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"})


# =============================================================================
# ========== SUPPORT CHAT REST ENDPOINTS (student ↔ consultant) ==============
# =============================================================================
def get_user_from_token(encoded_token: str):
    """Decode JWT manually for WebSocket events."""
    if not encoded_token:
        return None
    try:
        decoded = decode_token(encoded_token)
        identity = decoded.get("sub") or decoded.get("identity")
        if not identity:
            return None
        return User.query.get(int(identity))
    except Exception as exc:  # noqa: BLE001
        logging.warning(f"Failed to decode token in websocket: {exc}")
        return None


def get_default_consultant():
    """Pick first approved, not-blocked consultant."""
    return (
        User.query.filter_by(role="CONSULTANT", is_approved=True, is_blocked=False)
        .order_by(User.created_at.asc())
        .first()
    )


@app.route("/api/support/thread", methods=["POST"])
@jwt_required()
def ensure_support_thread():
    """
    For students / non-consultants:
    - ensure a thread exists with the default consultant
    - return that thread.
    """
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == "CONSULTANT":
        return jsonify({"error": "Consultants open threads from their panel"}), 400

    consultant = get_default_consultant()
    if not consultant:
        return jsonify({"error": "No consultant available"}), 503

    thread = ChatThread.query.filter_by(
        student_id=user.id, consultant_id=consultant.id
    ).first()

    if not thread:
        thread = ChatThread(student_id=user.id, consultant_id=consultant.id)
        db.session.add(thread)
        db.session.commit()

    thread_dict = thread.to_dict(include_consultant=True)
    if thread.consultant:
        cons = thread_dict.get("consultant") or {}
        cons.update(
            {
                "role": thread.consultant.role,
                "user_type": thread.consultant.role,
                "userType": thread.consultant.role,
                "type": thread.consultant.role,
            }
        )
        thread_dict["consultant"] = cons

    return jsonify({"thread": thread_dict})


@app.route("/api/support/threads", methods=["GET"])
@jwt_required()
def list_support_threads():
    """
    Consultant view – list all threads with students.
    """
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user or user.role != "CONSULTANT":
        return jsonify({"error": "Not authorized"}), 403

    threads = (
        ChatThread.query.filter_by(consultant_id=user.id)
        .order_by(ChatThread.created_at.desc())
        .all()
    )

    result = []
    for t in threads:
        data = t.to_dict(include_student=True)

        if getattr(t, "student", None):
            stu = data.get("student") or {}
            stu.update(
                {
                    "role": t.student.role,
                    "user_type": t.student.role,
                    "userType": t.student.role,
                    "type": t.student.role,
                }
            )
            data["student"] = stu

        last = (
            ChatMessage.query.filter_by(thread_id=t.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        if last:
            data["lastMessage"] = last.to_dict()
        result.append(data)

    return jsonify({"threads": result})


@app.route("/api/support/threads/<int:thread_id>/messages", methods=["GET"])
@jwt_required()
def get_thread_messages(thread_id):
    identity = get_jwt_identity()
    user = User.query.get(int(identity))

    if not user:
        return jsonify({"error": "User not found"}), 404

    thread = ChatThread.query.get(thread_id)
    if not thread:
        return jsonify({"error": "Thread not found"}), 404

    if user.id not in (thread.student_id, thread.consultant_id):
        return jsonify({"error": "Not authorized"}), 403

    messages = (
        ChatMessage.query.filter_by(thread_id=thread.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return jsonify({"messages": [m.to_dict() for m in messages]})


# =============================================================================
# ========================= SOCKET.IO EVENTS =================================
# =============================================================================
@socketio.on("join_thread")
def handle_join_thread(data):
    """
    data = {
        "token": "<JWT from localStorage>",
        "threadId": 123
    }
    """
    token = data.get("token")
    thread_id = data.get("threadId")

    user = get_user_from_token(token)
    if not user:
        emit("error", {"message": "Unauthorized"})
        return

    thread = ChatThread.query.get(thread_id)
    if not thread:
        emit("error", {"message": "Thread not found"})
        return

    if user.id not in (thread.student_id, thread.consultant_id):
        emit("error", {"message": "Not authorized for this thread"})
        return

    room_name = f"thread_{thread.id}"
    join_room(room_name)
    emit("joined_thread", {"threadId": thread.id})


@socketio.on("send_message")
def handle_send_message(data):
    """
    data = {
        "token": "<JWT>",
        "threadId": 123,
        "text": "Hello"
    }
    """
    token = data.get("token")
    thread_id = data.get("threadId")
    text = (data.get("text") or "").strip()

    if not text:
        return

    user = get_user_from_token(token)
    if not user:
        emit("error", {"message": "Unauthorized"})
        return

    thread = ChatThread.query.get(thread_id)
    if not thread:
        emit("error", {"message": "Thread not found"})
        return

    if user.id not in (thread.student_id, thread.consultant_id):
        emit("error", {"message": "Not authorized for this thread"})
        return

    msg = ChatMessage(thread_id=thread.id, sender_id=user.id, text=text)
    db.session.add(msg)
    db.session.commit()

    payload = msg.to_dict()
    room_name = f"thread_{thread.id}"
    emit("new_message", payload, room=room_name)


# ====================================================================================
# ============================ RETURN 404 FOR UNKNOWN ROUTE ==========================
# ====================================================================================
@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Route not found"}), 404


# ==============================================
# MAIN START
# ==============================================
if __name__ == "__main__":
    from os import environ

    with app.app_context():
        db.create_all()

    # Railway (and most platforms) give you a PORT env variable
    port = int(environ.get("PORT", 5001))

    # Production: no debug, listen on 0.0.0.0 and dynamic port
    socketio.run(app, host="0.0.0.0", port=port, debug=False)

