import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const router = Router();

function formatPcbaItem(r) {
  if (!r) return null;
  return {
    id: r.id,
    serialNo: r.serial_no,
    pcbaType: r.pcba_type,
    product: r.product || "",
    supplier: r.supplier || "",
    warehouseLocation: r.warehouse_location || "",
    status: r.status,
    receivedDate: r.received_date,
    receivedBy: r.received_by || "-",
    notes: r.notes || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function formatTransaction(r) {
  if (!r) return null;
  return {
    id: r.id,
    transactionNo: r.transaction_no,
    pcbaItemId: r.pcba_item_id,
    type: r.type,
    rmaId: r.rma_id,
    receivedDate: r.received_date,
    receivedBy: r.received_by,
    performedBy: r.performed_by,
    reason: r.reason || "",
    createdAt: r.created_at,
  };
}

function formatReplacement(r) {
  if (!r) return null;
  return {
    id: r.id,
    replacementNo: r.replacement_no,
    rmaId: r.rma_id,
    oldPcbaItemId: r.old_pcba_item_id,
    newPcbaItemId: r.new_pcba_item_id,
    pcbaType: r.pcba_type || "",
    replacedBy: r.replaced_by,
    replacedAt: r.replaced_at,
    notes: r.notes || "",
  };
}

function formatChinaShipment(r) {
  if (!r) return null;
  return {
    id: r.id,
    shipmentNo: r.shipment_no,
    pcbaItemId: r.pcba_item_id,
    serialNumber: r.serial_number || "",
    serialNo: r.serial_number || "",
    macAddress: r.mac_address || "",
    mac: r.mac_address || "",
    date: r.date,
    notes: r.notes || "",
    createdAt: r.created_at,
  };
}

function formatRepair(r) {
  if (!r) return null;
  return {
    id: r.id,
    repairNo: r.repair_no,
    pcbaItemId: r.pcba_item_id,
    engineer: r.engineer,
    diagnosis: r.diagnosis || "",
    actionTaken: r.action_taken || "",
    replacedComponents: r.replaced_components || "",
    statusBefore: r.status_before,
    statusAfter: r.status_after,
    repairedAt: r.repaired_at,
    notes: r.notes || "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * GET /api/pcba/all
 * Retrieve full PCBA inventory dataset bundle
 */
router.get("/all", requireAuth, (req, res) => {
  try {
    const items = db.prepare("SELECT * FROM pcba_items ORDER BY created_at DESC").all().map(formatPcbaItem);
    const transactions = db.prepare("SELECT * FROM pcba_transactions ORDER BY created_at DESC").all().map(formatTransaction);
    const replacements = db.prepare("SELECT * FROM pcba_replacements ORDER BY replaced_at DESC").all().map(formatReplacement);
    const chinaShipments = db.prepare("SELECT * FROM pcba_china_shipments ORDER BY created_at DESC").all().map(formatChinaShipment);
    const repairs = db.prepare("SELECT * FROM pcba_repairs ORDER BY repaired_at DESC").all().map(formatRepair);

    res.json({
      ok: true,
      data: {
        items,
        transactions,
        replacements,
        chinaShipments,
        repairs,
      },
    });
  } catch (err) {
    console.error("Error GET /api/pcba/all:", err);
    res.status(500).json({ ok: false, error: "Gagal mengambil data PCBA dari database." });
  }
});

/**
 * POST /api/pcba/receipt
 * Goods receipt: register new PCBA item + transaction atomically
 */
router.post("/receipt", requireAuth, (req, res) => {
  const formData = req.body;
  if (!formData.serialNo || !formData.pcbaType) {
    return res.status(400).json({ ok: false, error: "Nomor Serial dan Tipe PCBA wajib diisi." });
  }

  const now = new Date().toISOString();
  const itemId = formData.id || `pcba_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const trxId = `trx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const receivedDate = formData.receivedDate || now.slice(0, 10);
  const receivedBy = formData.receivedBy ? formData.receivedBy.trim() : (req.user.full_name || "-");
  const transactionNo = `TRX-${now.slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO pcba_items (
        id, serial_no, pcba_type, product, supplier, warehouse_location, status, received_date, received_by, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'Good', ?, ?, ?, ?, ?
      )
    `).run(
      itemId,
      formData.serialNo.trim(),
      formData.pcbaType,
      (formData.product || "").trim(),
      formData.supplier || "HSGQ HQ (China)",
      formData.warehouseLocation || "Gudang Jakarta",
      receivedDate,
      receivedBy,
      (formData.notes || "").trim(),
      now,
      now
    );

    db.prepare(`
      INSERT INTO pcba_transactions (
        id, transaction_no, pcba_item_id, type, rma_id, received_date, received_by, performed_by, reason, created_at
      ) VALUES (
        ?, ?, ?, 'Goods Receipt', NULL, ?, ?, ?, ?, ?
      )
    `).run(
      trxId,
      transactionNo,
      itemId,
      receivedDate,
      receivedBy,
      receivedBy,
      (formData.notes || "").trim() || `Penerimaan stok baru (${receivedBy})`,
      now
    );
  });

  try {
    tx();
    res.json({ ok: true, message: "Stok PCBA baru berhasil diterima." });
  } catch (err) {
    console.error("Receipt error:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({ ok: false, error: `Serial Number '${formData.serialNo}' sudah ada di database.` });
    }
    res.status(500).json({ ok: false, error: "Gagal menyimpan penerimaan PCBA." });
  }
});

/**
 * PUT /api/pcba/items/:id
 * Edit PCBA item metadata
 */
router.put("/items/:id", requireAuth, (req, res) => {
  const item = req.body;
  const id = req.params.id;
  const now = new Date().toISOString();

  try {
    const result = db.prepare(`
      UPDATE pcba_items SET
        serial_no = ?,
        pcba_type = ?,
        product = ?,
        supplier = ?,
        warehouse_location = ?,
        status = ?,
        received_date = ?,
        received_by = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      item.serialNo?.trim(),
      item.pcbaType,
      (item.product || "").trim(),
      item.supplier || "",
      item.warehouseLocation || "",
      item.status || "Good",
      item.receivedDate || now.slice(0, 10),
      item.receivedBy || "-",
      item.notes || "",
      now,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Item PCBA tidak ditemukan." });
    }
    res.json({ ok: true, message: "Data item PCBA berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal memperbarui item PCBA." });
  }
});

/**
 * DELETE /api/pcba/items/:id
 * Delete a PCBA item
 */
router.delete("/items/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat menghapus PCBA." });
  }
  try {
    const result = db.prepare("DELETE FROM pcba_items WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Item PCBA tidak ditemukan." });
    }
    res.json({ ok: true, message: "Item PCBA berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal menghapus item PCBA." });
  }
});

/**
 * POST /api/pcba/replacement
 * Process PCBA replacement (Atomic: updates stock, inserts replacement, logs transaction)
 */
router.post("/replacement", requireAuth, (req, res) => {
  const formData = req.body;
  if (!formData.newPcbaItemId) {
    return res.status(400).json({ ok: false, error: "PCBA Baru wajib dipilih." });
  }

  const now = new Date().toISOString();
  const repId = formData.id || `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const trxId = `trx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const replacementNo = formData.replacementNo || `REP-${now.slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;
  const replacedBy = formData.replacedBy?.trim() || req.user.full_name || "-";
  const replacedAt = formData.replacedAt || now;

  const tx = db.transaction(() => {
    // 1. Mark new PCBA item as 'Used for Replacement'
    db.prepare("UPDATE pcba_items SET status = 'Used for Replacement', updated_at = ? WHERE id = ?").run(
      now,
      formData.newPcbaItemId
    );

    // 2. Insert Replacement Record
    db.prepare(`
      INSERT INTO pcba_replacements (
        id, replacement_no, rma_id, old_pcba_item_id, new_pcba_item_id, pcba_type, replaced_by, replaced_at, notes
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      repId,
      replacementNo,
      formData.rmaId || null,
      formData.oldPcbaItemId || null,
      formData.newPcbaItemId,
      formData.pcbaType || "",
      replacedBy,
      replacedAt,
      formData.notes || ""
    );

    // 3. Log Stock Transaction
    db.prepare(`
      INSERT INTO pcba_transactions (
        id, transaction_no, pcba_item_id, type, rma_id, received_date, received_by, performed_by, reason, created_at
      ) VALUES (
        ?, ?, ?, 'Replacement Out', ?, ?, ?, ?, ?, ?
      )
    `).run(
      trxId,
      `TRX-${now.slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
      formData.newPcbaItemId,
      formData.rmaId || null,
      replacedAt.slice(0, 10),
      replacedBy,
      replacedBy,
      `Replacement untuk RMA: ${formData.rmaTicketNo || formData.rmaId || "-"}`,
      now
    );
  });

  try {
    tx();
    res.json({ ok: true, message: "Replacement PCBA berhasil diproses." });
  } catch (err) {
    console.error("Replacement error:", err);
    res.status(500).json({ ok: false, error: "Gagal memproses replacement PCBA." });
  }
});

/**
 * PUT /api/pcba/replacement/:id
 * Edit PCBA replacement
 */
router.put("/replacement/:id", requireAuth, (req, res) => {
  const rep = req.body;
  const id = req.params.id;

  try {
    const result = db.prepare(`
      UPDATE pcba_replacements SET
        rma_id = ?,
        old_pcba_item_id = ?,
        new_pcba_item_id = ?,
        pcba_type = ?,
        replaced_by = ?,
        replaced_at = ?,
        notes = ?
      WHERE id = ?
    `).run(
      rep.rmaId || null,
      rep.oldPcbaItemId || null,
      rep.newPcbaItemId,
      rep.pcbaType || "",
      rep.replacedBy || "-",
      rep.replacedAt || new Date().toISOString(),
      rep.notes || "",
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Data replacement tidak ditemukan." });
    }
    res.json({ ok: true, message: "Data replacement berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal memperbarui data replacement." });
  }
});

/**
 * DELETE /api/pcba/replacement/:id
 * Cancel replacement: restores new PCBA status to 'Good' and deletes record
 */
router.delete("/replacement/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat membatalkan replacement." });
  }

  const id = req.params.id;
  const rep = db.prepare("SELECT * FROM pcba_replacements WHERE id = ?").get(id);
  if (!rep) {
    return res.status(404).json({ ok: false, error: "Data replacement tidak ditemukan." });
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    if (rep.new_pcba_item_id) {
      db.prepare("UPDATE pcba_items SET status = 'Good', updated_at = ? WHERE id = ? AND status = 'Used for Replacement'").run(
        now,
        rep.new_pcba_item_id
      );
    }
    db.prepare("DELETE FROM pcba_replacements WHERE id = ?").run(id);
  });

  try {
    tx();
    res.json({ ok: true, message: "Replacement berhasil dibatalkan dan stok PCBA dipulihkan." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal membatalkan replacement." });
  }
});

/**
 * POST /api/pcba/send-to-china
 * Register shipment of bad PCBA to China
 */
router.post("/send-to-china", requireAuth, (req, res) => {
  const formData = req.body;
  const id = formData.id || `shp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const shipmentNo = formData.shipmentNo || `SHP-CN-${now.slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

  const tx = db.transaction(() => {
    if (formData.pcbaItemId) {
      db.prepare("UPDATE pcba_items SET status = 'Sent to China', updated_at = ? WHERE id = ?").run(
        now,
        formData.pcbaItemId
      );
    }

    db.prepare(`
      INSERT INTO pcba_china_shipments (
        id, shipment_no, pcba_item_id, serial_number, mac_address, date, notes, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      id,
      shipmentNo,
      formData.pcbaItemId || null,
      formData.serialNumber || formData.serialNo || "",
      formData.macAddress || formData.mac || "",
      formData.date || now.slice(0, 10),
      formData.notes || "",
      now
    );
  });

  try {
    tx();
    res.json({ ok: true, message: "Pengiriman PCBA ke China berhasil dicatat." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal mencatat pengiriman ke China." });
  }
});

/**
 * PUT /api/pcba/send-to-china/:id
 * Edit shipment to China
 */
router.put("/send-to-china/:id", requireAuth, (req, res) => {
  const shp = req.body;
  const id = req.params.id;

  try {
    const result = db.prepare(`
      UPDATE pcba_china_shipments SET
        serial_number = ?,
        mac_address = ?,
        date = ?,
        notes = ?
      WHERE id = ?
    `).run(
      shp.serialNumber || shp.serialNo || "",
      shp.macAddress || shp.mac || "",
      shp.date || new Date().toISOString().slice(0, 10),
      shp.notes || "",
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Data pengiriman tidak ditemukan." });
    }
    res.json({ ok: true, message: "Data pengiriman berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal memperbarui pengiriman ke China." });
  }
});

/**
 * DELETE /api/pcba/send-to-china/:id
 * Cancel shipment to China
 */
router.delete("/send-to-china/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat membatalkan pengiriman China." });
  }

  const id = req.params.id;
  const shp = db.prepare("SELECT * FROM pcba_china_shipments WHERE id = ?").get(id);
  if (!shp) {
    return res.status(404).json({ ok: false, error: "Data pengiriman tidak ditemukan." });
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    if (shp.pcba_item_id) {
      db.prepare("UPDATE pcba_items SET status = 'Bad', updated_at = ? WHERE id = ?").run(
        now,
        shp.pcba_item_id
      );
    }
    db.prepare("DELETE FROM pcba_china_shipments WHERE id = ?").run(id);
  });

  try {
    tx();
    res.json({ ok: true, message: "Pengiriman berhasil dibatalkan dan status PCBA dipulihkan ke Bad." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal membatalkan pengiriman." });
  }
});

/**
 * DELETE /api/pcba/transactions/:id
 * Delete a single transaction record
 */
router.delete("/transactions/:id", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat menghapus riwayat transaksi." });
  }
  try {
    const result = db.prepare("DELETE FROM pcba_transactions WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ ok: false, error: "Transaksi tidak ditemukan." });
    }
    res.json({ ok: true, message: "Riwayat transaksi berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal menghapus transaksi." });
  }
});

/**
 * POST /api/pcba/bulk-import
 * Bulk import PCBA items from Excel
 */
router.post("/bulk-import", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat mengimpor PCBA." });
  }

  const { rows, batchOptions } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ ok: false, error: "Tidak ada data PCBA yang valid untuk diimport." });
  }

  const now = new Date().toISOString();
  let importedCount = 0;

  const insertItem = db.prepare(`
    INSERT OR REPLACE INTO pcba_items (
      id, serial_no, pcba_type, product, supplier, warehouse_location, status, received_date, received_by, notes, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 'Good', ?, ?, ?, ?, ?
    )
  `);

  const insertTrx = db.prepare(`
    INSERT OR REPLACE INTO pcba_transactions (
      id, transaction_no, pcba_item_id, type, rma_id, received_date, received_by, performed_by, reason, created_at
    ) VALUES (
      ?, ?, ?, 'Goods Receipt', NULL, ?, ?, ?, ?, ?
    )
  `);

  const tx = db.transaction(() => {
    rows.forEach((row, idx) => {
      const serialNo = (row.serialNo || row.serial_no || "").trim();
      if (!serialNo) return;

      const itemId = `pcba_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
      const trxId = `trx_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
      const receivedDate = row.receivedDate || row.received_date || now.slice(0, 10);
      const receivedBy = batchOptions?.receivedBy?.trim() || row.receivedBy?.trim() || req.user.full_name || "Excel Import";
      const supplier = batchOptions?.supplier || row.supplier || "HSGQ HQ (China)";
      const warehouseLocation = batchOptions?.warehouseLocation || row.warehouseLocation || "Gudang Jakarta";
      const pcbaType = row.pcbaType || row.pcba_type || batchOptions?.pcbaType || "G04ID";
      const product = row.product || "";
      const notes = row.notes || "Import dari Excel";
      const transactionNo = `TRX-${now.slice(0, 10).replace(/-/g, "")}-${String(Date.now() + idx).slice(-4)}`;

      insertItem.run(
        itemId,
        serialNo,
        pcbaType,
        product,
        supplier,
        warehouseLocation,
        receivedDate,
        receivedBy,
        notes,
        now,
        now
      );

      insertTrx.run(
        trxId,
        transactionNo,
        itemId,
        receivedDate,
        receivedBy,
        receivedBy,
        `Excel Import (${receivedBy})`,
        now
      );

      importedCount++;
    });
  });

  try {
    tx();
    res.json({ ok: true, count: importedCount, message: `Berhasil mengimpor ${importedCount} item PCBA.` });
  } catch (err) {
    console.error("Bulk PCBA import error:", err);
    res.status(500).json({ ok: false, error: "Gagal mengimpor data PCBA." });
  }
});

/**
 * POST /api/pcba/sync-all
 * Full atomic synchronization of all PCBA datasets
 */
router.post("/sync-all", requireAuth, (req, res) => {
  if (req.user.role === "Viewer") {
    return res.status(403).json({ ok: false, error: "403 Forbidden: Viewer tidak dapat mengubah data PCBA." });
  }

  const { items = [], transactions = [], replacements = [], chinaShipments = [], repairs = [] } = req.body || {};
  const now = new Date().toISOString();

  const insertItem = db.prepare(`
    INSERT OR REPLACE INTO pcba_items (
      id, serial_no, pcba_type, product, supplier, warehouse_location, status, received_date, received_by, notes, created_at, updated_at
    ) VALUES (
      @id, @serial_no, @pcba_type, @product, @supplier, @warehouse_location, @status, @received_date, @received_by, @notes, @created_at, @updated_at
    )
  `);

  const insertTrx = db.prepare(`
    INSERT OR REPLACE INTO pcba_transactions (
      id, transaction_no, pcba_item_id, type, rma_id, received_date, received_by, performed_by, reason, created_at
    ) VALUES (
      @id, @transaction_no, @pcba_item_id, @type, @rma_id, @received_date, @received_by, @performed_by, @reason, @created_at
    )
  `);

  const insertRep = db.prepare(`
    INSERT OR REPLACE INTO pcba_replacements (
      id, replacement_no, rma_id, old_pcba_item_id, new_pcba_item_id, pcba_type, replaced_by, replaced_at, notes
    ) VALUES (
      @id, @replacement_no, @rma_id, @old_pcba_item_id, @new_pcba_item_id, @pcba_type, @replaced_by, @replaced_at, @notes
    )
  `);

  const insertShp = db.prepare(`
    INSERT OR REPLACE INTO pcba_china_shipments (
      id, shipment_no, pcba_item_id, serial_number, mac_address, date, notes, created_at
    ) VALUES (
      @id, @shipment_no, @pcba_item_id, @serial_number, @mac_address, @date, @notes, @created_at
    )
  `);

  const tx = db.transaction(() => {
    // Delete existing to match exact full state
    db.prepare("DELETE FROM pcba_replacements").run();
    db.prepare("DELETE FROM pcba_china_shipments").run();
    db.prepare("DELETE FROM pcba_transactions").run();
    db.prepare("DELETE FROM pcba_items").run();

    items.forEach((item) => {
      insertItem.run({
        id: item.id,
        serial_no: item.serialNo || item.serial_no || `SN-${item.id}`,
        pcba_type: item.pcbaType || item.pcba_type || "G04ID",
        product: item.product || "",
        supplier: item.supplier || "HSGQ HQ (China)",
        warehouse_location: item.warehouseLocation || item.warehouse_location || "Gudang Jakarta",
        status: item.status || "Good",
        received_date: item.receivedDate || item.received_date || now.slice(0, 10),
        received_by: item.receivedBy || item.received_by || "-",
        notes: item.notes || "",
        created_at: item.createdAt || item.created_at || now,
        updated_at: item.updatedAt || item.updated_at || now,
      });
    });

    transactions.forEach((txRow) => {
      insertTrx.run({
        id: txRow.id,
        transaction_no: txRow.transactionNo || txRow.transaction_no || `TRX-${txRow.id}`,
        pcba_item_id: txRow.pcbaItemId || txRow.pcba_item_id,
        type: txRow.type || "Goods Receipt",
        rma_id: txRow.rmaId || txRow.rma_id || null,
        received_date: txRow.receivedDate || txRow.received_date || now.slice(0, 10),
        received_by: txRow.receivedBy || txRow.received_by || "-",
        performed_by: txRow.performedBy || txRow.performed_by || txRow.receivedBy || "-",
        reason: txRow.reason || "",
        created_at: txRow.createdAt || txRow.created_at || now,
      });
    });

    replacements.forEach((rep) => {
      insertRep.run({
        id: rep.id,
        replacement_no: rep.replacementNo || rep.replacement_no || `REP-${rep.id}`,
        rma_id: rep.rmaId || rep.rma_id || null,
        old_pcba_item_id: rep.oldPcbaItemId || rep.old_pcba_item_id || null,
        new_pcba_item_id: rep.newPcbaItemId || rep.new_pcba_item_id || null,
        pcba_type: rep.pcbaType || rep.pcba_type || "",
        replaced_by: rep.replacedBy || rep.replaced_by || "-",
        replaced_at: rep.replacedAt || rep.replaced_at || now,
        notes: rep.notes || "",
      });
    });

    chinaShipments.forEach((shp) => {
      insertShp.run({
        id: shp.id,
        shipment_no: shp.shipmentNo || shp.shipment_no || `SHP-${shp.id}`,
        pcba_item_id: shp.pcbaItemId || shp.pcba_item_id || null,
        serial_number: shp.serialNumber || shp.serial_number || shp.serialNo || "",
        mac_address: shp.macAddress || shp.mac_address || shp.mac || "",
        date: shp.date || now.slice(0, 10),
        notes: shp.notes || "",
        created_at: shp.createdAt || shp.created_at || now,
      });
    });
  });

  try {
    tx();
    res.json({ ok: true, message: "Data PCBA berhasil disinkronkan ke database SQLite." });
  } catch (err) {
    console.error("Sync all PCBA error:", err);
    res.status(500).json({ ok: false, error: "Gagal menyinkronkan data PCBA ke SQLite." });
  }
});

export default router;

