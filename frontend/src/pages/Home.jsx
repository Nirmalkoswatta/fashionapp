import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { findVendors } from "../services/matchService";
import { createOrder } from "../api";
import MannequinSketch from "../components/MannequinSketch";

const AVAILABLE_MATERIALS = [
    "Cotton", "Silk", "Linen", "Wool",
    "Polyester", "Chiffon", "Denim", "Satin", "Velvet",
];

// AI processing steps shown sequentially while matching
const AI_STEPS = [
    { id: "extract",   label: "Extracting visual features from image" },
    { id: "embed",     label: "Building multimodal embedding vectors" },
    { id: "cosine",    label: "Calculating cosine similarity scores" },
    { id: "rank",      label: "Ranking vendor portfolio matches" },
];

// Score ring: SVG circle progress indicator
function ScoreRing({ score }) {
    const pct = Math.round(score * 100);
    const r = 22;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    // Colour: emerald if >= 90, gold otherwise
    const ringColor = pct >= 90 ? "var(--emerald)" : "var(--gold)";
    return (
        <div className="score-ring-wrapper">
            <svg className="score-ring-svg" viewBox="0 0 56 56">
                <circle className="score-ring-bg" cx="28" cy="28" r={r} />
                <circle
                    className="score-ring-fill"
                    cx="28" cy="28" r={r}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    stroke={ringColor}
                />
            </svg>
            <div className="score-ring-label">{pct}%</div>
        </div>
    );
}

function Home({ onOrderPlaced }) {
    const { token } = useSelector((state) => state.auth);
    const [image, setImage] = useState(null);
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);

    // AI step animation
    const [visibleSteps, setVisibleSteps] = useState([]);
    const stepTimers = useRef([]);

    // Sizing and customization state
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [measurements, setMeasurements] = useState({ chest: "", waist: "", hips: "", sleeve: "" });
    const [activeMarker, setActiveMarker] = useState(null);
    const [orderAmount, setOrderAmount] = useState(150.0);
    const [baseItemPrice, setBaseItemPrice] = useState(150.0);
    const [quantity, setQuantity] = useState(1);
    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState("");

    const previewUrl = useMemo(() => {
        if (!image) return "";
        return URL.createObjectURL(image);
    }, [image]);

    const sortedResults = useMemo(() => {
        return [...results].sort((a, b) => Number(b.score) - Number(a.score));
    }, [results]);

    // Animate AI steps while loading
    useEffect(() => {
        stepTimers.current.forEach(clearTimeout);
        stepTimers.current = [];
        setVisibleSteps([]);
        if (loading) {
            AI_STEPS.forEach((step, i) => {
                const t = setTimeout(() => {
                    setVisibleSteps((prev) => [...prev, step.id]);
                }, i * 600);
                stepTimers.current.push(t);
            });
        }
        return () => stepTimers.current.forEach(clearTimeout);
    }, [loading]);

    const handleImageChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setImage(selectedFile);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragOver(false);
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) setImage(file);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSelectedVendor(null);

        if (!image) { setError("Please upload a design image."); return; }
        if (!text.trim()) { setError("Please enter a description."); return; }

        try {
            setLoading(true);
            const data = await findVendors({ image, text: text.trim() });
            setResults(data);
        } catch (submitError) {
            const apiError = submitError?.response?.data?.message;
            setError(apiError || "Failed to fetch vendor matches.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMaterialToggle = (material) => {
        setSelectedMaterials((prev) =>
            prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material]
        );
    };

    const handleConfigureVendor = (vendorId) => {
        setSelectedVendor(vendorId);
        const matchScore = results.find((r) => r.vendorId === vendorId)?.score || 0.8;
        const baseAmount = Math.round((120 + matchScore * 80) * 100) / 100;
        setBaseItemPrice(baseAmount);
        setOrderAmount(baseAmount);
        setQuantity(1);
        setOrderError("");
    };

    const handleQuantityChange = (newQty) => {
        const qty = Math.max(1, parseInt(newQty) || 1);
        setQuantity(qty);
        setOrderAmount(Math.round(qty * baseItemPrice * 100) / 100);
    };

    const handlePlaceOrder = async (event) => {
        event.preventDefault();
        setOrderError("");
        const { chest, waist, hips, sleeve } = measurements;
        if (!chest || !waist || !hips || !sleeve) {
            setOrderError("Please complete all tailoring measurements.");
            return;
        }
        try {
            setOrderLoading(true);
            await createOrder(token, {
                vendorId: selectedVendor,
                textDescription: text.trim(),
                materials: selectedMaterials,
                measurements: {
                    chest: Number(chest),
                    waist: Number(waist),
                    hips: Number(hips),
                    sleeve: Number(sleeve),
                },
                amount: orderAmount,
                quantity,
            });
            setSelectedVendor(null);
            setSelectedMaterials([]);
            setMeasurements({ chest: "", waist: "", hips: "", sleeve: "" });
            setQuantity(1);
            if (onOrderPlaced) onOrderPlaced();
        } catch (err) {
            setOrderError(err.message || "Failed to submit custom order.");
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <section className="home-shell">
            {/* Header */}
            <header className="home-header">
                <p className="brand">AI Match &amp; Measure</p>
                <h1>Find Your Perfect Tailor</h1>
                <p className="subtitle">
                    Upload your design sketch and describe your vision. Our PyTorch model ranks
                    vendors by visual similarity.
                </p>
            </header>

            {/* Upload form */}
            <form className="match-form" onSubmit={handleSubmit}>
                {/* Drag-and-Drop Zone */}
                <div
                    className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <input
                        accept="image/*"
                        onChange={handleImageChange}
                        type="file"
                        id="design-upload"
                    />
                    {previewUrl ? (
                        <img
                            alt="Uploaded design sketch preview"
                            className="image-preview"
                            src={previewUrl}
                            style={{ maxHeight: "160px", width: "auto", borderRadius: "var(--radius-sm)" }}
                        />
                    ) : (
                        <>
                            {/* Upload icon */}
                            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="upload-title">Upload your design sketch or photo</span>
                            <span className="upload-sub">Drag &amp; drop or click to browse</span>
                            <span className="upload-badge">PNG · JPG · WEBP</span>
                        </>
                    )}
                </div>

                {/* Description */}
                <label>
                    Design Description
                    <input
                        onChange={(event) => setText(event.target.value)}
                        placeholder="e.g., black elegant dress with lace sleeves and open back"
                        type="text"
                        value={text}
                    />
                </label>

                {error ? <p className="form-error">{error}</p> : null}

                <button className="primary-btn" disabled={loading} type="submit">
                    {loading ? "Searching..." : "Find Matching Vendors →"}
                </button>
            </form>

            {/* AI Loading State */}
            {loading && (
                <div className="ai-loading-state" style={{ marginTop: "1.5rem" }}>
                    <p className="ai-loading-title">AI Processing Pipeline</p>
                    {AI_STEPS.map((step, i) => {
                        const isVisible = visibleSteps.includes(step.id);
                        const isDone = visibleSteps.indexOf(step.id) < visibleSteps.length - 1;
                        const isActive = visibleSteps[visibleSteps.length - 1] === step.id;
                        return (
                            <div
                                key={step.id}
                                className={`ai-step ${isVisible ? "visible" : ""} ${isDone ? "done" : ""} ${isActive ? "active" : ""}`}
                            >
                                <div className="ai-step-icon">
                                    {isDone ? "✓" : isActive ? "○" : `${i + 1}`}
                                </div>
                                {step.label}
                                {isActive && (
                                    <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--gold)" }}>
                                        Processing...
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Results */}
            <div className="search-results-flex-container">
                <section className="results-section">
                    {!loading && sortedResults.length > 0 && (
                        <h2>Top Vendor Matches</h2>
                    )}

                    {!loading && sortedResults.length === 0 && !error && results.length === 0 && (
                        <div className="empty-state" style={{ marginTop: 0 }}>
                            Upload a design and click "Find Matching Vendors" to see results.
                        </div>
                    )}

                    {!loading && sortedResults.length > 0 && (
                        <ul className="results-list">
                            {sortedResults.map((item, index) => (
                                <li
                                    key={`${item.vendorId}-${index}`}
                                    className={`result-item ${selectedVendor === item.vendorId ? "selected" : ""}`}
                                >
                                    <div className="result-main">
                                        <div className="result-vendor-info">
                                            <div className="result-vendor-name">{item.vendorId}</div>
                                            <div className="result-vendor-sub">
                                                {index === 0 ? "Top Match · Recommended" : `Match #${index + 1}`}
                                            </div>
                                            {item.explain?.matchedKeywords?.length > 0 && (
                                                <div className="result-tags" style={{ marginTop: "0.5rem" }}>
                                                    {item.explain.matchedKeywords.slice(0, 3).map((kw) => (
                                                        <span key={kw} className="result-tag">{kw}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ScoreRing score={Number(item.score)} />
                                    </div>

                                    {item.explain?.reason && (
                                        <div className="result-explain">
                                            <p>{item.explain.reason}</p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="secondary-btn configure-btn"
                                        onClick={() => handleConfigureVendor(item.vendorId)}
                                    >
                                        Configure &amp; Order →
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Sizing & Material Configurator Panel */}
                {selectedVendor && (
                    <section className="configurator-panel">
                        <h2>Configure Order</h2>
                        <p className="configurator-sub">
                            Vendor: <strong style={{ color: "var(--gold-light)" }}>{selectedVendor}</strong>
                            {" — "}Enter your measurements and choose fabrics.
                        </p>

                        {orderError ? <p className="form-error">{orderError}</p> : null}

                        <form onSubmit={handlePlaceOrder} className="configurator-form">
                            <div className="configurator-two-col">
                                {/* Interactive Mannequin */}
                                <div>
                                    <span className="section-label">Interactive Clothing Sketch</span>
                                    <MannequinSketch
                                        activeField={activeMarker}
                                        onMarkerClick={(fieldId) => {
                                            setActiveMarker(fieldId);
                                            document.getElementById(`input-${fieldId}`)?.focus();
                                        }}
                                    />
                                </div>

                                {/* Measurement Fields */}
                                <div className="measurements-inputs">
                                    <span className="section-label">Tailor Measurements (Inches)</span>
                                    <div className="inputs-block">
                                        {[
                                            { id: "chest",  label: "A · Bust / Chest", placeholder: "e.g. 36.5", min: 20, max: 60 },
                                            { id: "waist",  label: "B · Waist",         placeholder: "e.g. 29.0", min: 20, max: 60 },
                                            { id: "hips",   label: "C · Hips",          placeholder: "e.g. 38.0", min: 20, max: 60 },
                                            { id: "sleeve", label: "D · Sleeve Length", placeholder: "e.g. 24.5", min: 10, max: 45 },
                                        ].map(({ id, label, placeholder, min, max }) => (
                                            <label key={id} className={activeMarker === id ? "active-label" : ""}>
                                                {label}
                                                <input
                                                    id={`input-${id}`}
                                                    type="number"
                                                    step="0.1"
                                                    min={min}
                                                    max={max}
                                                    placeholder={placeholder}
                                                    value={measurements[id]}
                                                    onFocus={() => setActiveMarker(id)}
                                                    onChange={(e) =>
                                                        setMeasurements((prev) => ({ ...prev, [id]: e.target.value }))
                                                    }
                                                    required
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    {/* Material Fabric Selector */}
                                    <div style={{ marginTop: "0.5rem" }}>
                                        <span className="section-label">Garment Materials</span>
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

                                    {/* Quantity */}
                                    <div>
                                        <span className="section-label">Order Quantity</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => handleQuantityChange(e.target.value)}
                                            style={{
                                                border: "1px solid var(--line)",
                                                borderRadius: "var(--radius-sm)",
                                                padding: "0.55rem 0.75rem",
                                                font: "inherit",
                                                fontSize: "0.9rem",
                                                background: "rgba(255,255,255,0.04)",
                                                color: "var(--ink)",
                                                outline: "none",
                                                width: "110px",
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="pricing-preview-block">
                                <div className="price-row">
                                    <span style={{ color: "var(--ink-muted)" }}>Subtotal:</span>
                                    <strong style={{ color: "var(--ink)" }}>${orderAmount.toFixed(2)}</strong>
                                </div>
                                <div className="price-row commission-row">
                                    <span>Centralised Escrow Fee (10%):</span>
                                    <span>${(orderAmount * 0.1).toFixed(2)}</span>
                                </div>
                                <div className="price-row total-row">
                                    <span>Total:</span>
                                    <strong>${orderAmount.toFixed(2)}</strong>
                                </div>
                            </div>

                            <button className="primary-btn submit-order-btn" type="submit" disabled={orderLoading}>
                                {orderLoading ? "Placing Order..." : "Confirm & Place Order →"}
                            </button>
                        </form>
                    </section>
                )}
            </div>
        </section>
    );
}

export default Home;
