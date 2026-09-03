/**
 * src/api/authClient.js
 * Frontend HTTP client for HSGQ Local User Management & Authentication API
 */

const TOKEN_STORAGE_KEY = "hsgq_auth_token";
const USER_STORAGE_KEY = "hsgq_auth_user";
const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch (_) {
    return "";
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (_) {}
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (_) {}
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (_) {}
}

/**
 * Base API Request with automatic Bearer token header
 */
async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error || `HTTP Error ${response.status}: ${response.statusText}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    // If backend is unreachable
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      const netErr = new Error("Gagal terhubung ke Backend User Server. Pastikan server aktif.");
      netErr.status = 503;
      throw netErr;
    }
    throw error;
  }
}

export const authApi = {
  /**
   * Login with email or username + password
   */
  async login(emailOrUsername, password) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (res.token) {
      setStoredToken(res.token);
      setStoredUser(res.user || res.profile);
    }

    return res;
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const res = await request("/api/auth/me", { method: "GET" });
    if (res.user) {
      setStoredUser(res.user);
    }
    return res;
  },

  /**
   * Logout from system
   */
  async logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      clearStoredAuth();
    }
    return { ok: true };
  },

  /**
   * Update user preferences (such as theme)
   */
  async updatePreferences(preferences) {
    const res = await request("/api/auth/preferences", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    });

    const currentUser = getStoredUser();
    if (currentUser && preferences.theme) {
      currentUser.theme = preferences.theme;
      setStoredUser(currentUser);
    }

    return res;
  },

  /**
   * Change current user's password
   */
  async changePassword(currentPassword, newPassword) {
    return await request("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Administrator: List all users
   */
  async getUsers() {
    return await request("/api/users", { method: "GET" });
  },

  /**
   * Administrator: Create a new user
   */
  async createUser(userData) {
    return await request("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  /**
   * Administrator: Get user detail
   */
  async getUser(id) {
    return await request(`/api/users/${id}`, { method: "GET" });
  },

  /**
   * Administrator: Update user data (role, status, name, etc.)
   */
  async updateUser(id, updates) {
    return await request(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  /**
   * Administrator: Delete user account
   */
  async deleteUser(id) {
    return await request(`/api/users/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Administrator: Reset a user's password
   */
  async resetPassword(id, newPassword) {
    return await request(`/api/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ newPassword }),
    });
  },

  /**
   * Administrator: Toggle user active / inactive status
   */
  async toggleStatus(id, status) {
    return await request(`/api/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

export default authApi;
