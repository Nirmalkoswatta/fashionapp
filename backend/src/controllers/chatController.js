const axios = require("axios");

const SYSTEM_PROMPT = `You are the official AI Assistant for 'Fashion Girl', an innovative e-commerce platform that matches fashion buyers with custom tailors and vendors. 
Assist users with sizing advice, fabric selection, custom design ideas, tailoring measurements, and platform order management. 
Keep your answers professional, direct, and under 4-5 sentences where possible. Always maintain a helpful fashion expert tone.`;

async function handleChat(req, res, next) {
    try {
        const { message, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Field 'message' is required." });
        }

        const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
        const modelName = process.env.OLLAMA_MODEL || "mistral-nemo";

        // Construct message array for Ollama Chat API
        const formattedMessages = [{ role: "system", content: SYSTEM_PROMPT }];
        
        if (Array.isArray(history)) {
            history.slice(-6).forEach(msg => {
                formattedMessages.push({
                    role: msg.sender === "user" ? "user" : "assistant",
                    content: msg.text
                });
            });
        }
        
        formattedMessages.push({ role: "user", content: message.trim() });

        try {
            // Attempt to query local Ollama service
            const ollamaResponse = await axios.post(
                ollamaUrl,
                {
                    model: modelName,
                    messages: formattedMessages,
                    stream: false,
                },
                { timeout: Number(process.env.OLLAMA_TIMEOUT) || 60000 } // configured timeout to allow local LLM startup
            );

            if (ollamaResponse.data && ollamaResponse.data.message) {
                return res.status(200).json({
                    reply: ollamaResponse.data.message.content,
                    source: `Ollama (${modelName})`,
                });
            }
        } catch (ollamaErr) {
            console.log("Local Ollama service unavailable. Falling back to rules engine.");
        }

        // Fallback Rules Engine
        const query = message.toLowerCase();
        let reply = "";

        if (query.includes("measure") || query.includes("size") || query.includes("chest") || query.includes("waist") || query.includes("hip") || query.includes("sleeve")) {
            reply = "To get a perfect fit, please click on the clothing sketch markers in our measurement form:\n" +
                    "• Marker 1 (Chest): Measure around the fullest part of your chest.\n" +
                    "• Marker 2 (Waist): Measure around your natural waistline (narrowest part).\n" +
                    "• Marker 3 (Hips): Measure around the widest part of your hips.\n" +
                    "• Marker 4 (Sleeve): Measure from your shoulder joint down to your wrist.\n" +
                    "Using these visual cues guarantees your vendor receives exact details!";
        } else if (query.includes("material") || query.includes("fabric") || query.includes("cotton") || query.includes("silk") || query.includes("wool") || query.includes("linen")) {
            reply = "We offer a wide range of materials in our checklist selector. For casual, breathable wear, cotton or linen is ideal. For formal custom gowns, we recommend premium fabrics like silk, satin, or chiffon. For colder seasons, you can select wool, velvet, or leather. Make sure to tick your preferences when placing your order!";
        } else if (query.includes("pay") || query.includes("payment") || query.includes("commission") || query.includes("escrow") || query.includes("price")) {
            reply = "Transactions are centralized through the Fashion Girl payment gateway. When you make a payment, the platform holds the funds securely and releases them to the vendor once the order is finished. The platform retains a 10% commission fee to ensure payment protection and maintain our service quality.";
        } else if (query.includes("match") || query.includes("find") || query.includes("portfolio") || query.includes("recommend")) {
            reply = "Our multimodal matching system combines image and text processing. Upload a picture of your desired design and write a description; our CLIP-based AI will automatically compare it with our tailor portfolios to show you matches with a percentage score.";
        } else if (query.includes("hello") || query.includes("hi ") || query.includes("hey")) {
            reply = "Hello! I am your local Fashion Girl assistant. How can I help you today? Ask me about custom tailoring measurements, material recommendations, or platform payments!";
        } else {
            reply = "Thank you for reaching out! As the Fashion Girl assistant, I am here to help you get the best custom garments. You can ask me how to measure yourself, what fabrics work best, or how to navigate our vendor matching system.";
        }

        return res.status(200).json({
            reply,
            source: "Fashion Assistant Fallback Engine",
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    handleChat,
};
