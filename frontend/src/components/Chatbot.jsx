import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { sendChatMessage, sendAiChat } from "../api";

function Chatbot() {
    const { token, user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Initialize chat with role-based greeting
        if (user) {
            const initialGreeting = user.role === "vendor"
                ? "Hello! I am your AI Tailor Copilot. Ask me for design ideas, fabric stock matching suggestions, or customer measurement calculations!"
                : "Hello! I am your local Fashion Girl assistant. How can I help you today? Ask me about tailoring measurements, fabric recommendations, or platform payments!";
            
            setMessages([
                {
                    sender: "bot",
                    text: initialGreeting,
                    source: "System Init",
                },
            ]);
        }
    }, [user]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setError("");
        
        // Add user message to UI
        setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
        
        try {
            setLoading(true);
            const chatPayload = {
                message: userMessage,
                history: messages.map(msg => ({
                    sender: msg.sender,
                    text: msg.text
                })),
            };

            let response;
            if (user?.role === "vendor") {
                response = await sendAiChat(token, chatPayload);
            } else {
                response = await sendChatMessage(token, chatPayload);
            }
            
            // Add bot reply to UI
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: response.reply, source: response.source },
            ]);
        } catch (err) {
            setError(err.message || "Failed to contact chat server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="chatbot-shell">
            <header className="home-header">
                <p className="brand">{user?.role === "vendor" ? "AI Tailor Copilot" : "Customer Assistant"}</p>
                <h1>{user?.role === "vendor" ? "Vendor AI Assistant" : "Local AI Chat Assistant"}</h1>
                <p className="subtitle">
                    {user?.role === "vendor"
                        ? "Consult our local LLM running mistral-nemo for custom drafting tips, pattern measurements, or styling calculations."
                        : "Consult our local LLM running mistral-nemo for measurement guides, fabric choices, and support."}
                </p>
            </header>

            <div className="chat-window">
                <div className="chat-messages-container">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message-bubble-row ${msg.sender}`}>
                            <div className="chat-message-bubble">
                                <p className="chat-msg-text">{msg.text}</p>
                                {msg.source && (
                                    <span className="chat-msg-source">
                                        via {msg.source}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-message-bubble-row bot">
                            <div className="chat-message-bubble typing-bubble">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {error ? <p className="form-error chat-error">{error}</p> : null}

                <form className="chat-input-form" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder={
                            user?.role === "vendor"
                                ? "Ask for fabric calculations, styling tips, pattern eases..."
                                : "Ask about measurements, fabric types, payment safety..."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button className="primary-btn chat-send-btn" type="submit" disabled={loading || !input.trim()}>
                        {loading ? "Thinking..." : "Send"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default Chatbot;
