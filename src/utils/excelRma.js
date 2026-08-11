/**
 * excelRma.js
 * Utility untuk export dan import data RMA ke/dari .xlsx menggunakan SheetJS.
 *
 * ATURAN PENTING:
 * - Tanggal disimpan sebagai plain text yyyy-mm-dd (bukan Excel date serial).
 * - Field `id`, `statusHistory`, `unitPhotos`, `labelPhotos` TIDAK di-export / di-import.
 * - Duplicate check berdasarkan `ticketNo`.
 * - `id` baru di-generate oleh pemanggil (uid()).
 * - `statusHistory` di-populate oleh pemanggil dengan entry awal.
 */

import * as XLSX from "xlsx";

/* ============================================================
   KOLOM EXPORT — urutan kolom standar saat Export Excel
   ============================================================ */
export const RMA_COLUMNS = [
  { key: "ticketNo",              header: "Ticket No" },
  { key: "status",                header: "Status" },
  { key: "engineer",              header: "Engineer" },
  { key: "product",               header: "Product" },
  { key: "sn",                    header: "SN" },
  { key: "mac",                   header: "MAC" },
  { key: "customerName",          header: "Customer Name" },
  { key: "company",               header: "Company" },
  { key: "customerPhone",         header: "Customer Phone" },
  { key: "receivedDate",          header: "Received Date" },
  { key: "receivedBy",            header: "Received By" },
  { key: "doNumber",              header: "DO Number" },
  { key: "courierName",           header: "Courier" },
  { key: "physicalCondition",     header: "Physical Condition" },
  { key: "physicalDamageNotes",   header: "Physical Damage Notes" },
  { key: "accessories",           header: "Accessories" },
  { key: "unitQty",               header: "Unit Qty" },
  { key: "receivingNotes",        header: "Receiving Notes" },
  { key: "eta",                   header: "ETA" },
  { key: "closedDate",            header: "Closed Date" },
  { key: "initialProblem",        header: "Initial Problem" },
  { key: "symptom",               header: "Symptom" },
  { key: "checkingResult",        header: "Checking Result" },
  { key: "rootCause",             header: "Root Cause" },
  { key: "actionTaken",           header: "Action Taken" },
  { key: "finalResult",           header: "Final Result" },
  { key: "waitingReason",         header: "Waiting Reason" },
  { key: "waitingParty",          header: "Waiting Party" },
  { key: "waitingStart",          header: "Waiting Start" },
  { key: "waitingEnd",            header: "Waiting End" },
  { key: "waitingNote",           header: "Waiting Note" },
  { key: "warrantyStatus",        header: "Warranty Status" },
  { key: "warrantyStart",         header: "Warranty Start" },
  { key: "warrantyEnd",           header: "Warranty End" },
  { key: "warrantyDecision",      header: "Warranty Decision" },
  { key: "warrantyReason",        header: "Warranty Reason" },
  { key: "qcTester",              header: "QC Tester" },
  { key: "qcDate",                header: "QC Date" },
  { key: "qcResult",              header: "QC Result" },
  { key: "qcNotes",               header: "QC Notes" },
  { key: "shipping",              header: "Shipping Method" },
  { key: "trackingNo",            header: "Tracking No" },
  { key: "shippedDate",           header: "Shipped Date" },
  { key: "customerReceivedDate",  header: "Customer Received Date" },
  { key: "notes",                 header: "Notes" },
];

/* ============================================================
   MAP ALIAS HEADER — Mendukung Header Export Standar & Bilingual Existing
   ============================================================ */
export const HEADER_ALIAS_MAP = {
  // Ticket No
  "ticketno": "ticketNo",
  "ticket no": "ticketNo",
  "ticket no.": "ticketNo",
  "nomor ticket / ticket no": "ticketNo",
  "nomor ticket": "ticketNo",
  "no. ticket": "ticketNo",
  "no ticket": "ticketNo",

  // Status
  "status": "status",
  "status rma / rma status": "status",
  "status rma": "status",
  "rma status": "status",

  // Engineer
  "engineer": "engineer",

  // Product / Type
  "product": "product",
  "type": "product",
  "produk": "product",
  "produk / type": "product",
  "product / type": "product",

  // SN
  "sn": "sn",
  "serial number": "sn",
  "no. sn": "sn",

  // MAC
  "mac": "mac",
  "mac address": "mac",

  // Customer Name
  "customer name": "customerName",
  "nama customer / customer name": "customerName",
  "nama customer": "customerName",
  "customer": "customerName",

  // Company
  "company": "company",
  "perusahaan / company": "company",
  "perusahaan": "company",

  // Customer Phone
  "customer phone": "customerPhone",
  "nomor customer / customer phone": "customerPhone",
  "nomor customer": "customerPhone",
  "no. hp customer": "customerPhone",
  "no hp customer": "customerPhone",
  "phone": "customerPhone",

  // Received Date
  "received date": "receivedDate",
  "tanggal masuk / received date": "receivedDate",
  "tanggal masuk": "receivedDate",
  "masuk": "receivedDate",

  // Received By
  "received by": "receivedBy",
  "diterima oleh": "receivedBy",

  // DO Number
  "do number": "doNumber",
  "no do": "doNumber",
  "no. do": "doNumber",

  // Courier Name
  "courier": "courierName",
  "courier name": "courierName",
  "nama kurir": "courierName",

  // Physical Condition
  "physical condition": "physicalCondition",
  "kondisi fisik": "physicalCondition",

  // Physical Damage Notes
  "physical damage notes": "physicalDamageNotes",

  // Accessories
  "accessories": "accessories",
  "kelengkapan": "accessories",

  // Unit Qty
  "unit qty": "unitQty",
  "qty": "unitQty",

  // Receiving Notes
  "receiving notes": "receivingNotes",

  // ETA
  "eta": "eta",
  "estimasi waktu / eta": "eta",
  "estimasi waktu": "eta",
  "estimasi selesai (eta)": "eta",

  // Closed Date
  "closed date": "closedDate",
  "tanggal keluar / closed date": "closedDate",
  "tanggal keluar": "closedDate",
  "tanggal ditutup": "closedDate",

  // Initial Problem
  "initial problem": "initialProblem",
  "kendala awal / initial problem": "initialProblem",
  "kendala awal": "initialProblem",

  // Symptom
  "symptom": "symptom",
  "gejala": "symptom",

  // Checking Result
  "checking result": "checkingResult",
  "hasil pengecekan / checking result": "checkingResult",
  "hasil pengecekan": "checkingResult",

  // Root Cause
  "root cause": "rootCause",

  // Action Taken
  "action taken": "actionTaken",
  "tindakan": "actionTaken",

  // Final Result
  "final result": "finalResult",
  "hasil akhir / final result": "finalResult",
  "hasil akhir": "finalResult",

  // Waiting Reason
  "waiting reason": "waitingReason",

  // Waiting Party
  "waiting party": "waitingParty",

  // Waiting Start
  "waiting start": "waitingStart",

  // Waiting End
  "waiting end": "waitingEnd",

  // Waiting Note
  "waiting note": "waitingNote",

  // Warranty Status
  "warranty status": "warrantyStatus",

  // Warranty Start
  "warranty start": "warrantyStart",

  // Warranty End
  "warranty end": "warrantyEnd",

  // Warranty Decision
  "warranty decision": "warrantyDecision",

  // Warranty Reason
  "warranty reason": "warrantyReason",

  // QC Tester
  "qc tester": "qcTester",

  // QC Date
  "qc date": "qcDate",

  // QC Result
  "qc result": "qcResult",

  // QC Notes
  "qc notes": "qcNotes",

  // Shipping
  "shipping method": "shipping",
  "shipping": "shipping",
  "pengiriman / shipping": "shipping",
  "pengiriman": "shipping",

  // Tracking No
  "tracking no": "trackingNo",
  "nomor resi/no surat jalan / tracking/do no": "trackingNo",
  "nomor resi": "trackingNo",
  "no resi": "trackingNo",

  // Shipped Date
  "shipped date": "shippedDate",

  // Customer Received Date
  "customer received date": "customerReceivedDate",

  // Notes
  "notes": "notes",
  "keterangan / notes": "notes",
  "keterangan": "notes",
};

// Field tanggal — divalidasi dan dikonversi ke yyyy-mm-dd
const DATE_FIELDS = new Set([
  "receivedDate", "eta", "closedDate",
  "waitingStart", "waitingEnd",
  "warrantyStart", "warrantyEnd",
  "qcDate", "shippedDate", "customerReceivedDate",
]);

/**
 * Helper konversi/normalisasi tanggal dari Excel ke string yyyy-mm-dd
 */
export function normalizeExcelDate(val) {
  if (!val && val !== 0) return "";
  const str = String(val).trim();
  if (!str) return "";

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // dd/mm/yyyy atau dd-mm-yyyy
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const d = String(parts[0]).padStart(2, "0");
    const m = String(parts[1]).padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  // yyyy/mm/dd
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const y = parts[0];
    const m = String(parts[1]).padStart(2, "0");
    const d = String(parts[2]).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Serial number Excel (misal 45123)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  // Fallback: Standard Date parse
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str;
}

/* ============================================================
   EXPORT
   ============================================================ */
/**
 * Export array RMA entries ke file .xlsx dan trigger download browser.
 * @param {Array} rmaEntries - Array objek RMA dari store
 * @param {string} filename - Nama file tanpa ekstensi
 */
export function exportRmaToExcel(rmaEntries, filename = "RMA_Export") {
  const rows = rmaEntries.map((entry) => {
    const row = {};
    for (const col of RMA_COLUMNS) {
      const val = entry[col.key];
      if (val === null || val === undefined) {
        row[col.header] = "";
      } else if (typeof val === "object") {
        row[col.header] = "";
      } else {
        row[col.header] = val;
      }
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: RMA_COLUMNS.map((c) => c.header),
  });

  ws["!cols"] = RMA_COLUMNS.map((c) => ({
    wch: Math.max(c.header.length + 4, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RMA_Log");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ============================================================
   IMPORT — PARSE DAN VALIDASI (FLEXIBLE BILINGUAL HEADER)
   ============================================================ */
/**
 * Parse file Excel (.xlsx / .xls) dengan pencocokan header fleksibel (standar & bilingual):
 * @param {File} file - File object dari input[type=file]
 * @param {string[]} existingTicketNos - Array ticketNo yang sudah ada di store
 */
export async function parseRmaFromExcel(file, existingTicketNos = []) {
  const result = {
    valid: [],
    errors: [],
    duplicates: [],
    headerError: null,
  };

  let wb;
  try {
    const ab = await file.arrayBuffer();
    wb = XLSX.read(ab, { type: "array", cellDates: false, raw: false });
  } catch {
    result.headerError = "File tidak bisa dibaca. Pastikan format .xlsx atau .xls.";
    return result;
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    result.headerError = "File Excel kosong (tidak ada worksheet).";
    return result;
  }

  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (!rows || rows.length === 0) {
    result.headerError = "Worksheet tidak memiliki data.";
    return result;
  }

  // Petakan header di Excel ke field JS berdasarkan HEADER_ALIAS_MAP
  const actualHeaders = Object.keys(rows[0]);
  const excelHeaderToJsField = {};
  const mappedFields = new Set();

  actualHeaders.forEach((h) => {
    const cleanHeader = String(h).trim().toLowerCase();
    const mappedKey = HEADER_ALIAS_MAP[cleanHeader];
    if (mappedKey) {
      excelHeaderToJsField[h] = mappedKey;
      mappedFields.add(mappedKey);
    }
  });

  // Validasi required fields — pastikan kolom-kolom inti ada di file Excel
  const missingCoreFields = [];
  if (!mappedFields.has("ticketNo")) missingCoreFields.push("Nomor Ticket / Ticket No");
  if (!mappedFields.has("status")) missingCoreFields.push("Status / RMA Status");
  if (!mappedFields.has("engineer")) missingCoreFields.push("Engineer");
  if (!mappedFields.has("product")) missingCoreFields.push("Product / Type");
  if (!mappedFields.has("customerName")) missingCoreFields.push("Nama Customer / Customer Name");
  if (!mappedFields.has("sn") && !mappedFields.has("mac")) missingCoreFields.push("SN atau MAC");

  if (missingCoreFields.length > 0) {
    result.headerError = `Header tidak cocok. Kolom wajib berikut tidak ditemukan di file Excel: ${missingCoreFields.join(", ")}`;
    return result;
  }

  const existingSet = new Set(existingTicketNos);

  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // 1-indexed, +1 untuk header row
    const rowErrors = [];

    // Buat objek RMA default dengan field kosong
    const entry = {
      ticketNo: "",
      status: "",
      engineer: "",
      product: "",
      sn: "",
      mac: "",
      customerName: "",
      company: "",
      customerPhone: "",
      receivedDate: "",
      receivedBy: "",
      doNumber: "",
      courierName: "",
      physicalCondition: "",
      physicalDamageNotes: "",
      accessories: "",
      unitQty: 1,
      receivingNotes: "",
      eta: "",
      closedDate: "",
      initialProblem: "",
      symptom: "",
      checkingResult: "",
      rootCause: "",
      actionTaken: "",
      finalResult: "",
      waitingReason: "",
      waitingParty: "",
      waitingStart: "",
      waitingEnd: "",
      waitingNote: "",
      warrantyStatus: "",
      warrantyStart: "",
      warrantyEnd: "",
      warrantyDecision: "",
      warrantyReason: "",
      qcTester: "",
      qcDate: "",
      qcResult: "",
      qcNotes: "",
      shipping: "",
      trackingNo: "",
      shippedDate: "",
      customerReceivedDate: "",
      notes: "",
    };

    // Populate field yang ada dari Excel
    Object.entries(excelHeaderToJsField).forEach(([actualHeader, jsKey]) => {
      const rawVal = rawRow[actualHeader];
      const strVal = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
      entry[jsKey] = strVal;
    });

    // unitQty: konversi ke number
    const qty = parseInt(entry.unitQty, 10);
    entry.unitQty = isNaN(qty) || qty < 1 ? 1 : qty;

    // Normalisasi & validasi tanggal
    for (const field of DATE_FIELDS) {
      if (entry[field]) {
        entry[field] = normalizeExcelDate(entry[field]);
      }
    }

    // Validasi required values per row
    if (!entry.ticketNo) rowErrors.push("Ticket No wajib diisi.");
    if (!entry.status) rowErrors.push("Status wajib diisi.");
    if (!entry.engineer) rowErrors.push("Engineer wajib diisi.");
    if (!entry.product) rowErrors.push("Product / Type wajib diisi.");
    if (!entry.customerName) rowErrors.push("Customer Name wajib diisi.");
    if (!entry.sn && !entry.mac) rowErrors.push("SN atau MAC minimal salah satu wajib diisi.");

    // Validasi format ticketNo (RMA-YYYYMMDD-NNN)
    if (entry.ticketNo && !/^RMA-\d{8}-\d{3}$/.test(entry.ticketNo)) {
      rowErrors.push(`Format Ticket No tidak valid: "${entry.ticketNo}" (harusnya RMA-YYYYMMDD-NNN).`);
    }

    if (rowErrors.length > 0) {
      result.errors.push({ row: rowNum, message: rowErrors.join(" | ") });
      return;
    }

    // Duplicate check
    if (existingSet.has(entry.ticketNo)) {
      result.duplicates.push({ row: rowNum, ticketNo: entry.ticketNo });
      return;
    }

    result.valid.push(entry);
    existingSet.add(entry.ticketNo);
  });

  return result;
}
