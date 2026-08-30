const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vendorId: {
            type: String,
            required: true,
            trim: true,
        },
        textDescription: {
            type: String,
            required: true,
            trim: true,
        },
        materials: {
            type: [String],
            default: [],
        },
        measurements: {
            chest: { type: Number, required: true },
            waist: { type: Number, required: true },
            hips: { type: Number, required: true },
            sleeve: { type: Number, required: true },
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        commission: {
            type: Number,
            required: true,
            min: 0,
        },
        netVendorAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "paid", "designing", "in_progress", "shipped", "cancelled"],
            default: "pending",
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        paymentMethod: {
            type: String,
            enum: ["card", "cod", "payhere"],
            default: "payhere",
        },
        // PayHere-specific tracking fields
        payherePaymentId: {
            type: String,
            default: null,
        },
        payhereMethod: {
            type: String, // e.g. "VISA", "MASTER", "AMEX", "EZCASH"
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);
