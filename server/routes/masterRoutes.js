import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

const DEFAULT_MASTER = {
  engineers: ["Yusuf", "Danang", "Aris", "Yusuf(Afif)", "Aris(Abdiel)"],
  statusRMA: [
    "Unit Diterima",
    "Sedang Dicek",
    "Menunggu",
    "Sedang Diperbaiki",
    "QC/Testing",
    "Ready to Ship",
    "Shipped",
    "Customer Received",
    "Selesai",
  ],
  statusWA: ["On Progress", "Selesai", "FU Tim China", "Belum Ditag"],
  finalResults: [
    "Normal",
    "Replace",
    "Repair",
    "Service",
    "Return",
  ],
  waitingReasons: [
    "Customer Information",
    "Spare Part",
    "Firmware",
    "HQ / China",
    "Other",
  ],
  warrantyStatuses: ["In Warranty", "Out of Warranty", "Warranty Unknown"],
  qcResults: ["Pending", "Pass", "Fail"],
  pengiriman: ["EXPEDISI", "CJA JAKARTA", "CJA SURABAYA", "Pending Spare"],
  pcbaTypes: ["G02ID", "G04ID", "G08ID", "E04ID", "XE08ID"],
  suppliers: ["HSGQ HQ (China)", "Supplier Lokal"],
  warehouseLocations: ["Gudang Jakarta", "Gudang Surabaya"],
  pcbaReceivedBy: ["Yusuf", "Danang", "Aris", "Yusuf(Afif)", "Aris(Abdiel)"],
  minStockDefault: 5,
};

/**
 * GET /api/master
 * Get master dropdown configurations
 */
router.get("/", requireAuth, (req, res) => {
  try {
    const row = db.prepare("SELECT value_json FROM master_data WHERE key = 'app_master_config'").get();
    if (row && row.value_json) {
      const config = JSON.parse(row.value_json);
      res.json({ ok: true, data: { ...DEFAULT_MASTER, ...config } });
    } else {
      res.json({ ok: true, data: DEFAULT_MASTER });
    }
  } catch (err) {
    console.error("Error GET /api/master:", err);
    res.status(500).json({ ok: false, error: "Gagal mengambil konfigurasi Master Data." });
  }
});

/**
 * PUT /api/master
 * Update master dropdown configurations
 */
router.put("/", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat mengubah Master Data." });
  }

  const updates = req.body;
  if (!updates || typeof updates !== "object") {
    return res.status(400).json({ ok: false, error: "Payload data tidak valid." });
  }

  try {
    const existingRow = db.prepare("SELECT value_json FROM master_data WHERE key = 'app_master_config'").get();
    const current = existingRow && existingRow.value_json ? JSON.parse(existingRow.value_json) : DEFAULT_MASTER;
    const merged = { ...current, ...updates };
    const now = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO master_data (key, value_json, updated_at)
      VALUES ('app_master_config', ?, ?)
    `).run(JSON.stringify(merged), now);

    res.json({ ok: true, data: merged, message: "Master data berhasil diperbarui." });
  } catch (err) {
    console.error("Error PUT /api/master:", err);
    res.status(500).json({ ok: false, error: "Gagal memperbarui Master Data." });
  }
});

export default router;
