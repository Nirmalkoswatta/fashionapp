const axios = require("axios");
const multer = require("multer");

const Portfolio = require("../models/Portfolio");

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function matchVendors(req, res, next) {
    try {
        const { text } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "Field 'image' file is required." });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Field 'text' is required." });
        }

        const portfolioItems = await Portfolio.find({}, { vendorId: 1, imageUrl: 1, description: 1 }).lean();

        if (portfolioItems.length === 0) {
            return res.status(404).json({ message: "No portfolio items found." });
        }

        const portfolioPayload = portfolioItems.map((item) => ({
            imageUrl: item.imageUrl,
            description: item.description,
        }));

        const formData = new FormData();
        const imageBlob = new Blob([req.file.buffer], {
            type: req.file.mimetype || "application/octet-stream",
        });

        formData.append("image", imageBlob, req.file.originalname || "design.jpg");
        formData.append("text", text.trim());
        formData.append("portfolio", JSON.stringify(portfolioPayload));

        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

        const aiResponse = await axios.post(`${aiServiceUrl}/match`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 30000,
        });

        if (!Array.isArray(aiResponse.data)) {
            return res.status(502).json({ message: "AI service returned an invalid response format." });
        }

        const rankedVendors = aiResponse.data
            .map((result) => {
                const portfolioItem = portfolioItems[result.index];
                const score = Number(result.finalScore);

                if (!portfolioItem || Number.isNaN(score)) {
                    return null;
                }

                return {
                    vendorId: portfolioItem.vendorId,
                    score,
                    imageScore: Number(result.imageScore),
                    textScore: Number(result.textScore),
                    keywordBoost: Number(result.keywordBoost || 0),
                    explain: result.explain || null,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

        return res.status(200).json(rankedVendors);
    } catch (error) {
        if (error.response) {
            return res.status(502).json({
                message: "AI service request failed.",
                detail: error.response.data,
            });
        }

        return next(error);
    }
}

async function uploadItem(req, res, next) {
    try {
        const { title, price, material } = req.body;
        const vendorEmail = req.auth.email;

        if (!req.file) {
            return res.status(400).json({ message: "Field 'image' file is required." });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Field 'title' is required." });
        }

        if (!price || Number.isNaN(Number(price))) {
            return res.status(400).json({ message: "Field 'price' is required and must be a number." });
        }

        if (!material || !material.trim()) {
            return res.status(400).json({ message: "Field 'material' is required." });
        }

        const imageUrl = `https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=random_${Date.now()}`;
        const description = `${title.trim()} made of ${material.trim()}. Price: $${Number(price).toFixed(2)}.`;

        const portfolioItem = await Portfolio.create({
            vendorId: vendorEmail,
            imageUrl,
            description,
        });

        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
        
        const formPayload = new FormData();
        const imageBlob = new Blob([req.file.buffer], {
            type: req.file.mimetype || "application/octet-stream",
        });
        formPayload.append("vendor_id", vendorEmail);
        formPayload.append("file", imageBlob, req.file.originalname || "garment.jpg");

        try {
            await axios.post(`${aiServiceUrl}/add-ai-item`, formPayload, {
                timeout: 30000,
            });
        } catch (aiErr) {
            console.error("AI service catalog bridge failed:", aiErr.message);
            return res.status(502).json({ message: "AI vector indexing failed. Ensure Python server is running.", detail: aiErr.message });
        }

        return res.status(201).json({
            message: "Item uploaded and indexed successfully.",
            portfolioItem,
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    upload,
    matchVendors,
    uploadItem,
};
