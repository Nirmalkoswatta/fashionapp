const axios = require("axios");

const SYSTEM_PROMPT = `You are the expert AI Tailor Copilot for 'Fashion Girl'. 
Assist the vendor with design ideas, fabric suggestions, tailoring details, and customer measurement calculations.
Keep your replies professional, concise (under 5 sentences), and focused on custom tailoring expertise.`;

async function handleAiChat(req, res, next) {
    try {
        const { message, userMessage, history } = req.body;
        const finalMessage = message || userMessage;

        if (!finalMessage || !finalMessage.trim()) {
            return res.status(400).json({ message: "Field 'message' or 'userMessage' is required." });
        }

        const ollamaUrl = process.env.OLLAMA_GENERATE_URL || "http://localhost:11434/api/generate";
        const modelName = process.env.OLLAMA_MODEL || "mistral-nemo:latest";

        // Build prompt from history
        let promptText = `System: ${SYSTEM_PROMPT}\n\n`;

        if (Array.isArray(history)) {
            history.slice(-6).forEach((msg) => {
                const speaker = msg.sender === "user" ? "User" : "Assistant";
                promptText += `${speaker}: ${msg.text || msg.content}\n`;
            });
        }

        promptText += `User: ${finalMessage.trim()}\nAssistant:`;

        try {
            const ollamaResponse = await axios.post(
                ollamaUrl,
                {
                    model: modelName,
                    prompt: promptText,
                    stream: false,
                },
                { timeout: Number(process.env.OLLAMA_TIMEOUT) || 60000 }
            );

            if (ollamaResponse.data && ollamaResponse.data.response) {
                return res.status(200).json({
                    reply: ollamaResponse.data.response,
                    source: `Ollama (${modelName})`,
                });
            }
        } catch (ollamaErr) {
            console.error("Local Ollama generate service error:", ollamaErr.message);
        }

        // Fallback response if Ollama generate fails
        const query = finalMessage.toLowerCase();
        let reply = "I am currently offline from local Ollama. Here is a quick tip: double check the customer chest and waist ratios before cutting fabric. Let me know if you have specific questions about fabrics like Silk or Linen once my connection is restored!";
        
        if (query.includes("fabric") || query.includes("cotton") || query.includes("silk") || query.includes("linen")) {
            reply = "When recommending fabrics to vendors: Cotton is best for everyday shirts, Silk is perfect for formal dresses, and Linen is ideal for hot summer suits. Always ensure you have checked your in-stock checklist.";
        } else if (query.includes("measurement") || query.includes("calculate") || query.includes("size")) {
            reply = "To calculate sizing adjustments: A standard pattern needs 1.5 inches of ease for chest measurements and 1.0 inch of ease for waist measurements. Ensure the visual markers are matched properly.";
        }

        return res.status(200).json({
            reply,
            source: "AI Copilot Fallback Rules Engine",
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    handleAiChat,
};
