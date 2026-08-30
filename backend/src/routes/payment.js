const express = require("express");
const { createPayment, handleNotify, confirmCOD, getPaymentStatus } = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// ── Authenticated routes (customer must be logged in) ──────────────────────

// Step 1: Create a PayHere payment session (returns form fields + hash)
router.post("/create-payment", requireAuth, createPayment);

// Cash on Delivery confirmation (bypasses PayHere)
router.post("/cod", requireAuth, confirmCOD);

// Poll order payment status after returning from PayHere
router.get("/status/:orderId", requireAuth, getPaymentStatus);

// ── PayHere webhook — NO auth middleware ──────────────────────────────────
// PayHere POSTs here directly (server-to-server). It does NOT send a JWT.
// Security is handled inside handleNotify via MD5 signature verification.
router.post("/notify", handleNotify);

module.exports = router;
