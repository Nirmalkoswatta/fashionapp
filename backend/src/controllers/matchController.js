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

module.exports = {
    upload,
    matchVendors,
};
