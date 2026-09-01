import { getStoredToken } from "./authClient.js";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

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
}

export const masterApi = {
  async get() {
    const res = await request("/api/master", { method: "GET" });
    return res.data;
  },

  async update(updates) {
    const res = await request("/api/master", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return res.data;
  },
};

export default masterApi;
