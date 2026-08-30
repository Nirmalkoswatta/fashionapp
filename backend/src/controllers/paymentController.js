const crypto = require("crypto");
const Order = require("../models/Order");

// ─────────────────────────────────────────────────────────────────────────────
// PayHere Hash Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the MD5 hash required by PayHere for the checkout form.
 *
 * Formula (from PayHere docs):
 *   hash = MD5( merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase() ).toUpperCase()
 */
function generateCheckoutHash({ merchantId, orderId, amount, currency, merchantSecret }) {
    const secretHash = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawString = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
    return crypto.createHash("md5").update(rawString).digest("hex").toUpperCase();
}

/**
 * Verifies the MD5 signature sent by PayHere on the notify_url.
 *
 * Formula (from PayHere docs):
 *   local_md5sig = MD5(
 *     merchant_id + order_id + payhere_amount + payhere_currency +
 *     status_code + MD5(merchant_secret).toUpperCase()
 *   ).toUpperCase()
 *
 *   Verified if: local_md5sig === received md5sig AND status_code == 2
 */
function verifyNotificationHash({ merchantId, orderId, amount, currency, statusCode, md5sig, merchantSecret }) {
    const secretHash = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const rawString = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
    const localSig = crypto.createHash("md5").update(rawString).digest("hex").toUpperCase();
    return localSig === md5sig.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/create-payment
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Creates a PayHere payment session.
 * Returns all form fields the frontend needs to POST to PayHere's checkout URL.
 */
async function createPayment(req, res, next) {
    try {
        const { orderId } = req.body;
        const userId = req.auth.sub;

        if (!orderId) {
            return res.status(400).json({ message: "orderId is required." });
        }

        const order = await Order.findById(orderId).populate("customerId", "name email phone");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.customerId._id.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: This order does not belong to you." });
        }

        if (order.status !== "pending") {
            return res.status(400).json({
                message: `Cannot initiate payment: order status is already "${order.status}".`,
            });
        }

        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantId || !merchantSecret) {
            console.error("[paymentController] PayHere credentials not configured in .env");
            return res.status(503).json({
                message: "Payment gateway is not configured. Please contact support.",
            });
        }

        // PayHere requires amount formatted to 2 decimal places
        const amountFormatted = order.amount.toFixed(2);
        const currency = "LKR"; // Sri Lankan Rupee (change to USD if needed)

        // Use the order's MongoDB _id as the PayHere order_id reference
        const payhereOrderId = order._id.toString();

        const hash = generateCheckoutHash({
            merchantId,
            orderId: payhereOrderId,
            amount: amountFormatted,
            currency,
            merchantSecret,
        });

        console.log("=========================================");
        console.log(" PAYHERE CHECKOUT HASH DEBUG");
        console.log(" Merchant ID :", merchantId);
        console.log(" Order ID    :", payhereOrderId);
        console.log(" Amount      :", amountFormatted);
        console.log(" Currency    :", currency);
        console.log(" Secret Hash :", crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase());
        console.log(" Final Hash  :", hash);
        console.log(" Sandbox Mode:", process.env.PAYHERE_SANDBOX);
        console.log("=========================================");

        const isSandbox = process.env.PAYHERE_SANDBOX === "true";
        const checkoutUrl = isSandbox
            ? "https://sandbox.payhere.lk/pay/checkout"
            : "https://www.payhere.lk/pay/checkout";

        const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
        const backendBase = process.env.BACKEND_URL || "http://localhost:5000";

        // Build customer info from the populated order
        const customer = order.customerId;
        const [firstName, ...rest] = (customer.name || "Customer").split(" ");
        const lastName = rest.join(" ") || "User";

        const paymentData = {
            checkoutUrl,
            formFields: {
                merchant_id: merchantId,
                return_url: `${frontendBase}/payment/success`,
                cancel_url: `${frontendBase}/payment/cancel`,
                notify_url: `${backendBase}/api/payhere/notify`,
                order_id: payhereOrderId,
                items: `Fashion Girl Custom Order — ${order.textDescription.substring(0, 80)}`,
                currency,
                amount: amountFormatted,
                first_name: firstName,
                last_name: lastName,
                email: customer.email || "",
                phone: customer.phone || "0771234567",
                address: "Colombo",
                city: "Colombo",
                country: "Sri Lanka",
                hash,
            },
        };

        return res.status(200).json({
            message: "PayHere session created. Redirect customer to checkout.",
            ...paymentData,
        });
    } catch (error) {
        return next(error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payhere/notify  (PayHere webhook — NO auth middleware)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PayHere calls this endpoint after a payment attempt.
 * CRITICAL: verify the MD5 checksum before trusting any data from this request.
 *
 * PayHere status codes:
 *   2  = SUCCESS
 *   0  = PENDING
 *  -1  = CANCELLED
 *  -2  = FAILED
 *  -3  = CHARGEDBACK
 */
async function handleNotify(req, res, next) {
    try {
        console.log("================================");
        console.log("PAYHERE NOTIFICATION RECEIVED");
        console.log("================================");
        console.log(req.body);

        const data = req.body;
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig,
            payment_id,
            method,
        } = data;

        // Allow developer testing endpoints (e.g. curl / Postman tests with merchant_id=TEST)
        if (merchant_id === "TEST" || !md5sig) {
            console.log("[PayHere Notify] ℹ️ Test notification ping received and acknowledged.");
            return res.status(200).send("OK");
        }

        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        // 1. Verify MD5 Signature
        const isValid = verifyNotificationHash({
            merchantId: merchant_id,
            orderId: order_id,
            amount: payhere_amount,
            currency: payhere_currency,
            statusCode: status_code,
            md5sig,
            merchantSecret,
        });

        if (!isValid) {
            console.error(`[PayHere Notify] ❌ INVALID PAYMENT NOTIFICATION for order ${order_id}. Possible tampering!`);
            return res.status(400).send("Invalid");
        }

        // 2. Find the order in MongoDB
        const order = await Order.findById(order_id);
        if (!order) {
            console.error(`[PayHere Notify] Order not found in database: ${order_id}`);
            return res.status(200).send("OK");
        }

        const statusNum = parseInt(status_code, 10);

        // 3. Update order based on PayHere status
        if (statusNum === 2) {
            console.log("=========================================");
            console.log(" 🎉 PAYMENT SUCCESS!");
            console.log(" Order ID  :", order_id);
            console.log(" Payment ID:", payment_id);
            console.log(" Method    :", method);
            console.log(" Amount    :", `${payhere_currency} ${payhere_amount}`);
            console.log("=========================================");

            if (order.status === "pending") {
                order.status = "paid";
                order.paymentMethod = "payhere";
                order.payherePaymentId = payment_id || null;
                order.payhereMethod = method || null;
                await order.save();
                console.log(`[PayHere Notify] ✅ Order #${order_id} marked as PAID in MongoDB.`);
            }
        } else if (statusNum === 0) {
            console.log(`[PayHere Notify] ⏳ Order ${order_id} is PENDING (status 0).`);
        } else if (statusNum === -1) {
            console.log(`[PayHere Notify] ❌ Order ${order_id} CANCELLED by customer.`);
            order.status = "cancelled";
            await order.save();
        } else if (statusNum === -2) {
            console.log(`[PayHere Notify] ❌ Order ${order_id} payment FAILED.`);
        } else if (statusNum === -3) {
            console.log(`[PayHere Notify] ⚠️ Order ${order_id} CHARGEDBACK.`);
            order.status = "cancelled";
            await order.save();
        }

        return res.send("OK");
    } catch (error) {
        console.error("[PayHere Notify] Unhandled error:", error);
        return res.sendStatus(200);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payment/cod
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Confirms a Cash on Delivery order without going through PayHere.
 * The platform marks the order as paid (COD) immediately on customer commitment.
 */
async function confirmCOD(req, res, next) {
    try {
        const { orderId } = req.body;
        const userId = req.auth.sub;

        if (!orderId) {
            return res.status(400).json({ message: "orderId is required." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.customerId.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden: This order does not belong to you." });
        }

        if (order.status !== "pending") {
            return res.status(400).json({
                message: `Cannot confirm COD: order is already "${order.status}".`,
            });
        }

        order.status = "paid";
        order.paymentMethod = "cod";
        await order.save();

        const populatedOrder = await Order.findById(orderId).populate("customerId", "name email");

        return res.status(200).json({
            message: "Cash on Delivery confirmed! Please prepare payment upon delivery.",
            order: populatedOrder,
        });
    } catch (error) {
        return next(error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payment/status/:orderId
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Lightweight endpoint the frontend polls after returning from PayHere
 * to check if the notify_url has already updated the order to "paid".
 */
async function getPaymentStatus(req, res, next) {
    try {
        const { orderId } = req.params;
        const userId = req.auth.sub;

        const order = await Order.findById(orderId).select("status paymentMethod payherePaymentId");
        if (!order) {
            return res.status(404).json({ message: "Order not found." });
        }

        if (order.customerId && order.customerId.toString() !== userId) {
            return res.status(403).json({ message: "Forbidden." });
        }

        return res.status(200).json({
            orderId,
            status: order.status,
            paymentMethod: order.paymentMethod,
            payherePaymentId: order.payherePaymentId || null,
        });
    } catch (error) {
        return next(error);
    }
}

module.exports = { createPayment, handleNotify, confirmCOD, getPaymentStatus };
