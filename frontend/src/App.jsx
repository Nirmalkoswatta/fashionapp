import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    clearAuthError,
    hydrateUserThunk,
    loginThunk,
    logout,
    registerThunk,
    googleLoginThunk,
} from "./features/auth/authSlice";
import Home from "./pages/Home";
import Orders from "./components/Orders";
import Chatbot from "./components/Chatbot";
import AiTailorWidget from "./components/AiTailorWidget";
import VendorItemUploader from "./components/VendorItemUploader";
import AdminStats from "./components/AdminStats";
import { validateLoginForm, validateRegisterForm } from "./validation";

const emptyRegister = { username: "", email: "", password: "", confirmPassword: "", role: "customer" };
const emptyLogin = { email: "", password: "" };

function App() {
    const dispatch = useDispatch();
    const { user, token, loading, error } = useSelector((state) => state.auth);
    const [mode, setMode] = useState("login");
    const [registerForm, setRegisterForm] = useState(emptyRegister);
    const [loginForm, setLoginForm] = useState(emptyLogin);
    const [clientError, setClientError] = useState("");
    const [activeTab, setActiveTab] = useState("match");
    const [showGoogleModal, setShowGoogleModal] = useState(false);

    useEffect(() => {
        if (token && !user) {
            dispatch(hydrateUserThunk());
        }
    }, [dispatch, token, user]);

    useEffect(() => {
        if (!user) {
            setMode("login");
            setActiveTab("match");
        } else {
            if (user.role === "vendor") {
                setActiveTab("upload");
            } else {
                setActiveTab("match");
            }
        }
    }, [user]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    useEffect(() => {
        const initGoogleSSO = () => {
            if (window.google && document.getElementById("google-signin-btn") && !user) {
                window.google.accounts.id.initialize({
                    client_id: "948585514340-lmehdmnk9drbjqnk3vl7uf0jcd97n5c5.apps.googleusercontent.com",
                    callback: async (response) => {
                        setClientError("");
                        dispatch(clearAuthError());
                        await dispatch(googleLoginThunk({ idToken: response.credential }));
                    },
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("google-signin-btn"),
                    { theme: "outline", size: "large", width: 320 }
                );
            }
        };

        if (mode === "login" && !user) {
            initGoogleSSO();
            const timer = setInterval(() => {
                if (window.google) {
                    initGoogleSSO();
                    clearInterval(timer);
                }
            }, 500);
            return () => clearInterval(timer);
        }
    }, [user, mode, dispatch]);

    const activeError = useMemo(() => clientError || error || "", [clientError, error]);

    const switchMode = (nextMode) => {
        setMode(nextMode);
        setClientError("");
        dispatch(clearAuthError());
    };

    const onRegisterSubmit = async (event) => {
        event.preventDefault();
        setClientError("");
        dispatch(clearAuthError());

        const errors = validateRegisterForm(registerForm);
        if (errors.length) {
            setClientError(errors.join(" "));
            return;
        }

        await dispatch(registerThunk(registerForm));
    };

    const onLoginSubmit = async (event) => {
        event.preventDefault();
        setClientError("");
        dispatch(clearAuthError());

        const errors = validateLoginForm(loginForm);
        if (errors.length) {
            setClientError(errors.join(" "));
            return;
        }

        await dispatch(loginThunk(loginForm));
    };

    const handleGoogleSSO = async (email, name) => {
        setShowGoogleModal(false);
        setClientError("");
        dispatch(clearAuthError());
        await dispatch(googleLoginThunk({ email, name }));
    };

    if (user) {
        return (
            <main className="app">
                <section className="dashboard-shell">
                    <div className="dashboard-topbar">
                        <div>
                            <p className="brand">Fashion Girl</p>
                            <p className="subtitle">
                                Signed in as <strong>{user.email}</strong> ({user.role})
                            </p>
                        </div>
                        <button className="secondary-btn" onClick={() => dispatch(logout())} type="button">
                            Logout
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="dashboard-tabs">
                        {(user.role === "customer" || user.role === "admin" || user.role === "staff") && (
                            <button
                                className={`tab-btn ${activeTab === "match" ? "active" : ""}`}
                                onClick={() => setActiveTab("match")}
                            >
                                🔍 Find Vendors
                            </button>
                        )}
                        {(user.role === "vendor" || user.role === "admin" || user.role === "staff") && (
                            <button
                                className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
                                onClick={() => setActiveTab("upload")}
                            >
                                📤 Upload Catalog
                            </button>
                        )}
                        <button
                            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
                            onClick={() => setActiveTab("orders")}
                        >
                            🧵 My Orders
                        </button>
                        <button
                            className={`tab-btn ${activeTab === "chatbot" ? "active" : ""}`}
                            onClick={() => setActiveTab("chatbot")}
                        >
                            💬 AI Tailor Copilot
                        </button>
                        {(user.role === "vendor" || user.role === "admin" || user.role === "staff") && (
                            <button
                                className={`tab-btn ${activeTab === "admin" ? "active" : ""}`}
                                onClick={() => setActiveTab("admin")}
                            >
                                📊 {user.role === "vendor" ? "My Earnings" : "Platform Revenue"}
                            </button>
                        )}
                    </nav>

                    {/* Content Display based on Active Tab */}
                    <div className="tab-content">
                        {activeTab === "match" && (user.role === "customer" || user.role === "admin" || user.role === "staff") && (
                            <Home onOrderPlaced={() => setActiveTab("orders")} />
                        )}
                        {activeTab === "upload" && (user.role === "vendor" || user.role === "admin" || user.role === "staff") && (
                            <VendorItemUploader />
                        )}
                        {activeTab === "orders" && <Orders />}
                        {activeTab === "chatbot" && (user.role === "vendor" ? <AiTailorWidget /> : <Chatbot />)}
                        {activeTab === "admin" && (user.role === "vendor" || user.role === "admin" || user.role === "staff") && <AdminStats />}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="app">
            <section className="auth-shell">
                <p className="brand">Fashion Girl</p>
                <h1>Style Meets Smart Commerce</h1>

                {activeError ? <p className="form-error">{activeError}</p> : null}

                {mode === "login" ? (
                    <>
                        <form className="auth-form" onSubmit={onLoginSubmit}>
                            <label>
                                Email
                                <input
                                    autoComplete="email"
                                    onChange={(event) =>
                                        setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                                    }
                                    placeholder="you@example.com"
                                    type="email"
                                    value={loginForm.email}
                                />
                            </label>
                            <label>
                                Password
                                <input
                                    autoComplete="current-password"
                                    onChange={(event) =>
                                        setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                                    }
                                    placeholder="Enter your password"
                                    type="password"
                                    value={loginForm.password}
                                />
                            </label>
                            <button className="primary-btn" disabled={loading} type="submit">
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        {/* Google Sign-in SSO trigger */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", width: "100%", margin: "0.6rem 0" }}>
                            <div id="google-signin-btn"></div>
                            <button
                                className="link-btn"
                                type="button"
                                onClick={() => setShowGoogleModal(true)}
                                style={{ fontSize: "0.78rem" }}
                            >
                                (Or use offline demo guest accounts)
                            </button>
                        </div>

                        <p className="auth-switch">
                            Not registered yet?{" "}
                            <button className="link-btn" onClick={() => switchMode("register")} type="button">
                                Create an account
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <form className="auth-form" onSubmit={onRegisterSubmit}>
                            <label>
                                Username
                                <input
                                    autoComplete="username"
                                    onChange={(event) =>
                                        setRegisterForm((prev) => ({ ...prev, username: event.target.value }))
                                    }
                                    placeholder="Your username"
                                    type="text"
                                    value={registerForm.username}
                                />
                            </label>
                            <label>
                                Email
                                <input
                                    autoComplete="email"
                                    onChange={(event) =>
                                        setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                                    }
                                    placeholder="you@example.com"
                                    type="email"
                                    value={registerForm.email}
                                />
                            </label>
                            <label>
                                Password
                                <input
                                    autoComplete="new-password"
                                    onChange={(event) =>
                                        setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                                    }
                                    placeholder="At least 6 characters"
                                    type="password"
                                    value={registerForm.password}
                                />
                            </label>
                            <label>
                                Confirm Password
                                <input
                                    autoComplete="new-password"
                                    onChange={(event) =>
                                        setRegisterForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                                    }
                                    placeholder="Re-enter your password"
                                    type="password"
                                    value={registerForm.confirmPassword}
                                />
                            </label>
                            <label>
                                Register As
                                <select
                                    value={registerForm.role}
                                    onChange={(event) =>
                                        setRegisterForm((prev) => ({ ...prev, role: event.target.value }))
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "0.6rem 0.8rem",
                                        borderRadius: "var(--radius)",
                                        border: "1px solid var(--gray-light)",
                                        backgroundColor: "var(--paper)",
                                        color: "var(--ink)",
                                        fontSize: "0.95rem",
                                        marginTop: "0.3rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    <option value="customer">Customer (Buyer)</option>
                                    <option value="vendor">Vendor (Tailor)</option>
                                </select>
                            </label>
                            <button className="primary-btn" disabled={loading} type="submit">
                                {loading ? "Creating account..." : "Create account"}
                            </button>
                        </form>
                        <p className="auth-switch">
                            Already have an account?{" "}
                            <button className="link-btn" onClick={() => switchMode("login")} type="button">
                                Go to login
                            </button>
                        </p>
                    </>
                )}
            </section>

            {/* Google SSO Account Chooser Dialog */}
            {showGoogleModal && (
                <div className="modal-overlay">
                    <div className="sso-modal">
                        <h3>Choose a Google Account</h3>
                        <p className="sso-modal-sub">to continue to <strong>Fashion Girl</strong></p>
                        <ul className="sso-account-list">
                            <li onClick={() => handleGoogleSSO("nirmal.koswatta@gmail.com", "Nirmal Koswatta")}>
                                <div className="account-avatar">NK</div>
                                <div className="account-info">
                                    <strong>Nirmal Koswatta</strong>
                                    <span>nirmal.koswatta@gmail.com</span>
                                </div>
                            </li>
                            <li onClick={() => handleGoogleSSO("guest.buyer@gmail.com", "Fashion Guest")}>
                                <div className="account-avatar">FG</div>
                                <div className="account-info">
                                    <strong>Fashion Guest</strong>
                                    <span>guest.buyer@gmail.com</span>
                                </div>
                            </li>
                            <li onClick={() => handleGoogleSSO("bespoke.buyer@gmail.com", "Bespoke Enthusiast")}>
                                <div className="account-avatar">BE</div>
                                <div className="account-info">
                                    <strong>Bespoke Enthusiast</strong>
                                    <span>bespoke.buyer@gmail.com</span>
                                </div>
                            </li>
                        </ul>
                        <button
                            className="secondary-btn sso-cancel-btn"
                            type="button"
                            onClick={() => setShowGoogleModal(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default App;
