import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

/**
 * Helper to parse RMA row into frontend object format
 */
function formatRmaRow(row) {
  if (!row) return null;
  let unitPhotos = [];
  let labelPhotos = [];
  try {
    unitPhotos = JSON.parse(row.unit_photos_json || "[]");
  } catch (_) {}
  try {
    labelPhotos = JSON.parse(row.label_photos_json || "[]");
  } catch (_) {}

  return {
    id: row.id,
    ticketNo: row.ticket_no,
    receivedDate: row.received_date,
    engineer: row.engineer,
    customerName: row.customer_name || "",
    company: row.company || "",
    customerPhone: row.customer_phone || "",
    product: row.product || "",
    productType: row.product_type || "",
    sn: row.sn || "",
    mac: row.mac || "",
    completeness: row.completeness || "",
    initialProblem: row.initial_problem || "",
    symptom: row.symptom || "",
    checkingResult: row.checking_result || "",
    rootCause: row.root_cause || "",
    actionTaken: row.action_taken || "",
    status: row.status,
    finalResult: row.final_result || "",
    waitingReason: row.waiting_reason || "",
    warrantyStatus: row.warranty_status || "In Warranty",
    qcResult: row.qc_result || "Pending",
    qcBy: row.qc_by || "",
    qcDate: row.qc_date || "",
    pengiriman: row.pengiriman || "",
    trackingNo: row.tracking_no || "",
    closedDate: row.closed_date || "",
    customerReceivedDate: row.customer_received_date || "",
    notes: row.notes || "",
    unitPhotos,
    labelPhotos,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * GET /api/rma
 * Get all RMA tickets
 */
router.get("/", requireAuth, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM rma_entries ORDER BY received_date DESC, created_at DESC").all();
    const formatted = rows.map(formatRmaRow);
    res.json({ ok: true, data: formatted });
  } catch (err) {
    console.error("Error GET /api/rma:", err);
    res.status(500).json({ ok: false, error: "Gagal mengambil data RMA dari database." });
  }
});

/**
 * GET /api/rma/:id
 * Get single RMA ticket
 */
router.get("/:id", requireAuth, (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM rma_entries WHERE id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ ok: false, error: "Tiket RMA tidak ditemukan." });
    }
    res.json({ ok: true, data: formatRmaRow(row) });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal mengambil detail tiket RMA." });
  }
});

/**
 * POST /api/rma
 * Create a new RMA ticket
 */
router.post("/", requireAuth, (req, res) => {
  const entry = req.body;
  if (!entry || !entry.ticketNo || !entry.engineer) {
    return res.status(400).json({ ok: false, error: "Nomor Tiket dan Engineer wajib diisi." });
  }

  const id = entry.id || `rma_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const unitPhotos = Array.isArray(entry.unitPhotos) ? entry.unitPhotos : [];
  const labelPhotos = Array.isArray(entry.labelPhotos) ? entry.labelPhotos : [];

  try {
    const insertStmt = db.prepare(`
      INSERT INTO rma_entries (
        id, ticket_no, received_date, engineer, customer_name, company, customer_phone,
        product, product_type, sn, mac, completeness, initial_problem, symptom,
        checking_result, root_cause, action_taken, status, final_result, waiting_reason,
        warranty_status, qc_result, qc_by, qc_date, pengiriman, tracking_no,
        closed_date, customer_received_date, notes, unit_photos_json, label_photos_json,
        raw_data_json, created_at, updated_at
      ) VALUES (
        @id, @ticket_no, @received_date, @engineer, @customer_name, @company, @customer_phone,
        @product, @product_type, @sn, @mac, @completeness, @initial_problem, @symptom,
        @checking_result, @root_cause, @action_taken, @status, @final_result, @waiting_reason,
        @warranty_status, @qc_result, @qc_by, @qc_date, @pengiriman, @tracking_no,
        @closed_date, @customer_received_date, @notes, @unit_photos_json, @label_photos_json,
        @raw_data_json, @created_at, @updated_at
      )
    `);

    insertStmt.run({
      id,
      ticket_no: entry.ticketNo.trim(),
      received_date: entry.receivedDate || now.slice(0, 10),
      engineer: entry.engineer.trim(),
      customer_name: entry.customerName || "",
      company: entry.company || "",
      customer_phone: entry.customerPhone || "",
      product: entry.product || "",
      product_type: entry.productType || "",
      sn: entry.sn || "",
      mac: entry.mac || "",
      completeness: typeof entry.completeness === "string" ? entry.completeness : JSON.stringify(entry.completeness || ""),
      initial_problem: entry.initialProblem || "",
      symptom: entry.symptom || "",
      checking_result: entry.checkingResult || "",
      root_cause: entry.rootCause || "",
      action_taken: entry.actionTaken || "",
      status: entry.status || "Unit Diterima",
      final_result: entry.finalResult || "",
      waiting_reason: entry.waitingReason || "",
      warranty_status: entry.warrantyStatus || "In Warranty",
      qc_result: entry.qcResult || "Pending",
      qc_by: entry.qcBy || "",
      qc_date: entry.qcDate || "",
      pengiriman: entry.pengiriman || "",
      tracking_no: entry.trackingNo || "",
      closed_date: entry.closedDate || "",
      customer_received_date: entry.customerReceivedDate || "",
      notes: entry.notes || "",
      unit_photos_json: JSON.stringify(unitPhotos),
      label_photos_json: JSON.stringify(labelPhotos),
      raw_data_json: JSON.stringify(entry),
      created_at: entry.createdAt || now,
      updated_at: now,
    });

    const saved = db.prepare("SELECT * FROM rma_entries WHERE id = ?").get(id);
    res.json({ ok: true, data: formatRmaRow(saved) });
  } catch (err) {
    console.error("Error POST /api/rma:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ ok: false, error: `Nomor tiket '${entry.ticketNo}' sudah digunakan.` });
    }
    res.status(500).json({ ok: false, error: "Gagal menyimpan tiket RMA." });
  }
});

/**
 * PUT /api/rma/:id
 * Update an existing RMA ticket
 */
router.put("/:id", requireAuth, (req, res) => {
  const entry = req.body;
  const id = req.params.id;
  const now = new Date().toISOString();
  const unitPhotos = Array.isArray(entry.unitPhotos) ? entry.unitPhotos : [];
  const labelPhotos = Array.isArray(entry.labelPhotos) ? entry.labelPhotos : [];

  try {
    const updateStmt = db.prepare(`
      UPDATE rma_entries SET
        ticket_no = @ticket_no,
        received_date = @received_date,
        engineer = @engineer,
        customer_name = @customer_name,
        company = @company,
        customer_phone = @customer_phone,
        product = @product,
        product_type = @product_type,
        sn = @sn,
        mac = @mac,
        completeness = @completeness,
        initial_problem = @initial_problem,
        symptom = @symptom,
        checking_result = @checking_result,
        root_cause = @root_cause,
        action_taken = @action_taken,
        status = @status,
        final_result = @final_result,
        waiting_reason = @waiting_reason,
        warranty_status = @warranty_status,
        qc_result = @qc_result,
        qc_by = @qc_by,
        qc_date = @qc_date,
        pengiriman = @pengiriman,
        tracking_no = @tracking_no,
        closed_date = @closed_date,
        customer_received_date = @customer_received_date,
        notes = @notes,
        unit_photos_json = @unit_photos_json,
        label_photos_json = @label_photos_json,
        raw_data_json = @raw_data_json,
        updated_at = @updated_at
      WHERE id = @id
    `);

    const result = updateStmt.run({
      id,
      ticket_no: entry.ticketNo?.trim(),
      received_date: entry.receivedDate || now.slice(0, 10),
      engineer: entry.engineer?.trim() || "-",
      customer_name: entry.customerName || "",
      company: entry.company || "",
      customer_phone: entry.customerPhone || "",
      product: entry.product || "",
      product_type: entry.productType || "",
      sn: entry.sn || "",
      mac: entry.mac || "",
      completeness: typeof entry.completeness === "string" ? entry.completeness : JSON.stringify(entry.completeness || ""),
      initial_problem: entry.initialProblem || "",
      symptom: entry.symptom || "",
      checking_result: entry.checkingResult || "",
      root_cause: entry.rootCause || "",
      action_taken: entry.actionTaken || "",
      status: entry.status || "Unit Diterima",
      final_result: entry.finalResult || "",
      waiting_reason: entry.waitingReason || "",
      warranty_status: entry.warrantyStatus || "In Warranty",
      qc_result: entry.qcResult || "Pending",
      qc_by: entry.qcBy || "",
      qc_date: entry.qcDate || "",
      pengiriman: entry.pengiriman || "",
      tracking_no: entry.trackingNo || "",
      closed_date: entry.closedDate || "",
      customer_received_date: entry.customerReceivedDate || "",
      notes: entry.notes || "",
      unit_photos_json: JSON.stringify(unitPhotos),
      label_photos_json: JSON.stringify(labelPhotos),
      raw_data_json: JSON.stringify(entry),
      updated_at: now,
    });

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Tiket RMA tidak ditemukan." });
    }

    const saved = db.prepare("SELECT * FROM rma_entries WHERE id = ?").get(id);
    res.json({ ok: true, data: formatRmaRow(saved) });
  } catch (err) {
    console.error("Error PUT /api/rma/:id:", err);
    res.status(500).json({ ok: false, error: "Gagal memperbarui tiket RMA." });
  }
});

/**
 * DELETE /api/rma/:id
 * Delete an RMA ticket
 */
router.delete("/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat menghapus tiket RMA." });
  }
  try {
    const result = db.prepare("DELETE FROM rma_entries WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Tiket RMA tidak ditemukan." });
    }
    res.json({ ok: true, message: "Tiket RMA berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal menghapus tiket RMA." });
  }
});

/**
 * POST /api/rma/bulk-import
 * Import array of RMA tickets from Excel
 */
router.post("/bulk-import", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat mengimpor data RMA." });
  }

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ ok: false, error: "Tidak ada data baris RMA yang valid untuk diimport." });
  }

  const now = new Date().toISOString();
  let importedCount = 0;
  let skippedCount = 0;

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO rma_entries (
      id, ticket_no, received_date, engineer, customer_name, company, customer_phone,
      product, product_type, sn, mac, completeness, initial_problem, symptom,
      checking_result, root_cause, action_taken, status, final_result, waiting_reason,
      warranty_status, qc_result, qc_by, qc_date, pengiriman, tracking_no,
      closed_date, customer_received_date, notes, unit_photos_json, label_photos_json,
      raw_data_json, created_at, updated_at
    ) VALUES (
      @id, @ticket_no, @received_date, @engineer, @customer_name, @company, @customer_phone,
      @product, @product_type, @sn, @mac, @completeness, @initial_problem, @symptom,
      @checking_result, @root_cause, @action_taken, @status, @final_result, @waiting_reason,
      @warranty_status, @qc_result, @qc_by, @qc_date, @pengiriman, @tracking_no,
      @closed_date, @customer_received_date, @notes, @unit_photos_json, @label_photos_json,
      @raw_data_json, @created_at, @updated_at
    )
  `);

  const importTx = db.transaction(() => {
    for (const r of rows) {
      if (!r.ticketNo && !r.ticket_no) {
        skippedCount++;
        continue;
      }
      const ticketNo = (r.ticketNo || r.ticket_no).trim();
      const id = r.id || `rma_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      insertStmt.run({
        id,
        ticket_no: ticketNo,
        received_date: r.receivedDate || r.received_date || now.slice(0, 10),
        engineer: r.engineer || req.user.full_name,
        customer_name: r.customerName || r.customer_name || "",
        company: r.company || "",
        customer_phone: r.customerPhone || r.customer_phone || "",
        product: r.product || "",
        product_type: r.productType || r.product_type || "",
        sn: r.sn || "",
        mac: r.mac || "",
        completeness: r.completeness || "",
        initial_problem: r.initialProblem || r.initial_problem || "",
        symptom: r.symptom || "",
        checking_result: r.checkingResult || r.checking_result || "",
        root_cause: r.rootCause || r.root_cause || "",
        action_taken: r.actionTaken || r.action_taken || "",
        status: r.status || "Unit Diterima",
        final_result: r.finalResult || r.final_result || "",
        waiting_reason: r.waitingReason || r.waiting_reason || "",
        warranty_status: r.warrantyStatus || r.warranty_status || "In Warranty",
        qc_result: r.qcResult || r.qc_result || "Pending",
        qc_by: r.qcBy || r.qc_by || "",
        qc_date: r.qcDate || r.qc_date || "",
        pengiriman: r.pengiriman || "",
        tracking_no: r.trackingNo || r.tracking_no || "",
        closed_date: r.closedDate || r.closed_date || "",
        customer_received_date: r.customerReceivedDate || r.customer_received_date || "",
        notes: r.notes || "",
        unit_photos_json: JSON.stringify(r.unitPhotos || []),
        label_photos_json: JSON.stringify(r.labelPhotos || []),
        raw_data_json: JSON.stringify(r),
        created_at: r.createdAt || now,
        updated_at: now,
      });
      importedCount++;
    }
  });

  try {
    importTx();
    res.json({ ok: true, count: importedCount, skipped: skippedCount, message: `Berhasil mengimpor ${importedCount} tiket RMA.` });
  } catch (err) {
    console.error("Bulk import error:", err);
    res.status(500).json({ ok: false, error: "Gagal mengimpor data RMA." });
  }
});

export default router;
