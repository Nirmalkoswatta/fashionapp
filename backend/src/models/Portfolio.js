const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
    {
        vendorId: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);
