import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";

function AiTailorWidget() {
    const { token } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hello! I am your AI Tailor Copilot. Tell me your customer's measurements or fabric type, and I will calculate the rest.",
            source: "Ollama (mistral-nemo:latest)"
        }
    ]);
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

        // Append user's message to state (aligned to the right)
        setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
        setLoading(true);

        try {
            // Trigger fetch() POST request to the local server endpoint
            // We pass the auth token in headers because the route is protected.
            const response = await fetch("http://localhost:5000/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userMessage })
            });

            if (!response.ok) {
                throw new Error("Chat copilot service returned an error status.");
            }

            const data = await response.json();
            
            // Append AI's response to state (aligned to the left)
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: data.reply, source: data.source }
            ]);
        } catch (err) {
            setError(err.message || "Failed to reach AI Copilot server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="chatbot-shell w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Sleek Header */}
            <header className="home-header bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <p className="brand text-xs font-semibold text-pink-500 uppercase tracking-wider">AI Tailor Copilot</p>
                    <h1 className="text-xl font-bold text-gray-900 mt-1">💬 AI Tailor Copilot</h1>
                    <p className="subtitle text-sm text-gray-500 mt-0.5">Consult local LLM running mistral-nemo for measurement guides, fabric choices, and support.</p>
                </div>
            </header>

            {/* Chat Container */}
            <div className="chat-window flex flex-col h-[450px] bg-gray-50">
                <div className="chat-messages-container flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message-bubble-row ${msg.sender} flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`chat-message-bubble max-w-[80%] rounded-lg p-3 ${msg.sender === "user" ? "bg-pink-500 text-white" : "bg-white text-gray-800 border border-gray-200"}`}>
                                <p className="chat-msg-text text-sm whitespace-pre-wrap">{msg.text}</p>
                                {msg.source && (
                                    <span className="chat-msg-source text-[10px] text-gray-400 block mt-1 text-right">
                                        via {msg.source}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-message-bubble-row bot flex justify-start">
                            <div className="chat-message-bubble max-w-[80%] rounded-lg p-3 bg-white text-gray-500 border border-gray-200 typing-bubble">
                                <div className="typing-dots flex space-x-1 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                                <span className="text-xs text-gray-400 mt-1 block">Copilot is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {error ? <p className="form-error chat-error text-red-500 bg-red-50 px-4 py-2 text-sm border-t border-red-100">{error}</p> : null}

                {/* Sticky Bottom Input Bar */}
                <form className="chat-input-form border-t border-gray-200 p-3 bg-white flex items-center gap-2" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="Ask about measurements, fabric types, pattern calculations..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button 
                        className="primary-btn chat-send-btn px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md text-sm transition-colors disabled:opacity-50"
                        type="submit" 
                        disabled={loading || !input.trim()}
                    >
                        {loading ? "Thinking..." : "Send"}
                    </button>
                </form>
            </div>
        </section>
    );
}

export default AiTailorWidget;
