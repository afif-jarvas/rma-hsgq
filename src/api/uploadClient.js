import { getStoredToken } from "./authClient.js";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Convert File object to Base64 dataURL
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload RMA photo to local server storage
 */
export async function uploadLocalRmaPhoto(file, ticketNo, category, id) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const dataUrl = await fileToDataUrl(file);
  const url = `${API_BASE_URL}/api/upload/photo`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      ticketNo,
      category,
      id,
      name: file.name,
      dataUrl,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Upload gagal: HTTP ${response.status}`);
  }

  return data.data; // { id, name, url, size, uploadedAt }
}

export default uploadLocalRmaPhoto;
