/**
 * excelPcba.js
 * Utility untuk export data PCBA Inventory ke .xlsx menggunakan SheetJS.
 */

import * as XLSX from "xlsx";

export const PCBA_COLUMNS = [
  { key: "serialNo", header: "Serial Number" },
  { key: "pcbaType", header: "PCBA Type" },
  { key: "status", header: "Status" },
  { key: "supplier", header: "Supplier" },
  { key: "warehouseLocation", header: "Warehouse / Location" },
  { key: "receivedDate", header: "Received Date" },
  { key: "receivedBy", header: "Received By" },
  { key: "notes", header: "Notes" },
];

export const REPLACEMENT_COLUMNS = [
  { key: "replacementNo", header: "No. Replacement" },
  { key: "rmaTicketNo", header: "Tiket RMA" },
  { key: "oldSerialNo", header: "PCBA Lama" },
  { key: "pcbaType", header: "Tipe PCBA" },
  { key: "chinaStatus", header: "Status Kirim China" },
  { key: "newSerialNo", header: "PCBA Baru" },
  { key: "replacedBy", header: "Diproses Oleh" },
  { key: "replacedAt", header: "Tanggal Replacement" },
  { key: "notes", header: "Catatan" },
];

export const CHINA_SHIPMENT_COLUMNS = [
  { key: "serialNumber", header: "Serial Number (SN)" },
  { key: "macAddress", header: "MAC Address" },
  { key: "date", header: "Tanggal Kirim" },
  { key: "notes", header: "Catatan" },
];

export function normalizeExcelDate(val) {
  if (!val && val !== 0) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(val).trim();
  if (!str) return "";

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // dd/mm/yyyy or dd-mm-yyyy or d/m/yyyy
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const d = String(parts[0]).padStart(2, "0");
    const m = String(parts[1]).padStart(2, "0");
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }
  // yyyy/mm/dd or yyyy-m-d
  if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const y = parts[0];
    const m = String(parts[1]).padStart(2, "0");
    const d = String(parts[2]).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Excel Serial date number (e.g. 45123)
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
  // Fallback: Date parse
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return str;
}

/**
 * Parse file Excel untuk import PCBA Inventory.
 * Format yang didukung:
 * Kolom: "PCBA Serial No.", "PCBA Type", "Date"
 *
 * @param {File} file - Objek file Excel dari file input
 * @param {Array<string>} existingSerialNos - List serial number yang sudah ada di database
 * @returns {Promise<Object>} - { valid, duplicates, errors, allRows, headerError, totalRows }
 */
export async function parsePcbaFromExcel(file, existingSerialNos = []) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          cellNF: false,
          cellText: false,
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return resolve({
            headerError: "File Excel kosong atau tidak memiliki worksheet.",
            valid: [],
            duplicates: [],
            errors: [],
            allRows: [],
            totalRows: 0,
          });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rawRows || rawRows.length === 0) {
          return resolve({
            headerError: "Worksheet Excel kosong.",
            valid: [],
            duplicates: [],
            errors: [],
            allRows: [],
            totalRows: 0,
          });
        }

        // Cari header row (baris non-kosong pertama)
        let headerRowIndex = 0;
        let headers = [];
        for (let r = 0; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (row && row.some((cell) => String(cell).trim() !== "")) {
            headerRowIndex = r;
            headers = row.map((cell) => String(cell).trim());
            break;
          }
        }

        // Mapping kolom berdasarkan header
        let serialNoCol = -1;
        let pcbaTypeCol = -1;
        let dateCol = -1;

        headers.forEach((h, idx) => {
          const clean = h.toLowerCase().replace(/[\r\n\t_]/g, " ").replace(/\s+/g, " ").trim();

          // PCBA Serial No.
          if (
            clean.includes("pcba serial") ||
            clean === "serial number" ||
            clean === "serial no." ||
            clean === "serial no" ||
            clean === "sn" ||
            clean === "no seri" ||
            clean === "no. seri" ||
            clean === "serial"
          ) {
            if (serialNoCol === -1) serialNoCol = idx;
          }

          // PCBA Type
          if (
            clean.includes("pcba type") ||
            clean.includes("tipe pcba") ||
            clean === "type" ||
            clean === "tipe"
          ) {
            if (pcbaTypeCol === -1) pcbaTypeCol = idx;
          }

          // Date
          if (
            clean === "date" ||
            clean === "received date" ||
            clean === "tanggal" ||
            clean === "tgl" ||
            clean === "tgl terima" ||
            clean === "tanggal terima" ||
            clean === "tgl." ||
            clean === "date received"
          ) {
            if (dateCol === -1) dateCol = idx;
          }
        });

        // Validasi keberadaan 3 header wajib
        const missingHeaders = [];
        if (serialNoCol === -1) missingHeaders.push("PCBA Serial No.");
        if (pcbaTypeCol === -1) missingHeaders.push("PCBA Type");
        if (dateCol === -1) missingHeaders.push("Date");

        if (missingHeaders.length > 0) {
          return resolve({
            headerError: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}. Pastikan file Excel memiliki kolom 'PCBA Serial No.', 'PCBA Type', dan 'Date'.`,
            valid: [],
            duplicates: [],
            errors: [],
            allRows: [],
            totalRows: 0,
            headersFound: headers,
          });
        }

        const existingSet = new Set(
          (existingSerialNos || [])
            .map((s) => String(s).trim().toLowerCase())
            .filter(Boolean)
        );

        const seenInFile = new Set();
        const valid = [];
        const duplicates = [];
        const errors = [];
        const allRows = [];

        let totalDataRows = 0;

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          // Cek jika seluruh baris kosong
          const isBlank = row.every((c) => String(c).trim() === "");
          if (isBlank) continue;

          totalDataRows++;
          const rowNumber = r + 1; // 1-indexed untuk Excel row

          const rawSerial = String(row[serialNoCol] ?? "").trim();
          const rawType = String(row[pcbaTypeCol] ?? "").trim();
          const rawDate = row[dateCol];

          // Validasi data kosong
          if (!rawSerial) {
            const errObj = {
              rowNumber,
              serialNo: "-",
              pcbaType: rawType || "-",
              receivedDate: rawDate ? String(rawDate) : "-",
              status: "error",
              message: "PCBA Serial No. kosong",
            };
            errors.push(errObj);
            allRows.push(errObj);
            continue;
          }

          if (!rawType) {
            const errObj = {
              rowNumber,
              serialNo: rawSerial,
              pcbaType: "-",
              receivedDate: rawDate ? String(rawDate) : "-",
              status: "error",
              message: "PCBA Type kosong",
            };
            errors.push(errObj);
            allRows.push(errObj);
            continue;
          }

          if (rawDate === undefined || rawDate === null || String(rawDate).trim() === "") {
            const errObj = {
              rowNumber,
              serialNo: rawSerial,
              pcbaType: rawType,
              receivedDate: "-",
              status: "error",
              message: "Date kosong",
            };
            errors.push(errObj);
            allRows.push(errObj);
            continue;
          }

          const normDate = normalizeExcelDate(rawDate);
          if (!normDate) {
            const errObj = {
              rowNumber,
              serialNo: rawSerial,
              pcbaType: rawType,
              receivedDate: String(rawDate),
              status: "error",
              message: "Format tanggal tidak valid",
            };
            errors.push(errObj);
            allRows.push(errObj);
            continue;
          }

          const lowerSerial = rawSerial.toLowerCase();

          // Cek duplicate di dalam file
          if (seenInFile.has(lowerSerial)) {
            const dupObj = {
              rowNumber,
              serialNo: rawSerial,
              pcbaType: rawType,
              receivedDate: normDate,
              status: "duplicate",
              message: `Duplikat di dalam file Excel (${rawSerial})`,
            };
            duplicates.push(dupObj);
            allRows.push(dupObj);
            continue;
          }
          seenInFile.add(lowerSerial);

          // Cek duplicate dengan database inventory
          if (existingSet.has(lowerSerial)) {
            const dupObj = {
              rowNumber,
              serialNo: rawSerial,
              pcbaType: rawType,
              receivedDate: normDate,
              status: "duplicate",
              message: `Serial Number '${rawSerial}' sudah ada di PCBA Inventory`,
            };
            duplicates.push(dupObj);
            allRows.push(dupObj);
            continue;
          }

          const validObj = {
            rowNumber,
            serialNo: rawSerial,
            pcbaType: rawType,
            receivedDate: normDate,
            status: "valid",
          };
          valid.push(validObj);
          allRows.push(validObj);
        }

        resolve({
          valid,
          duplicates,
          errors,
          allRows,
          headerError: null,
          totalRows: totalDataRows,
          headersFound: headers,
        });
      } catch (err) {
        reject(new Error(`Gagal memproses file Excel: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file dari disk."));
    };

    reader.readAsArrayBuffer(file);
  });
}

function fmtExcelDate(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Export array PCBA items ke file .xlsx dan trigger download browser.
 * @param {Array} items - Array objek PCBA item atau record pengiriman
 * @param {string} filename - Nama file tanpa ekstensi
 * @param {Array} customColumns - Opsional array kolom custom
 * @param {string} sheetName - Nama sheet Excel
 */
export function exportPcbaToExcel(
  items,
  filename = "PCBA_Inventory_Export",
  customColumns = null,
  sheetName = "PCBA_Data"
) {
  const columns = customColumns || PCBA_COLUMNS;
  const rows = (items || []).map((entry) => {
    const row = {};
    for (const col of columns) {
      let val = entry[col.key];
      if (col.key === "serialNumber" && (val === undefined || val === null)) {
        val = entry.serialNo || "";
      }
      if (col.key === "macAddress" && (val === undefined || val === null)) {
        val = entry.mac || "";
      }
      if (col.key === "receivedDate" || col.key === "date" || col.key === "replacedAt") {
        val = val ? fmtExcelDate(val) : (entry.createdAt ? fmtExcelDate(entry.createdAt) : "-");
      }
      if (val === null || val === undefined) {
        row[col.header] = "";
      } else {
        row[col.header] = String(val);
      }
    }
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  ws["!views"] = [{ state: "frozen", ySplit: 1 }];

  ws["!cols"] = columns.map((c) => ({
    wch: Math.max(c.header.length + 4, 15),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
