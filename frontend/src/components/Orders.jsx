import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getOrders, updateOrderStatus, getVendors, createOrder, confirmCOD } from "../api";
import MannequinSketch from "./MannequinSketch";
import PaymentGateway from "./PaymentGateway";

const AVAILABLE_MATERIALS = [
    "Cotton",
    "Silk",
    "Linen",
    "Wool",
    "Polyester",
    "Chiffon",
    "Denim",
    "Satin",
    "Velvet",
];

function Orders() {
    const { token, user } = useSelector((state) => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [activeModalOrder, setActiveModalOrder] = useState(null);
    const [activeMarker, setActiveMarker] = useState(null);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Manual Order Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    const [selectedVendor, setSelectedVendor] = useState("");
    const [textDescription, setTextDescription] = useState("");
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [measurements, setMeasurements] = useState({ chest: "", waist: "", hips: "", sleeve: "" });
    const [unitPrice, setUnitPrice] = useState("");
    const [quantity, setQuantity] = useState(1);

    // Payment Gateway Modal State
    const [activePaymentOrder, setActivePaymentOrder] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getOrders(token);
            setOrders(data);
        } catch (err) {
            setError(err.message || "Failed to fetch orders.");
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const data = await getVendors(token);
            setVendors(data);
        } catch (err) {
            console.error("Failed to fetch vendors", err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
            if (user?.role === "customer") {
                fetchVendors();
            }
        }
    }, [token, user]);

    const handlePaymentSuccess = (updatedOrder) => {
        setActivePaymentOrder(null);
        setSuccessMsg(`Payment confirmed! Order #${updatedOrder._id.slice(-8).toUpperCase()} is now paid and in the queue.`);
        fetchOrders();
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            setUpdatingStatusId(orderId);
            setError("");
            setSuccessMsg("");
            await updateOrderStatus(token, orderId, newStatus);
            setSuccessMsg(`Order status updated to ${newStatus} successfully!`);
            fetchOrders();
        } catch (err) {
            setError(err.message || "Failed to update status.");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleMaterialToggle = (material) => {
        setSelectedMaterials((prev) =>
            prev.includes(material)
                ? prev.filter((m) => m !== material)
                : [...prev, material]
        );
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        setFormError("");
        setFormSuccess("");

        if (!selectedVendor) {
            setFormError("Please select a vendor.");
            return;
        }
        if (!textDescription.trim()) {
            setFormError("Please enter a design description.");
            return;
        }
        if (!unitPrice || isNaN(Number(unitPrice)) || Number(unitPrice) <= 0) {
            setFormError("Please enter a valid unit price.");
            return;
        }
        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            setFormError("Please enter a valid quantity.");
            return;
        }

        const { chest, waist, hips, sleeve } = measurements;
        if (!chest || !waist || !hips || !sleeve) {
            setFormError("Please complete all tailoring measurements.");
            return;
        }

        const totalAmount = Math.round((Number(unitPrice) * Number(quantity)) * 100) / 100;

        try {
            setFormLoading(true);
            await createOrder(token, {
                vendorId: selectedVendor,
                textDescription: textDescription.trim(),
                materials: selectedMaterials,
                measurements: {
                    chest: Number(chest),
                    waist: Number(waist),
                    hips: Number(hips),
                    sleeve: Number(sleeve),
                },
                amount: totalAmount,
                quantity: Number(quantity),
            });

            setFormSuccess("Custom order placed successfully!");
            // Reset form
            setSelectedVendor("");
            setTextDescription("");
            setSelectedMaterials([]);
            setMeasurements({ chest: "", waist: "", hips: "", sleeve: "" });
            setUnitPrice("");
            setQuantity(1);
            setShowCreateForm(false);
            
            // Refresh list
            fetchOrders();
        } catch (err) {
            setFormError(err.message || "Failed to place custom order.");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <section className="orders-shell">
            <header className="home-header">
                <p className="brand">Platform Escrow System</p>
                <h1>{user?.role === "vendor" ? "Vendor Order Book" : "Custom Tailoring Orders"}</h1>
                <p className="subtitle">
                    {user?.role === "vendor"
                        ? "Inspect sizing parameters, manage custom design phases, and monitor your escrow balances."
                        : "Track your tailor specifications, material parameters, and complete transactions securely."}
                </p>
            </header>

            {user?.role === "customer" && (
                <div style={{ margin: "1.5rem 0 1rem 0", display: "flex", justifyContent: "flex-end" }}>
                    <button
                        className="primary-btn"
                        onClick={() => {
                            setShowCreateForm(!showCreateForm);
                            setFormError("");
                            setFormSuccess("");
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                        {showCreateForm ? "✕ Cancel Order Form" : "🧵 Place New Custom Order"}
                    </button>
                </div>
            )}

            {showCreateForm && user?.role === "customer" && (
                <section className="configurator-panel" style={{ margin: "1rem 0 2rem 0" }}>
                    <h2>Create Custom Order Manually</h2>
                    <p className="configurator-sub">Specify a tailor, design description, fabrics, and measurement sizing.</p>

                    {formError ? <p className="form-error">{formError}</p> : null}
                    {formSuccess ? (
                        <p
                            className="form-error success-shell"
                            style={{ color: "#1b4332", borderColor: "#52b788", backgroundColor: "#d8f3dc" }}
                        >
                            {formSuccess}
                        </p>
                    ) : null}

                    <form onSubmit={handleCreateOrder} className="configurator-form">
                        <div className="configurator-two-col">
                            {/* Left Column: Vendor, Description, Amount */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>
                                    Select Vendor (Tailor) *
                                    <select
                                        value={selectedVendor}
                                        onChange={(e) => setSelectedVendor(e.target.value)}
                                        style={{
                                            padding: "0.6rem 0.8rem",
                                            borderRadius: "var(--radius)",
                                            border: "1px solid var(--line)",
                                            backgroundColor: "var(--paper)",
                                            color: "var(--ink)",
                                            fontSize: "0.95rem",
                                            cursor: "pointer"
                                        }}
                                        required
                                    >
                                        <option value="">-- Choose an Active Vendor --</option>
                                        {vendors.map((v) => (
                                            <option key={v._id} value={v.email}>
                                                {v.name} ({v.email})
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>
                                    Design Description *
                                    <textarea
                                        placeholder="Describe your design idea in detail, e.g., A formal blue velvet blazer with silk lapels..."
                                        value={textDescription}
                                        onChange={(e) => setTextDescription(e.target.value)}
                                        style={{
                                            border: "1px solid var(--line)",
                                            borderRadius: "14px",
                                            padding: "0.8rem 0.9rem",
                                            font: "inherit",
                                            color: "var(--ink)",
                                            background: "rgba(255, 255, 255, 0.92)",
                                            minHeight: "100px",
                                            resize: "vertical",
                                            outline: "none"
                                        }}
                                        required
                                    />
                                </label>

                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>
                                        Unit Price ($) *
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="e.g. 150.00"
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            style={{
                                                border: "1px solid var(--line)",
                                                borderRadius: "14px",
                                                padding: "0.8rem 0.9rem",
                                                font: "inherit",
                                                color: "var(--ink)",
                                                background: "rgba(255, 255, 255, 0.92)",
                                                outline: "none"
                                            }}
                                            required
                                        />
                                    </label>

                                    <label style={{ width: "120px", display: "flex", flexDirection: "column", gap: "0.3rem", fontWeight: "600", fontSize: "0.9rem" }}>
                                        Quantity *
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                            style={{
                                                border: "1px solid var(--line)",
                                                borderRadius: "14px",
                                                padding: "0.8rem 0.9rem",
                                                font: "inherit",
                                                color: "var(--ink)",
                                                background: "rgba(255, 255, 255, 0.92)",
                                                outline: "none"
                                            }}
                                            required
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Right Column: Measurements & Fabric */}
                            <div className="measurements-inputs">
                                <label className="section-label">Tailor Measurements (Inches) *</label>
                                <div className="inputs-block">
                                    <label className={activeMarker === "chest" ? "active-label" : ""}>
                                        Chest Measurement
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="20"
                                            max="60"
                                            placeholder="e.g. 36.5"
                                            value={measurements.chest}
                                            onFocus={() => setActiveMarker("chest")}
                                            onChange={(e) => setMeasurements((prev) => ({ ...prev, chest: e.target.value }))}
                                            required
                                        />
                                    </label>

                                    <label className={activeMarker === "waist" ? "active-label" : ""}>
                                        Waist Measurement
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="20"
                                            max="60"
                                            placeholder="e.g. 29.0"
                                            value={measurements.waist}
                                            onFocus={() => setActiveMarker("waist")}
                                            onChange={(e) => setMeasurements((prev) => ({ ...prev, waist: e.target.value }))}
                                            required
                                        />
                                    </label>

                                    <label className={activeMarker === "hips" ? "active-label" : ""}>
                                        Hips Measurement
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="20"
                                            max="60"
                                            placeholder="e.g. 38.0"
                                            value={measurements.hips}
                                            onFocus={() => setActiveMarker("hips")}
                                            onChange={(e) => setMeasurements((prev) => ({ ...prev, hips: e.target.value }))}
                                            required
                                        />
                                    </label>

                                    <label className={activeMarker === "sleeve" ? "active-label" : ""}>
                                        Sleeve Length
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="10"
                                            max="45"
                                            placeholder="e.g. 24.5"
                                            value={measurements.sleeve}
                                            onFocus={() => setActiveMarker("sleeve")}
                                            onChange={(e) => setMeasurements((prev) => ({ ...prev, sleeve: e.target.value }))}
                                            required
                                        />
                                    </label>
                                </div>

                                <div className="materials-block" style={{ marginTop: "1rem" }}>
                                    <label className="section-label">Garment Materials Selector</label>
                                    <div className="materials-grid">
                                        {AVAILABLE_MATERIALS.map((material) => (
                                            <label key={material} className="material-checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMaterials.includes(material)}
                                                    onChange={() => handleMaterialToggle(material)}
                                                />
                                                {material}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing display preview */}
                        {unitPrice && !isNaN(Number(unitPrice)) && Number(unitPrice) > 0 && (
                            <div className="pricing-preview-block" style={{ marginTop: "1rem" }}>
                                <div className="price-row">
                                    <span>Subtotal Custom Design ({quantity} x ${Number(unitPrice).toFixed(2)}):</span>
                                    <strong>${(Number(unitPrice) * Number(quantity)).toFixed(2)}</strong>
                                </div>
                                <div className="price-row commission-row">
                                    <span>Centralized Escrow Fee (10%):</span>
                                    <span>${(Number(unitPrice) * Number(quantity) * 0.1).toFixed(2)}</span>
                                </div>
                                <div className="price-row total-row">
                                    <span>Total Price to Pay:</span>
                                    <strong>${(Number(unitPrice) * Number(quantity)).toFixed(2)}</strong>
                                </div>
                            </div>
                        )}

                        <button className="primary-btn submit-order-btn" type="submit" disabled={formLoading} style={{ marginTop: "1rem" }}>
                            {formLoading ? "Placing Custom Order..." : "Confirm & Place Custom Order"}
                        </button>
                    </form>
                </section>
            )}

            {error ? <p className="form-error">{error}</p> : null}
            {successMsg ? (
                <p
                    className="form-error success-shell"
                    style={{ color: "#1b4332", borderColor: "#52b788", backgroundColor: "#d8f3dc" }}
                >
                    {successMsg}
                </p>
            ) : null}

            {loading ? <div className="spinner" aria-label="loading" /> : null}

            {!loading && orders.length === 0 ? (
                <div className="empty-state-orders">
                    <p className="empty-state">No custom orders found.</p>
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                        {user?.role === "vendor"
                            ? "Awaiting your first design match order from buyers!"
                            : "Find matching vendors and configure tailoring specifications to place your first order!"}
                    </p>
                </div>
            ) : null}

            {!loading && orders.length > 0 ? (
                user?.role === "vendor" ? (
                    <div
                        className="orders-table-wrapper"
                        style={{
                            overflowX: "auto",
                            margin: "1.5rem 0",
                            backgroundColor: "var(--paper)",
                            borderRadius: "var(--radius)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                        }}
                    >
                        <table className="orders-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid var(--gray-light)", backgroundColor: "var(--gray-light)", color: "var(--ink-light)" }}>
                                    <th style={{ padding: "0.8rem 1rem" }}>Order ID</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Customer</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Material Type</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Qty</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Net Payout</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Status</th>
                                    <th style={{ padding: "0.8rem 1rem" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} style={{ borderBottom: "1px solid var(--gray-light)" }}>
                                        <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--muted)" }}>{order._id}</td>
                                        <td style={{ padding: "1rem" }}>
                                            <strong>{order.customerId?.name || "Customer"}</strong>
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{order.customerId?.email}</div>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            {order.materials && order.materials.length > 0 ? order.materials.join(", ") : "None"}
                                        </td>
                                        <td style={{ padding: "1rem" }}>{order.quantity || 1}</td>
                                        <td style={{ padding: "1rem", fontWeight: "bold" }}>
                                            ${order.netVendorAmount?.toFixed(2)}
                                            {order.status !== "pending" && (
                                                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: "normal" }}>
                                                    via {order.paymentMethod === "cod" ? "COD" : "Visa"}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <select
                                                value={order.status}
                                                disabled={updatingStatusId === order._id}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                style={{
                                                    padding: "0.4rem 0.6rem",
                                                    borderRadius: "var(--radius)",
                                                    border: "1px solid var(--gray-light)",
                                                    backgroundColor: "var(--paper)",
                                                    cursor: "pointer",
                                                    fontSize: "0.85rem"
                                                }}
                                            >
                                                <option value="pending">Pending Payment</option>
                                                <option value="paid">Paid</option>
                                                <option value="designing">Designing</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="shipped">Shipped</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <button
                                                className="secondary-btn"
                                                onClick={() => setActiveModalOrder(order)}
                                                style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                                            >
                                                🔍 Inspect Measurements
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <article key={order._id} className="order-card">
                                <div className="order-card-header">
                                    <div>
                                        <h3>Order from {order.vendorId}</h3>
                                        <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.78rem", color: "var(--muted)" }}>
                                            <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span><strong>Quantity: {order.quantity || 1}</strong></span>
                                        </div>
                                    </div>
                                    <span className={`order-status-badge ${order.status}`}>
                                        {order.status === "paid"
                                            ? `✓ Paid (${order.paymentMethod === "cod" ? "COD" : "Visa"})`
                                            : order.status === "pending"
                                            ? "Pending Payment"
                                            : order.status}
                                    </span>
                                </div>
 
                                <div className="order-card-body">
                                    <div className="order-details-col">
                                        <p><strong>Design Idea:</strong> {order.textDescription}</p>
                                        <p>
                                            <strong>Preferred Materials:</strong>{" "}
                                            {order.materials && order.materials.length > 0
                                                ? order.materials.join(", ")
                                                : "No material preference chosen"}
                                        </p>
                                    </div>
 
                                    <div className="order-measurements-col">
                                        <h4>Measurements (Inches)</h4>
                                        <div className="measurement-bubble-grid">
                                            <div className="measure-bubble">
                                                <span>Chest</span>
                                                <strong>{order.measurements?.chest}"</strong>
                                            </div>
                                            <div className="measure-bubble">
                                                <span>Waist</span>
                                                <strong>{order.measurements?.waist}"</strong>
                                            </div>
                                            <div className="measure-bubble">
                                                <span>Hips</span>
                                                <strong>{order.measurements?.hips}"</strong>
                                            </div>
                                            <div className="measure-bubble">
                                                <span>Sleeve</span>
                                                <strong>{order.measurements?.sleeve}"</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
 
                                <div className="order-card-footer">
                                    <div className="pricing-breakdown">
                                        <div className="price-item">
                                            <span>Subtotal Price ({order.quantity || 1} x ${(order.amount / (order.quantity || 1)).toFixed(2)}):</span>
                                            <strong>${order.amount.toFixed(2)}</strong>
                                        </div>
                                        <div className="price-item commission-split">
                                            <span>Platform Fee (10%):</span>
                                            <strong style={{ color: "var(--accent-deep)" }}>-${order.commission.toFixed(2)}</strong>
                                        </div>
                                        <div className="price-item vendor-payout">
                                            <span>Vendor Payout (90%):</span>
                                            <strong style={{ color: "var(--ok)" }}>${order.netVendorAmount.toFixed(2)}</strong>
                                        </div>
                                    </div>
 
                                    {order.status === "pending" ? (
                                        <button
                                            className="primary-btn pay-btn"
                                            disabled={actionLoading === order._id}
                                            onClick={() => setActivePaymentOrder(order)}
                                        >
                                            💳 Pay Now (LKR {order.amount.toFixed(2)})
                                        </button>
                                    ) : (
                                        <div className="payment-receipt-info">
                                            Paid via centralized platform escrow ({order.paymentMethod === "cod" ? "Cash on Delivery" : "Visa Card"}). Secured.
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )
            ) : null}

            {/* Interactive Sizing Inspection Modal */}
            {activeModalOrder && (
                <div
                    className="modal-overlay"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        zIndex: 1000,
                        padding: "1rem"
                    }}
                >
                    <div
                        className="modal-content"
                        style={{
                            backgroundColor: "var(--paper)",
                            padding: "2rem",
                            borderRadius: "var(--radius)",
                            maxWidth: "800px",
                            width: "100%",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: "1px solid var(--gray-light)",
                                paddingBottom: "1rem",
                                marginBottom: "1.5rem"
                            }}
                        >
                            <h2 style={{ margin: 0 }}>Inspect Sizing & Design Details</h2>
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    setActiveModalOrder(null);
                                    setActiveMarker(null);
                                }}
                                style={{ padding: "0.3rem 0.8rem" }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="configurator-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                            <div>
                                <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Interactive Outline Sketch</h3>
                                <MannequinSketch
                                    activeField={activeMarker}
                                    onMarkerClick={(fieldId) => setActiveMarker(fieldId)}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                                <div>
                                    <h3 style={{ fontSize: "1rem", marginBottom: "0.8rem" }}>Numerical Sizing (Inches)</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                                        <div
                                            onClick={() => setActiveMarker("chest")}
                                            style={{
                                                padding: "0.8rem",
                                                backgroundColor: activeMarker === "chest" ? "rgba(239, 71, 111, 0.1)" : "var(--gray-light)",
                                                border: activeMarker === "chest" ? "1px solid var(--accent-deep)" : "1px solid transparent",
                                                borderRadius: "var(--radius)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>1. Chest</div>
                                            <strong style={{ fontSize: "1.2rem" }}>{activeModalOrder.measurements?.chest}"</strong>
                                        </div>
                                        <div
                                            onClick={() => setActiveMarker("waist")}
                                            style={{
                                                padding: "0.8rem",
                                                backgroundColor: activeMarker === "waist" ? "rgba(239, 71, 111, 0.1)" : "var(--gray-light)",
                                                border: activeMarker === "waist" ? "1px solid var(--accent-deep)" : "1px solid transparent",
                                                borderRadius: "var(--radius)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>2. Waist</div>
                                            <strong style={{ fontSize: "1.2rem" }}>{activeModalOrder.measurements?.waist}"</strong>
                                        </div>
                                        <div
                                            onClick={() => setActiveMarker("hips")}
                                            style={{
                                                padding: "0.8rem",
                                                backgroundColor: activeMarker === "hips" ? "rgba(239, 71, 111, 0.1)" : "var(--gray-light)",
                                                border: activeMarker === "hips" ? "1px solid var(--accent-deep)" : "1px solid transparent",
                                                borderRadius: "var(--radius)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>3. Hips</div>
                                            <strong style={{ fontSize: "1.2rem" }}>{activeModalOrder.measurements?.hips}"</strong>
                                        </div>
                                        <div
                                            onClick={() => setActiveMarker("sleeve")}
                                            style={{
                                                padding: "0.8rem",
                                                backgroundColor: activeMarker === "sleeve" ? "rgba(239, 71, 111, 0.1)" : "var(--gray-light)",
                                                border: activeMarker === "sleeve" ? "1px solid var(--accent-deep)" : "1px solid transparent",
                                                borderRadius: "var(--radius)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>4. Sleeve</div>
                                            <strong style={{ fontSize: "1.2rem" }}>{activeModalOrder.measurements?.sleeve}"</strong>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem" }}>Design Idea Description</h4>
                                    <p
                                        style={{
                                            padding: "0.8rem",
                                            backgroundColor: "var(--gray-light)",
                                            borderRadius: "var(--radius)",
                                            margin: 0,
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        {activeModalOrder.textDescription}
                                    </p>
                                </div>

                                <div>
                                    <h4 style={{ margin: "0 0 0.4rem 0", fontSize: "0.9rem" }}>Materials Required</h4>
                                    <p
                                        style={{
                                            padding: "0.8rem",
                                            backgroundColor: "var(--gray-light)",
                                            borderRadius: "var(--radius)",
                                            margin: 0,
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        {activeModalOrder.materials && activeModalOrder.materials.length > 0
                                            ? activeModalOrder.materials.join(", ")
                                            : "No material preference."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PayHere Payment Gateway Modal */}
            {activePaymentOrder && (
                <PaymentGateway
                    order={activePaymentOrder}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => setActivePaymentOrder(null)}
                />
            )}
        </section>
    );
}

export default Orders;
