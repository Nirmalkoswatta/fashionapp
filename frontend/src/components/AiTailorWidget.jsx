import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";

const INITIAL_MESSAGE = {
    sender: "bot",
    text: "I am your AI Tailor Copilot. Provide a customer's measurements or design constraints, and I will calculate fabric yardage and fit adjustments.",
    source: "Ollama (mistral-nemo:latest)",
};

// Paper-plane send icon
function SendIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    );
}

function AiTailorWidget() {
    const { token } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setError("");

        setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ userMessage }),
            });

            if (!response.ok) throw new Error("Chat copilot service returned an error status.");

            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: data.reply, source: data.source },
            ]);
        } catch (err) {
            setError(err.message || "Failed to reach AI Copilot server.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            handleSend(e);
        }
    };

    return (
        <div className="ai-tailor-shell">
            {/* ── Premium Header ── */}
            <div className="ai-tailor-header">
                <div className="ai-header-icon" aria-hidden="true">✦</div>
                <div className="ai-header-info">
                    <p className="brand">Powered by Ollama</p>
                    <h2>AI Tailor Copilot</h2>
                </div>
                <div className="ai-header-status">
                    <span className="ai-status-dot" />
                    Online
                </div>
            </div>

            {/* ── Chat Window ── */}
            <div className="chat-window">
                <div className="chat-messages-container">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat-message-bubble-row ${msg.sender}`}
                        >
                            <div className="chat-message-bubble">
                                <p className="chat-msg-text">{msg.text}</p>
                                {msg.source && (
                                    <span className="chat-msg-source">via {msg.source}</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="chat-message-bubble-row bot">
                            <div className="chat-message-bubble typing-bubble">
                                <div className="typing-dots">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Error bar */}
                {error && <p className="chat-error">{error}</p>}

                {/* ── Input Bar ── */}
                <form className="chat-input-form" onSubmit={handleSend}>
                    <input
                        className="chat-input"
                        type="text"
                        placeholder="Ask about measurements, fabric yardage, fit adjustments…"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        autoComplete="off"
                    />
                    <button
                        className="chat-send-btn"
                        type="submit"
                        disabled={loading || !input.trim()}
                        title="Send message"
                    >
                        <SendIcon />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AiTailorWidget;
