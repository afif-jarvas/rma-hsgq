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

export const pcbaApi = {
  async getAll() {
    const res = await request("/api/pcba/all", { method: "GET" });
    return res.data || { items: [], transactions: [], replacements: [], chinaShipments: [], repairs: [] };
  },

  async goodsReceipt(formData) {
    return await request("/api/pcba/receipt", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },

  async updateItem(id, item) {
    return await request(`/api/pcba/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  },

  async deleteItem(id) {
    return await request(`/api/pcba/items/${id}`, { method: "DELETE" });
  },

  async bulkImport(rows, batchOptions = {}) {
    return await request("/api/pcba/bulk-import", {
      method: "POST",
      body: JSON.stringify({ rows, batchOptions }),
    });
  },

  async createReplacement(formData) {
    return await request("/api/pcba/replacement", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },

  async updateReplacement(id, rep) {
    return await request(`/api/pcba/replacement/${id}`, {
      method: "PUT",
      body: JSON.stringify(rep),
    });
  },

  async deleteReplacement(id) {
    return await request(`/api/pcba/replacement/${id}`, { method: "DELETE" });
  },

  async sendToChina(formData) {
    return await request("/api/pcba/send-to-china", {
      method: "POST",
      body: JSON.stringify(formData),
    });
  },

  async updateChinaShipment(id, shp) {
    return await request(`/api/pcba/send-to-china/${id}`, {
      method: "PUT",
      body: JSON.stringify(shp),
    });
  },

  async deleteChinaShipment(id) {
    return await request(`/api/pcba/send-to-china/${id}`, { method: "DELETE" });
  },

  async deleteTransaction(id) {
    return await request(`/api/pcba/transactions/${id}`, { method: "DELETE" });
  },

  async syncAll(data) {
    return await request("/api/pcba/sync-all", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export default pcbaApi;
