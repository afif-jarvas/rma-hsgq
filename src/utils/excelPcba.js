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
