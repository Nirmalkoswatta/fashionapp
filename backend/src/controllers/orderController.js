const Order = require("../models/Order");

async function createOrder(req, res, next) {
    try {
        const { vendorId, textDescription, materials, measurements, amount, quantity } = req.body;
        const customerId = req.auth.sub;

        const missing = [];
        if (!vendorId) missing.push("vendorId");
        if (!textDescription) missing.push("textDescription");
        if (!amount) missing.push("amount");
        if (!measurements) missing.push("measurements");

        if (missing.length > 0) {
            return res.status(400).json({ message: `Missing required order parameters: ${missing.join(", ")}` });
        }

        const { chest, waist, hips, sleeve } = measurements;
        const missingMeasurements = [];
        if (!chest) missingMeasurements.push("chest");
        if (!waist) missingMeasurements.push("waist");
        if (!hips) missingMeasurements.push("hips");
        if (!sleeve) missingMeasurements.push("sleeve");

        if (missingMeasurements.length > 0) {
            return res.status(400).json({ message: `Incomplete sizing measurements: ${missingMeasurements.join(", ")}` });
        }

        const baseAmount = Number(amount);
        const commission = Math.round(baseAmount * 0.1 * 100) / 100;
        const netVendorAmount = Math.round((baseAmount - commission) * 100) / 100;

        const order = await Order.create({
            customerId,
            vendorId,
            textDescription,
            materials: materials || [],
            measurements: { chest, waist, hips, sleeve },
            amount: baseAmount,
            quantity: Number(quantity) || 1,
            commission,
            netVendorAmount,
            status: "pending",
        });

        return res.status(201).json({
            message: "Order placed successfully. Complete payment to proceed.",
            order,
        });
    } catch (error) {
        return next(error);
    }
}

async function payOrder(req, res, next) {
    try {
        const { id } = req.params;
        const { paymentMethod } = req.body;
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Simulate successful payment gateway transaction
        order.status = "paid";
        if (paymentMethod) {
            order.paymentMethod = paymentMethod === "cod" ? "cod" : "card";
        }
        await order.save();

        return res.status(200).json({
            message: "Payment processed successfully through platform gateway.",
            order,
        });
    } catch (error) {
        return next(error);
    }
}

async function getOrders(req, res, next) {
    try {
        const userId = req.auth.sub;
        const userRole = req.auth.role;
        const userEmail = req.auth.email;

        let query = {};
        if (userRole === "vendor") {
            query = { vendorId: userEmail };
        } else if (userRole === "customer") {
            query = { customerId: userId };
        }

        const orders = await Order.find(query)
            .populate("customerId", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json(orders);
    } catch (error) {
        return next(error);
    }
}

async function getPlatformEarnings(req, res, next) {
    try {
        // Platform admin can check profits
        const paidOrders = await Order.find({ status: "paid" });
        const totalEarnings = paidOrders.reduce((sum, order) => sum + (order.commission || 0), 0);
        return res.status(200).json({
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            count: paidOrders.length,
        });
    } catch (error) {
        return next(error);
    }
}

async function updateOrderStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userEmail = req.auth.email;
        const userRole = req.auth.role;

        const validStatuses = ["pending", "paid", "designing", "in_progress", "shipped"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status value." });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (userRole !== "admin" && userRole !== "staff" && order.vendorId !== userEmail) {
            return res.status(403).json({ message: "Forbidden: You are not the assigned vendor for this order." });
        }

        order.status = status;
        await order.save();

        const populatedOrder = await Order.findById(id).populate("customerId", "name email");

        return res.status(200).json({
            message: `Order status updated to ${status} successfully.`,
            order: populatedOrder,
        });
    } catch (error) {
        return next(error);
    }
}

async function getVendorStats(req, res, next) {
    try {
        const userEmail = req.auth.email;
        const userRole = req.auth.role;

        let query = {};
        if (userRole === "vendor") {
            query = { vendorId: userEmail };
        } else if (userRole !== "admin" && userRole !== "staff") {
            return res.status(403).json({ message: "Forbidden: Customers cannot access vendor earnings statistics." });
        }

        const orders = await Order.find(query);
        const paidOrders = orders.filter((o) => o.status !== "pending");

        // Escrow Balance = Paid orders that are NOT YET shipped
        const escrowOrders = paidOrders.filter((o) => o.status !== "shipped");
        const escrowBalance = escrowOrders.reduce((sum, o) => sum + (o.netVendorAmount || 0), 0);

        // Total Earnings = Paid orders that ARE shipped
        const completedOrders = paidOrders.filter((o) => o.status === "shipped");
        const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.netVendorAmount || 0), 0);

        // Platform Commission = Total commissions on all paid orders
        const platformCommission = paidOrders.reduce((sum, o) => sum + (o.commission || 0), 0);

        return res.status(200).json({
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            escrowBalance: Math.round(escrowBalance * 100) / 100,
            platformCommission: Math.round(platformCommission * 100) / 100,
            completedTransactions: completedOrders.map((o) => ({
                id: o._id,
                amount: o.amount,
                netVendorAmount: o.netVendorAmount,
                commission: o.commission,
                date: o.updatedAt,
                description: o.textDescription,
            })),
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    createOrder,
    payOrder,
    getOrders,
    getPlatformEarnings,
    updateOrderStatus,
    getVendorStats,
};
