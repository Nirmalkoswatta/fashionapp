import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

function VendorItemUploader() {
    const { token } = useSelector((state) => state.auth);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [material, setMaterial] = useState("Cotton");
    const [image, setImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const previewUrl = useMemo(() => {
        if (!image) return "";
        return URL.createObjectURL(image);
    }, [image]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setImage(file);
        setError("");
        setSuccessMsg("");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0] || null;
        setImage(file);
        setError("");
        setSuccessMsg("");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!title.trim()) {
            setError("Please provide a title.");
            return;
        }

        if (!price || Number.isNaN(Number(price))) {
            setError("Please provide a valid price.");
            return;
        }

        if (!image) {
            setError("Please upload an image for the garment.");
            return;
        }

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("price", Number(price));
            formData.append("material", material);
            formData.append("image", image);

            const response = await fetch("http://localhost:5000/api/vendor/upload-item", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload item.");
            }

            setSuccessMsg("Garment successfully uploaded and indexed into the AI catalog!");
            setTitle("");
            setPrice("");
            setMaterial("Cotton");
            setImage(null);
        } catch (err) {
            setError(err.message || "Something went wrong during the upload.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <section className="vendor-uploader-shell" style={{ maxWidth: "600px", margin: "1.5rem auto" }}>
            <header className="home-header">
                <p className="brand">Incremental AI Indexer</p>
                <h1>Upload Garment Item</h1>
                <p className="subtitle">Publish new designs to your catalog. They will be incrementally indexed in real-time by CLIP.</p>
            </header>

            <form className="match-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {error ? <p className="form-error">{error}</p> : null}
                {successMsg ? (
                    <p className="form-error success-shell" style={{ color: "#1b4332", borderColor: "#52b788", backgroundColor: "#d8f3dc" }}>
                        {successMsg}
                    </p>
                ) : null}

                <label>
                    Garment Title
                    <input
                        type="text"
                        placeholder="e.g. Silk Wedding Dress"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isUploading}
                        required
                    />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label>
                        Price ($)
                        <input
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="e.g. 129.99"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={isUploading}
                            required
                        />
                    </label>

                    <label>
                        Material
                        <select
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                            disabled={isUploading}
                            style={{
                                width: "100%",
                                padding: "0.6rem 0.8rem",
                                borderRadius: "var(--radius)",
                                border: "1px solid var(--gray-light)",
                                backgroundColor: "var(--paper)",
                                color: "var(--ink)",
                                marginTop: "0.3rem",
                                fontSize: "0.95rem"
                            }}
                        >
                            <option value="Cotton">Cotton</option>
                            <option value="Linen">Linen</option>
                            <option value="Silk">Silk</option>
                            <option value="Denim">Denim</option>
                            <option value="Wool">Wool</option>
                            <option value="Polyester">Polyester</option>
                            <option value="Satin">Satin</option>
                        </select>
                    </label>
                </div>

                <label>
                    Garment Image
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{
                            border: "2px dashed var(--gray-light)",
                            borderRadius: "var(--radius)",
                            padding: "2rem",
                            textAlign: "center",
                            cursor: "pointer",
                            backgroundColor: "var(--paper)",
                            marginTop: "0.3rem"
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: "none" }}
                            id="garment-image-file"
                            disabled={isUploading}
                        />
                        <label htmlFor="garment-image-file" style={{ cursor: "pointer", fontWeight: "normal", color: "var(--ink)" }}>
                            {image ? (
                                <p style={{ color: "var(--ok)", fontWeight: "bold" }}>Selected: {image.name}</p>
                            ) : (
                                <p>Drag and drop or click here to upload photo</p>
                            )}
                        </label>
                    </div>
                </label>

                {previewUrl ? (
                    <div className="image-preview-card" style={{ marginTop: "0.5rem" }}>
                        <img alt="New garment preview" className="image-preview" src={previewUrl} style={{ maxHeight: "200px", objectFit: "contain", borderRadius: "var(--radius)" }} />
                    </div>
                ) : null}

                <button className="primary-btn" disabled={isUploading} type="submit" style={{ marginTop: "1rem" }}>
                    {isUploading ? "Uploading & Indexing..." : "Upload & Index Item"}
                </button>
            </form>
        </section>
    );
}

export default VendorItemUploader;
