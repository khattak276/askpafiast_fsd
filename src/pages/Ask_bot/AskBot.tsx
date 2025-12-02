import React, { useState, useEffect, useRef } from "react";
import "./AskBot.css";
import ShardFieldBackground from "../../components/ShardFieldBackground";
import Topbar from "../../components/Topbar";
import { io, Socket } from "socket.io-client";
import ChatParticles from "../../components/ChatParticles";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";


type SimpleMessage = {
  sender: "bot" | "user";
  text: string;
  time: string;
};

type SupportMessage = {
  id?: number;
  threadId?: number;
  senderId?: number;
  senderName?: string | null;
  text: string;
  createdAt?: string;
  mine?: boolean;
};

type SupportThread = {
  id: number;
  studentId: number;
  consultantId: number;
  student?: {
    id: number;
    fullName: string;
    email: string;
    role?: string;
    user_type?: string;
    userType?: string;
    type?: string;
  };
  consultant?: {
    id: number;
    fullName: string;
    email: string;
    role?: string;
    user_type?: string;
    userType?: string;
    type?: string;
  };
  lastMessage?: SupportMessage;
};

type CurrentUser = {
  id: number;
  role: string;
  full_name?: string;
  fullName?: string;
};

/* ===== NEW: date-grouped AI history types ===== */
type AiDateBlock = {
  date: string; // "2025-11-29"
  count: number;
  firstAt?: string;
  lastAt?: string;
  snippet?: string;
};

type AiPair = {
  id: number; // prompt id
  prompt: string;
  reply?: string;
  promptCreatedAt: string;
  replyCreatedAt?: string;
};

/* ---------------- Role helpers ---------------- */

const getUserRole = (user: any | undefined | null): string | undefined => {
  if (!user) return undefined;
  return user.role || user.user_type || user.userType || user.type || undefined;
};

const formatRoleLabel = (role?: string): string => {
  const r = (role || "").toUpperCase();

  switch (r) {
    case "ADMIN":
      return "Admin";
    case "SUB_ADMIN":
      return "Sub-Admin";
    case "STUDENT":
      return "Student";
    case "STUDENT_ORGANIZER":
      return "Student Organizer";
    case "SOCIETY_HEAD":
      return "Society Head";
    case "SOCIAL_MEDIA":
      return "Social Media";
    case "CONSULTANT":
      return "Consultant";
    default:
      if (!role) return "User";
      return role
        .toLowerCase()
        .split("_")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
};

const AskBot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"ai" | "history" | "support">("ai");
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // --------- AI conversation / Talk to AI state ---------
  const [aiConversationId, setAiConversationId] = useState<number | null>(null);
  const [aiConversation, setAiConversation] = useState<SimpleMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const aiBottomRef = useRef<HTMLDivElement>(null);

  // --------- AI History (date-grouped) state ---------
  const [aiDates, setAiDates] = useState<AiDateBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [aiPairs, setAiPairs] = useState<AiPair[]>([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [aiPairsLoading, setAiPairsLoading] = useState(false);
  const [aiHistoryInfo, setAiHistoryInfo] = useState<string | null>(null);

  // --------- Socket state ---------
  const socketRef = useRef<Socket | null>(null);
  const activeThreadRef = useRef<number | null>(null);

  // --------- Load token + /api/me ---------
  useEffect(() => {
    const t =
      (typeof window !== "undefined" &&
        (localStorage.getItem("token") ||
          localStorage.getItem("authToken"))) ||
      null;

    if (!t) {
      setToken(null);
      setCurrentUser(null);
      setAiConversation([]);
      setAiConversationId(null);
      localStorage.removeItem("aiConversationId");
      return;
    }

    setToken(t);

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        const json = await res.json();
        if (res.ok && json.user) {
          setCurrentUser(json.user);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Failed to load /api/me:", err);
        setCurrentUser(null);
      }
    })();
  }, []);

  /* --------- Restore last AI conversation on reload --------- */
  useEffect(() => {
    const restoreConversation = async () => {
      if (!token) return;
      const savedId = localStorage.getItem("aiConversationId");
      if (!savedId) return;
      const convId = Number(savedId);
      if (!convId || Number.isNaN(convId)) return;

      await fetchAiConversation(convId);
    };

    restoreConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* --------- Socket.IO --------- */

  useEffect(() => {
    if (!token) return;

    const s = io(API_BASE, {
      transports: ["websocket"],
    });

    socketRef.current = s;

    s.on("connect", () => {
      console.log("Socket connected");
    });

    s.on("connect_error", (err) => {
      console.error("Socket connect error:", err);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  /* =========================
   *  AI CHAT FUNCTIONS
   * ========================= */

  const fetchAiConversation = async (convId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/conversations/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Failed to load AI conversation:", json.error || json);
        return;
      }

      const msgs: SimpleMessage[] = (json.messages || []).map((m: any) => ({
        sender: m.sender === "user" ? "user" : "bot",
        text: m.text,
        time: m.createdAt
          ? new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
      }));

      setAiConversationId(json.conversationId);
      setAiConversation(msgs);
      localStorage.setItem("aiConversationId", String(json.conversationId));
    } catch (err) {
      console.error("fetchAiConversation error:", err);
    }
  };

  const sendAiMessage = async () => {
    if (!aiMessage.trim()) return;

    const nowLabel = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: SimpleMessage = {
      sender: "user",
      text: aiMessage,
      time: nowLabel,
    };
    setAiConversation((prev) => [...prev, userMsg]);
    setAiLoading(true);
    const toSend = aiMessage;
    setAiMessage("");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: toSend,
          conversationId: aiConversationId,
        }),
      });
      const data = await res.json();

      if (data.conversationId && data.conversationId !== aiConversationId) {
        setAiConversationId(data.conversationId);
        if (token) {
          localStorage.setItem("aiConversationId", String(data.conversationId));
        }
      }

      const botMsg: SimpleMessage = {
        sender: "bot",
        text:
          data.response ??
          "⚠️ Error communicating with the assistant. Please try again later.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setAiConversation((prev) => [...prev, botMsg]);

      // refresh date blocks silently (so count stays in sync)
      if (token) {
        fetchAiHistoryDates(false);
      }
    } catch (err) {
      console.error(err);
      const botMsg: SimpleMessage = {
        sender: "bot",
        text:
          "⚠️ Error communicating with the assistant. Please try again later.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setAiConversation((prev) => [...prev, botMsg]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!aiLoading) sendAiMessage();
    }
  };

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiConversation]);

  /* =========================
   *  AI HISTORY – DATE GROUPED
   * ========================= */

  const fetchAiHistoryDates = async (showLoader = true) => {
    if (!token) return;
    if (showLoader) setAiHistoryLoading(true);
    setAiHistoryInfo(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai/history/dates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setAiHistoryInfo(json.error || "Failed to load history.");
        setAiDates([]);
        return;
      }
      setAiDates(json.dates || []);
      if ((json.dates || []).length === 0) {
        setSelectedDate(null);
        setAiPairs([]);
      }
    } catch (err) {
      console.error("fetchAiHistoryDates error:", err);
      setAiHistoryInfo("Could not load AI history.");
    } finally {
      if (showLoader) setAiHistoryLoading(false);
    }
  };

  const fetchAiPairsForDate = async (date: string) => {
    if (!token) return;
    setAiPairsLoading(true);
    setAiHistoryInfo(null);

    try {
      const res = await fetch(`${API_BASE}/api/ai/history/dates/${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        setAiHistoryInfo(json.error || "Failed to load chats for this date.");
        setAiPairs([]);
        return;
      }
      setAiPairs(json.pairs || []);
    } catch (err) {
      console.error("fetchAiPairsForDate error:", err);
      setAiHistoryInfo("Could not load chats for this date.");
    } finally {
      setAiPairsLoading(false);
    }
  };

  const handleSelectHistoryDate = async (date: string) => {
    setSelectedDate(date);
    await fetchAiPairsForDate(date);
  };

  const handleDeleteDate = async (date: string) => {
    if (!token) return;
    const pretty = new Date(date).toLocaleDateString();
    const ok = window.confirm(
      `Delete ALL chats for ${pretty}? This cannot be undone.`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/ai/history/dates/${date}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to delete chats for this date.");
        return;
      }

      const remaining = aiDates.filter((d) => d.date !== date);
      setAiDates(remaining);

      if (selectedDate === date) {
        setSelectedDate(null);
        setAiPairs([]);
      }
    } catch (err) {
      console.error("handleDeleteDate error:", err);
      alert("Could not delete chats for this date.");
    }
  };

  const handleDeletePair = async (pairId: number) => {
    if (!token || !selectedDate) return;
    const ok = window.confirm("Delete this question & answer?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/ai/pairs/${pairId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to delete this chat.");
        return;
      }

      // reload pairs for same date and refresh date counts
      await fetchAiPairsForDate(selectedDate);
      await fetchAiHistoryDates(false);
    } catch (err) {
      console.error("handleDeletePair error:", err);
      alert("Could not delete this chat.");
    }
  };

  /* =========================
   *  SUPPORT CHAT STATE
   * ========================= */

  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [supportThreadForStudent, setSupportThreadForStudent] =
    useState<SupportThread | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportInfo, setSupportInfo] = useState<string | null>(null);
  const supportBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supportBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportMessages]);

  useEffect(() => {
    if (!socketRef.current) return;
    const s = socketRef.current;

    const handler = (msg: any) => {
      if (!msg || !msg.threadId) return;
      const activeId = activeThreadRef.current;
      if (!activeId || msg.threadId !== activeId) return;

      setSupportMessages((prev) => [
        ...prev,
        {
          ...msg,
          mine: currentUser ? msg.senderId === currentUser.id : false,
        },
      ]);
    };

    s.on("new_message", handler);
    return () => {
      s.off("new_message", handler);
    };
  }, [currentUser]);

  const loadMessages = async (threadId: number) => {
    if (!token) return;
    setSupportLoading(true);
    setSupportInfo(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/support/threads/${threadId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setSupportInfo(json.error || "Failed to load messages.");
        setSupportMessages([]);
        return;
      }

      const msgs: SupportMessage[] = (json.messages || []).map(
        (m: any): SupportMessage => ({
          ...m,
          mine: currentUser ? m.senderId === currentUser.id : false,
        })
      );
      setSupportMessages(msgs);
    } catch (err) {
      console.error("loadMessages error:", err);
      setSupportInfo("Could not load messages.");
    } finally {
      setSupportLoading(false);
    }
  };

  const joinThreadRoom = (threadId: number) => {
    if (!socketRef.current || !token) return;
    activeThreadRef.current = threadId;
    socketRef.current.emit("join_thread", {
      token,
      threadId,
    });
  };

  useEffect(() => {
    if (activeTab !== "support" || !token || !currentUser) return;

    if (currentUser.role === "CONSULTANT") {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/support/threads`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const json = await res.json();
          if (!res.ok) {
            setSupportInfo(json.error || "Failed to load threads.");
            setSupportThreads([]);
            return;
          }
          const threads: SupportThread[] = json.threads || [];
          setSupportThreads(threads);

          if (threads.length > 0) {
            const first = threads[0];
            setSelectedThreadId(first.id);
            joinThreadRoom(first.id);
            await loadMessages(first.id);
          } else {
            setSelectedThreadId(null);
            setSupportMessages([]);
          }
        } catch (err) {
          console.error("list_support_threads error:", err);
          setSupportInfo("Could not load threads.");
        }
      })();
    } else {
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/support/thread`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const json = await res.json();
          if (!res.ok) {
            setSupportInfo(json.error || "Failed to open chat.");
            setSupportThreadForStudent(null);
            setSupportMessages([]);
            return;
          }
          const th: SupportThread = json.thread;
          setSupportThreadForStudent(th);
          setSelectedThreadId(th.id);
          joinThreadRoom(th.id);
          await loadMessages(th.id);
        } catch (err) {
          console.error("ensure_support_thread error:", err);
          setSupportInfo("Could not open support chat.");
        }
      })();
    }
  }, [activeTab, token, currentUser]);

  const handleSelectThread = async (thread: SupportThread) => {
    setSelectedThreadId(thread.id);
    joinThreadRoom(thread.id);
    await loadMessages(thread.id);
  };

  const handleSupportSend = () => {
    if (!supportInput.trim()) return;
    if (!socketRef.current || !token || !selectedThreadId) {
      setSupportInfo("Not connected. Please refresh the page.");
      return;
    }

    const text = supportInput.trim();
    setSupportInput("");

    socketRef.current.emit("send_message", {
      token,
      threadId: selectedThreadId,
      text,
    });
  };

  const handleSupportKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSupportSend();
    }
  };

  /* --------- PAGE CLASSES --------- */

  useEffect(() => {
    document.body.classList.add("topbar-mode", "askbot-page");
    const sidebar = document.querySelector(".sidebar") as HTMLElement | null;
    if (sidebar) sidebar.style.display = "none";

    return () => {
      document.body.classList.remove("topbar-mode", "askbot-page");
      const sb = document.querySelector(".sidebar") as HTMLElement | null;
      if (sb) sb.style.display = "flex";
    };
  }, []);

  /* --------- RENDER HELPERS --------- */

  const renderAiChat = () => (
    <>
      <div id="chat-fullscreen">
        {aiConversation.map((msg, idx) => (
          <div
            key={idx}
            className={`msg-bubble ${msg.sender === "user" ? "user" : "bot"}`}
          >
            <div className="msg-text">{msg.text}</div>
            <span className="msg-time">{msg.time}</span>
          </div>
        ))}

        {aiLoading && (
          <div className="msg-bubble bot typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={aiBottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          placeholder={aiLoading ? "Sending..." : "Ask something..."}
          value={aiMessage}
          onChange={(e) => setAiMessage(e.target.value)}
          onKeyDown={handleAiKeyDown}
          disabled={aiLoading}
        />
        <button onClick={sendAiMessage} disabled={aiLoading}>
          Send
        </button>
      </div>
    </>
  );

  const renderAiHistory = () => {
    if (!token || !currentUser) {
      return (
        <div className="support-unauth">
          Login to view your conversation history with the AI assistant.
        </div>
      );
    }

    return (
      <div id="ai-history-panel">
        <div className="ai-history-header">
          <h2>Your AI Conversations</h2>
          <p>Select a date block to see all chats from that day.</p>
        </div>

        <div className="ai-history-body">
          <div className="ai-history-list">
            {aiHistoryLoading && (
              <div className="ai-history-empty">Loading history…</div>
            )}

            {!aiHistoryLoading && aiDates.length === 0 && (
              <div className="ai-history-empty">
                No AI conversations yet. Start a new chat in “Talk to AI”.
              </div>
            )}

            {aiDates.map((d) => {
              const prettyDate = new Date(d.date).toLocaleDateString(
                undefined,
                {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <div
                  key={d.date}
                  className={`ai-history-item ${
                    selectedDate === d.date ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="ai-history-main"
                    onClick={() => handleSelectHistoryDate(d.date)}
                  >
                    <div className="ai-history-title">
                      Chats from {prettyDate}
                    </div>
                    {d.snippet && (
                      <div className="ai-history-snippet">{d.snippet}</div>
                    )}
                    <div className="ai-history-meta">
                      {d.count} message
                      {d.count !== 1 ? "s" : ""} •{" "}
                      {d.firstAt &&
                        new Date(d.firstAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                      –{" "}
                      {d.lastAt &&
                        new Date(d.lastAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                  </button>

                  <button
                    type="button"
                    className="ai-history-delete-date"
                    onClick={() => handleDeleteDate(d.date)}
                    title="Delete all chats for this day"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>

          <div id="ai-history-details">
            {selectedDate ? (
              <>
                <div className="ai-history-details-header">
                  <div className="ai-history-details-title">
                    Chats from{" "}
                    {new Date(selectedDate).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  {aiPairsLoading && (
                    <div className="ai-history-details-sub">Loading…</div>
                  )}
                  {!aiPairsLoading && aiPairs.length === 0 && (
                    <div className="ai-history-details-sub">
                      No chats left for this day.
                    </div>
                  )}
                </div>

                <div className="ai-pairs-list">
                  {aiPairs.map((p) => (
                    <div key={p.id} className="ai-pair-card">
                      <div className="ai-pair-header">
                        <div className="ai-pair-meta">
                          <span className="ai-pair-label">You</span>
                          <span className="ai-pair-time">
                            {p.promptCreatedAt &&
                              new Date(
                                p.promptCreatedAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="ai-pair-delete"
                          onClick={() => handleDeletePair(p.id)}
                          title="Delete this question + answer"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="ai-pair-prompt">{p.prompt}</div>

                      {p.reply && (
                        <>
                          <div className="ai-pair-meta ai-pair-meta-bot">
                            <span className="ai-pair-label bot">
                              Assistant
                            </span>
                            <span className="ai-pair-time">
                              {p.replyCreatedAt &&
                                new Date(
                                  p.replyCreatedAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                            </span>
                          </div>
                          <div className="ai-pair-reply">{p.reply}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="ai-history-details-placeholder">
                Select a date on the left to view your chats.
              </div>
            )}

            {aiHistoryInfo && (
              <div className="support-info-banner history">
                {aiHistoryInfo}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupportStudent = () => {
    const consultantName =
      supportThreadForStudent?.consultant?.fullName || "Consultant";

    const consultantRole = formatRoleLabel(
      getUserRole(supportThreadForStudent?.consultant) || "CONSULTANT"
    );

    return (
      <>
        <div id="support-single">
          <div className="support-header">
            <div className="support-avatar">
              {consultantName.charAt(0).toUpperCase()}
            </div>
            <div className="support-header-meta">
              <div className="support-header-name">{consultantName}</div>
              <div className="support-header-role">{consultantRole}</div>
            </div>
          </div>

          {/* MAIN CHAT BOX – particles on container, messages scroll inside */}
          <div className="support-messages">
            <ChatParticles />
            <div className="support-messages-scroll">
              {supportMessages.map((m) => (
                <div
                  key={m.id ?? `${m.createdAt}-${m.text}`}
                  className={`msg-bubble ${m.mine ? "user" : "bot"}`}
                >
                  <div className="msg-text">{m.text}</div>
                  {m.createdAt && (
                    <span className="msg-time">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}

              {supportLoading && (
                <div className="msg-bubble bot typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={supportBottomRef} />
            </div>
          </div>

          <div className="support-input-bar">
            <input
              type="text"
              placeholder="Write a message to consultant..."
              value={supportInput}
              onChange={(e) => setSupportInput(e.target.value)}
              onKeyDown={handleSupportKeyDown}
            />
            <button onClick={handleSupportSend}>Send</button>
          </div>
        </div>

        {supportInfo && (
          <div className="support-info-banner">{supportInfo}</div>
        )}
      </>
    );
  };

  const renderSupportConsultant = () => {
    const activeThread =
      supportThreads.find((t) => t.id === selectedThreadId) || null;

    const studentName =
      activeThread?.student?.fullName ||
      (activeThread ? `Student #${activeThread.studentId}` : "");

    const studentRole = formatRoleLabel(getUserRole(activeThread?.student));

    return (
      <div id="support-layout">
        <div className="thread-list">
          <div className="thread-list-title">Students</div>
          {supportThreads.length === 0 && (
            <div className="thread-empty">No student chats yet.</div>
          )}
          {supportThreads.map((t) => (
            <button
              key={t.id}
              className={`thread-item ${
                selectedThreadId === t.id ? "active" : ""
              }`}
              onClick={() => handleSelectThread(t)}
            >
              <div className="thread-name">
                {t.student?.fullName || `Student #${t.studentId}`}
              </div>
              <div className="thread-last">
                {t.lastMessage?.text || "No messages yet"}
              </div>
            </button>
          ))}
        </div>

        <div className="support-main">
          <div className="support-header">
            {activeThread ? (
              <>
                <div className="support-avatar">
                  {studentName.charAt(0).toUpperCase()}
                </div>
                <div className="support-header-meta">
                  <div className="support-header-name">{studentName}</div>
                  <div className="support-header-role">{studentRole}</div>
                </div>
              </>
            ) : (
              <div className="support-header-name">
                Select a student chat to start
              </div>
            )}
          </div>

          {/* MAIN CHAT BOX – particles on container, messages scroll inside */}
          <div className="support-messages">
            <ChatParticles />
            <div className="support-messages-scroll">
              {supportMessages.map((m) => (
                <div
                  key={m.id ?? `${m.createdAt}-${m.text}`}
                  className={`msg-bubble ${m.mine ? "user" : "bot"}`}
                >
                  <div className="msg-text">{m.text}</div>
                  {m.createdAt && (
                    <span className="msg-time">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}

              {supportLoading && (
                <div className="msg-bubble bot typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={supportBottomRef} />
            </div>
          </div>

          {activeThread && (
            <div className="support-input-bar">
              <input
                type="text"
                placeholder="Reply to student..."
                value={supportInput}
                onChange={(e) => setSupportInput(e.target.value)}
                onKeyDown={handleSupportKeyDown}
              />
              <button onClick={handleSupportSend}>Send</button>
            </div>
          )}

          {supportInfo && (
            <div className="support-info-banner">{supportInfo}</div>
          )}
        </div>
      </div>
    );
  };

  const renderSupportTab = () => {
    if (!token || !currentUser) {
      return (
        <div className="support-unauth">
          To enjoy all the features, login or signup to the system.
        </div>
      );
    }

    if (currentUser.role === "CONSULTANT") {
      return renderSupportConsultant();
    }
    return renderSupportStudent();
  };

  const supportTabLabel =
    currentUser?.role === "CONSULTANT"
      ? "Talk to Students"
      : "Contact Consultant";

  // fetch date blocks when user opens History tab
  useEffect(() => {
    if (activeTab === "history" && token) {
      fetchAiHistoryDates(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  return (
    <div id="ask-container">
      <Topbar />

      {/* global 3D shard background behind ALL tabs */}
      <ShardFieldBackground />

      <div className="ask-tabs">
        <button
          className={`ask-tab-btn ${activeTab === "ai" ? "active" : ""}`}
          type="button"
          onClick={() => setActiveTab("ai")}
        >
          Talk to AI
        </button>
        <button
          className={`ask-tab-btn ${
            activeTab === "history" ? "active" : ""
          }`}
          type="button"
          onClick={() => setActiveTab("history")}
        >
          AI History
        </button>
        <button
          className={`ask-tab-btn ${
            activeTab === "support" ? "active" : ""
          }`}
          type="button"
          onClick={() => setActiveTab("support")}
        >
          {supportTabLabel}
        </button>
      </div>

      {activeTab === "ai" && renderAiChat()}
      {activeTab === "history" && renderAiHistory()}
      {activeTab === "support" && renderSupportTab()}
    </div>
  );
};

export default AskBot;
