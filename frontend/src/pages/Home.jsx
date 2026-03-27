import { useMemo, useState } from "react";

import { findVendors } from "../services/matchService";

function Home() {
    const [image, setImage] = useState(null);
    const [text, setText] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <section className="home-shell">
            <header className="home-header">
                <p className="brand">Fashion Girl</p>
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

            <section className="results-section">
                <h2>Top Matches</h2>

                {loading ? <div className="spinner" aria-label="loading" /> : null}

                {!loading && sortedResults.length === 0 ? <p className="empty-state">No results</p> : null}

                {!loading && sortedResults.length > 0 ? (
                    <ul className="results-list">
                        {sortedResults.map((item, index) => (
                            <li key={`${item.vendorId}-${index}`} className="result-item">
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
                            </li>
                        ))}
                    </ul>
                ) : null}
            </section>
        </section>
    );
}

export default Home;
