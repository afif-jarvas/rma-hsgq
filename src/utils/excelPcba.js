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
 * @param {Array} items - Array objek PCBA item
 * @param {string} filename - Nama file tanpa ekstensi
 */
export function exportPcbaToExcel(items, filename = "PCBA_Inventory_Export") {
  const rows = (items || []).map((entry) => {
    const row = {};
    for (const col of PCBA_COLUMNS) {
      let val = entry[col.key];
      if (col.key === "receivedDate") {
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
    header: PCBA_COLUMNS.map((c) => c.header),
  });

  ws["!views"] = [{ state: "frozen", ySplit: 1 }];

  ws["!cols"] = PCBA_COLUMNS.map((c) => ({
    wch: Math.max(c.header.length + 4, 15),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PCBA_Stock");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
