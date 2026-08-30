import React, { useState } from "react";
import { useSelector } from "react-redux";
import { createPayment, confirmCOD } from "../api";

// ─── PayHere Logo SVG ──────────────────────────────────────────────────────
function PayHereLogo() {
    return (
        <svg width="90" height="22" viewBox="0 0 140 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayHere">
            <rect width="140" height="34" rx="6" fill="#E0252A" />
            <text x="12" y="23" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="white">Pay</text>
            <text x="48" y="23" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16" fill="white">Here</text>
        </svg>
    );
}

// ─── Security Badge ────────────────────────────────────────────────────────
function SecurityBadges() {
    return (
        <div className="pg-badges">
            <span className="pg-badge">🔒 256-bit SSL</span>
            <span className="pg-badge">✓ PCI DSS</span>
            <span className="pg-badge">🛡️ 3D Secure</span>
        </div>
    );
}

// ─── Accepted Card Icons ───────────────────────────────────────────────────
function CardNetworkIcons() {
    return (
        <div className="pg-card-networks">
            {["VISA", "MC", "AMEX", "eZCash", "mCash"].map((n) => (
                <span key={n} className="pg-card-chip">{n}</span>
            ))}
        </div>
    );
}

// ─── Step Indicator ───────────────────────────────────────────────────────
function StepIndicator({ step }) {
    const steps = ["Method", "Review", "Pay"];
    return (
        <div className="pg-steps">
            {steps.map((label, i) => (
                <React.Fragment key={label}>
                    <div className={`pg-step ${step >= i ? "active" : ""} ${step > i ? "done" : ""}`}>
                        <div className="pg-step-dot">{step > i ? "✓" : i + 1}</div>
                        <span>{label}</span>
                    </div>
                    {i < steps.length - 1 && <div className={`pg-step-line ${step > i ? "done" : ""}`} />}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main PaymentGateway Component
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Props:
 *   order      — the Order object to pay for
 *   onSuccess  — called after COD confirmation succeeds
 *   onClose    — called when user cancels/closes the modal
 */
export default function PaymentGateway({ order, onSuccess, onClose }) {
    const { token } = useSelector((state) => state.auth);

    const [step, setStep] = useState(0);              // 0=method, 1=review, 2=paying
    const [method, setMethod] = useState("payhere"); // "payhere" | "cod"
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!order) return null;

    // ── PayHere payment: Lightbox Popup or Form Redirect ──
    const handlePayHereRedirect = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await createPayment(token, order._id);

            // Option A: Use PayHere JS SDK Popup Lightbox if available
            if (window.payhere && typeof window.payhere.startPayment === "function") {
                window.payhere.onCompleted = function onCompleted(payhereOrderId) {
                    console.log("PayHere payment completed:", payhereOrderId);
                    setLoading(false);
                    onSuccess({ ...order, status: "paid" });
                };

                window.payhere.onDismissed = function onDismissed() {
                    console.log("PayHere payment modal dismissed");
                    setLoading(false);
                };

                window.payhere.onError = function onError(payhereErr) {
                    console.error("PayHere Error:", payhereErr);
                    setLoading(false);
                    setError("PayHere error: " + (payhereErr || "Payment authorization failed"));
                };

                // Trigger PayHere popup
                window.payhere.startPayment(data.formFields);
                return;
            }

            // Option B: Standard Form POST Redirect
            const form = document.createElement("form");
            form.method = "POST";
            form.action = data.checkoutUrl;

            Object.entries(data.formFields).forEach(([key, value]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            setLoading(false);
            setError(err.message || "Failed to initiate PayHere checkout. Please try again.");
        }
    };

    // ── COD: confirm with backend directly ────────────────────────────────
    const handleCODConfirm = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await confirmCOD(token, order._id);
            setLoading(false);
            onSuccess(data.order);
        } catch (err) {
            setLoading(false);
            setError(err.message || "COD confirmation failed. Please try again.");
        }
    };

    const handleProceed = () => {
        if (step === 0) { setStep(1); return; }
        if (step === 1) {
            if (method === "payhere") handlePayHereRedirect();
            else handleCODConfirm();
        }
    };

    return (
        <div className="modal-overlay pg-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="pg-modal" role="dialog" aria-modal="true" aria-label="Secure Checkout">

                {/* ── Header ── */}
                <div className="pg-header">
                    <div className="pg-header-left">
                        <PayHereLogo />
                        <span className="pg-header-title">Secure Checkout</span>
                    </div>
                    <button className="pg-close-btn" onClick={onClose} aria-label="Close" disabled={loading}>✕</button>
                </div>

                <StepIndicator step={step} />

                {/* ── Error Banner ── */}
                {error && (
                    <div className="pg-error-banner">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError("")}>✕</button>
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    STEP 0 — Choose Payment Method
                ════════════════════════════════════════════════ */}
                {step === 0 && (
                    <div className="pg-step-content">
                        <h2 className="pg-section-title">Choose Payment Method</h2>
                        <p className="pg-section-sub">Your payment is secured by PayHere, Sri Lanka's leading payment gateway.</p>

                        <div className="pg-method-grid">
                            {/* PayHere Online Card */}
                            <button
                                className={`pg-method-card ${method === "payhere" ? "selected" : ""}`}
                                onClick={() => setMethod("payhere")}
                                type="button"
                            >
                                <div className="pg-method-icon">💳</div>
                                <div className="pg-method-info">
                                    <strong>Pay Online via PayHere</strong>
                                    <span>Visa, Mastercard, Amex, eZCash, mCash</span>
                                </div>
                                <div className={`pg-method-radio ${method === "payhere" ? "checked" : ""}`} />
                            </button>

                            {/* Cash on Delivery */}
                            <button
                                className={`pg-method-card ${method === "cod" ? "selected" : ""}`}
                                onClick={() => setMethod("cod")}
                                type="button"
                            >
                                <div className="pg-method-icon">💵</div>
                                <div className="pg-method-info">
                                    <strong>Cash on Delivery (COD)</strong>
                                    <span>Pay in cash when your order arrives</span>
                                </div>
                                <div className={`pg-method-radio ${method === "cod" ? "checked" : ""}`} />
                            </button>
                        </div>

                        <CardNetworkIcons />
                        <SecurityBadges />
                    </div>
                )}

                {/* ════════════════════════════════════════════════
                    STEP 1 — Order Review & Confirmation
                ════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="pg-step-content">
                        <h2 className="pg-section-title">Order Summary</h2>

                        <div className="pg-order-summary">
                            <div className="pg-summary-row">
                                <span>Order Reference</span>
                                <strong className="pg-mono">#{order._id.slice(-8).toUpperCase()}</strong>
                            </div>
                            <div className="pg-summary-row">
                                <span>Design</span>
                                <strong style={{ maxWidth: "220px", textAlign: "right", fontSize: "0.82rem" }}>
                                    {order.textDescription.length > 60
                                        ? order.textDescription.substring(0, 60) + "…"
                                        : order.textDescription}
                                </strong>
                            </div>
                            <div className="pg-summary-row">
                                <span>Quantity</span>
                                <strong>{order.quantity || 1} item(s)</strong>
                            </div>
                            {order.materials?.length > 0 && (
                                <div className="pg-summary-row">
                                    <span>Materials</span>
                                    <strong>{order.materials.join(", ")}</strong>
                                </div>
                            )}
                            <div className="pg-divider" />
                            <div className="pg-summary-row">
                                <span>Subtotal</span>
                                <span>LKR {order.amount.toFixed(2)}</span>
                            </div>
                            <div className="pg-summary-row muted">
                                <span>Platform Escrow Fee (10%)</span>
                                <span>−LKR {order.commission.toFixed(2)}</span>
                            </div>
                            <div className="pg-summary-row total">
                                <span>Total to Pay</span>
                                <strong className="pg-amount-highlight">LKR {order.amount.toFixed(2)}</strong>
                            </div>
                        </div>

                        {/* Payment method reminder */}
                        <div className={`pg-method-reminder ${method === "cod" ? "cod" : "card"}`}>
                            {method === "payhere" ? (
                                <>
                                    <span>💳</span>
                                    <div>
                                        <strong>Paying via PayHere</strong>
                                        <p>You'll be redirected to PayHere's secure page to enter your card details. Your card info never touches our servers.</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>💵</span>
                                    <div>
                                        <strong>Cash on Delivery</strong>
                                        <p>By confirming, you commit to paying <strong>LKR {order.amount.toFixed(2)}</strong> in cash upon delivery of your custom garment.</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <SecurityBadges />
                    </div>
                )}

                {/* ── Footer Buttons ── */}
                <div className="pg-footer">
                    {step > 0 && (
                        <button
                            className="pg-btn-secondary"
                            onClick={() => { setError(""); setStep(step - 1); }}
                            disabled={loading}
                        >
                            ← Back
                        </button>
                    )}
                    <button
                        className="pg-btn-primary"
                        onClick={handleProceed}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="pg-loading-spinner">
                                <span className="pg-spinner" />
                                {method === "payhere" ? "Redirecting to PayHere…" : "Confirming COD…"}
                            </span>
                        ) : step === 0 ? (
                            "Continue →"
                        ) : method === "payhere" ? (
                            `Pay LKR ${order.amount.toFixed(2)} via PayHere`
                        ) : (
                            "Confirm Cash on Delivery"
                        )}
                    </button>
                </div>

                <p className="pg-footer-note">
                    🔒 Payments processed securely by{" "}
                    <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer">PayHere</a>.
                    Your data is encrypted end-to-end.
                </p>
            </div>
        </div>
    );
}
