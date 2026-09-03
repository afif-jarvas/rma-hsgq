/**
 * server/pdfService.js
 * High-performance, memory-safe PDF generation service for HSGQ RMA, WA, and PCBA modules.
 * Built using pdfmake with standard A4 landscape formatting, repeating headers/footers,
 * status badge colors, and embedded HSGQ branding.
 */

import pdfmake from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize virtual fonts for pdfmake
for (const [name, content] of Object.entries(pdfFonts)) {
  pdfmake.virtualfs.writeFileSync(name, Buffer.from(content, "base64"));
}

pdfmake.setFonts({
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
});

pdfmake.setUrlAccessPolicy(() => true);
pdfmake.setLocalAccessPolicy(() => true);

// Cache base64 logo
let cachedLogoBase64 = null;
function getLogoBase64() {
  if (cachedLogoBase64) return cachedLogoBase64;
  try {
    const logoPath = path.resolve(__dirname, "../public/hsgq-logo.png");
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      cachedLogoBase64 = "data:image/png;base64," + buffer.toString("base64");
    }
  } catch (err) {
    console.warn("Could not read logo image:", err.message);
  }
  return cachedLogoBase64;
}

/**
 * Map status string to color styles
 */
export function getStatusColor(statusRaw) {
  const s = String(statusRaw || "").toLowerCase().trim();

  // Green / Success
  if (["selesai", "completed", "customer received", "good", "ready"].includes(s)) {
    return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  }
  // Blue / In Transit / Active
  if (["shipped", "ready to ship", "on progress", "in progress", "repaired"].includes(s)) {
    return { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" };
  }
  // Purple / Processing
  if (["qc/testing", "qc / testing", "sedang diperbaiki", "under repair", "testing"].includes(s)) {
    return { bg: "#f3e8ff", border: "#d8b4fe", text: "#6b21a8" };
  }
  // Cyan / Received / Checking
  if (["sedang dicek", "checking", "unit diterima", "unit received"].includes(s)) {
    return { bg: "#cffafe", border: "#67e8f9", text: "#0e7490" };
  }
  // Amber / Warning / Escalation
  if (["menunggu", "waiting", "fu tim china", "fu china", "china team follow-up"].includes(s)) {
    return { bg: "#fef3c7", border: "#fde047", text: "#854d0e" };
  }
  // Red / Danger / Defective
  if (["bad", "defective", "fail", "ditolak", "scrap"].includes(s)) {
    return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
  }
  // Default neutral
  return { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155" };
}

/**
 * Format timestamp nicely
 */
function formatGeneratedDate() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const d = pad(now.getDate());
  const m = pad(now.getMonth() + 1);
  const y = now.getFullYear();
  const hr = pad(now.getHours());
  const min = pad(now.getMinutes());
  return d + "/" + m + "/" + y + " " + hr + ":" + min + " WIB";
}

/**
 * Common layout options for A4 Landscape
 */
function buildDocDefinition({ title, metadata, headers, rows, colWidths, fontSize = 7.5 }) {
  const logo = getLogoBase64();
  const generatedTime = formatGeneratedDate();

  // Construct table body: first row is headers
  const tableBody = [
    headers.map((h) => ({
      text: h,
      style: "tableHeader",
    })),
    ...rows,
  ];

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [26, 76, 26, 38], // left, top, right, bottom
    header: function (currentPage, pageCount) {
      return {
        margin: [26, 16, 26, 10],
        columns: [
          // Left: Logo & Company
          {
            width: "auto",
            columns: [
              logo
                ? {
                    image: logo,
                    fit: [60, 32],
                    margin: [0, 0, 10, 0],
                  }
                : { text: "HSGQ", bold: true, fontSize: 16, color: "#2563eb", margin: [0, 4, 10, 0] },
              {
                text: [
                  { text: "PT HSGQ INDONESIA\n", bold: true, fontSize: 10.5, color: "#0f172a" },
                  { text: "Technical Support & RMA Department", fontSize: 7.5, color: "#64748b" },
                ],
                margin: [0, 2, 0, 0],
              },
            ],
          },
          // Right: Report Title & Metadata
          {
            alignment: "right",
            text: [
              { text: title + "\n", bold: true, fontSize: 11, color: "#0f172a" },
              { text: metadata || "", fontSize: 7.5, color: "#64748b" },
            ],
            margin: [0, 2, 0, 0],
          },
        ],
      };
    },
    footer: function (currentPage, pageCount) {
      return {
        margin: [26, 10, 26, 12],
        columns: [
          {
            text: "Dicetak otomatis oleh Sistem HSGQ RMA • " + generatedTime,
            fontSize: 7.5,
            color: "#94a3b8",
          },
          {
            text: "Halaman " + currentPage + " dari " + pageCount,
            alignment: "right",
            fontSize: 8,
            bold: true,
            color: "#475569",
          },
        ],
      };
    },
    content: [
      {
        table: {
          headerRows: 1,
          dontBreakRows: false,
          widths: colWidths,
          body: tableBody,
        },
        layout: {
          hLineWidth: function (i, node) {
            return i === 0 || i === 1 || i === node.table.body.length ? 0.8 : 0.4;
          },
          vLineWidth: function () {
            return 0.4;
          },
          hLineColor: function (i) {
            return i === 0 || i === 1 ? "#334155" : "#e2e8f0";
          },
          vLineColor: function () {
            return "#e2e8f0";
          },
          fillColor: function (rowIndex) {
            if (rowIndex === 0) return "#1e293b"; // Dark header
            return rowIndex % 2 === 0 ? "#f8fafc" : "#ffffff"; // Striped
          },
          paddingLeft: function () {
            return 4;
          },
          paddingRight: function () {
            return 4;
          },
          paddingTop: function () {
            return 4;
          },
          paddingBottom: function () {
            return 4;
          },
        },
      },
    ],
    defaultStyle: {
      font: "Roboto",
      fontSize: fontSize,
      color: "#1e293b",
      lineHeight: 1.15,
    },
    styles: {
      tableHeader: {
        bold: true,
        fontSize: fontSize + 0.5,
        color: "#ffffff",
        alignment: "center",
      },
    },
  };
}

/**
 * 1. RMA PDF Report Generator
 */
export function buildRmaDocDefinition(items, metaString) {
  const headers = [
    "No. Tiket",
    "Tgl Masuk",
    "Status",
    "Teknisi",
    "Customer / PT",
    "Produk",
    "SN / MAC",
    "Kendala / Kerusakan",
    "Tindakan / Hasil",
    "Garansi / QC",
    "Pengiriman",
  ];

  // Total width: 80+48+62+55+80+65+65+110+90+55+65 = 775 pt (well within 790 pt)
  const colWidths = [80, 48, 62, 55, 80, 65, 65, 110, 90, 55, 65];

  const rows = items.map((r) => {
    const stCol = getStatusColor(r.status);
    const customerInfo = [r.customerName, r.company].filter(Boolean).join("\n") || "-";
    const productInfo = [r.product, r.productType].filter(Boolean).join("\n") || "-";
    const hardwareInfo = [r.sn ? "SN: " + r.sn : "", r.mac ? "MAC: " + r.mac : ""].filter(Boolean).join("\n") || "-";
    const problemInfo = [r.initialProblem, r.symptom ? "Gejala: " + r.symptom : ""].filter(Boolean).join("\n") || "-";
    const actionInfo = [r.actionTaken, r.finalResult ? "Hasil: " + r.finalResult : ""].filter(Boolean).join("\n") || "-";
    const warrantyQcInfo = [r.warrantyStatus || "In Warranty", r.qcResult ? "QC: " + r.qcResult : ""].filter(Boolean).join("\n");
    const shippingInfo = [r.shippedDate ? "Tgl: " + r.shippedDate : "", r.shipping || r.pengiriman || ""].filter(Boolean).join("\n") || "-";

    return [
      { text: r.ticketNo || "-", bold: true, fontSize: 7 },
      { text: r.receivedDate || "-", alignment: "center", fontSize: 7 },
      {
        text: r.status || "-",
        bold: true,
        alignment: "center",
        fontSize: 6.5,
        fillColor: stCol.bg,
        color: stCol.text,
      },
      { text: r.engineer || "-", fontSize: 7 },
      { text: customerInfo, fontSize: 7 },
      { text: productInfo, fontSize: 7 },
      { text: hardwareInfo, fontSize: 6.5 },
      { text: problemInfo, fontSize: 7 },
      { text: actionInfo, fontSize: 7 },
      { text: warrantyQcInfo, fontSize: 6.5 },
      { text: shippingInfo, fontSize: 6.5 },
    ];
  });

  return buildDocDefinition({
    title: "LAPORAN LOGBOOK RMA UNIT",
    metadata: metaString,
    headers,
    rows,
    colWidths,
    fontSize: 7,
  });
}

/**
 * 2. WA PDF Report Generator
 */
export function buildWaDocDefinition(items, metaString) {
  const headers = [
    "No. Case",
    "Tgl Case",
    "Status",
    "Teknisi",
    "Customer",
    "Perusahaan",
    "Perangkat",
    "Kendala Awal",
    "Analisa Akhir",
    "Tgl Solved",
  ];

  // Total width: 80+50+65+60+85+80+75+115+130+50 = 790 pt
  const colWidths = [80, 50, 65, 60, 85, 80, 75, 115, 130, 50];

  const rows = items.map((w) => {
    const stCol = getStatusColor(w.status);
    const customerInfo = [w.customerName, w.customerPhone].filter(Boolean).join("\n") || "-";
    const deviceInfo = [w.deviceType, w.sn ? "SN: " + w.sn : "", w.mac ? "MAC: " + w.mac : ""].filter(Boolean).join("\n") || "-";

    return [
      { text: w.caseNo || "-", bold: true, fontSize: 7 },
      { text: w.caseDate || "-", alignment: "center", fontSize: 7 },
      {
        text: w.status || "-",
        bold: true,
        alignment: "center",
        fontSize: 6.5,
        fillColor: stCol.bg,
        color: stCol.text,
      },
      { text: w.engineerTag || "-", fontSize: 7 },
      { text: customerInfo, fontSize: 7 },
      { text: w.company || "-", fontSize: 7 },
      { text: deviceInfo, fontSize: 6.5 },
      { text: w.initialProblem || "-", fontSize: 7 },
      { text: w.finalAnalysis || "-", fontSize: 7 },
      { text: w.solvedDate || "-", alignment: "center", fontSize: 7 },
    ];
  });

  return buildDocDefinition({
    title: "LAPORAN LOGBOOK WHATSAPP SUPPORT",
    metadata: metaString,
    headers,
    rows,
    colWidths,
    fontSize: 7,
  });
}

/**
 * 3. PCBA PDF Report Generator per Sub-Tab
 */
export function buildPcbaDocDefinition(items, subTab, metaString) {
  let title = "LAPORAN PCBA INVENTORY";
  let headers = [];
  let colWidths = [];
  let rows = [];

  if (subTab === "replacements") {
    title = "LAPORAN RIWAYAT REPLACEMENT PCBA";
    headers = [
      "No.",
      "No. Replacement",
      "Tiket RMA",
      "PCBA Lama",
      "Tipe PCBA",
      "PCBA Baru",
      "Kirim China",
      "Diproses Oleh",
      "Tgl Replacement",
      "Catatan",
    ];
    colWidths = [25, 90, 85, 80, 65, 80, 65, 75, 65, 150];

    rows = items.map((r, i) => [
      { text: String(i + 1), alignment: "center", fontSize: 7 },
      { text: r.replacementNo || "-", bold: true, fontSize: 7 },
      { text: r.rmaTicketNo || r.rmaId || "-", fontSize: 7 },
      { text: r.oldSerialNo || r.oldPcbaItemId || "-", fontSize: 7 },
      { text: r.pcbaType || "-", alignment: "center", fontSize: 7 },
      { text: r.newSerialNo || r.newPcbaItemId || "-", fontSize: 7 },
      { text: r.chinaStatus || "-", alignment: "center", fontSize: 7 },
      { text: r.replacedBy || "-", fontSize: 7 },
      { text: r.replacedAt ? String(r.replacedAt).slice(0, 10) : "-", alignment: "center", fontSize: 7 },
      { text: r.notes || "-", fontSize: 7 },
    ]);
  } else if (subTab === "chinaShipments") {
    title = "LAPORAN PCBA KIRIM KE CHINA";
    headers = ["No.", "Serial Number (SN)", "MAC Address", "Tanggal Kirim", "Catatan"];
    colWidths = [30, 150, 150, 90, 360];

    rows = items.map((c, i) => [
      { text: String(i + 1), alignment: "center", fontSize: 7.5 },
      { text: c.serialNumber || "-", bold: true, fontSize: 7.5 },
      { text: c.macAddress || "-", fontSize: 7.5 },
      { text: c.date || "-", alignment: "center", fontSize: 7.5 },
      { text: c.notes || "-", fontSize: 7.5 },
    ]);
  } else if (subTab === "transactions") {
    title = "LAPORAN MUTASI TRANSAKSI PCBA";
    headers = [
      "No.",
      "No. Transaksi",
      "Serial Number",
      "Tipe Mutasi",
      "Ref RMA",
      "Tgl Mutasi",
      "Diproses Oleh",
      "Alasan / Keterangan",
    ];
    colWidths = [25, 95, 95, 70, 85, 70, 85, 255];

    rows = items.map((t, i) => {
      const typeColor =
        t.type === "IN"
          ? { bg: "#dcfce7", text: "#166534" }
          : t.type === "OUT"
          ? { bg: "#fee2e2", text: "#991b1b" }
          : { bg: "#f1f5f9", text: "#334155" };

      return [
        { text: String(i + 1), alignment: "center", fontSize: 7 },
        { text: t.transactionNo || "-", bold: true, fontSize: 7 },
        { text: t.serialNo || t.pcbaItemId || "-", fontSize: 7 },
        {
          text: t.type || "-",
          bold: true,
          alignment: "center",
          fontSize: 6.5,
          fillColor: typeColor.bg,
          color: typeColor.text,
        },
        { text: t.rmaId || "-", fontSize: 7 },
        { text: t.receivedDate || t.createdAt ? String(t.receivedDate || t.createdAt).slice(0, 10) : "-", alignment: "center", fontSize: 7 },
        { text: t.performedBy || t.receivedBy || "-", fontSize: 7 },
        { text: t.reason || "-", fontSize: 7 },
      ];
    });
  } else {
    // Default: stock
    title = "LAPORAN STOK PCBA INVENTORY";
    headers = [
      "No.",
      "Serial Number",
      "Tipe PCBA",
      "Status",
      "Supplier",
      "Lokasi Gudang",
      "Tgl Terima",
      "Penerima",
      "Catatan",
    ];
    colWidths = [25, 95, 65, 65, 90, 85, 65, 75, 215];

    rows = items.map((s, i) => {
      const stCol = getStatusColor(s.status);
      return [
        { text: String(i + 1), alignment: "center", fontSize: 7 },
        { text: s.serialNo || "-", bold: true, fontSize: 7 },
        { text: s.pcbaType || "-", alignment: "center", fontSize: 7 },
        {
          text: s.status || "-",
          bold: true,
          alignment: "center",
          fontSize: 6.5,
          fillColor: stCol.bg,
          color: stCol.text,
        },
        { text: s.supplier || "-", fontSize: 7 },
        { text: s.warehouseLocation || "-", fontSize: 7 },
        { text: s.receivedDate || "-", alignment: "center", fontSize: 7 },
        { text: s.receivedBy || "-", fontSize: 7 },
        { text: s.notes || "-", fontSize: 7 },
      ];
    });
  }

  return buildDocDefinition({
    title,
    metadata: metaString,
    headers,
    rows,
    colWidths,
    fontSize: 7,
  });
}

/**
 * Generate PDF buffer from docDefinition
 */
export async function generatePdfBuffer(docDefinition) {
  const doc = pdfmake.createPdf(docDefinition);
  return await doc.getBuffer();
}
