import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { requireAuth } from "../auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../uploads/rma_photos");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = Router();

/**
 * POST /api/upload/photo
 * Upload a photo (unit or label) saved directly to server local storage
 * Payload: { ticketNo, category, id, name, dataUrl }
 */
router.post("/photo", requireAuth, (req, res) => {
  const { ticketNo, category, id, name, dataUrl } = req.body;

  if (!ticketNo || !category || !dataUrl) {
    return res.status(400).json({ ok: false, error: "ticketNo, category, dan dataUrl foto wajib diisi." });
  }

  try {
    const safeTicketNo = ticketNo.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, "_");
    const targetDir = path.join(UPLOADS_DIR, safeTicketNo, safeCategory);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Extract base64 data
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = "jpg";

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes("png")) ext = "png";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(dataUrl, "base64");
    }

    const photoId = id || `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${photoId}.${ext}`;
    const filePath = path.join(targetDir, filename);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/rma_photos/${safeTicketNo}/${safeCategory}/${filename}`;
    const now = new Date().toISOString();

    res.json({
      ok: true,
      data: {
        id: photoId,
        name: name || filename,
        url: relativeUrl,
        size: buffer.length,
        uploadedAt: now,
      },
    });
  } catch (err) {
    console.error("Error upload photo:", err);
    res.status(500).json({ ok: false, error: "Gagal menyimpan foto di server." });
  }
});

export default router;
