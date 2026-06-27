import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getMe, login, register, googleLogin } from "../../api";

const initialToken = localStorage.getItem("fashion_girl_token");
const initialUser = (() => {
    try {
        const raw = localStorage.getItem("fashion_girl_user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
})();

const initialState = {
    token: initialToken,
    user: initialUser,
    loading: false,
    error: null,
};

function persistAuth(token, user) {
    localStorage.setItem("fashion_girl_token", token);
    localStorage.setItem("fashion_girl_user", JSON.stringify(user));
}

function clearPersistedAuth() {
    localStorage.removeItem("fashion_girl_token");
    localStorage.removeItem("fashion_girl_user");
}

export const registerThunk = createAsyncThunk(
    "auth/register",
    async (payload, { rejectWithValue }) => {
        try {
            return await register(payload);
        } catch (error) {
            return rejectWithValue(error.message || "Registration failed.");
        }
    }
);

export const loginThunk = createAsyncThunk(
    "auth/login",
    async (payload, { rejectWithValue }) => {
        try {
            return await login(payload);
        } catch (error) {
            return rejectWithValue(error.message || "Login failed.");
        }
    }
);

export const googleLoginThunk = createAsyncThunk(
    "auth/googleLogin",
    async (payload, { rejectWithValue }) => {
        try {
            return await googleLogin(payload);
        } catch (error) {
            return rejectWithValue(error.message || "Google Login failed.");
        }
    }
);

export const hydrateUserThunk = createAsyncThunk(
    "auth/hydrateUser",
    async (_, { getState, rejectWithValue }) => {
        const token = getState().auth.token;

        if (!token) {
            return rejectWithValue("No token found.");
        }

        try {
            const data = await getMe(token);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.message || "Session validation failed.");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError(state) {
            state.error = null;
        },
        logout(state) {
            state.token = null;
            state.user = null;
            state.error = null;
            clearPersistedAuth();
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
                persistAuth(action.payload.token, action.payload.user);
            })
            .addCase(registerThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Registration failed.";
            })
            .addCase(loginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
                persistAuth(action.payload.token, action.payload.user);
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Login failed.";
            })
            .addCase(googleLoginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(googleLoginThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
                persistAuth(action.payload.token, action.payload.user);
            })
            .addCase(googleLoginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Google Login failed.";
            })
            .addCase(hydrateUserThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(hydrateUserThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.error = null;
                if (state.token) {
                    persistAuth(state.token, action.payload);
                }
            })
            .addCase(hydrateUserThunk.rejected, (state) => {
                state.loading = false;
                state.token = null;
                state.user = null;
                clearPersistedAuth();
            });
    },
});

export const { clearAuthError, logout } = authSlice.actions;

export default authSlice.reducer;
