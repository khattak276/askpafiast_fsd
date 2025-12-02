# chatbot_backend/models.py
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    # roles: "ADMIN", "SUB_ADMIN", "SOCIETY_HEAD", "CONSULTANT",
    #        "SOCIAL_MEDIA", "STUDENT_ORGANIZER", "STUDENT"
    role = db.Column(db.String(50), nullable=False, default="STUDENT")

    # for non-students, this must be True (approved by Student Organizer / Admin later)
    is_approved = db.Column(db.Boolean, default=False)

    # block flag for "Blocked" status in dashboard
    is_blocked = db.Column(db.Boolean, default=False)

    # academic / personal fields
    department = db.Column(db.String(120), nullable=True)
    semester = db.Column(db.String(50), nullable=True)
    cnic = db.Column(db.String(50), nullable=True)
    contact = db.Column(db.String(50), nullable=True)

    # employment / identity
    position_post = db.Column(db.String(120), nullable=True)
    student_id = db.Column(db.String(50), nullable=True)
    employee_id = db.Column(db.String(50), nullable=True)

    # store file paths (not raw image bytes)
    profile_image_path = db.Column(
        db.String(255), nullable=True
    )  # passport-size photo
    student_card_image_path = db.Column(
        db.String(255), nullable=True
    )  # student card snapshot

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        """Return a JSON-friendly representation used by frontend & login."""
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "isApproved": self.is_approved,
            "isBlocked": self.is_blocked,
            "department": self.department,
            "semester": self.semester,
            "cnic": self.cnic,
            "contact": self.contact,
            # expose both names for compatibility
            "positionPost": self.position_post,
            "position": self.position_post,
            "studentId": self.student_id,
            "employeeId": self.employee_id,
            "profileImagePath": self.profile_image_path,
            "studentCardImagePath": self.student_card_image_path,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class RevokedToken(db.Model):
    __tablename__ = "revoked_tokens"

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, index=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ==============================
#   CHAT MODELS (student ↔ consultant)
# ==============================


class ChatThread(db.Model):
    """
    One thread per student–consultant pair.
    A student can only see their own thread.
    A consultant can see all threads where he/she is consultant_id.
    """

    __tablename__ = "chat_threads"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    consultant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship("User", foreign_keys=[student_id])
    consultant = db.relationship("User", foreign_keys=[consultant_id])

    messages = db.relationship(
        "ChatMessage",
        backref="thread",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at.asc()",
    )

    def to_dict(self, include_student=False, include_consultant=False):
        data = {
            "id": self.id,
            "studentId": self.student_id,
            "consultantId": self.consultant_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

        if include_student and self.student:
            data["student"] = {
                "id": self.student.id,
                "fullName": self.student.full_name,
                "email": self.student.email,
            }

        if include_consultant and self.consultant:
            data["consultant"] = {
                "id": self.consultant.id,
                "fullName": self.consultant.full_name,
                "email": self.consultant.email,
            }

        return data


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(
        db.Integer, db.ForeignKey("chat_threads.id"), nullable=False, index=True
    )
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    sender = db.relationship("User")

    def to_dict(self):
        return {
            "id": self.id,
            "threadId": self.thread_id,
            "senderId": self.sender_id,
            "senderName": self.sender.full_name if self.sender else None,
            "text": self.text,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


# ==============================
#   AI CHAT HISTORY (user ↔ AI)
# ==============================


class AiConversation(db.Model):
    __tablename__ = "ai_conversations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user = db.relationship("User")
    messages = db.relationship(
        "AiMessage",
        backref="conversation",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="AiMessage.created_at.asc()",
    )


class AiMessage(db.Model):
    __tablename__ = "ai_messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(
        db.Integer, db.ForeignKey("ai_conversations.id"), nullable=False, index=True
    )
    sender = db.Column(db.String(16), nullable=False)  # "user" or "ai"
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "conversationId": self.conversation_id,
            "sender": self.sender,
            "text": self.text,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
