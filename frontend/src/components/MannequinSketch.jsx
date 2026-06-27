import React from "react";

function MannequinSketch({ activeField, onMarkerClick }) {
    const markers = [
        { id: "chest", label: "1", x: 100, y: 100, name: "Chest", desc: "Measure around the fullest part of your chest." },
        { id: "waist", label: "2", x: 100, y: 150, name: "Waist", desc: "Measure around your natural waistline (narrowest part)." },
        { id: "hips", label: "3", x: 100, y: 210, name: "Hips", desc: "Measure around the widest part of your hips." },
        { id: "sleeve", label: "4", x: 45, y: 130, name: "Sleeve", desc: "Measure from shoulder joint down to your wrist." },
    ];

    const activeMarker = markers.find((m) => m.id === activeField);

    return (
        <div className="mannequin-container">
            <svg
                viewBox="0 0 200 320"
                className="mannequin-svg"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Torso Outline */}
                <path
                    d="M100 30 
                       C110 30, 115 35, 112 42 
                       C118 42, 138 48, 142 55 
                       C145 60, 142 90, 138 105
                       C130 115, 125 130, 122 150
                       C118 175, 128 195, 130 220
                       C132 235, 128 250, 124 280
                       L76 280
                       C72 250, 68 235, 70 220
                       C72 195, 82 175, 78 150
                       C75 130, 70 115, 62 105
                       C58 90, 55 60, 58 55
                       C62 48, 82 42, 88 42
                       C85 35, 90 30, 100 30 Z"
                    className="mannequin-body-path"
                />

                {/* Left Arm Outline */}
                <path
                    d="M58 55 C50 65, 40 85, 34 110 C30 125, 28 140, 26 155 C24 165, 28 170, 32 165 C36 155, 42 135, 46 115 C49 98, 55 85, 60 70 Z"
                    className="mannequin-limb-path"
                    style={{ fill: activeField === "sleeve" ? "rgba(239, 71, 111, 0.2)" : "rgba(35, 24, 21, 0.04)" }}
                />

                {/* Right Arm Outline */}
                <path
                    d="M142 55 C150 65, 160 85, 166 110 C170 125, 172 140, 174 155 C176 165, 172 170, 168 165 C164 155, 158 135, 154 115 C151 98, 145 85, 140 70 Z"
                    className="mannequin-limb-path"
                />

                {/* Highlight Zones based on active field */}
                {activeField === "chest" && (
                    <line x1="61" y1="100" x2="139" y2="100" className="mannequin-highlight-line" />
                )}
                {activeField === "waist" && (
                    <line x1="78" y1="150" x2="122" y2="150" className="mannequin-highlight-line" />
                )}
                {activeField === "hips" && (
                    <line x1="71" y1="210" x2="129" y2="210" className="mannequin-highlight-line" />
                )}

                {/* Clickable Marker Hotspots */}
                {markers.map((marker) => {
                    const isActive = activeField === marker.id;
                    return (
                        <g
                            key={marker.id}
                            className={`mannequin-marker ${isActive ? "active" : ""}`}
                            onClick={() => onMarkerClick(marker.id)}
                            style={{ cursor: "pointer" }}
                        >
                            <circle
                                cx={marker.x}
                                cy={marker.y}
                                r="12"
                                className="marker-circle"
                            />
                            <text
                                x={marker.x}
                                y={marker.y + 4}
                                textAnchor="middle"
                                className="marker-text"
                            >
                                {marker.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Instruction Panel */}
            <div className="mannequin-tooltip">
                {activeMarker ? (
                    <>
                        <h4>
                            Marker {activeMarker.label}: {activeMarker.name}
                        </h4>
                        <p>{activeMarker.desc}</p>
                    </>
                ) : (
                    <p className="no-selection-msg">Click a marker (1-4) on the clothing sketch to enter measurements.</p>
                )}
            </div>
        </div>
    );
}

export default MannequinSketch;
