const express = require("express");

const { createOrder, payOrder, getOrders, getPlatformEarnings, updateOrderStatus, getVendorStats } = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.post("/", createOrder);
router.post("/:id/pay", payOrder);
router.get("/", getOrders);
router.get("/earnings", getPlatformEarnings);
router.patch("/:id/status", updateOrderStatus);
router.get("/vendor-stats", getVendorStats);

module.exports = router;
