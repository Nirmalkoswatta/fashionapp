import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
    clearAuthError,
    hydrateUserThunk,
    loginThunk,
    logout,
    registerThunk,
} from "./features/auth/authSlice";
import Home from "./pages/Home";
import { validateLoginForm, validateRegisterForm } from "./validation";

const emptyRegister = { username: "", email: "", password: "", confirmPassword: "" };
const emptyLogin = { email: "", password: "" };

function App() {
    const dispatch = useDispatch();
    const { user, token, loading, error } = useSelector((state) => state.auth);
    const [mode, setMode] = useState("login");
    const [registerForm, setRegisterForm] = useState(emptyRegister);
    const [loginForm, setLoginForm] = useState(emptyLogin);
    const [clientError, setClientError] = useState("");

    useEffect(() => {
        if (token && !user) {
            dispatch(hydrateUserThunk());
        }
    }, [dispatch, token, user]);

    useEffect(() => {
        if (!user) {
            setMode("login");
        }
    }, [user]);

    useEffect(() => {
        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

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

    if (user) {
        return (
            <main className="app">
                <section className="dashboard-shell">
                    <div className="dashboard-topbar">
                        <div>
                            <p className="brand">Fashion Girl</p>
                            <p className="subtitle">
                                Signed in as {user.email} ({user.role})
                            </p>
                        </div>
                        <button className="secondary-btn" onClick={() => dispatch(logout())} type="button">
                            Logout
                        </button>
                    </div>
                    <Home />
                </section>
            </main>
        );
    }

    return (
        <main className="app">
            <section className="auth-shell">
                <p className="brand">Fashion Girl</p>
                <h1>Style Meets Smart Commerce</h1>
                <p className="subtitle">Secure access for customers, staff, and administrators.</p>

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
        </main>
    );
}

export default App;
