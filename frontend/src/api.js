import { API_BASE_URL } from "./config";

async function request(path, options = {}) {
    const { headers = {}, ...rest } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        ...rest,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data.message || "Request failed";
        const errors = data.errors || [];
        throw new Error([message, ...errors].join(" "));
    }

    return data;
}

export function register(payload) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function login(payload) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function getMe(token) {
    return request("/auth/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function googleLogin(payload) {
    return request("/auth/google-login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function createOrder(token, payload) {
    return request("/orders", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}

/**
 * Step 1 of PayHere checkout:
 * Creates a PayHere payment session on the backend.
 * Returns { checkoutUrl, formFields } which the frontend uses to redirect the customer.
 */
export function createPayment(token, orderId) {
    return request("/payment/create-payment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
    });
}

/**
 * Polls the backend to check if PayHere has already called the notify_url
 * and updated the order status to "paid".
 */
export function getPaymentStatus(token, orderId) {
    return request(`/payment/status/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });
}

/**
 * Cash on Delivery: confirms the order without going through PayHere.
 */
export function confirmCOD(token, orderId) {
    return request("/payment/cod", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
    });
}

export function getOrders(token) {
    return request("/orders", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function getEarnings(token) {
    return request("/orders/earnings", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function sendChatMessage(token, payload) {
    return request("/chat", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}

export function updateOrderStatus(token, orderId, status) {
    return request(`/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
    });
}

export function getVendorStats(token) {
    return request("/orders/vendor-stats", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function getVendorStock(token) {
    return request("/auth/vendor-stock", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

export function updateVendorStock(token, stockMaterials) {
    return request("/auth/vendor-stock", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stockMaterials }),
    });
}

export function sendAiChat(token, payload) {
    return request("/ai/chat", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
}

export function getVendors(token) {
    return request("/auth/vendors", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
}

