import { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

/** 🔹 Base URL for backend API */
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5001";

const AskButton = () => {
  const [open, setOpen] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const offsetY = useRef<number>(0);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMouseInside = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputText("");
  }, []);

  useEffect(() => {
    if (!open || !popupRef.current) return;

    const popup = popupRef.current;

    const onMouseDown = (e: MouseEvent) => {
      offsetY.current = e.clientY - popup.getBoundingClientRect().top;

      const onMouseMove = (e: MouseEvent) => {
        popup.style.top = `${e.clientY - offsetY.current}px`;
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const header = popup.querySelector(".ask-header") as HTMLElement;
    header?.addEventListener("mousedown", onMouseDown);

    return () => {
      header?.removeEventListener("mousedown", onMouseDown);
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, loading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { sender: "user", text: inputText };
    setConversation((prev) => [...prev, userMessage]);
    setLoading(true);
    setInputText("");

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await res.json();
      const botMessage: Message = {
        sender: "bot",
        text: data.response ?? "Error communicating with the bot.",
      };
      setConversation((prev) => [...prev, botMessage]);
    } catch {
      setConversation((prev) => [
        ...prev,
        { sender: "bot", text: "Error communicating with the bot." },
      ]);
    }

    setLoading(false);
  };

  const handlePopupEnter = () => {
    isMouseInside.current = true;
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setShowInput(true);
  };

  const handlePopupLeave = () => {
    isMouseInside.current = false;
    hoverTimeout.current = setTimeout(() => {
      if (!isMouseInside.current) {
        setOpen(false);
        setShowInput(false);
        setConversation([]);
      }
    }, 500); // small delay buffer
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!open && (
        <button className="ask-btn" onClick={() => setOpen(true)}>
          💬 Ask
        </button>
      )}

      {open && (
        <div
          ref={popupRef}
          className="ask-popup fade-in"
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
        >
          <div className="ask-header">
            <h4>Ask-pafiast</h4>
          </div>
          <div className="ask-body">
            <div className="chat-scroll">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message ${
                    msg.sender === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  {msg.text}
                </div>
              ))}

              {loading && (
                <div className="message bot-message">
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {showInput && (
              <div className="ask-input-slide">
                <input
                  type="text"
                  placeholder="Type here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AskButton;
