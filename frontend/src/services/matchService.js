import http from "./http";

export async function findVendors({ image, text }) {
    const formData = new FormData();
    formData.append("image", image);
    formData.append("text", text);

    const response = await http.post("/api/match", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return Array.isArray(response.data) ? response.data : [];
}
