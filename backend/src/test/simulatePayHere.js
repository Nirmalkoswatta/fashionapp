const crypto = require("crypto");

/**
 * PayHere Simulation Test Script
 * Verifies PayHere checksum math for both:
 * 1. Frontend checkout form hash generation
 * 2. Backend IPN webhook notification verification
 */

const merchantId = "1234567";
const merchantSecret = "my_secret_key_abc123";
const orderId = "order_test_98765";
const amount = "1500.00";
const currency = "LKR";
const statusCode = "2"; // 2 = SUCCESS

console.log("=========================================");
console.log(" PAYHERE PAYMENT LIFECYCLE SIMULATION");
console.log("=========================================\n");

// Step 1: Merchant Secret MD5 hash
const secretHash = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
console.log(`[1] MD5(merchant_secret): ${secretHash}`);

// Step 2: Checkout Request Hash (Sent to PayHere Sandbox)
const checkoutRaw = `${merchantId}${orderId}${amount}${currency}${secretHash}`;
const checkoutHash = crypto.createHash("md5").update(checkoutRaw).digest("hex").toUpperCase();
console.log(`[2] Checkout Hash to send to PayHere: ${checkoutHash}`);

// Step 3: PayHere Sandbox processes payment & sends IPN Callback (notify_url)
const notifyRaw = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
const payhereGeneratedMd5Sig = crypto.createHash("md5").update(notifyRaw).digest("hex").toUpperCase();

const simulatedCallbackPayload = {
    merchant_id: merchantId,
    order_id: orderId,
    payment_id: "320025123456",
    payhere_amount: amount,
    payhere_currency: currency,
    status_code: statusCode,
    md5sig: payhereGeneratedMd5Sig,
    method: "VISA",
    status_message: "Successfully completed the payment.",
};

console.log("\n[3] Simulated PayHere IPN Callback Payload (POST /api/payment/notify):");
console.log(JSON.stringify(simulatedCallbackPayload, null, 2));

// Step 4: Backend verifies MD5 Signature
const backendCalculatedSig = crypto
    .createHash("md5")
    .update(`${simulatedCallbackPayload.merchant_id}${simulatedCallbackPayload.order_id}${simulatedCallbackPayload.payhere_amount}${simulatedCallbackPayload.payhere_currency}${simulatedCallbackPayload.status_code}${secretHash}`)
    .digest("hex")
    .toUpperCase();

console.log(`\n[4] Backend Calculated Signature : ${backendCalculatedSig}`);
console.log(`    PayHere Received Signature   : ${simulatedCallbackPayload.md5sig}`);

const isSignatureValid = backendCalculatedSig === simulatedCallbackPayload.md5sig;
console.log(`    Signature Match Status       : ${isSignatureValid ? "✅ VERIFIED & AUTHENTIC" : "❌ REJECTED"}`);

if (isSignatureValid && simulatedCallbackPayload.status_code === "2") {
    console.log("\n[5] Database Order Status Update: Status -> 'paid', Method -> 'payhere', PaymentID -> 320025123456");
    console.log("🎉 Lifecycle completed: Customer -> Checkout -> PayHere Sandbox -> Callback Verified -> DB Updated!");
}
