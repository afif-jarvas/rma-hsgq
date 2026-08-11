/**
 * excelWa.js
 * Utility untuk export dan import data WhatsApp Log Book ke/dari .xlsx menggunakan SheetJS.
 *
 * ATURAN PENTING:
 * - Menggunakan 17 kolom standar bilingual sesuai LOGBOOKWhatsAPP.xlsx.
 * - Field formula (Umur Case, Pesan Konfirmasi WA, Troubleshooting Status) di-generate/dihitung saat export.
 * - Tanggal disimpan/di-import sebagai string ISO yyyy-mm-dd.
 * - Duplicate check berdasarkan `caseNo` (atau kombinasi caseDate+customerPhone+customerName+initialProblem).
 * - `id` baru di-generate oleh pemanggil (uid()).
 */

import * as XLSX from "xlsx";
import { normalizeExcelDate } from "./excelRma.js";

/* ============================================================
   KOLOM EXPORT (17 KOLOM STANDAR BILINGUAL)
   ============================================================ */
export const WA_COLUMNS = [
  { key: "caseDate",          header: "Tanggal Case / Case Date" },
  { key: "caseNo",            header: "Nomor Kendala / Case No" },
  { key: "customerPhone",     header: "Nomor Customer / Customer Phone" },
  { key: "customerName",      header: "Nama Customer / Customer Name" },
  { key: "company",           header: "Perusahaan Customer / Company" },
  { key: "deviceType",        header: "Type Perangkat / Device Type" },
  { key: "sn",                header: "SN" },
  { key: "mac",               header: "MAC" },
  { key: "initialProblem",    header: "Kendala Awal / Initial Problem" },
  { key: "engineerTag",       header: "Tagging Tim Teknis / Technical Team Tag" },
  { key: "status",            header: "Request Status" },
  { key: "troubleshootingStatus", header: "Status Trouble Shooting / Troubleshooting Status" },
  { key: "finalAnalysis",     header: "Analisa Akhir / Final Analysis" },
  { key: "solvedDate",        header: "Tanggal Solved / Solved Date" },
  { key: "caseAge",           header: "Umur Case (Hari) / Case Age (Days)" },
  { key: "waConfirmationMsg", header: "Pesan Konfirmasi WhatsApp / WhatsApp Confirmation Message" },
  { key: "notes",             header: "Keterangan / Notes" },
];

/* ============================================================
   MAP ALIAS HEADER — fleksibel bilingual & variasi penulisan
   ============================================================ */
export const HEADER_ALIAS_MAP_WA = {
  // Case Date
  "tanggal case / case date": "caseDate",
  "tanggal case": "caseDate",
  "case date": "caseDate",
  "tanggal": "caseDate",
  "tgl case": "caseDate",

  // Case No
  "nomor kendala / case no": "caseNo",
  "nomor kendala": "caseNo",
  "case no": "caseNo",
  "case no.": "caseNo",
  "no. case": "caseNo",
  "no case": "caseNo",
  "case number": "caseNo",

  // Customer Phone
  "nomor customer / customer phone": "customerPhone",
  "nomor customer": "customerPhone",
  "customer phone": "customerPhone",
  "no hp customer": "customerPhone",
  "no. hp customer": "customerPhone",
  "no hp": "customerPhone",
  "phone": "customerPhone",

  // Customer Name
  "nama customer / customer name": "customerName",
  "nama customer": "customerName",
  "customer name": "customerName",
  "customer": "customerName",

  // Company
  "perusahaan customer / company": "company",
  "perusahaan customer": "company",
  "company": "company",
  "perusahaan": "company",

  // Device Type
  "type perangkat / device type": "deviceType",
  "type perangkat": "deviceType",
  "device type": "deviceType",
  "tipe perangkat": "deviceType",
  "device": "deviceType",

  // SN
  "sn": "sn",
  "serial number": "sn",
  "no. sn": "sn",

  // MAC
  "mac": "mac",
  "mac address": "mac",

  // Initial Problem
  "kendala awal / initial problem": "initialProblem",
  "kendala awal": "initialProblem",
  "initial problem": "initialProblem",
  "kendala": "initialProblem",

  // Engineer Tag
  "tagging tim teknis / technical team tag": "engineerTag",
  "tagging tim teknis": "engineerTag",
  "technical team tag": "engineerTag",
  "engineer tag": "engineerTag",
  "engineer": "engineerTag",
  "tagging": "engineerTag",

  // Status
  "request status": "status",
  "status": "status",
  "status wa": "status",

  // Troubleshooting Status
  "status trouble shooting / troubleshooting status": "troubleshootingStatus",
  "status trouble shooting": "troubleshootingStatus",
  "troubleshooting status": "troubleshootingStatus",

  // Final Analysis
  "analisa akhir / final analysis": "finalAnalysis",
  "analisa akhir": "finalAnalysis",
  "final analysis": "finalAnalysis",

  // Solved Date
  "tanggal solved / solved date": "solvedDate",
  "tanggal solved": "solvedDate",
  "solved date": "solvedDate",
  "tanggal selesai": "solvedDate",

  // Case Age
  "umur case (hari) / case age (days)": "caseAge",
  "umur case": "caseAge",
  "case age": "caseAge",

  // WhatsApp Confirmation Message
  "pesan konfirmasi whatsapp / whatsapp confirmation message": "waConfirmationMsg",
  "pesan konfirmasi whatsapp": "waConfirmationMsg",
  "whatsapp confirmation message": "waConfirmationMsg",
  "pesan konfirmasi": "waConfirmationMsg",

  // Notes
  "keterangan / notes": "notes",
  "keterangan": "notes",
  "notes": "notes",
};

/**
 * Normalisasi nomor HP agar selalu bertipe string dan mempertahankan 0 di depan
 */
export function normalizePhoneNumber(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (!str) return "";
  if (/^\d+$/.test(str)) {
    if (str.startsWith("8")) {
      str = "0" + str;
    }
  }
  return str;
}

/**
 * Helper menghitung selisih hari antara dua string tanggal ISO
 */
function calculateCaseAge(caseDate, solvedDate) {
  if (!caseDate) return 0;
  const start = new Date(caseDate);
  if (isNaN(start.getTime())) return 0;
  const endStr = solvedDate || new Date().toISOString().slice(0, 10);
  const end = new Date(endStr);
  if (isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end - start) / 86400000));
}

/**
 * Helper membuat template Pesan Konfirmasi WA (bilingual ID/EN)
 */
export function generateWaConfirmationMessage(e) {
  return `Halo ${e.customerName || "-"},

Update kendala WhatsApp dengan nomor case ${e.caseNo || "-"}.
Perusahaan: ${e.company || "-"}
Perangkat: ${e.deviceType || "-"} | SN: ${e.sn || "-"} | MAC: ${e.mac || "-"}
Kendala: ${e.initialProblem || "-"}
Status: ${e.status || "-"}
Analisa akhir: ${e.finalAnalysis || "-"}
Terima kasih.

--- English ---
Dear ${e.customerName || "-"},

WhatsApp case update, case number ${e.caseNo || "-"}.
Company: ${e.company || "-"}
Device: ${e.deviceType || "-"} | SN: ${e.sn || "-"} | MAC: ${e.mac || "-"}
Issue: ${e.initialProblem || "-"}
Status: ${e.status || "-"}
Final Analysis: ${e.finalAnalysis || "-"}
Thank you.`;
}

/* ============================================================
   EXPORT EXCEL
   ============================================================ */
/**
 * Export array WA entries ke file .xlsx dan trigger download browser.
 * @param {Array} waEntries - Array objek WhatsApp Log Book
 * @param {string} filename - Nama file tanpa ekstensi
 */
export function exportWaToExcel(waEntries, filename = "LOGBOOK_WhatsApp_Export") {
  const rows = waEntries.map((entry) => {
    const row = {};

    // Calculate derived fields for export
    const caseAge = calculateCaseAge(entry.caseDate, entry.solvedDate);
    const waMsg = generateWaConfirmationMessage(entry);
    const troubleshootingStatus = entry.status || "On Progress";

    for (const col of WA_COLUMNS) {
      if (col.key === "caseAge") {
        row[col.header] = caseAge;
      } else if (col.key === "waConfirmationMsg") {
        row[col.header] = waMsg;
      } else if (col.key === "troubleshootingStatus") {
        row[col.header] = troubleshootingStatus;
      } else {
        const val = entry[col.key];
        row[col.header] = val === null || val === undefined ? "" : String(val);
      }
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: WA_COLUMNS.map((c) => c.header),
  });

  // Freeze top row
  ws["!views"] = [{ state: "frozen", ySplit: 1 }];

  // Column width calculations & auto-wrap
  ws["!cols"] = WA_COLUMNS.map((c) => {
    let wch = Math.max(c.header.length + 3, 12);
    if (c.key === "waConfirmationMsg") wch = 40;
    else if (c.key === "initialProblem" || c.key === "finalAnalysis" || c.key === "notes") wch = 30;
    else if (c.key === "customerName" || c.key === "company") wch = 22;
    return { wch };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "WhatsApp_Log");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/* ============================================================
   IMPORT — PARSE DAN VALIDASI EXCEL
   ============================================================ */
/**
 * Parse file Excel (.xlsx / .xls) untuk WhatsApp Log Book:
 * @param {File} file - File dari input[type=file]
 * @param {Array} existingWaEntries - Data WA yang sudah ada di store
 */
export async function parseWaFromExcel(file, existingWaEntries = []) {
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

  // Header mapping
  const actualHeaders = Object.keys(rows[0]);
  const excelHeaderToJsField = {};
  const mappedFields = new Set();

  actualHeaders.forEach((h) => {
    const cleanHeader = String(h).trim().toLowerCase();
    const mappedKey = HEADER_ALIAS_MAP_WA[cleanHeader];
    if (mappedKey) {
      excelHeaderToJsField[h] = mappedKey;
      mappedFields.add(mappedKey);
    }
  });

  // Validasi required core headers
  const missingCoreFields = [];
  if (!mappedFields.has("customerName")) missingCoreFields.push("Nama Customer / Customer Name");
  if (!mappedFields.has("initialProblem")) missingCoreFields.push("Kendala Awal / Initial Problem");

  if (missingCoreFields.length > 0) {
    result.headerError = `Header tidak cocok. Kolom wajib berikut tidak ditemukan di file Excel: ${missingCoreFields.join(", ")}`;
    return result;
  }

  // Existing keys set for duplicate detection
  const existingCaseNos = new Set(
    existingWaEntries.map((e) => (e.caseNo || "").trim()).filter(Boolean)
  );

  const existingFingerprints = new Set(
    existingWaEntries.map((e) =>
      `${(e.caseDate || "").trim()}|${(e.customerPhone || "").trim()}|${(e.customerName || "").trim().toLowerCase()}|${(e.initialProblem || "").trim().toLowerCase()}`
    )
  );

  rows.forEach((rawRow, idx) => {
    const rowNum = idx + 2; // 1-indexed (+1 for header)
    const rowErrors = [];

    const entry = {
      caseDate: "",
      caseNo: "",
      customerPhone: "",
      customerName: "",
      company: "",
      deviceType: "",
      sn: "",
      mac: "",
      initialProblem: "",
      engineerTag: "",
      status: "On Progress",
      finalAnalysis: "",
      solvedDate: "",
      notes: "",
      commHistory: [],
    };

    // Populate from Excel row
    Object.entries(excelHeaderToJsField).forEach(([actualHeader, jsKey]) => {
      // Ignore formula-only columns during import
      if (jsKey === "caseAge" || jsKey === "waConfirmationMsg" || jsKey === "troubleshootingStatus") {
        return;
      }
      const rawVal = rawRow[actualHeader];
      const strVal = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
      entry[jsKey] = strVal;
    });

    // Data Normalization
    if (entry.caseDate) {
      entry.caseDate = normalizeExcelDate(entry.caseDate);
    } else {
      entry.caseDate = new Date().toISOString().slice(0, 10);
    }

    if (entry.solvedDate) {
      entry.solvedDate = normalizeExcelDate(entry.solvedDate);
    }

    // Phone number string normalization
    entry.customerPhone = normalizePhoneNumber(entry.customerPhone);

    // SN and MAC string normalization (uppercase, no number conversion)
    entry.sn = String(entry.sn || "").toUpperCase().trim();
    entry.mac = String(entry.mac || "").toUpperCase().trim();

    // Required row fields validation
    if (!entry.customerName) rowErrors.push("Nama Customer wajib diisi.");
    if (!entry.initialProblem) rowErrors.push("Kendala Awal wajib diisi.");

    if (rowErrors.length > 0) {
      result.errors.push({ row: rowNum, message: rowErrors.join(" | ") });
      return;
    }

    // Duplicate detection strategy
    const hasCaseNo = Boolean(entry.caseNo);
    const fingerprint = `${entry.caseDate}|${entry.customerPhone}|${entry.customerName.toLowerCase()}|${entry.initialProblem.toLowerCase()}`;

    let isDuplicate = false;
    if (hasCaseNo && existingCaseNos.has(entry.caseNo)) {
      isDuplicate = true;
    } else if (existingFingerprints.has(fingerprint)) {
      isDuplicate = true;
    }

    if (isDuplicate) {
      result.duplicates.push({ row: rowNum, caseNo: entry.caseNo || "N/A", entry });
      return;
    }

    // Add to valid
    result.valid.push(entry);
    if (hasCaseNo) existingCaseNos.add(entry.caseNo);
    existingFingerprints.add(fingerprint);
  });

  return result;
}
