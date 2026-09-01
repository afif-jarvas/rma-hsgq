import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

function formatWaRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    caseNo: row.case_no,
    caseDate: row.case_date,
    customerName: row.customer_name || "",
    company: row.company || "",
    customerPhone: row.customer_phone || "",
    engineerTag: row.engineer_tag || "",
    deviceType: row.device_type || "",
    sn: row.sn || "",
    mac: row.mac || "",
    initialProblem: row.initial_problem || "",
    finalAnalysis: row.final_analysis || "",
    status: row.status,
    solvedDate: row.solved_date || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/wa
 * Get all WhatsApp cases
 */
router.get("/", requireAuth, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM wa_entries ORDER BY case_date DESC, created_at DESC").all();
    res.json({ ok: true, data: rows.map(formatWaRow) });
  } catch (err) {
    console.error("Error GET /api/wa:", err);
    res.status(500).json({ ok: false, error: "Gagal mengambil data WhatsApp dari database." });
  }
});

/**
 * GET /api/wa/:id
 * Get single WhatsApp case
 */
router.get("/:id", requireAuth, (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM wa_entries WHERE id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ ok: false, error: "Kasus WhatsApp tidak ditemukan." });
    }
    res.json({ ok: true, data: formatWaRow(row) });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal mengambil detail kasus WhatsApp." });
  }
});

/**
 * POST /api/wa
 * Create a new WhatsApp case
 */
router.post("/", requireAuth, (req, res) => {
  const entry = req.body;
  if (!entry || !entry.caseNo) {
    return res.status(400).json({ ok: false, error: "Nomor Kasus WhatsApp wajib diisi." });
  }

  const id = entry.id || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  try {
    const insertStmt = db.prepare(`
      INSERT INTO wa_entries (
        id, case_no, case_date, customer_name, company, customer_phone,
        engineer_tag, device_type, sn, mac, initial_problem, final_analysis,
        status, solved_date, notes, raw_data_json, created_at, updated_at
      ) VALUES (
        @id, @case_no, @case_date, @customer_name, @company, @customer_phone,
        @engineer_tag, @device_type, @sn, @mac, @initial_problem, @final_analysis,
        @status, @solved_date, @notes, @raw_data_json, @created_at, @updated_at
      )
    `);

    insertStmt.run({
      id,
      case_no: entry.caseNo.trim(),
      case_date: entry.caseDate || now.slice(0, 10),
      customer_name: entry.customerName || "",
      company: entry.company || "",
      customer_phone: entry.customerPhone || "",
      engineer_tag: entry.engineerTag || entry.engineer || req.user.full_name,
      device_type: entry.deviceType || "",
      sn: entry.sn || "",
      mac: entry.mac || "",
      initial_problem: entry.initialProblem || "",
      final_analysis: entry.finalAnalysis || "",
      status: entry.status || "On Progress",
      solved_date: entry.solvedDate || "",
      notes: entry.notes || "",
      raw_data_json: JSON.stringify(entry),
      created_at: entry.createdAt || now,
      updated_at: now,
    });

    const saved = db.prepare("SELECT * FROM wa_entries WHERE id = ?").get(id);
    res.json({ ok: true, data: formatWaRow(saved) });
  } catch (err) {
    console.error("Error POST /api/wa:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ ok: false, error: `Nomor kasus '${entry.caseNo}' sudah digunakan.` });
    }
    res.status(500).json({ ok: false, error: "Gagal menyimpan kasus WhatsApp." });
  }
});

/**
 * PUT /api/wa/:id
 * Update an existing WhatsApp case
 */
router.put("/:id", requireAuth, (req, res) => {
  const entry = req.body;
  const id = req.params.id;
  const now = new Date().toISOString();

  try {
    const updateStmt = db.prepare(`
      UPDATE wa_entries SET
        case_no = @case_no,
        case_date = @case_date,
        customer_name = @customer_name,
        company = @company,
        customer_phone = @customer_phone,
        engineer_tag = @engineer_tag,
        device_type = @device_type,
        sn = @sn,
        mac = @mac,
        initial_problem = @initial_problem,
        final_analysis = @final_analysis,
        status = @status,
        solved_date = @solved_date,
        notes = @notes,
        raw_data_json = @raw_data_json,
        updated_at = @updated_at
      WHERE id = @id
    `);

    const result = updateStmt.run({
      id,
      case_no: entry.caseNo?.trim(),
      case_date: entry.caseDate || now.slice(0, 10),
      customer_name: entry.customerName || "",
      company: entry.company || "",
      customer_phone: entry.customerPhone || "",
      engineer_tag: entry.engineerTag || entry.engineer || "-",
      device_type: entry.deviceType || "",
      sn: entry.sn || "",
      mac: entry.mac || "",
      initial_problem: entry.initialProblem || "",
      final_analysis: entry.finalAnalysis || "",
      status: entry.status || "On Progress",
      solved_date: entry.solvedDate || "",
      notes: entry.notes || "",
      raw_data_json: JSON.stringify(entry),
      updated_at: now,
    });

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Kasus WhatsApp tidak ditemukan." });
    }

    const saved = db.prepare("SELECT * FROM wa_entries WHERE id = ?").get(id);
    res.json({ ok: true, data: formatWaRow(saved) });
  } catch (err) {
    console.error("Error PUT /api/wa/:id:", err);
    res.status(500).json({ ok: false, error: "Gagal memperbarui kasus WhatsApp." });
  }
});

/**
 * DELETE /api/wa/:id
 * Delete a WhatsApp case
 */
router.delete("/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat menghapus kasus WhatsApp." });
  }
  try {
    const result = db.prepare("DELETE FROM wa_entries WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Kasus WhatsApp tidak ditemukan." });
    }
    res.json({ ok: true, message: "Kasus WhatsApp berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal menghapus kasus WhatsApp." });
  }
});

/**
 * POST /api/wa/bulk-import
 * Import array of WhatsApp cases from Excel
 */
router.post("/bulk-import", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat mengimpor data WhatsApp." });
  }

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ ok: false, error: "Tidak ada data baris WhatsApp yang valid untuk diimport." });
  }

  const now = new Date().toISOString();
  let importedCount = 0;
  let skippedCount = 0;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO wa_entries (
      id, case_no, case_date, customer_name, company, customer_phone,
      engineer_tag, device_type, sn, mac, initial_problem, final_analysis,
      status, solved_date, notes, raw_data_json, created_at, updated_at
    ) VALUES (
      @id, @case_no, @case_date, @customer_name, @company, @customer_phone,
      @engineer_tag, @device_type, @sn, @mac, @initial_problem, @final_analysis,
      @status, @solved_date, @notes, @raw_data_json, @created_at, @updated_at
    )
  `);

  const importTx = db.transaction(() => {
    for (const r of rows) {
      if (!r.caseNo && !r.case_no) {
        skippedCount++;
        continue;
      }
      const caseNo = (r.caseNo || r.case_no).trim();
      const id = r.id || `wa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      insertStmt.run({
        id,
        case_no: caseNo,
        case_date: r.caseDate || r.case_date || now.slice(0, 10),
        customer_name: r.customerName || r.customer_name || "",
        company: r.company || "",
        customer_phone: r.customerPhone || r.customer_phone || "",
        engineer_tag: r.engineerTag || r.engineer || req.user.full_name,
        device_type: r.deviceType || r.device_type || "",
        sn: r.sn || "",
        mac: r.mac || "",
        initial_problem: r.initialProblem || r.initial_problem || "",
        final_analysis: r.finalAnalysis || r.final_analysis || "",
        status: r.status || "On Progress",
        solved_date: r.solvedDate || r.solved_date || "",
        notes: r.notes || "",
        raw_data_json: JSON.stringify(r),
        created_at: r.createdAt || now,
        updated_at: now,
      });
      importedCount++;
    }
  });

  try {
    importTx();
    res.json({ ok: true, count: importedCount, skipped: skippedCount, message: `Berhasil mengimpor ${importedCount} kasus WhatsApp.` });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({ ok: false, error: "Gagal mengimpor data WhatsApp." });
  }
});

export default router;
