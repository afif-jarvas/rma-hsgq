/**
 * src/utils/exportPdf.js
 * Client helper to request PDF generation from backend and trigger browser download.
 */

import { getStoredToken } from "../api/authClient.js";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

export async function downloadPdfFromBackend(endpoint, { items, subTab, meta, defaultFilename }) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  const url = "" + API_BASE_URL + cleanEndpoint;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ items, subTab, meta }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Gagal mengekspor PDF: " + response.statusText);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = defaultFilename || "Export_" + new Date().toISOString().slice(0, 10) + ".pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}
