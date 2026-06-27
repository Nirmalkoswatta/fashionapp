import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getEarnings, getVendorStats, getVendorStock, updateVendorStock } from "../api";

const ALL_FABRICS = [
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
            if (user?.role === "vendor") {
                fetchVendorData();
            } else {
                fetchAdminStats();
            }
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
            setError(err.message || "Failed to update fabric stock checklist.");
        } finally {
            setStockLoading(false);
        }
    };

    if (user?.role === "vendor") {
        return (
            <section className="admin-stats-shell">
                <header className="home-header">
                    <p className="brand">Vendor Escrow & Ledger</p>
                    <h1>My Earnings Dashboard</h1>
                    <p className="subtitle">Track your platform payouts, active escrow balances, and set fabric configurations.</p>
                </header>

                {error ? <p className="form-error">{error}</p> : null}
                {loading ? <div className="spinner" aria-label="loading" /> : null}

                {!loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="stats-dashboard-grid">
                            <article className="stat-card revenue">
                                <h3>Total Earnings</h3>
                                <p className="stat-value">${stats.totalEarnings?.toFixed(2)}</p>
                                <span className="stat-desc">Funds released to you after delivery</span>
                            </article>

                            <article className="stat-card gross">
                                <h3>Escrow Balance</h3>
                                <p className="stat-value" style={{ color: "var(--accent-deep)" }}>
                                    ${stats.escrowBalance?.toFixed(2)}
                                </p>
                                <span className="stat-desc">Held safely until orders are Shipped</span>
                            </article>

                            <article className="stat-card payouts">
                                <h3>Commission Paid</h3>
                                <p className="stat-value">${stats.platformCommission?.toFixed(2)}</p>
                                <span className="stat-desc">10% platform protection fee paid</span>
                            </article>
                        </div>

                        {/* Fabric parameter settings checklist */}
                        <article
                            className="stock-checklist-card"
                            style={{
                                backgroundColor: "var(--paper)",
                                padding: "1.5rem",
                                borderRadius: "var(--radius)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}
                        >
                            <h3 style={{ margin: "0 0 0.5rem 0" }}>⚙️ Material Parameter Checklist</h3>
                            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                                Select the fabrics you currently have in stock. Toggling these options immediately updates your vendor availability.
                            </p>
                            {stockLoading ? <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Saving settings...</p> : null}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                                    gap: "0.8rem",
                                    marginTop: "0.5rem"
                                }}
                            >
                                {ALL_FABRICS.map((fabric) => (
                                    <label
                                        key={fabric}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            padding: "0.6rem 0.8rem",
                                            backgroundColor: "var(--gray-light)",
                                            borderRadius: "var(--radius)",
                                            cursor: "pointer",
                                            fontSize: "0.9rem"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={stockMaterials.includes(fabric)}
                                            onChange={() => handleFabricToggle(fabric)}
                                            disabled={stockLoading}
                                        />
                                        {fabric}
                                    </label>
                                ))}
                            </div>
                        </article>

                        {/* Completed transactions */}
                        <article
                            className="transactions-ledger-card"
                            style={{
                                backgroundColor: "var(--paper)",
                                padding: "1.5rem",
                                borderRadius: "var(--radius)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                            }}
                        >
                            <h3 style={{ margin: "0 0 1rem 0" }}>✓ Ledger & Completed Transactions</h3>
                            {stats.completedTransactions?.length === 0 ? (
                                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No completed transactions yet. Completed orders will be logged here.</p>
                            ) : (
                                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                    {stats.completedTransactions?.map((tx) => (
                                        <li
                                            key={tx.id}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "0.8rem 0",
                                                borderBottom: "1px solid var(--gray-light)",
                                                fontSize: "0.9rem"
                                            }}
                                        >
                                            <div>
                                                <strong>Order #{tx.id.substring(0, 8)}...</strong>
                                                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                                    {new Date(tx.date).toLocaleDateString()} - {tx.description}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <strong style={{ color: "var(--ok)" }}>+${tx.netVendorAmount?.toFixed(2)}</strong>
                                                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Platform commission: ${tx.commission?.toFixed(2)}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    </div>
                ) : null}

                <div className="admin-actions-bar" style={{ marginTop: "1.5rem" }}>
                    <button className="secondary-btn" onClick={fetchVendorData}>
                        Refresh Ledger
                    </button>
                </div>
            </section>
        );
    }

    const grossVolume = adminStats.totalEarnings * 10;
    const vendorPayouts = grossVolume - adminStats.totalEarnings;

    return (
        <section className="admin-stats-shell">
            <header className="home-header">
                <p className="brand">Platform Revenue Analytics</p>
                <h1>Commission Dashboard</h1>
                <p className="subtitle">Real-time accounting of platform transaction commissions, gross volumes, and payouts.</p>
            </header>

            {error ? <p className="form-error">{error}</p> : null}
            {loading ? <div className="spinner" aria-label="loading" /> : null}

            {!loading ? (
                <div className="stats-dashboard-grid">
                    <article className="stat-card revenue">
                        <h3>Platform Revenue</h3>
                        <p className="stat-value">${adminStats.totalEarnings.toFixed(2)}</p>
                        <span className="stat-desc">Direct 10% commission on orders</span>
                    </article>

                    <article className="stat-card gross">
                        <h3>Gross Transaction Volume</h3>
                        <p className="stat-value">${grossVolume.toFixed(2)}</p>
                        <span className="stat-desc">Total platform volume</span>
                    </article>

                    <article className="stat-card payouts">
                        <h3>Released Vendor Payouts</h3>
                        <p className="stat-value" style={{ color: "var(--ok)" }}>${vendorPayouts.toFixed(2)}</p>
                        <span className="stat-desc">90% of payment forwarded to tailors</span>
                    </article>

                    <article className="stat-card volume">
                        <h3>Successful Orders</h3>
                        <p className="stat-value" style={{ color: "var(--ink)" }}>{adminStats.count}</p>
                        <span className="stat-desc">Number of paid transactions</span>
                    </article>
                </div>
            ) : null}

            <div className="admin-actions-bar" style={{ marginTop: "1.5rem" }}>
                <button className="secondary-btn" onClick={fetchAdminStats}>
                    Refresh Ledger
                </button>
            </div>
        </section>
    );
}

export default AdminStats;
