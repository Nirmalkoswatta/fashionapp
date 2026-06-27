import { useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { findVendors } from "../services/matchService";
import { createOrder } from "../api";
import MannequinSketch from "../components/MannequinSketch";

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

function Home({ onOrderPlaced }) {
    const { token } = useSelector((state) => state.auth);
    const [image, setImage] = useState(null);
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const handleImageChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setImage(selectedFile);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSelectedVendor(null);

        if (!image) {
            setError("Please upload an image.");
            return;
        }

        if (!text.trim()) {
            setError("Please enter a description.");
            return;
        }

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
            prev.includes(material)
                ? prev.filter((m) => m !== material)
                : [...prev, material]
        );
    };

    const handleConfigureVendor = (vendorId) => {
        setSelectedVendor(vendorId);
        // generate a randomized but plausible price based on matching score
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
        setOrderAmount(Math.round((qty * baseItemPrice) * 100) / 100);
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
                quantity: quantity,
            });
            // Reset state
            setSelectedVendor(null);
            setSelectedMaterials([]);
            setMeasurements({ chest: "", waist: "", hips: "", sleeve: "" });
            setQuantity(1);
            // Redirect to Orders Tab
            if (onOrderPlaced) {
                onOrderPlaced();
            }
        } catch (err) {
            setOrderError(err.message || "Failed to submit custom order.");
        } finally {
            setOrderLoading(false);
        }
    };

    return (
        <section className="home-shell">
            <header className="home-header">
                <p className="brand">Multimodal Recommendation</p>
                <h1>Find Matching Vendors</h1>
                <p className="subtitle">Upload your design and describe your idea to rank vendor portfolio matches.</p>
            </header>

            <form className="match-form" onSubmit={handleSubmit}>
                <label className="upload-box">
                    <span>Upload Design Image</span>
                    <input accept="image/*" onChange={handleImageChange} type="file" />
                </label>

                {previewUrl ? (
                    <div className="image-preview-card">
                        <img alt="Uploaded fashion design preview" className="image-preview" src={previewUrl} />
                    </div>
                ) : null}

                <label>
                    Description
                    <input
                        onChange={(event) => setText(event.target.value)}
                        placeholder="e.g., black elegant dress with lace sleeves"
                        type="text"
                        value={text}
                    />
                </label>

                {error ? <p className="form-error">{error}</p> : null}

                <button className="primary-btn" disabled={loading} type="submit">
                    {loading ? "Finding vendors..." : "Find Vendors"}
                </button>
            </form>

            <div className="search-results-flex-container">
                <section className="results-section">
                    <h2>Top Matches</h2>

                    {loading ? <div className="spinner" aria-label="loading" /> : null}

                    {!loading && sortedResults.length === 0 ? <p className="empty-state">No results</p> : null}

                    {!loading && sortedResults.length > 0 ? (
                        <ul className="results-list">
                            {sortedResults.map((item, index) => (
                                <li key={`${item.vendorId}-${index}`} className={`result-item ${selectedVendor === item.vendorId ? "selected" : ""}`}>
                                    <div className="result-main">
                                        <span>{item.vendorId}</span>
                                        <strong>{(Number(item.score) * 100).toFixed(2)}%</strong>
                                    </div>
                                    {item.explain ? (
                                        <div className="result-explain">
                                            <p>{item.explain.reason}</p>
                                            <p>
                                                Matched keywords: {item.explain.matchedKeywords?.length
                                                    ? item.explain.matchedKeywords.join(", ")
                                                    : "none"}
                                            </p>
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="secondary-btn configure-btn"
                                        style={{ marginTop: "0.6rem", width: "100%" }}
                                        onClick={() => handleConfigureVendor(item.vendorId)}
                                    >
                                        Configure & Order
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </section>

                {/* Sizing & Material Configurator Panel */}
                {selectedVendor && (
                    <section className="configurator-panel">
                        <h2>Configure Order: {selectedVendor}</h2>
                        <p className="configurator-sub">Enter custom measurements and choose garment fabrics.</p>

                        {orderError ? <p className="form-error">{orderError}</p> : null}

                        <form onSubmit={handlePlaceOrder} className="configurator-form">
                            <div className="configurator-two-col">
                                {/* Interactive Measurement Mannequin */}
                                <div>
                                    <label className="section-label">Interactive Clothing Sketch</label>
                                    <MannequinSketch
                                        activeField={activeMarker}
                                        onMarkerClick={(fieldId) => {
                                            setActiveMarker(fieldId);
                                            document.getElementById(`input-${fieldId}`)?.focus();
                                        }}
                                    />
                                </div>

                                {/* Custom Measurement Fields */}
                                <div className="measurements-inputs">
                                    <label className="section-label">Tailor Measurements (Inches)</label>
                                    
                                    <div className="inputs-block">
                                        <label className={activeMarker === "chest" ? "active-label" : ""}>
                                            1. Chest Measurement
                                            <input
                                                id="input-chest"
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
                                            2. Waist Measurement
                                            <input
                                                id="input-waist"
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
                                            3. Hips Measurement
                                            <input
                                                id="input-hips"
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
                                            4. Sleeve Length
                                            <input
                                                id="input-sleeve"
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

                                    {/* Material Fabric Selector */}
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

                                    {/* Order Quantity */}
                                    <div className="quantity-block" style={{ marginTop: "1rem" }}>
                                        <label className="section-label" style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                            Order Quantity
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => handleQuantityChange(e.target.value)}
                                                style={{
                                                    border: "1px solid var(--line)",
                                                    borderRadius: "10px",
                                                    padding: "0.5rem 0.7rem",
                                                    font: "inherit",
                                                    background: "#ffffff",
                                                    outline: "none",
                                                    width: "120px",
                                                    marginTop: "0.2rem"
                                                }}
                                                required
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing & commission split display */}
                            <div className="pricing-preview-block">
                                <div className="price-row">
                                    <span>Subtotal Custom Design:</span>
                                    <strong>${orderAmount.toFixed(2)}</strong>
                                </div>
                                <div className="price-row commission-row">
                                    <span>Centralized Escrow Fee (10%):</span>
                                    <span>${(orderAmount * 0.1).toFixed(2)}</span>
                                </div>
                                <div className="price-row total-row">
                                    <span>Total Price to Pay:</span>
                                    <strong>${orderAmount.toFixed(2)}</strong>
                                </div>
                            </div>

                            <button className="primary-btn submit-order-btn" type="submit" disabled={orderLoading}>
                                {orderLoading ? "Placing Order..." : "Confirm & Place Order"}
                            </button>
                        </form>
                    </section>
                )}
            </div>
        </section>
    );
}

export default Home;
