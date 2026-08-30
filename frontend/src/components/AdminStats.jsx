import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEarnings, getVendorStats, getVendorStock, updateVendorStock } from "../api";

const ALL_FABRICS = ["Cotton", "Silk", "Linen", "Wool", "Polyester", "Chiffon", "Denim", "Satin", "Velvet"];

// Mock pending orders for the vendor orders table
const MOCK_PENDING_ORDERS = [
    { id: "ORD-4821", customer: "Priya M.", fabric: "Silk", deadline: "2026-08-20", status: "pending" },
    { id: "ORD-3967", customer: "Sophie L.", fabric: "Linen", deadline: "2026-08-25", status: "processing" },
    { id: "ORD-5113", customer: "Ananya R.", fabric: "Cotton", deadline: "2026-09-02", status: "pending" },
    { id: "ORD-4490", customer: "Mei X.", fabric: "Velvet", deadline: "2026-09-10", status: "shipped" },
];

// Status badge helper
function StatusBadge({ status }) {
    return (
        <span className={`order-status-badge ${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

// SVG Icons
const Icons = {
    earnings: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    escrow: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    commission: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    revenue: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
    ),
    volume: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    orders: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
    ),
    fabric: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
    ),
    refresh: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
    ),
};

function AdminStats() {
    const { token, user } = useSelector((state) => state.auth);
    const [stats, setStats] = useState({ totalEarnings: 0, escrowBalance: 0, platformCommission: 0, completedTransactions: [] });
    const [adminStats, setAdminStats] = useState({ totalEarnings: 0, count: 0 });
    const [stockMaterials, setStockMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stockLoading, setStockLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchVendorData = async () => {
        try {
            setLoading(true);
            setError("");
            const statsData = await getVendorStats(token);
            setStats(statsData);
            const stockData = await getVendorStock(token);
            setStockMaterials(stockData.stockMaterials || []);
        } catch (err) {
            setError(err.message || "Failed to load vendor statistics.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminStats = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getEarnings(token);
            setAdminStats(data);
        } catch (err) {
            setError(err.message || "Failed to load admin stats.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            user?.role === "vendor" ? fetchVendorData() : fetchAdminStats();
        }
    }, [token, user]);

    const handleFabricToggle = async (fabric) => {
        try {
            setStockLoading(true);
            const updatedMaterials = stockMaterials.includes(fabric)
                ? stockMaterials.filter((m) => m !== fabric)
                : [...stockMaterials, fabric];
            setStockMaterials(updatedMaterials);
            await updateVendorStock(token, updatedMaterials);
        } catch (err) {
            setError(err.message || "Failed to update fabric stock.");
        } finally {
            setStockLoading(false);
        }
    };

    // ── VENDOR VIEW ──────────────────────────────────────────────────
    if (user?.role === "vendor") {
        return (
            <section className="admin-stats-shell">
                <header className="home-header">
                    <p className="brand">Vendor Escrow &amp; Ledger</p>
                    <h1>My Earnings Dashboard</h1>
                    <p className="subtitle">
                        Track your platform payouts, active escrow balances, and configure fabric availability.
                    </p>
                </header>

                {error ? <p className="form-error">{error}</p> : null}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.25rem", marginTop: "1.5rem" }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="shimmer" style={{ height: "120px", borderRadius: "var(--radius-lg)" }} />
                        ))}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                        {/* ── Metric Cards ── */}
                        <div className="stats-dashboard-grid">
                            {/* Total Earnings */}
                            <article className="stat-card revenue">
                                <div className="stat-card-top">
                                    <h3>Total Earnings</h3>
                                    <div className="stat-card-icon">{Icons.earnings}</div>
                                </div>
                                <p className="stat-value">${stats.totalEarnings?.toFixed(2)}</p>
                                <span className="stat-desc">Funds released to you after delivery confirmation</span>
                            </article>

                            {/* Escrow Balance */}
                            <article className="stat-card escrow">
                                <div className="stat-card-top">
                                    <h3>Funds in Escrow</h3>
                                    <div className="stat-card-icon">{Icons.escrow}</div>
                                </div>
                                <p className="stat-value">${stats.escrowBalance?.toFixed(2)}</p>
                                <span className="stat-desc">Locked securely until orders are shipped</span>
                            </article>

                            {/* Platform Commission */}
                            <article className="stat-card commission">
                                <div className="stat-card-top">
                                    <h3>Platform Fee</h3>
                                    <div className="stat-card-icon">{Icons.commission}</div>
                                </div>
                                <p className="stat-value">${stats.platformCommission?.toFixed(2)}</p>
                                <span className="stat-desc">10% platform protection fee deducted</span>
                            </article>
                        </div>

                        {/* ── Pending Orders Table ── */}
                        <div className="vendor-orders-card">
                            <div className="vendor-orders-header">
                                <h3>{Icons.orders} &nbsp;Pending Custom Orders</h3>
                                <span className="order-status-badge pending" style={{ fontSize: "0.72rem" }}>
                                    {MOCK_PENDING_ORDERS.filter(o => o.status === "pending").length} Pending
                                </span>
                            </div>
                            <div className="orders-table-wrapper">
                                <table className="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Fabric</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_PENDING_ORDERS.map((order) => (
                                            <tr key={order.id}>
                                                <td className="order-id-cell">{order.id}</td>
                                                <td>{order.customer}</td>
                                                <td>{order.fabric}</td>
                                                <td>{order.deadline}</td>
                                                <td><StatusBadge status={order.status} /></td>
                                                <td>
                                                    <button className="table-action-btn" type="button">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Material Parameter Checklist ── */}
                        <article className="fabric-checklist-card">
                            <div className="fabric-checklist-header">
                                <h3>{Icons.fabric} &nbsp;Material Parameter Checklist</h3>
                                {stockLoading && (
                                    <span className="fabric-saving-indicator">Saving…</span>
                                )}
                            </div>
                            <p className="fabric-checklist-sub">
                                Toggle the fabrics you currently have in stock. Updates your vendor matching profile instantly.
                            </p>
                            <div className="fabric-pills-grid">
                                {ALL_FABRICS.map((fabric) => {
                                    const isActive = stockMaterials.includes(fabric);
                                    return (
                                        <label
                                            key={fabric}
                                            className={`fabric-pill ${isActive ? "active" : ""}`}
                                            onClick={() => !stockLoading && handleFabricToggle(fabric)}
                                        >
                                            <input type="checkbox" readOnly checked={isActive} />
                                            <span className="fabric-pill-check">{isActive ? "✓" : ""}</span>
                                            {fabric}
                                        </label>
                                    );
                                })}
                            </div>
                        </article>

                        {/* ── Completed Transactions ── */}
                        <article className="transactions-ledger-card">
                            <h3 style={{ marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 600, color: "var(--ink)" }}>
                                ✓ Ledger &amp; Completed Transactions
                            </h3>
                            {stats.completedTransactions?.length === 0 ? (
                                <div className="ledger-empty">
                                    No completed transactions yet. Shipped orders will appear here.
                                </div>
                            ) : (
                                <ul style={{ listStyle: "none" }}>
                                    {stats.completedTransactions?.map((tx) => (
                                        <li
                                            key={tx.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                padding: "0.9rem 0",
                                                borderBottom: "1px solid var(--line)",
                                                fontSize: "0.875rem",
                                            }}
                                        >
                                            <div>
                                                <strong style={{ color: "var(--ink)" }}>Order #{tx.id.substring(0, 8)}…</strong>
                                                <div style={{ fontSize: "0.75rem", color: "var(--ink-muted)", marginTop: "0.2rem" }}>
                                                    {new Date(tx.date).toLocaleDateString()} — {tx.description}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <strong style={{ color: "var(--emerald)" }}>+${tx.netVendorAmount?.toFixed(2)}</strong>
                                                <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>
                                                    Fee: ${tx.commission?.toFixed(2)}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    </div>
                )}

                <div className="admin-actions-bar" style={{ marginTop: "1.5rem" }}>
                    <button className="secondary-btn" onClick={fetchVendorData} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {Icons.refresh} Refresh Ledger
                    </button>
                </div>
            </section>
        );
    }

    // ── ADMIN / STAFF VIEW ───────────────────────────────────────────
    const grossVolume = adminStats.totalEarnings * 10;
    const vendorPayouts = grossVolume - adminStats.totalEarnings;

    return (
        <section className="admin-stats-shell">
            <header className="home-header">
                <p className="brand">Platform Revenue Analytics</p>
                <h1>Commission Dashboard</h1>
                <p className="subtitle">
                    Real-time accounting of platform commissions, gross transaction volumes, and vendor payouts.
                </p>
            </header>

            {error ? <p className="form-error">{error}</p> : null}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1.25rem", marginTop: "1.5rem" }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="shimmer" style={{ height: "120px", borderRadius: "var(--radius-lg)" }} />
                    ))}
                </div>
            ) : (
                <div className="stats-dashboard-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <article className="stat-card revenue">
                        <div className="stat-card-top">
                            <h3>Platform Revenue</h3>
                            <div className="stat-card-icon">{Icons.revenue}</div>
                        </div>
                        <p className="stat-value">${adminStats.totalEarnings.toFixed(2)}</p>
                        <span className="stat-desc">Direct 10% commission on all orders</span>
                    </article>

                    <article className="stat-card gross">
                        <div className="stat-card-top">
                            <h3>Gross Transaction Volume</h3>
                            <div className="stat-card-icon">{Icons.volume}</div>
                        </div>
                        <p className="stat-value">${grossVolume.toFixed(2)}</p>
                        <span className="stat-desc">Total platform GMV processed</span>
                    </article>

                    <article className="stat-card payouts">
                        <div className="stat-card-top">
                            <h3>Released Vendor Payouts</h3>
                            <div className="stat-card-icon">{Icons.earnings}</div>
                        </div>
                        <p className="stat-value">${vendorPayouts.toFixed(2)}</p>
                        <span className="stat-desc">90% of payment forwarded to tailors</span>
                    </article>

                    <article className="stat-card volume">
                        <div className="stat-card-top">
                            <h3>Successful Orders</h3>
                            <div className="stat-card-icon">{Icons.orders}</div>
                        </div>
                        <p className="stat-value" style={{ color: "var(--ink)" }}>{adminStats.count}</p>
                        <span className="stat-desc">Total paid &amp; completed transactions</span>
                    </article>
                </div>
            )}

            <div className="admin-actions-bar" style={{ marginTop: "1.75rem" }}>
                <button className="secondary-btn" onClick={fetchAdminStats} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {Icons.refresh} Refresh Data
                </button>
            </div>
        </section>
    );
}

export default AdminStats;
