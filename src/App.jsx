import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  PackageSearch,
  MessageSquare,
  FileClock,
  Settings2,
  Plus,
  X,
  Copy,
  Check,
  Search,
  Wifi,
  ChevronDown,
  Trash2,
  Pencil,
  Eye,
  ZoomIn,
  CalendarRange,
  AlertTriangle,
  Loader2,
  ScanSearch,
  History,
  ShieldCheck,
  Truck,
  ClipboardCheck,
  PackageCheck,
  Info,
  Menu,
  Cloud,
  CloudOff,
  Languages,
  Moon,
  Sun,
  FileDown,
  FileUp,
  Boxes,
  Wrench,
  ArrowLeftRight,
  ClipboardList,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { storeGet, storeSet, isUsingFirebase, uploadRmaPhoto, storage } from "./firebase.js";
import UserCenter from "./components/UserCenter.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";

import hsgqLogo from "./assets/hsgq-logo.png";
import { exportRmaToExcel, parseRmaFromExcel } from "./utils/excelRma.js";

/* ============================================================
   TOKENS — "Fiber patch bay" console
   ============================================================ */
const T = {
  void: "var(--bg)",
  panel: "var(--panel)",
  panel2: "var(--panel-2)",

  line: "var(--line)",

  ink: "var(--text)",
  ink2: "var(--text-2)",
  ink3: "var(--text-3)",

  cyan: "var(--primary)",
  cyanDim: "var(--primary-dim)",

  amber: "var(--amber)",
  amberDim: "var(--amber-dim)",

  red: "var(--red)",
  redDim: "var(--red-dim)",

  green: "var(--green)",
  greenDim: "var(--green-dim)",

  grey: "var(--text-3)",
};
const mono = "'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace";
const sans = "'Inter', -apple-system, 'Segoe UI', sans-serif";

const LANGUAGES = [
  { code: "id", label: "Indonesia" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

const I18N = {
  id: {
    home: "Home",
    rmaLog: "RMA Log Book",
    waLog: "WhatsApp Log",
    unitHistory: "Unit History",
    weeklyReport: "Weekly Report",
    settings: "Pengaturan",
    pcbaInventory: "PCBA Inventory",
    homeTitle: "Home",
    homeSubtitle: "Ringkasan monitoring operasional RMA & WhatsApp support",
    totalDevices: "Total Devices",
    lastLoginTime: "Last Login Time",
    totalRma: "Total RMA",
    rmaOpen: "RMA Open",
    rmaClosed: "RMA Closed",
    rmaOverdue: "RMA Overdue",
    avgTat: "Rata-rata TAT (hari)",
    totalWa: "Total Case WhatsApp",
    engineerLoad: "Beban Kasus per Engineer",
    statusDistribution: "Device Status",
    productCount: "Device Count",
    warrantyChart: "RMA per Warranty",
    cases: "Cases",
    count: "Count",
    firestoreConnected: "Firestore Tersambung",
    localMode: "Mode Lokal",
    language: "Bahasa",
    theme: "Theme",
    openMenu: "Menu",
    loadingData: "Memuat data...",
    firebaseWarning:
      "Firebase belum dikonfigurasi di src/firebase.js — data disimpan sementara di localStorage browser ini saja.",
    cancel: "Batal",
    userCenter: "User Center",
    profile: "Profile",
    editAccountInfo: "Edit informasi akun",
    appearance: "Tampilan",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    logout: "Keluar",
    manageProfile: "Kelola profile",
    nickName: "Nama Panggilan",
    yourName: "Nama kamu",
    email: "Email",
    phone: "Telepon",
    phonePlaceholder: "08xxxxxxxxxx",
    company: "Perusahaan",
    companyPlaceholder: "PT HSGQ Indonesia",
    address: "Alamat",
    addressPlaceholder: "Alamat",
    selectAppearance: "Pilih tampilan aplikasi",
    saveChanges: "Simpan Perubahan",
    saving: "Menyimpan...",
    profileUpdated: "Profile berhasil diperbarui.",
    profileUpdateFailed: "Gagal menyimpan profile.",
    nameRequired: "Nama tidak boleh kosong.",
    // Settings
    settingsEngineer: "Engineer",
    settingsStatusRma: "Status RMA (alur utama)",
    settingsStatusWa: "Status WhatsApp",
    settingsFinalResults: "Hasil Akhir",
    settingsWaitingReasons: "Alasan Menunggu",
    settingsWarrantyStatuses: "Status Warranty",
    settingsQcResults: "Hasil QC",
    settingsShippingMethod: "Metode Pengiriman",
    settingsPcbaTypes: "Tipe PCBA",
    settingsSuppliers: "Supplier",
    settingsWarehouseLocations: "Lokasi Gudang",
    settingsMinStockDefault: "Minimum Stok Default (unit)",
    // PCBA Inventory
    pcbaStock: "Stok",
    pcbaReplacement: "Replacement",
    pcbaRepair: "Repair & QC",
    pcbaTransactions: "Transaksi",
    pcbaReceiveNew: "Terima PCBA Baru",
    pcbaLowStock: "Stok Good di bawah minimum ({min} unit) untuk tipe: {types}",
    pcbaStatusGood: "Good",
    pcbaStatusBad: "Bad",
    pcbaStatusUnderRepair: "Under Repair",
    pcbaStatusReplacement: "Replacement",
    pcbaStatusScrap: "Scrap",
    pcbaSerialNo: "No. Serial PCBA",
    pcbaType: "Tipe PCBA",
    pcbaProduct: "Produk Terkait",
    pcbaSupplier: "Supplier",
    pcbaWarehouseLocation: "Lokasi Gudang",
    pcbaNotes: "Catatan",
    pcbaReplaceOld: "PCBA Lama",
    pcbaReplaceNew: "PCBA Baru",
    pcbaSelectOld: "Pilih PCBA lama",
    pcbaSelectNew: "Pilih PCBA baru (Good)",
    pcbaRepairItem: "PCBA untuk Repair",
    pcbaRepairNotes: "Catatan Repair",
    pcbaQcResult: "Hasil QC",
    pcbaQcNotes: "Catatan QC",
    pcbaSelectItem: "Pilih PCBA",
    pcbaAction: "Aksi",
    pcbaOldSerial: "Serial Lama",
    pcbaNewSerial: "Serial Baru",
    // Unit History
    unitHistorySearchPlaceholder: "Filter SN, MAC, customer, case...",
    unitHistoryHint: "Cari SN/MAC untuk melihat apakah unit ini pernah punya riwayat RMA atau case WhatsApp sebelumnya — berguna sebelum bikin tiket baru untuk unit yang sama.",
    unitHistoryNotFound: 'Tidak ditemukan riwayat untuk "{q}". Unit ini baru pertama kali masuk sistem.',
    unitHistoryPriorWarning: "⚠ Unit ini pernah memiliki {n} riwayat sebelumnya.",
    unitHistoryPartialMatch: "Kecocokan sebagian",
    // Weekly Report
    weeklyReportFromDate: "Dari Tanggal",
    weeklyReportToDate: "Sampai Tanggal",
    weeklyReportLast7Days: "7 Hari Terakhir",
    weeklyReportExportPdf: "Export PDF",
    weeklyReportEmptyRange: "Tidak ada case pada rentang tanggal ini.",
    weeklyReportPopupBlocked: "Popup browser diblokir. Izinkan popup untuk export PDF.",
    weeklyReportSummary: "Ringkasan Kegiatan",
    weeklyReportMonitoring: "Monitoring OLT dan ONU / OLT and ONU Monitoring",
    weeklyReportTroubleshooting: "Troubleshooting Issue Customer / Customer Issue Troubleshooting",
    weeklyReportSupport: "Technical Support HSGQ Jakarta / HSGQ Jakarta Technical Support",
    weeklyReportIssue: "Issue & Troubleshooting / Kendala & Penanganan",
    add: "Tambah",
    addItemPlaceholder: "Tambah item...",
    searchPlaceholder: "Cari...",
    copy: "Salin",
    copied: "Tersalin",
    editAction: "Edit",
    deleteAction: "Hapus",
    waMessageAction: "Pesan WA",
    resetFilter: "Reset Filter",
    colTicket: "Ticket",
    colCase: "Case",
    colStatus: "Status",
    colEngineer: "Engineer",
    colProduct: "Produk",
    colCustomer: "Customer",
    colWarranty: "Warranty",
    colReceived: "Masuk",
    colEta: "ETA",
    colType: "Type",
    colDate: "Tanggal",
    colComm: "Komunikasi",
    rmaPageTitle: "RMA Log Book",
    rmaPageSubtitle:
      "Daftar tiket RMA — Receiving, Diagnosis, Waiting, Warranty, QC, Shipping",
    rmaNewTicket: "Tiket Baru",
    rmaSearchPlaceholder: "Cari tiket, customer, SN, MAC...",
    rmaOverdueOnly: "Overdue saja",
    rmaEmptyList:
      "Belum ada tiket RMA yang cocok dengan filter. Klik 'Tiket Baru' untuk mulai.",
    rmaModalNewTitle: "TIKET RMA BARU",
    rmaModalEditPrefix: "EDIT",
    waPageTitle: "WhatsApp Log Book",
    waPageSubtitle: "Daftar case kendala via WhatsApp + riwayat komunikasi",
    waNewCase: "Case Baru",
    waSearchPlaceholder: "Cari case, customer, SN, MAC...",
    waEmptyList: "Belum ada case WhatsApp. Klik 'Case Baru' untuk mulai.",
    waModalNewTitle: "CASE WHATSAPP BARU",
    waMsgModalTitle: "PESAN KONFIRMASI WHATSAPP",
    unitHistoryPageSubtitle:
      "Quick search riwayat unit berdasarkan SN/MAC lintas RMA & WhatsApp Case",
    reportPageSubtitle: "Ringkasan mingguan otomatis dari RMA + WhatsApp log",
    reportFromDate: "Dari Tanggal",
    reportToDate: "Sampai Tanggal",
    reportLast7Days: "7 Hari Terakhir",
    reportExportPdf: "Export PDF",
    reportEmptyRange: "Tidak ada case pada rentang tanggal ini.",
    reportPopupBlocked:
      "Popup browser diblokir. Izinkan popup untuk export PDF.",
    settingsPageSubtitle: "Kelola daftar Engineer, status, dan opsi lainnya",
    tabOverview: "Overview",
    tabReceiving: "Receiving",
    tabDiagnosis: "Diagnosis",
    tabWaiting: "Waiting",
    tabWarranty: "Warranty",
    tabQcShipping: "QC/Shipping",
    tabTimeline: "Timeline",
    rmaTicketNo: "No. Ticket",
    rmaStatus: "Status",
    rmaEngineer: "Engineer",
    rmaProductType: "Produk / Type",
    rmaSn: "SN",
    rmaMac: "MAC",
    rmaCustomerName: "Nama Customer",
    rmaCompany: "Perusahaan",
    rmaCustomerPhone: "No. HP Customer",
    rmaPriorMatchPrefix: "Unit ini pernah muncul",
    rmaPriorMatchTimesSuffix: "x sebelumnya:",
    rmaPriorMatchSuffix: '. Cek tab "Unit History" untuk detail lengkap.',
    rmaReceivedDate: "Tanggal Masuk",
    rmaReceivedTime: "Jam Diterima",
    rmaReceivedBy: "Diterima Oleh",
    rmaEta: "Estimasi Selesai (ETA)",
    rmaEtaHint: "Default masuk + 3 hari",
    rmaDoNumber: "No. DO / Surat Jalan Customer",
    rmaCourierName: "Nama Pengirim / Kurir",
    rmaUnitQty: "Jumlah Unit",
    rmaPhysicalCondition: "Kondisi Fisik Saat Diterima",
    rmaAccessories: "Kelengkapan / Accessories",
    rmaReceivingNotes: "Catatan Receiving",
    rmaPhotoHint:
      "Foto unit/label SN/MAC belum bisa diunggah di versi web ini — perlu backend penyimpanan file sungguhan (Tahap 3+).",
    rmaInitialProblem: "Kendala Awal",
    rmaSymptom: "Gejala",
    rmaCheckingResult: "Hasil Pengecekan",
    rmaRootCause: "Root Cause",
    rmaActionTaken: "Tindakan",
    rmaFinalResult: "Hasil Akhir",
    rmaWaitingHint:
      'Isi bagian ini hanya jika status RMA sedang "Menunggu" — dipakai untuk menghitung berapa lama tiket tertahan karena pihak tertentu.',
    rmaWaitingReason: "Alasan Menunggu",
    rmaWaitingParty: "Pihak yang Ditunggu",
    rmaWaitingStart: "Mulai Menunggu",
    rmaWaitingEnd: "Selesai Menunggu",
    rmaWaitingNote: "Catatan Waiting",
    rmaWaitingDuration: "Lama menunggu:",
    rmaDays: "hari",
    rmaStillOngoing: "(masih berjalan)",
    rmaWarrantyStatus: "Status Warranty",
    rmaWarrantyDecision: "Keputusan Warranty",
    rmaWarrantyStart: "Warranty Start",
    rmaWarrantyEnd: "Warranty End",
    rmaWarrantyReason: "Alasan Keputusan Warranty",
    rmaQcTesting: "QC / TESTING",
    rmaQcTester: "QC / Tester",
    rmaQcDate: "Tanggal QC",
    rmaQcResult: "Hasil QC",
    rmaQcNotes: "Catatan QC",
    rmaQcFailHint:
      'QC Fail — status sebaiknya dikembalikan ke "Sedang Diperbaiki" di tab Overview.',
    rmaShippingSection: "SHIPPING",
    rmaShippingMethod: "Metode Pengiriman",
    rmaTrackingNo: "No. Resi / Surat Jalan",
    rmaShippedDate: "Tanggal Dikirim (Shipped)",
    rmaCustomerReceivedDate: "Tanggal Diterima Customer",
    rmaClosedDate: "Tanggal Ditutup (Closed)",
    rmaNotes: "Keterangan",
    rmaNoHistory: "Belum ada riwayat.",
    rmaCreatedPrefix: "Dibuat:",
    rmaSaveTicket: "Simpan Tiket",
    waCaseNo: "No. Case",
    waCaseDate: "Tanggal Case",
    waEngineerTag: "Engineer / Tagging",
    waStatus: "Status",
    waCustomerName: "Nama Customer",
    waCompany: "Perusahaan",
    waCustomerPhone: "No. HP Customer",
    waDeviceType: "Type Perangkat",
    waSn: "SN",
    waMac: "MAC",
    waSolvedDate: "Tanggal Solved",
    waInitialProblem: "Kendala Awal",
    waFinalAnalysis: "Analisa Akhir",
    waCommHistory: "Riwayat Komunikasi",
    waAdd: "Tambah",
    waSummaryPlaceholder: "Ringkasan komunikasi",
    waResultPlaceholder: "Hasil",
    waNoCommHistory:
      "Belum ada riwayat komunikasi — berguna kalau 1 case ditangani beberapa engineer.",
    waNotes: "Keterangan",
    waSaveCase: "Simpan Case",
    rmaExportExcel: "Export Excel",
    rmaImportExcel: "Import Excel",
    rmaImportModalTitle: "IMPORT RMA DARI EXCEL",
    rmaImportSelectFile: "Pilih file .xlsx / .xls",
    rmaImportHint: "File harus menggunakan format export dari aplikasi ini. Kolom wajib: Ticket No, Status, Engineer, Product, Customer Name, dan SN atau MAC.",
    rmaImportValidating: "Memvalidasi...",
    rmaImportHeaderError: "Header tidak cocok",
    rmaImportRowErrors: "Baris bermasalah",
    rmaImportDuplicates: "Duplikat (dilewati)",
    rmaImportValidRows: "Baris valid siap diimport",
    rmaImportConfirm: "Import {n} Tiket",
    rmaImportSuccess: "Berhasil mengimport {n} tiket baru.",
    rmaImportRowLabel: "Baris",
  },
  en: {
    home: "Home",
    rmaLog: "RMA Log Book",
    waLog: "WhatsApp Log",
    unitHistory: "Unit History",
    weeklyReport: "Weekly Report",
    settings: "Settings",
    pcbaInventory: "PCBA Inventory",
    homeTitle: "Home",
    homeSubtitle: "Operational monitoring summary for RMA & WhatsApp support",
    totalDevices: "Total Devices",
    lastLoginTime: "Last Login Time",
    totalRma: "Total RMA",
    rmaOpen: "RMA Open",
    rmaClosed: "RMA Closed",
    rmaOverdue: "RMA Overdue",
    avgTat: "Average TAT (days)",
    totalWa: "Total WhatsApp Cases",
    engineerLoad: "Case Load by Engineer",
    statusDistribution: "Device Status",
    productCount: "Device Count",
    warrantyChart: "RMA by Warranty",
    cases: "Cases",
    count: "Count",
    firestoreConnected: "Firestore Connected",
    localMode: "Local Mode",
    language: "Language",
    theme: "Theme",
    openMenu: "Menu",
    loadingData: "Loading data...",
    firebaseWarning:
      "Firebase is not configured yet in src/firebase.js — data is temporarily stored in this browser's localStorage only.",
    cancel: "Cancel",
    userCenter: "User Center",
    profile: "Profile",
    editAccountInfo: "Edit account info",
    appearance: "Appearance",
    light: "Light",
    dark: "Dark",
    system: "System",
    logout: "Logout",
    manageProfile: "Manage profile",
    nickName: "Nick Name",
    yourName: "Your name",
    email: "Email",
    phone: "Phone",
    phonePlaceholder: "08xxxxxxxxxx",
    company: "Company",
    companyPlaceholder: "PT HSGQ Indonesia",
    address: "Address",
    addressPlaceholder: "Address",
    selectAppearance: "Select app appearance",
    saveChanges: "Save Changes",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully.",
    profileUpdateFailed: "Failed to save profile.",
    nameRequired: "Name cannot be empty.",
    add: "Add",
    addItemPlaceholder: "Add item...",
    searchPlaceholder: "Search...",
    copy: "Copy",
    copied: "Copied",
    editAction: "Edit",
    deleteAction: "Delete",
    waMessageAction: "WA Message",
    resetFilter: "Reset Filter",
    colTicket: "Ticket",
    colCase: "Case",
    colStatus: "Status",
    colEngineer: "Engineer",
    colProduct: "Product",
    colCustomer: "Customer",
    colWarranty: "Warranty",
    colReceived: "Received",
    colEta: "ETA",
    colType: "Type",
    colDate: "Date",
    colComm: "Communication",
    rmaPageTitle: "RMA Log Book",
    rmaPageSubtitle:
      "List of RMA tickets — Receiving, Diagnosis, Waiting, Warranty, QC, Shipping",
    rmaNewTicket: "New Ticket",
    rmaSearchPlaceholder: "Search ticket, customer, SN, MAC...",
    rmaOverdueOnly: "Overdue only",
    rmaEmptyList:
      "No RMA tickets match the filter yet. Click 'New Ticket' to start.",
    rmaModalNewTitle: "NEW RMA TICKET",
    rmaModalEditPrefix: "EDIT",
    waPageTitle: "WhatsApp Log Book",
    waPageSubtitle: "List of WhatsApp support cases + communication history",
    waNewCase: "New Case",
    waSearchPlaceholder: "Search case, customer, SN, MAC...",
    waEmptyList: "No WhatsApp cases yet. Click 'New Case' to start.",
    waModalNewTitle: "NEW WHATSAPP CASE",
    waMsgModalTitle: "WHATSAPP CONFIRMATION MESSAGE",
    unitHistoryPageSubtitle:
      "Quick search unit history by SN/MAC across RMA & WhatsApp Cases",
    unitHistorySearchPlaceholder: "Filter SN, MAC, customer, case...",
    unitHistoryHint:
      "Search by SN/MAC to see if this unit already has RMA or WhatsApp case history — useful before creating a new ticket for the same unit.",
    unitHistoryNotFound:
      'No history found for "{q}". This unit is new to the system.',
    unitHistoryPriorWarning:
      "⚠ This unit already has {n} previous history entries.",
    unitHistoryPartialMatch: "Partial match",
    reportPageSubtitle: "Automatic weekly summary from RMA + WhatsApp log",
    reportFromDate: "From Date",
    reportToDate: "To Date",
    reportLast7Days: "Last 7 Days",
    reportExportPdf: "Export PDF",
    reportEmptyRange: "No cases in this date range.",
    reportPopupBlocked: "Browser popup blocked. Allow popups to export PDF.",
    settingsPageSubtitle: "Manage Engineer list, statuses, and other options",
    settingsEngineer: "Engineer",
    settingsStatusRma: "RMA Status (main flow)",
    settingsStatusWa: "WhatsApp Status",
    settingsFinalResults: "Final Result",
    settingsWaitingReasons: "Waiting Reason",
    settingsWarrantyStatuses: "Warranty Status",
    settingsQcResults: "QC Result",
    settingsShippingMethod: "Shipping Method",
    settingsPcbaTypes: "PCBA Type",
    settingsSuppliers: "Supplier",
    settingsWarehouseLocations: "Warehouse Location",
    settingsMinStockDefault: "Default Minimum Stock (unit)",
    // PCBA Inventory
    pcbaStock: "Stock",
    pcbaReplacement: "Replacement",
    pcbaRepair: "Repair & QC",
    pcbaTransactions: "Transactions",
    pcbaReceiveNew: "Receive New PCBA",
    pcbaLowStock: "Good stock below minimum ({min} units) for types: {types}",
    pcbaStatusGood: "Good",
    pcbaStatusBad: "Bad",
    pcbaStatusUnderRepair: "Under Repair",
    pcbaStatusReplacement: "Replacement",
    pcbaStatusScrap: "Scrap",
    pcbaSerialNo: "PCBA Serial No.",
    pcbaType: "PCBA Type",
    pcbaProduct: "Related Product",
    pcbaSupplier: "Supplier",
    pcbaWarehouseLocation: "Warehouse Location",
    pcbaNotes: "Notes",
    pcbaReplaceOld: "Old PCBA",
    pcbaReplaceNew: "New PCBA",
    pcbaSelectOld: "Select old PCBA",
    pcbaSelectNew: "Select new PCBA (Good)",
    pcbaRepairItem: "PCBA for Repair",
    pcbaRepairNotes: "Repair Notes",
    pcbaQcResult: "QC Result",
    pcbaQcNotes: "QC Notes",
    pcbaSelectItem: "Select PCBA",
    pcbaAction: "Action",
    pcbaOldSerial: "Old Serial",
    pcbaNewSerial: "New Serial",
    // Weekly Report
    weeklyReportFromDate: "From Date",
    weeklyReportToDate: "To Date",
    weeklyReportLast7Days: "Last 7 Days",
    weeklyReportExportPdf: "Export PDF",
    weeklyReportEmptyRange: "No cases in this date range.",
    weeklyReportPopupBlocked: "Browser popup blocked. Allow popups to export PDF.",
    weeklyReportSummary: "Activity Summary",
    weeklyReportMonitoring: "OLT and ONU Monitoring / OLT and ONU Monitoring",
    weeklyReportTroubleshooting: "Customer Issue Troubleshooting / Customer Issue Troubleshooting",
    weeklyReportSupport: "HSGQ Jakarta Technical Support / HSGQ Jakarta Technical Support",
    weeklyReportIssue: "Issue & Troubleshooting / Issue & Troubleshooting",
    tabReceiving: "Receiving",
    tabDiagnosis: "Diagnosis",
    tabWaiting: "Waiting",
    tabWarranty: "Warranty",
    tabQcShipping: "QC/Shipping",
    tabTimeline: "Timeline",
    rmaTicketNo: "Ticket No.",
    rmaStatus: "Status",
    rmaEngineer: "Engineer",
    rmaProductType: "Product / Type",
    rmaSn: "SN",
    rmaMac: "MAC",
    rmaCustomerName: "Customer Name",
    rmaCompany: "Company",
    rmaCustomerPhone: "Customer Phone",
    rmaPriorMatchPrefix: "This unit has appeared",
    rmaPriorMatchTimesSuffix: "x before:",
    rmaPriorMatchSuffix: '. Check the "Unit History" tab for full details.',
    rmaReceivedDate: "Received Date",
    rmaReceivedTime: "Time Received",
    rmaReceivedBy: "Received By",
    rmaEta: "Estimated Completion (ETA)",
    rmaEtaHint: "Defaults to received date + 3 days",
    rmaDoNumber: "Customer DO / Delivery Note No.",
    rmaCourierName: "Sender / Courier Name",
    rmaUnitQty: "Unit Quantity",
    rmaPhysicalCondition: "Physical Condition on Receipt",
    rmaAccessories: "Accessories Included",
    rmaReceivingNotes: "Receiving Notes",
    rmaPhotoHint:
      "Unit/SN/MAC label photos can't be uploaded in this web version yet — requires a real file storage backend (Phase 3+).",
    rmaInitialProblem: "Initial Problem",
    rmaSymptom: "Symptom",
    rmaCheckingResult: "Checking Result",
    rmaRootCause: "Root Cause",
    rmaActionTaken: "Action Taken",
    rmaFinalResult: "Final Result",
    rmaWaitingHint:
      'Fill this section only if the RMA status is "Waiting" — used to calculate how long the ticket has been held up by a certain party.',
    rmaWaitingReason: "Waiting Reason",
    rmaWaitingParty: "Party Being Waited On",
    rmaWaitingStart: "Waiting Start",
    rmaWaitingEnd: "Waiting End",
    rmaWaitingNote: "Waiting Notes",
    rmaWaitingDuration: "Waiting duration:",
    rmaDays: "days",
    rmaStillOngoing: "(still ongoing)",
    rmaWarrantyStatus: "Warranty Status",
    rmaWarrantyDecision: "Warranty Decision",
    rmaWarrantyStart: "Warranty Start",
    rmaWarrantyEnd: "Warranty End",
    rmaWarrantyReason: "Warranty Decision Reason",
    rmaQcTesting: "QC / TESTING",
    rmaQcTester: "QC / Tester",
    rmaQcDate: "QC Date",
    rmaQcResult: "QC Result",
    rmaQcNotes: "QC Notes",
    rmaQcFailHint:
      'QC Fail — status should be returned to "Under Repair" on the Overview tab.',
    rmaShippingSection: "SHIPPING",
    rmaShippingMethod: "Shipping Method",
    rmaTrackingNo: "Tracking No. / Delivery Note",
    rmaShippedDate: "Shipped Date",
    rmaCustomerReceivedDate: "Customer Received Date",
    rmaClosedDate: "Closed Date",
    rmaNotes: "Notes",
    rmaNoHistory: "No history yet.",
    rmaCreatedPrefix: "Created:",
    rmaSaveTicket: "Save Ticket",
    waCaseNo: "Case No.",
    waCaseDate: "Case Date",
    waEngineerTag: "Engineer / Tagging",
    waStatus: "Status",
    waCustomerName: "Customer Name",
    waCompany: "Company",
    waCustomerPhone: "Customer Phone",
    waDeviceType: "Device Type",
    waSn: "SN",
    waMac: "MAC",
    waSolvedDate: "Solved Date",
    waInitialProblem: "Initial Problem",
    waFinalAnalysis: "Final Analysis",
    waCommHistory: "Communication History",
    waAdd: "Add",
    waSummaryPlaceholder: "Communication summary",
    waResultPlaceholder: "Result",
    waNoCommHistory:
      "No communication history yet — useful when a case is handled by multiple engineers.",
    waNotes: "Notes",
    waSaveCase: "Save Case",
    rmaExportExcel: "Export Excel",
    rmaImportExcel: "Import Excel",
    rmaImportModalTitle: "IMPORT RMA FROM EXCEL",
    rmaImportSelectFile: "Select .xlsx / .xls file",
    rmaImportHint: "File must use the export format from this application. Required columns: Ticket No, Status, Engineer, Product, Customer Name, and SN or MAC.",
    rmaImportValidating: "Validating...",
    rmaImportHeaderError: "Header mismatch",
    rmaImportRowErrors: "Invalid rows",
    rmaImportDuplicates: "Duplicates (skipped)",
    rmaImportValidRows: "Valid rows ready to import",
    rmaImportConfirm: "Import {n} Tickets",
    rmaImportSuccess: "Successfully imported {n} new tickets.",
    rmaImportRowLabel: "Row",
  },
  zh: {
    home: "主页",
    rmaLog: "RMA 记录",
    waLog: "WhatsApp 记录",
    unitHistory: "设备历史",
    weeklyReport: "周报",
    settings: "设置",
    pcbaInventory: "PCBA 库存",
    homeTitle: "主页",
    homeSubtitle: "RMA 与 WhatsApp 支持运营监控摘要",
    totalDevices: "设备总数",
    lastLoginTime: "上次登录时间",
    totalRma: "RMA 总数",
    rmaOpen: "未结 RMA",
    rmaClosed: "已结 RMA",
    rmaOverdue: "逾期 RMA",
    avgTat: "平均处理天数",
    totalWa: "WhatsApp 案例总数",
    engineerLoad: "工程师案例量",
    statusDistribution: "设备状态",
    productCount: "设备数量",
    warrantyChart: "保修 RMA 分布",
    cases: "案例",
    count: "数量",
    firestoreConnected: "Firestore 已连接",
    localMode: "本地模式",
    language: "语言",
    theme: "主题",
    openMenu: "菜单",
    loadingData: "正在加载数据...",
    firebaseWarning:
      "尚未在 src/firebase.js 中配置 Firebase — 数据暂时仅保存在此浏览器的 localStorage 中。",
    cancel: "取消",
    userCenter: "用户中心",
    profile: "个人资料",
    editAccountInfo: "编辑账户信息",
    appearance: "外观",
    light: "浅色",
    dark: "深色",
    system: "跟随系统",
    logout: "退出登录",
    manageProfile: "管理个人资料",
    nickName: "昵称",
    yourName: "您的姓名",
    email: "邮箱",
    phone: "电话",
    phonePlaceholder: "08xxxxxxxxxx",
    company: "公司",
    companyPlaceholder: "PT HSGQ Indonesia",
    address: "地址",
    addressPlaceholder: "地址",
    selectAppearance: "选择应用外观",
    saveChanges: "保存更改",
    saving: "保存中...",
    profileUpdated: "个人资料已更新。",
    profileUpdateFailed: "保存个人资料失败。",
    nameRequired: "姓名不能为空。",
    add: "添加",
    addItemPlaceholder: "添加项目...",
    searchPlaceholder: "搜索...",
    copy: "复制",
    copied: "已复制",
    editAction: "编辑",
    deleteAction: "删除",
    waMessageAction: "WA 消息",
    resetFilter: "重置筛选",
    colTicket: "工单号",
    colCase: "案例编号",
    colStatus: "状态",
    colEngineer: "工程师",
    colProduct: "产品",
    colCustomer: "客户",
    colWarranty: "保修",
    colReceived: "接收日期",
    colEta: "预计完成",
    colType: "类型",
    colDate: "日期",
    colComm: "沟通记录",
    rmaPageTitle: "RMA 记录",
    rmaPageSubtitle: "RMA 工单列表 — 接收、诊断、等待、保修、QC、发货",
    rmaNewTicket: "新工单",
    rmaSearchPlaceholder: "搜索工单、客户、SN、MAC...",
    rmaOverdueOnly: "仅显示逾期",
    rmaEmptyList: "暂无符合筛选条件的 RMA 工单。点击「新工单」开始。",
    rmaModalNewTitle: "新建 RMA 工单",
    rmaModalEditPrefix: "编辑",
    waPageTitle: "WhatsApp 记录",
    waPageSubtitle: "WhatsApp 支持案例列表 + 沟通记录",
    waNewCase: "新案例",
    waSearchPlaceholder: "搜索案例、客户、SN、MAC...",
    waEmptyList: "暂无 WhatsApp 案例。点击「新案例」开始。",
    waModalNewTitle: "新建 WhatsApp 案例",
    waMsgModalTitle: "WhatsApp 确认消息",
    unitHistoryPageSubtitle:
      "按 SN/MAC 快速搜索 RMA 与 WhatsApp 案例中的设备历史",
    unitHistorySearchPlaceholder: "按 SN、MAC、客户、案例筛选...",
    unitHistoryHint:
      "搜索 SN/MAC 以查看该设备是否曾有 RMA 或 WhatsApp 案例记录 — 在为同一设备建立新工单前很有用。",
    unitHistoryNotFound: '未找到 "{q}" 的历史记录。此设备是首次进入系统。',
    unitHistoryPriorWarning: "⚠ 此设备此前已有 {n} 条历史记录。",
    unitHistoryPartialMatch: "部分匹配",
    reportPageSubtitle: "根据 RMA + WhatsApp 记录自动生成的周报摘要",
    reportFromDate: "起始日期",
    reportToDate: "结束日期",
    reportLast7Days: "最近 7 天",
    reportExportPdf: "导出 PDF",
    reportEmptyRange: "该日期范围内没有案例。",
    reportPopupBlocked: "浏览器弹窗被拦截。请允许弹窗以导出 PDF。",
    settingsPageSubtitle: "管理工程师名单、状态及其他选项",
    settingsEngineer: "工程师",
    settingsStatusRma: "RMA 状态（主流程）",
    settingsStatusWa: "WhatsApp 状态",
    settingsFinalResults: "最终结果",
    settingsWaitingReasons: "等待原因",
    settingsWarrantyStatuses: "保修状态",
    settingsQcResults: "QC 结果",
    settingsShippingMethod: "发货方式",
    settingsPcbaTypes: "PCBA 类型",
    settingsSuppliers: "供应商",
    settingsWarehouseLocations: "仓库位置",
    settingsMinStockDefault: "默认最低库存（件）",
    // PCBA Inventory
    pcbaStock: "库存",
    pcbaReplacement: "替换",
    pcbaRepair: "维修与 QC",
    pcbaTransactions: "交易",
    pcbaReceiveNew: "接收新 PCBA",
    pcbaLowStock: "良品库存低于最小值 ({min} 件) 的类型: {types}",
    pcbaStatusGood: "良品",
    pcbaStatusBad: "不良品",
    pcbaStatusUnderRepair: "维修中",
    pcbaStatusReplacement: "替换",
    pcbaStatusScrap: "报废",
    pcbaSerialNo: "PCBA 序列号",
    pcbaType: "PCBA 类型",
    pcbaProduct: "相关产品",
    pcbaSupplier: "供应商",
    pcbaWarehouseLocation: "仓库位置",
    pcbaNotes: "备注",
    pcbaReplaceOld: "旧 PCBA",
    pcbaReplaceNew: "新 PCBA",
    pcbaSelectOld: "选择旧 PCBA",
    pcbaSelectNew: "选择新 PCBA (良品)",
    pcbaRepairItem: "维修 PCBA",
    pcbaRepairNotes: "维修备注",
    pcbaQcResult: "QC 结果",
    pcbaQcNotes: "QC 备注",
    pcbaSelectItem: "选择 PCBA",
    pcbaAction: "操作",
    pcbaOldSerial: "旧序列号",
    pcbaNewSerial: "新序列号",
    // Weekly Report
    weeklyReportFromDate: "起始日期",
    weeklyReportToDate: "结束日期",
    weeklyReportLast7Days: "最近 7 天",
    weeklyReportExportPdf: "导出 PDF",
    weeklyReportEmptyRange: "该日期范围内没有案例。",
    weeklyReportPopupBlocked: "浏览器弹窗被拦截。请允许弹窗以导出 PDF。",
    weeklyReportSummary: "活动摘要",
    weeklyReportMonitoring: "OLT 和 ONU 监控 / OLT and ONU Monitoring",
    weeklyReportTroubleshooting: "客户故障排查 / Customer Issue Troubleshooting",
    weeklyReportSupport: "HSGQ Jakarta 技术支持 / HSGQ Jakarta Technical Support",
    weeklyReportIssue: "问题与排查 / Issue & Troubleshooting",
    tabReceiving: "接收",
    tabDiagnosis: "诊断",
    tabWaiting: "等待",
    tabWarranty: "保修",
    tabQcShipping: "QC/发货",
    tabTimeline: "时间线",
    rmaTicketNo: "工单号",
    rmaStatus: "状态",
    rmaEngineer: "工程师",
    rmaProductType: "产品 / 型号",
    rmaSn: "SN",
    rmaMac: "MAC",
    rmaCustomerName: "客户姓名",
    rmaCompany: "公司",
    rmaCustomerPhone: "客户电话",
    rmaPriorMatchPrefix: "此设备此前出现过",
    rmaPriorMatchTimesSuffix: "次：",
    rmaPriorMatchSuffix: '。请查看"设备历史"标签页获取完整详情。',
    rmaReceivedDate: "接收日期",
    rmaReceivedTime: "接收时间",
    rmaReceivedBy: "接收人",
    rmaEta: "预计完成时间（ETA）",
    rmaEtaHint: "默认接收日期 + 3 天",
    rmaDoNumber: "客户送货单号",
    rmaCourierName: "寄件人 / 快递名称",
    rmaUnitQty: "设备数量",
    rmaPhysicalCondition: "接收时的外观状况",
    rmaAccessories: "配件 / Accessories",
    rmaReceivingNotes: "接收备注",
    rmaPhotoHint:
      "此网页版本尚不支持上传设备/SN/MAC 标签照片 — 需要真实的文件存储后端（第 3 阶段以后）。",
    rmaInitialProblem: "初始故障描述",
    rmaSymptom: "现象",
    rmaCheckingResult: "检测结果",
    rmaRootCause: "根本原因",
    rmaActionTaken: "处理措施",
    rmaFinalResult: "最终结果",
    rmaWaitingHint:
      "仅当 RMA 状态为「等待中」时才需填写此部分 — 用于计算工单因某一方而延迟的时长。",
    rmaWaitingReason: "等待原因",
    rmaWaitingParty: "等待对象",
    rmaWaitingStart: "开始等待",
    rmaWaitingEnd: "结束等待",
    rmaWaitingNote: "等待备注",
    rmaWaitingDuration: "等待时长：",
    rmaDays: "天",
    rmaStillOngoing: "（仍在进行中）",
    rmaWarrantyStatus: "保修状态",
    rmaWarrantyDecision: "保修决定",
    rmaWarrantyStart: "保修开始",
    rmaWarrantyEnd: "保修结束",
    rmaWarrantyReason: "保修决定原因",
    rmaQcTesting: "QC / 测试",
    rmaQcTester: "QC / 测试员",
    rmaQcDate: "QC 日期",
    rmaQcResult: "QC 结果",
    rmaQcNotes: "QC 备注",
    rmaQcFailHint: "QC 未通过 — 建议在概览标签页将状态改回「维修中」。",
    rmaShippingSection: "发货",
    rmaShippingMethod: "发货方式",
    rmaTrackingNo: "运单号 / 送货单号",
    rmaShippedDate: "发货日期",
    rmaCustomerReceivedDate: "客户收货日期",
    rmaClosedDate: "关闭日期",
    rmaNotes: "备注",
    rmaNoHistory: "暂无历史记录。",
    rmaCreatedPrefix: "创建：",
    rmaSaveTicket: "保存工单",
    waCaseNo: "案例编号",
    waCaseDate: "案例日期",
    waEngineerTag: "工程师 / 标签",
    waStatus: "状态",
    waCustomerName: "客户姓名",
    waCompany: "公司",
    waCustomerPhone: "客户电话",
    waDeviceType: "设备型号",
    waSn: "SN",
    waMac: "MAC",
    waSolvedDate: "解决日期",
    waInitialProblem: "初始故障描述",
    waFinalAnalysis: "最终分析",
    waCommHistory: "沟通记录",
    waAdd: "添加",
    waSummaryPlaceholder: "沟通摘要",
    waResultPlaceholder: "结果",
    waNoCommHistory: "暂无沟通记录 — 适用于一个案例由多位工程师处理的情况。",
    waNotes: "备注",
    waSaveCase: "保存案例",
    rmaExportExcel: "导出 Excel",
    rmaImportExcel: "导入 Excel",
    rmaImportModalTitle: "从 EXCEL 导入 RMA",
    rmaImportSelectFile: "选择 .xlsx / .xls 文件",
    rmaImportHint: "文件必须使用本应用的导出格式。必填列：Ticket No、Status、Engineer、Product、Customer Name，以及 SN 或 MAC。",
    rmaImportValidating: "验证中...",
    rmaImportHeaderError: "列标题不匹配",
    rmaImportRowErrors: "无效行",
    rmaImportDuplicates: "重复项（已跳过）",
    rmaImportValidRows: "有效行，准备导入",
    rmaImportConfirm: "导入 {n} 张工单",
    rmaImportSuccess: "成功导入 {n} 张新工单。",
    rmaImportRowLabel: "行",
  },
};

function getStoredLanguage() {
  if (typeof window === "undefined") return "id";
  const saved = localStorage.getItem("hsgq_language");
  return I18N[saved] ? saved : "id";
}

/* ============================================================
   STATUS / OVERDUE HELPERS
   ============================================================ */
const RMA_DONE_STATUSES = ["Closed", "Customer Received"];
function ledColor(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("closed") || s.includes("received") || s.includes("selesai"))
    return T.green;
  if (
    s.includes("diterima") ||
    s.includes("menunggu") ||
    s.includes("pending") ||
    s.includes("belum")
  )
    return T.grey;
  if (
    s.includes("shipped") ||
    s.includes("ready") ||
    s.includes("qc") ||
    s.includes("dicek") ||
    s.includes("diperbaiki") ||
    s.includes("progress")
  )
    return T.amber;
  if (s.includes("reject") || s.includes("batal")) return T.red;
  return T.cyan;
}
function StatusLed({ status, size = 8 }) {
  const c = ledColor(status);

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: c,
          boxShadow: `0 0 0 3px ${c}22`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12.5, color: T.ink2, fontFamily: sans }}>
        {status || "—"}
      </span>
    </span>
  );
}
function isOverdue(rma) {
  if (!rma.eta || RMA_DONE_STATUSES.includes(rma.status)) return false;
  return rma.eta < todayISO();
}
function OverdueBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: T.redDim,
        color: T.red,
        fontSize: 10.5,
        fontWeight: 700,
        padding: "2px 7px",
        borderRadius: 999,
        letterSpacing: 0.3,
      }}
    >
      <AlertTriangle size={10} /> OVERDUE
    </span>
  );
}

/* ============================================================
   STORAGE
   ============================================================ */
const KEYS = {
  rma: "hsgq_rma_entries_v2",
  wa: "hsgq_wa_entries_v2",
  master: "hsgq_master_data_v2",
  pcba: "hsgq_pcba_data_v1",
};
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
    "Closed",
  ],
  statusWA: ["On Progress", "Selesai", "FU Tim China", "Belum Ditag"],
  finalResults: [
    "Normal",
    "Repair",
    "Replace PCBA",
    "Replace Unit",
    "Tidak Dapat Diperbaiki",
    "Rejected",
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
  minStockDefault: 5,
};

const PCBA_DEFAULT = {
  items: [],
  transactions: [],
  replacements: [],
  repairs: [],
};
const PCBA_STATUSES = [
  "Good",
  "Bad",
  "Under Repair",
  "Repaired",
  "Used for Replacement",
  "Scrapped",
];
function pcbaLed(status) {
  if (status === "Good") return T.green;
  if (status === "Bad" || status === "Scrapped") return T.red;
  if (status === "Under Repair" || status === "Repaired") return T.amber;
  if (status === "Used for Replacement") return T.grey;
  return T.cyan;
}
// storeGet & storeSet sekarang diimpor dari ./firebase.js (Firestore / localStorage fallback)

/* ============================================================
   UTILS
   ============================================================ */
const pad2 = (n) => String(n).padStart(2, "0");
const fmtSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateNDaysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const addDaysISO = (iso, n) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
function genTicket(prefix, existingField) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const todays = existingField.filter((v) => (v || "").includes(stamp));
  return `${prefix}-${stamp}-${String(todays.length + 1).padStart(3, "0")}`;
}
function daysBetween(a, b) {
  if (!a || !b) return "";
  const d1 = new Date(a),
    d2 = new Date(b);
  if (isNaN(d1) || isNaN(d2)) return "";
  return Math.max(0, Math.round((d2 - d1) / 86400000));
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ============================================================
   WA MESSAGE TEMPLATES
   ============================================================ */
function rmaWaMessage(e) {
  return `Halo ${e.customerName || "-"},

Update RMA perangkat ${e.type || "-"} dengan nomor ticket ${e.ticketNo || "-"}.
SN: ${e.sn || "-"} | MAC: ${e.mac || "-"}
Kendala: ${e.initialProblem || "-"}
Status: ${e.status || "-"}
Root cause: ${e.rootCause || "-"}
Tindakan: ${e.actionTaken || "-"}
Hasil akhir: ${e.finalResult || "-"}
Warranty: ${e.warrantyStatus || "-"}
Resi/Surat Jalan: ${e.trackingNo || "-"}
Terima kasih.

--- English ---
Dear ${e.customerName || "-"},

RMA update for device ${e.type || "-"}, ticket ${e.ticketNo || "-"}.
SN: ${e.sn || "-"} | MAC: ${e.mac || "-"}
Issue: ${e.initialProblem || "-"}
Status: ${e.status || "-"}
Root cause: ${e.rootCause || "-"}
Action taken: ${e.actionTaken || "-"}
Final result: ${e.finalResult || "-"}
Warranty: ${e.warrantyStatus || "-"}
Tracking/DO No: ${e.trackingNo || "-"}
Thank you.`;
}
function waWaMessage(e) {
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
   FIELD PRIMITIVES
   ============================================================ */
function Field({ label, children, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          letterSpacing: 0.4,
          color: T.ink3,
          textTransform: "uppercase",
          fontFamily: sans,
        }}
      >
        {label}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: T.ink3 }}>{hint}</span>}
    </label>
  );
}
const inputBase = {
  background: T.panel2,
  border: `1px solid ${T.line}`,
  borderRadius: 6,
  color: T.ink,
  padding: "8px 10px",
  fontSize: 13.5,
  fontFamily: sans,
  outline: "none",
};
function TextInput(props) {
  return <input {...props} style={{ ...inputBase, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        ...inputBase,
        resize: "vertical",
        minHeight: 56,
        ...(props.style || {}),
      }}
    />
  );
}
function Select({ options, ...props }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        {...props}
        style={{
          ...inputBase,
          appearance: "none",
          width: "100%",
          paddingRight: 28,
          ...(props.style || {}),
        }}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        color={T.ink3}
        style={{
          position: "absolute",
          right: 8,
          top: 10,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
function Btn({ children, variant = "ghost", ...props }) {
  const styles = {
    solid: {
      background: T.cyan,
      color: "#FFFFFF",
      border: `1px solid ${T.cyan}`,
    },
    ghost: {
      background: T.panel2,
      color: T.ink2,
      border: `1px solid ${T.line}`,
    },
    danger: {
      background: T.panel2,
      color: T.red,
      border: `1px solid ${T.red}`,
    },
    tab: { background: "transparent", color: T.ink3, border: "none" },
    tabActive: { background: T.cyanDim, color: T.cyan, border: "none" },
  };
  return (
    <button
      {...props}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontFamily: sans,
        fontSize: 13,
        fontWeight: 600,
        padding: "8px 14px",
        borderRadius: 6,
        transition: "opacity .15s",
        ...styles[variant],
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}
function Modal({ title, onClose, children, width = 720 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4,10,11,0.7)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 50,
        padding: "40px 16px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 14,
          width: "100%",
          maxWidth: width,
          boxShadow: "0 20px 45px rgba(16,24,40,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: `1px solid ${T.line}`,
          }}
        >
          <span
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 14,
              color: T.ink,
              letterSpacing: 0.2,
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.ink3,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}
function CopyButton({ text, t }) {
  const tt = t || I18N.id;
  const [copied, setCopied] = useState(false);
  return (
    <Btn
      variant={copied ? "solid" : "ghost"}
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
      {copied ? tt.copied : tt.copy}
    </Btn>
  );
}
function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: `1px solid ${T.line}`,
        borderRadius: 6,
        padding: 6,
        cursor: "pointer",
        color: danger ? T.red : T.ink3,
        display: "flex",
      }}
    >
      <Icon size={13} />
    </button>
  );
}
function SectionHeader({ title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontFamily: sans, color: T.ink }}>
          {title}
        </h2>
        <div style={{ fontSize: 12.5, color: T.ink3, marginTop: 2 }}>
          {subtitle}
        </div>
      </div>
      {action}
    </div>
  );
}
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", maxWidth: 320 }}>
      <Search
        size={14}
        color={T.ink3}
        style={{ position: "absolute", left: 10, top: 10 }}
      />
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Cari..."}
        style={{ paddingLeft: 30, width: "100%" }}
      />
    </div>
  );
}
function InlineHint({ children, tone = "info" }) {
  const colors = { info: [T.cyanDim, T.cyan], warn: [T.amberDim, T.amber] };
  const [bg, fg] = colors[tone];
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "flex-start",
        background: bg,
        color: fg,
        fontSize: 11.5,
        padding: "6px 9px",
        borderRadius: 6,
      }}
    >
      <Info size={12} style={{ marginTop: 1, flexShrink: 0 }} />{" "}
      <span>{children}</span>
    </div>
  );
}

/* ============================================================
   PHOTO PICKER CARD
   ============================================================ */
/**
 * PhotoPickerCard — real HTML file input with local thumbnail previews.
 * previewUrl is a temporary browser object URL and is NEVER persisted
 * to Firestore or localStorage. It is revoked when the item is removed.
 */
/**
 * fileRegistry stores File objects keyed by photo id.
 * This is module-level so PhotoPickerCard and the upload logic can share it.
 * File objects are NEVER persisted — they only live in memory during the session.
 */
const fileRegistry = new Map();

function PhotoPickerCard({ title, photos, onAdd, onRemove, addLabel, capture }) {
  const inputRef = useRef(null);
  const MAX = 3;
  const storageAvailable = !!storage;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX - photos.length;
    files.slice(0, remaining).forEach((file) => {
      const id = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
      const previewUrl = URL.createObjectURL(file);
      // Store File object in registry so upload can access it later
      fileRegistry.set(id, file);
      onAdd({
        id,
        name: file.name,
        size: file.size,
        previewUrl, // temporary — NOT stored in Firestore/localStorage
        uploadedAt: new Date().toISOString(),
      });
    });
    e.target.value = "";
  };

  return (
    <div className="attachment-section-card">
      <div style={{ fontWeight: 600, fontSize: 13 }}>
        {title} (Maks. {MAX})
      </div>

      {!storageAvailable && (
        <div style={{ fontSize: 11.5, color: "var(--amber)", padding: "6px 8px", background: "var(--amber-dim)", borderRadius: 6, marginBottom: 4 }}>
          ⚠ Fitur foto sementara tidak tersedia (Firebase Storage belum aktif). Foto hanya preview lokal, tidak akan tersimpan.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {photos.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--ink3)", fontStyle: "italic" }}>
            Belum ada foto yang dipilih.
          </div>
        )}
        {photos.map((item, idx) => (
          <div key={item.id || idx} className="attachment-preview-item">
            {item.previewUrl || item.url ? (
              <img
                src={item.previewUrl || item.url}
                alt={item.name}
                className="attachment-thumb"
              />
            ) : (
              <div className="attachment-thumb-placeholder">📷</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name}
              </div>
              {item.size != null && (
                <div style={{ fontSize: 11, color: "var(--ink3)" }}>
                  {fmtSize(item.size)}
                </div>
              )}
              <div style={{ fontSize: 10, color: "var(--ink3)", marginTop: 2 }}>
                {item.url
                  ? "✓ Tersimpan di cloud."
                  : "Preview lokal. Akan diupload saat tiket disimpan."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                fileRegistry.delete(item.id);
                onRemove(idx);
              }}
              title="Hapus foto"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink3)",
                fontSize: 16,
                padding: "4px 6px",
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Hidden real file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        multiple={MAX - photos.length > 1}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {photos.length < MAX && (
        <button
          type="button"
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            background: "none",
            border: "1px dashed var(--line)",
            borderRadius: 6,
            padding: "7px 12px",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--primary)",
            textAlign: "left",
            fontWeight: 500,
          }}
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

/* ============================================================
   RMA DETAIL PREVIEW MODAL (Read-only)
   ============================================================ */
function PhotoLightbox({ photo, category, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, maxWidth: "90vw", maxHeight: "90vh" }}
      >
        <img
          src={photo.url || photo.previewUrl}
          alt={photo.name}
          style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 10, objectFit: "contain", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        />
        <div style={{ color: "#fff", fontSize: 13, textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>{photo.name}</div>
          <div style={{ opacity: 0.6, fontSize: 11, marginTop: 2 }}>{category}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8,
            color: "#fff",
            padding: "6px 18px",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          ✕ Tutup
        </button>
      </div>
    </div>
  );
}

function RmaDetailModal({ entry, onClose }) {
  const [lightbox, setLightbox] = useState(null); // { photo, category }

  const unitPhotos = Array.isArray(entry.unitPhotos) ? entry.unitPhotos : [];
  const labelPhotos = Array.isArray(entry.labelPhotos) ? entry.labelPhotos : [];

  const Row = ({ label, value }) => (
    <div style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: `1px solid var(--line)`, alignItems: "flex-start" }}>
      <div style={{ minWidth: 160, fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: "var(--text)", flex: 1, wordBreak: "break-word" }}>{value || <span style={{ color: "var(--text-3)", fontStyle: "italic" }}>—</span>}</div>
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div style={{ marginBottom: 20 }}>
      <div className="form-section-title" style={{ marginBottom: 10 }}>
        {Icon && <Icon size={14} />} {title}
      </div>
      {children}
    </div>
  );

  const PhotoGrid = ({ photos, category }) => (
    <div className="rma-detail-photo-grid">
      {photos.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic", gridColumn: "1/-1" }}>Tidak ada foto.</div>
      ) : (
        photos.map((p, i) => (
          <div
            key={p.id || i}
            className="rma-detail-photo-thumb"
            onClick={() => (p.url || p.previewUrl) && setLightbox({ photo: p, category })}
            title={p.name}
          >
            {p.url || p.previewUrl ? (
              <img src={p.url || p.previewUrl} alt={p.name} />
            ) : (
              <div className="placeholder">
                <span style={{ fontSize: 22 }}>📷</span>
                <span>Foto tidak tersedia</span>
              </div>
            )}
            {(p.url || p.previewUrl) && (
              <div className="rma-detail-photo-overlay"><ZoomIn size={16} /></div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <Modal title={`DETAIL RMA — ${entry.ticketNo}`} onClose={onClose} width={860}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

          <Section title="Informasi Tiket" icon={PackageSearch}>
            <Row label="No. Tiket" value={entry.ticketNo} />
            <Row label="Status" value={entry.status} />
            <Row label="Engineer" value={entry.engineer} />
            <Row label="Produk" value={entry.product} />
            <Row label="Customer" value={entry.customerName} />
            <Row label="No. HP Customer" value={entry.customerPhone} />
            <Row label="Garansi" value={entry.warrantyStatus} />
            <Row label="SN" value={entry.sn} />
            <Row label="MAC" value={entry.mac} />
            <Row label="Keluhan Customer" value={entry.customerComplaint} />
          </Section>

          <Section title="Receiving" icon={Truck}>
            <Row label="Tanggal Masuk" value={fmtDate(entry.receivedDate)} />
            <Row label="Jam Diterima" value={entry.receivedTime} />
            <Row label="Diterima Oleh" value={entry.receivedBy} />
            <Row label="ETA" value={fmtDate(entry.eta)} />
            <Row label="No. DO / Surat Jalan" value={entry.doNumber} />
            <Row label="Pengirim / Kurir" value={entry.courierName} />
            <Row label="Jumlah Unit" value={entry.unitQty} />
          </Section>

          <Section title="Kondisi Fisik" icon={AlertTriangle}>
            <Row label="Kondisi Fisik Saat Diterima" value={entry.physicalCondition} />
            <Row label="Kelengkapan / Accessories" value={entry.accessories} />
            <Row label="Catatan Kerusakan Fisik" value={entry.physicalDamageNotes} />
            <Row label="Catatan Receiving" value={entry.receivingNotes} />
          </Section>

          {unitPhotos.length > 0 && (
            <Section title="Foto Unit Perangkat" icon={ScanSearch}>
              <PhotoGrid photos={unitPhotos} category="Foto Unit" />
            </Section>
          )}

          {labelPhotos.length > 0 && (
            <Section title="Foto Label SN / MAC" icon={ScanSearch}>
              <PhotoGrid photos={labelPhotos} category="Foto Label SN/MAC" />
            </Section>
          )}

        </div>
      </Modal>
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          category={lightbox.category}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

/* ============================================================
   RMA FORM (tabbed: Overview / Receiving / Diagnosis / Waiting / Warranty / QC / Shipping / Timeline)
   ============================================================ */
const RMA_TABS = [
  { id: "overview", label: "Overview", icon: PackageSearch },
  { id: "receiving", label: "Receiving", icon: Truck },
  { id: "diagnosis", label: "Diagnosis", icon: ScanSearch },
  { id: "waiting", label: "Waiting", icon: History },
  { id: "warranty", label: "Warranty", icon: ShieldCheck },
  { id: "qc", label: "QC/Shipping", icon: PackageCheck },
];

function RmaForm({
  initial,
  master,
  existingTicketNos,
  unitHistoryLookup,
  onSave,
  onClose,
  t,
}) {
  const { user, profile } = useAuth();
  const currentUserDisplayName =
    profile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "";

  const isEdit = !!initial;
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const TAB_LABELS = {
    overview: t.tabOverview,
    receiving: t.tabReceiving,
    diagnosis: t.tabDiagnosis,
    waiting: t.tabWaiting,
    warranty: t.tabWarranty,
    qc: t.tabQcShipping,
  };
  const [f, setF] = useState(() => {
    if (initial) {
      return {
        ...initial,
        physicalDamageNotes: initial.physicalDamageNotes || "",
        unitPhotos: Array.isArray(initial.unitPhotos) ? initial.unitPhotos : [],
        labelPhotos: Array.isArray(initial.labelPhotos) ? initial.labelPhotos : [],
      };
    }
    return {
      id: uid(),
      ticketNo: genTicket("RMA", existingTicketNos),
      status: master.statusRMA[0] || "",
      engineer: "",
      product: "",
      sn: "",
      mac: "",
      customerName: "",
      company: "",
      customerPhone: "",
      receivedDate: todayISO(),
      receivedTime: new Date().toTimeString().slice(0, 5),
      receivedBy: currentUserDisplayName,
      doNumber: "",
      courierName: "",
      physicalCondition: "",
      physicalDamageNotes: "",
      accessories: "",
      unitQty: 1,
      receivingNotes: "",
      unitPhotos: [],
      labelPhotos: [],
      eta: addDaysISO(todayISO(), 3),
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
      statusHistory: [
        {
          from: null,
          to: master.statusRMA[0] || "",
          changedBy: currentUserDisplayName || "",
          changedAt: new Date().toISOString(),
          note: t.rmaTicketCreatedNote || "Tiket dibuat",
        },
      ],
    };
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const priorMatches = useMemo(() => {
    if (!f.sn && !f.mac) return [];
    return unitHistoryLookup(f.sn, f.mac).filter((h) => h.id !== f.id);
  }, [f.sn, f.mac, unitHistoryLookup, f.id]);

  const handleSave = async () => {
    setFormError("");

    // Required field validation
    const required = {
      ticketNo: t.rmaTicketNo,
      status: t.rmaStatus,
      engineer: t.rmaEngineer,
      product: t.rmaProductType,
      customerName: t.rmaCustomerName,
    };
    for (const [key, label] of Object.entries(required)) {
      if (!f[key] || !f[key].trim()) {
        setFormError(`${label} wajib diisi.`);
        return;
      }
    }
    if (!f.sn && !f.mac) {
      setFormError("SN atau MAC minimal salah satu wajib diisi.");
      return;
    }

    let statusHistory = f.statusHistory || [];
    if (isEdit && initial.status !== f.status) {
      statusHistory = [
        ...statusHistory,
        {
          from: initial.status,
          to: f.status,
          changedBy: f.engineer,
          changedAt: new Date().toISOString(),
          note: "",
        },
      ];
    }
    let eta = f.eta;
    if (!eta && f.receivedDate) eta = addDaysISO(f.receivedDate, 3);

    // Strip temporary previewUrls before persisting — previewUrls are
    // browser object URLs only valid for the current session.
    // Do NOT persist them to Firestore or localStorage.
    const stripPreview = (photos) =>
      (photos || []).map(({ previewUrl: _p, ...rest }) => rest);

    setSaving(true);
    const result = await onSave({
      ...f,
      eta,
      statusHistory,
      unitPhotos: stripPreview(f.unitPhotos),
      labelPhotos: stripPreview(f.labelPhotos),
    });
    setSaving(false);
    if (!result?.ok) {
      setFormError("Gagal menyimpan tiket. Coba lagi.");
    }
  };

  const Tabs = (
    <div
      style={{
        display: "flex",
        gap: 2,
        borderBottom: `1px solid ${T.line}`,
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      {RMA_TABS.map((td) => {
        const Icon = td.icon;
        const active = tab === td.id;
        return (
          <button
            key={td.id}
            onClick={() => setTab(td.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: "none",
              border: "none",
              borderBottom: active
                ? `2px solid ${T.cyan}`
                : "2px solid transparent",
              color: active ? T.cyan : T.ink3,
              cursor: "pointer",
              fontFamily: sans,
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: -1,
            }}
          >
            <Icon size={13} /> {TAB_LABELS[td.id]}
          </button>
        );
      })}
      {isEdit && (
        <button
          onClick={() => setTab("timeline")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: "none",
            border: "none",
            borderBottom:
              tab === "timeline"
                ? `2px solid ${T.cyan}`
                : "2px solid transparent",
            color: tab === "timeline" ? T.cyan : T.ink3,
            cursor: "pointer",
            fontFamily: sans,
            fontSize: 12.5,
            fontWeight: 600,
            marginBottom: -1,
          }}
        >
          <History size={13} /> {t.tabTimeline}
        </button>
      )}
    </div>
  );

  return (
    <div>
      {Tabs}
      {formError && (
        <div
          style={{
            background: T.redDim,
            color: T.red,
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12.5,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={14} /> {formError}
        </div>
      )}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="No. Ticket">
              <TextInput
                value={f.ticketNo}
                onChange={set("ticketNo")}
                style={{ fontFamily: mono }}
              />
            </Field>
            <Field label="Status">
              <Select
                options={master.statusRMA}
                value={f.status}
                onChange={set("status")}
              />
            </Field>
            <Field label="Engineer">
              <Select
                options={master.engineers}
                value={f.engineer}
                onChange={set("engineer")}
              />
            </Field>
            <Field label="Produk / Type">
              <TextInput
                value={f.product}
                onChange={set("product")}
                placeholder="cth. G04ID"
              />
            </Field>
            <Field label="SN">
              <TextInput
                value={f.sn}
                onChange={set("sn")}
                style={{ fontFamily: mono }}
              />
            </Field>
            <Field label="MAC">
              <TextInput
                value={f.mac}
                onChange={set("mac")}
                style={{ fontFamily: mono }}
              />
            </Field>
            <Field label="Nama Customer">
              <TextInput
                value={f.customerName}
                onChange={set("customerName")}
              />
            </Field>
            <Field label="Perusahaan">
              <TextInput value={f.company} onChange={set("company")} />
            </Field>
            <Field label="No. HP Customer">
              <TextInput
                value={f.customerPhone}
                onChange={set("customerPhone")}
              />
            </Field>
          </div>
          {priorMatches.length > 0 && (
            <InlineHint tone="warn">
              Unit ini pernah muncul {priorMatches.length}x sebelumnya:{" "}
              {priorMatches
                .slice(0, 3)
                .map((h) => `${h.ref} (${h.status})`)
                .join(", ")}
              {priorMatches.length > 3 ? ", ..." : ""}. Cek tab "Unit History"
              untuk detail lengkap.
            </InlineHint>
          )}
        </div>
      )}

      {tab === "receiving" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Section 1: Receiving Information */}
          <div className="form-section-title">
            <ClipboardList size={15} /> Informasi Receiving
          </div>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Tanggal Masuk">
              <TextInput
                type="date"
                value={f.receivedDate}
                onChange={set("receivedDate")}
              />
            </Field>
            <Field label="Jam Diterima">
              <TextInput
                type="time"
                value={f.receivedTime}
                onChange={set("receivedTime")}
              />
            </Field>
            <Field label="Diterima Oleh">
              <TextInput
                value={f.receivedBy}
                onChange={set("receivedBy")}
                placeholder="Nama penerima unit..."
              />
            </Field>
            <Field label="Estimasi Selesai (ETA)" hint="Default masuk + 3 hari">
              <TextInput type="date" value={f.eta} onChange={set("eta")} />
            </Field>
          </div>

          {/* Section 2: Delivery / Unit Information */}
          <div className="form-section-title">
            <Truck size={15} /> Informasi Pengiriman & Unit
          </div>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="No. DO / Surat Jalan Customer">
              <TextInput value={f.doNumber} onChange={set("doNumber")} />
            </Field>
            <Field label="Nama Pengirim / Kurir">
              <TextInput value={f.courierName} onChange={set("courierName")} />
            </Field>
            <Field label="Jumlah Unit">
              <TextInput
                type="number"
                min="1"
                value={f.unitQty}
                onChange={set("unitQty")}
              />
            </Field>
          </div>

          {/* Section 3: Physical Condition */}
          <div className="form-section-title">
            <Boxes size={15} /> Kondisi Fisik & Kelengkapan
          </div>
          <Field label="Kondisi Fisik Saat Diterima">
            <TextArea
              value={f.physicalCondition}
              onChange={set("physicalCondition")}
              placeholder="cth. lecet minor di casing, tidak ada kerusakan berat"
            />
          </Field>
          <Field label="Kelengkapan / Accessories">
            <TextArea
              value={f.accessories}
              onChange={set("accessories")}
              placeholder="cth. adaptor, kabel LAN, tanpa dus"
            />
          </Field>

          {/* Section 4: Pre-Inspection Damage Notes */}
          <div className="form-section-title">
            <AlertTriangle size={15} /> Kerusakan Fisik Sebelum Pengecekan
          </div>
          <Field
            label="Catatan Kerusakan Fisik Sebelum Pengecekan"
            hint="Dokumentasikan kerusakan fisik yang terlihat sebelum unit diperiksa / dibongkar oleh teknisi (cth. port LAN bengkok, casing retak, indikator cairan berubah warna)"
          >
            <TextArea
              value={f.physicalDamageNotes}
              onChange={set("physicalDamageNotes")}
              placeholder="Catatan rincian kerusakan fisik awal..."
            />
          </Field>

          <Field label="Catatan General Receiving">
            <TextArea
              value={f.receivingNotes}
              onChange={set("receivingNotes")}
            />
          </Field>

          {/* Section 5: Unit & Label Photo Attachments */}
          <div className="form-section-title">
            <ScanSearch size={15} /> Lampiran Foto Unit & Label SN/MAC
          </div>

          <InlineHint tone="info">
            Preview lokal. Penyimpanan cloud belum dikonfigurasi — foto hanya tampil selama sesi ini dan tidak diunggah ke server.
          </InlineHint>

          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {/* ---- Foto Unit Card ---- */}
            <PhotoPickerCard
              title="Foto Unit Perangkat"
              photos={f.unitPhotos || []}
              onAdd={(newItem) =>
                setF((s) => ({
                  ...s,
                  unitPhotos: [...(s.unitPhotos || []), newItem],
                }))
              }
              onRemove={(idx) => {
                const removed = (f.unitPhotos || [])[idx];
                if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
                setF((s) => ({
                  ...s,
                  unitPhotos: (s.unitPhotos || []).filter((_, i) => i !== idx),
                }))
              }}
              addLabel="+ Tambah Foto Unit"
              capture="environment"
            />

            {/* ---- Foto Label SN/MAC Card ---- */}
            <PhotoPickerCard
              title="Foto Label SN / MAC"
              photos={f.labelPhotos || []}
              onAdd={(newItem) =>
                setF((s) => ({
                  ...s,
                  labelPhotos: [...(s.labelPhotos || []), newItem],
                }))
              }
              onRemove={(idx) => {
                const removed = (f.labelPhotos || [])[idx];
                if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
                setF((s) => ({
                  ...s,
                  labelPhotos: (s.labelPhotos || []).filter((_, i) => i !== idx),
                }))
              }}
              addLabel="+ Tambah Foto Label SN / MAC"
              capture="environment"
            />
          </div>
        </div>
      )}

      {tab === "diagnosis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Kendala Awal">
            <TextArea
              value={f.initialProblem}
              onChange={set("initialProblem")}
            />
          </Field>
          <Field label="Gejala">
            <TextArea
              value={f.symptom}
              onChange={set("symptom")}
              placeholder="cth. PON LED tidak menyala"
            />
          </Field>
          <Field label="Hasil Pengecekan">
            <TextArea
              value={f.checkingResult}
              onChange={set("checkingResult")}
            />
          </Field>
          <Field label="Root Cause">
            <TextArea
              value={f.rootCause}
              onChange={set("rootCause")}
              placeholder="cth. kerusakan optical module"
            />
          </Field>
          <Field label="Tindakan">
            <TextArea
              value={f.actionTaken}
              onChange={set("actionTaken")}
              placeholder="cth. Replacement PCBA"
            />
          </Field>
          <Field label="Hasil Akhir">
            <Select
              options={master.finalResults}
              value={f.finalResult}
              onChange={set("finalResult")}
            />
          </Field>
        </div>
      )}

      {tab === "waiting" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <InlineHint>
            Isi bagian ini hanya jika status RMA sedang "Menunggu" — dipakai
            untuk menghitung berapa lama tiket tertahan karena pihak tertentu.
          </InlineHint>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Alasan Menunggu">
              <Select
                options={master.waitingReasons}
                value={f.waitingReason}
                onChange={set("waitingReason")}
              />
            </Field>
            <Field label="Pihak yang Ditunggu">
              <TextInput
                value={f.waitingParty}
                onChange={set("waitingParty")}
                placeholder="cth. Tim China, Customer"
              />
            </Field>
            <Field label="Mulai Menunggu">
              <TextInput
                type="date"
                value={f.waitingStart}
                onChange={set("waitingStart")}
              />
            </Field>
            <Field label="Selesai Menunggu">
              <TextInput
                type="date"
                value={f.waitingEnd}
                onChange={set("waitingEnd")}
              />
            </Field>
          </div>
          <Field label="Catatan Waiting">
            <TextArea value={f.waitingNote} onChange={set("waitingNote")} />
          </Field>
          {f.waitingStart && (
            <div style={{ fontSize: 12.5, color: T.ink2 }}>
              Lama menunggu:{" "}
              <b style={{ color: T.cyan, fontFamily: mono }}>
                {daysBetween(f.waitingStart, f.waitingEnd || todayISO())} hari
              </b>
              {!f.waitingEnd && " (masih berjalan)"}
            </div>
          )}
        </div>
      )}

      {tab === "warranty" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Status Warranty">
              <Select
                options={master.warrantyStatuses}
                value={f.warrantyStatus}
                onChange={set("warrantyStatus")}
              />
            </Field>
            <Field label="Keputusan Warranty">
              <TextInput
                value={f.warrantyDecision}
                onChange={set("warrantyDecision")}
                placeholder="cth. Ditanggung, Ditolak"
              />
            </Field>
            <Field label="Warranty Start">
              <TextInput
                type="date"
                value={f.warrantyStart}
                onChange={set("warrantyStart")}
              />
            </Field>
            <Field label="Warranty End">
              <TextInput
                type="date"
                value={f.warrantyEnd}
                onChange={set("warrantyEnd")}
              />
            </Field>
          </div>
          <Field label="Alasan Keputusan Warranty">
            <TextArea
              value={f.warrantyReason}
              onChange={set("warrantyReason")}
            />
          </Field>
        </div>
      )}

      {tab === "qc" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.ink2,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ClipboardCheck size={14} color={T.cyan} /> QC / TESTING
          </div>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="QC / Tester">
              <Select
                options={master.engineers}
                value={f.qcTester}
                onChange={set("qcTester")}
              />
            </Field>
            <Field label="Tanggal QC">
              <TextInput
                type="date"
                value={f.qcDate}
                onChange={set("qcDate")}
              />
            </Field>
            <Field label="Hasil QC">
              <Select
                options={master.qcResults}
                value={f.qcResult}
                onChange={set("qcResult")}
              />
            </Field>
          </div>
          <Field label="Catatan QC">
            <TextArea value={f.qcNotes} onChange={set("qcNotes")} />
          </Field>
          {f.qcResult === "Fail" && (
            <InlineHint tone="warn">
              QC Fail — status sebaiknya dikembalikan ke "Sedang Diperbaiki" di
              tab Overview.
            </InlineHint>
          )}

          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: T.ink2,
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
            }}
          >
            <Truck size={14} color={T.cyan} /> SHIPPING
          </div>
          <div
            className="form-grid-2"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Metode Pengiriman">
              <Select
                options={master.pengiriman}
                value={f.shipping}
                onChange={set("shipping")}
              />
            </Field>
            <Field label="No. Resi / Surat Jalan">
              <TextInput value={f.trackingNo} onChange={set("trackingNo")} />
            </Field>
            <Field label="Tanggal Dikirim (Shipped)">
              <TextInput
                type="date"
                value={f.shippedDate}
                onChange={set("shippedDate")}
              />
            </Field>
            <Field label="Tanggal Diterima Customer">
              <TextInput
                type="date"
                value={f.customerReceivedDate}
                onChange={set("customerReceivedDate")}
              />
            </Field>
            <Field label="Tanggal Ditutup (Closed)">
              <TextInput
                type="date"
                value={f.closedDate}
                onChange={set("closedDate")}
              />
            </Field>
          </div>
          <Field label="Keterangan">
            <TextArea value={f.notes} onChange={set("notes")} />
          </Field>
        </div>
      )}

      {tab === "timeline" && isEdit && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(f.statusHistory || [])
            .slice()
            .reverse()
            .map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "8px 10px",
                  background: T.panel2,
                  borderRadius: 6,
                  border: `1px solid ${T.line}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 99,
                    background: ledColor(h.to),
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 12.5 }}>
                  <div style={{ color: T.ink }}>
                    {h.from ? `${h.from} → ${h.to}` : `Dibuat: ${h.to}`}
                  </div>
                  <div style={{ color: T.ink3, fontSize: 11 }}>
                    {new Date(h.changedAt).toLocaleString("id-ID")}{" "}
                    {h.changedBy ? `· ${h.changedBy}` : ""}{" "}
                    {h.note ? `· ${h.note}` : ""}
                  </div>
                </div>
              </div>
            ))}
          {(!f.statusHistory || f.statusHistory.length === 0) && (
            <div style={{ color: T.ink3, fontSize: 12.5 }}>
              Belum ada riwayat.
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${T.line}`,
        }}
      >
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn variant="solid" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          Simpan Tiket
        </Btn>
      </div>
    </div>
  );
}

/* ============================================================
   WA FORM (with communication history)
   ============================================================ */
function WaForm({ initial, master, existingCaseNos, onSave, onClose }) {
  const [f, setF] = useState(
    initial || {
      id: uid(),
      caseDate: todayISO(),
      caseNo: genTicket("CASE", existingCaseNos),
      customerPhone: "",
      customerName: "",
      company: "",
      deviceType: "",
      sn: "",
      mac: "",
      initialProblem: "",
      engineerTag: "",
      status: master.statusWA[0] || "",
      finalAnalysis: "",
      solvedDate: "",
      notes: "",
      commHistory: [],
    },
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const addComm = () =>
    setF((s) => ({
      ...s,
      commHistory: [
        ...(s.commHistory || []),
        { id: uid(), date: todayISO(), handledBy: "", summary: "", result: "" },
      ],
    }));
  const updateComm = (id, key, val) =>
    setF((s) => ({
      ...s,
      commHistory: s.commHistory.map((c) =>
        c.id === id ? { ...c, [key]: val } : c,
      ),
    }));
  const removeComm = (id) =>
    setF((s) => ({
      ...s,
      commHistory: s.commHistory.filter((c) => c.id !== id),
    }));

  const handleSave = async () => {
    setFormError("");

    const required = {
      caseNo: "No. Case",
      caseDate: "Tanggal Case",
      engineerTag: "Engineer / Tagging",
      status: "Status",
      customerName: "Nama Customer",
    };
    for (const [key, label] of Object.entries(required)) {
      if (!f[key] || !f[key].trim()) {
        setFormError(`${label} wajib diisi.`);
        return;
      }
    }
    if (!f.sn && !f.mac) {
      setFormError("SN atau MAC minimal salah satu wajib diisi.");
      return;
    }

    setSaving(true);
    const result = await onSave(f);
    setSaving(false);
    if (!result?.ok) {
      setFormError("Gagal menyimpan case. Coba lagi.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        className="form-grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <Field label="No. Case">
          <TextInput
            value={f.caseNo}
            onChange={set("caseNo")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label="Tanggal Case">
          <TextInput
            type="date"
            value={f.caseDate}
            onChange={set("caseDate")}
          />
        </Field>
        <Field label="Engineer / Tagging">
          <Select
            options={master.engineers}
            value={f.engineerTag}
            onChange={set("engineerTag")}
          />
        </Field>
        <Field label="Status">
          <Select
            options={master.statusWA}
            value={f.status}
            onChange={set("status")}
          />
        </Field>
        <Field label="Nama Customer">
          <TextInput value={f.customerName} onChange={set("customerName")} />
        </Field>
        <Field label="Perusahaan">
          <TextInput value={f.company} onChange={set("company")} />
        </Field>
        <Field label="No. HP Customer">
          <TextInput value={f.customerPhone} onChange={set("customerPhone")} />
        </Field>
        <Field label="Type Perangkat">
          <TextInput value={f.deviceType} onChange={set("deviceType")} />
        </Field>
        <Field label="SN">
          <TextInput
            value={f.sn}
            onChange={set("sn")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label="MAC">
          <TextInput
            value={f.mac}
            onChange={set("mac")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label="Tanggal Solved">
          <TextInput
            type="date"
            value={f.solvedDate}
            onChange={set("solvedDate")}
          />
        </Field>
      </div>
      <Field label="Kendala Awal">
        <TextArea value={f.initialProblem} onChange={set("initialProblem")} />
      </Field>
      <Field label="Analisa Akhir">
        <TextArea value={f.finalAnalysis} onChange={set("finalAnalysis")} />
      </Field>

      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: 0.4,
              color: T.ink3,
              textTransform: "uppercase",
              fontFamily: sans,
            }}
          >
            Riwayat Komunikasi
          </span>
          <Btn variant="ghost" onClick={addComm}>
            <Plus size={13} /> Tambah
          </Btn>
        </div>
        <div className="wa-comm-container" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(f.commHistory || []).map((c) => (
            <div
              key={c.id}
              className="wa-comm-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "110px 110px 1fr 1fr 28px",
                gap: 6,
                alignItems: "start",
              }}
            >
              <TextInput
                type="date"
                value={c.date}
                onChange={(e) => updateComm(c.id, "date", e.target.value)}
              />
              <Select
                options={master.engineers}
                value={c.handledBy}
                onChange={(e) => updateComm(c.id, "handledBy", e.target.value)}
              />
              <TextInput
                placeholder="Ringkasan komunikasi"
                value={c.summary}
                onChange={(e) => updateComm(c.id, "summary", e.target.value)}
              />
              <TextInput
                placeholder="Hasil"
                value={c.result}
                onChange={(e) => updateComm(c.id, "result", e.target.value)}
              />
              <button
                onClick={() => removeComm(c.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: T.ink3,
                  cursor: "pointer",
                  padding: 8,
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {(!f.commHistory || f.commHistory.length === 0) && (
            <div style={{ fontSize: 12, color: T.ink3 }}>
              Belum ada riwayat komunikasi — berguna kalau 1 case ditangani
              beberapa engineer.
            </div>
          )}
        </div>
      </div>

      {formError && (
        <div
          style={{
            background: T.redDim,
            color: T.red,
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12.5,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={14} /> {formError}
        </div>
      )}

      <Field label="Keterangan">
        <TextArea value={f.notes} onChange={set("notes")} />
      </Field>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 4,
        }}
      >
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn variant="solid" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          Simpan Case
        </Btn>
      </div>
    </div>
  );
}

/* ============================================================
   TABLE
   ============================================================ */
function DataTable({ columns, rows, onRowClick, emptyLabel }) {
  return (
    <div
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        border: `1px solid ${T.line}`,
        borderRadius: 8,
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 680,
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ background: T.panel2 }}>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  color: T.ink3,
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  fontFamily: sans,
                  borderBottom: `1px solid ${T.line}`,
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: 24, textAlign: "center", color: T.ink3 }}
              >
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{
                borderBottom: `1px solid ${T.line}`,
                cursor: onRowClick ? "pointer" : "default",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.panel2)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: "9px 12px",
                    color: T.ink,
                    fontFamily: c.mono ? mono : sans,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function Dashboard({ rma, wa, t, lastLoginLabel }) {
  const statusCount = useMemo(() => {
    const m = {};
    [...rma.map((e) => e.status), ...wa.map((e) => e.status)].forEach((s) => {
      const k = s || "—";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [rma, wa]);

  const productCount = useMemo(() => {
    const m = {};
    rma.forEach((e) => {
      const k = e.product || "—";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [rma]);

  const engineerCount = useMemo(() => {
    const m = {};
    [...rma.map((e) => e.engineer), ...wa.map((e) => e.engineerTag)].forEach(
      (e) => {
        if (e) m[e] = (m[e] || 0) + 1;
      },
    );
    return Object.entries(m)
      .map(([name, cases]) => ({ name, cases }))
      .sort((a, b) => b.cases - a.cases);
  }, [rma, wa]);

  const warrantyCount = useMemo(() => {
    const m = {};
    rma.forEach((e) => {
      const k = e.warrantyStatus || "Belum diisi";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [rma]);

  const rmaOpen = rma.filter(
    (e) => !RMA_DONE_STATUSES.includes(e.status),
  ).length;
  const rmaClosed = rma.filter((e) =>
    RMA_DONE_STATUSES.includes(e.status),
  ).length;
  const rmaOverdue = rma.filter(isOverdue).length;
  const avgTAT = useMemo(() => {
    const days = rma
      .filter((e) => e.closedDate)
      .map((e) => daysBetween(e.receivedDate, e.closedDate))
      .filter((n) => typeof n === "number");
    if (!days.length) return "-";
    return (days.reduce((a, b) => a + b, 0) / days.length).toFixed(1);
  }, [rma]);

  const pieColors = [T.cyan, T.amber, T.green, T.red, T.grey, "#8B7FD6"];
  const Stat = ({ label, value, accent }) => (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 12,
        padding: 16,
        flex: 1,
        minWidth: 130,
        boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          color: T.ink3,
          textTransform: "uppercase",
          fontFamily: sans,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontFamily: mono,
          color: accent || T.ink,
          marginTop: 6,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          maxWidth: "100%",
        }}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Stat label={t.totalDevices} value={rma.length + wa.length} />
        <Stat label={t.lastLoginTime} value={lastLoginLabel} accent={T.cyan} />
        <Stat label={t.totalRma} value={rma.length} />
        <Stat label={t.rmaOpen} value={rmaOpen} accent={T.amber} />
        <Stat label={t.rmaClosed} value={rmaClosed} accent={T.green} />
        <Stat label={t.rmaOverdue} value={rmaOverdue} accent={T.red} />
        <Stat label={t.avgTat} value={avgTAT} accent={T.cyan} />
        <Stat label={t.totalWa} value={wa.length} />
      </div>
      <div className="dashboard-chart-grid"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}
      >
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.ink2,
              marginBottom: 10,
              fontFamily: sans,
              fontWeight: 600,
            }}
          >
            {t.engineerLoad}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={engineerCount}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={T.ink3}
                fontSize={11}
                tick={{ fill: T.ink3 }}
              />
              <YAxis
                stroke={T.ink3}
                fontSize={11}
                allowDecimals={false}
                tick={{ fill: T.ink3 }}
              />
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: T.ink,
                }}
                labelStyle={{ color: T.ink }}
                itemStyle={{ color: T.ink2 }}
              />
              <Bar
                dataKey="cases"
                name={t.cases}
                fill={T.cyan}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.ink2,
              marginBottom: 10,
              fontFamily: sans,
              fontWeight: 600,
            }}
          >
            {t.statusDistribution}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusCount}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={72}
                paddingAngle={2}
              >
                {statusCount.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: T.ink,
                }}
                labelStyle={{ color: T.ink }}
                itemStyle={{ color: T.ink2 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="dashboard-chart-grid"
        style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}
      >
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.ink2,
              marginBottom: 10,
              fontFamily: sans,
              fontWeight: 600,
            }}
          >
            {t.productCount}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productCount}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={T.ink3}
                fontSize={11}
                tick={{ fill: T.ink3 }}
              />
              <YAxis
                stroke={T.ink3}
                fontSize={11}
                allowDecimals={false}
                tick={{ fill: T.ink3 }}
              />
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: T.ink,
                }}
                labelStyle={{ color: T.ink }}
                itemStyle={{ color: T.ink2 }}
              />
              <Bar
                dataKey="count"
                name={t.count}
                fill={T.amber}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div
          style={{
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: T.ink2,
              marginBottom: 10,
              fontFamily: sans,
              fontWeight: 600,
            }}
          >
            {t.warrantyChart}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={warrantyCount}
                dataKey="value"
                nameKey="name"
                innerRadius={40}
                outerRadius={72}
                paddingAngle={2}
              >
                {warrantyCount.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: T.ink,
                }}
                labelStyle={{ color: T.ink }}
                itemStyle={{ color: T.ink2 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   WEEKLY REPORT
   ============================================================ */
function WeeklyReport({ rma, wa, t }) {
  const [start, setStart] = useState(dateNDaysAgoISO(7));
  const [end, setEnd] = useState(todayISO());

  const cases = useMemo(() => {
    const inRange = (d) => d && d >= start && d <= end;
    const rmaCases = rma
      .filter((e) => inRange(e.receivedDate))
      .map((e) => ({
        channel: "RMA",
        engineer: e.engineer,
        date: e.receivedDate,
        customer: e.customerName || e.company || "-",
        type: e.product || "-",
        problem: e.initialProblem || "-",
        analysis:
          [e.checkingResult, e.rootCause ? `Root cause: ${e.rootCause}` : ""]
            .filter(Boolean)
            .join(" | ") || "-",
        solution: RMA_DONE_STATUSES.includes(e.status)
          ? `Selesai pada ${fmtDate(e.closedDate || e.customerReceivedDate)}`
          : e.actionTaken || "Follow up / monitoring",
        status: e.status || "-",
      }));
    const waCases = wa
      .filter((e) => inRange(e.caseDate))
      .map((e) => ({
        channel: "WhatsApp",
        engineer: e.engineerTag,
        date: e.caseDate,
        customer: e.customerName || e.company || "-",
        type: e.deviceType || "-",
        problem: e.initialProblem || "-",
        analysis: e.finalAnalysis || "-",
        solution: (e.status || "").toLowerCase().includes("selesai")
          ? `Selesai pada ${fmtDate(e.solvedDate)}`
          : e.finalAnalysis || "Follow up / monitoring",
        status: e.status || "-",
      }));
    return [...rmaCases, ...waCases].sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [rma, wa, start, end]);

  const reportText = useMemo(() => {
    const header = `WEEKLY SUMMARY / RINGKASAN MINGGUAN – TECHNICAL SUPPORT
📅 Periode / Period:
${fmtDate(start)} – ${fmtDate(end)}
🧑‍💻 Ringkasan Kegiatan / Activity Summary:
Monitoring OLT dan ONU / OLT and ONU Monitoring
Troubleshooting Issue Customer / Customer Issue Troubleshooting
Technical Support HSGQ Jakarta / HSGQ Jakarta Technical Support
🚨 Issue & Troubleshooting / Kendala & Penanganan:
============================================`;
    const body = cases
      .map(
        (c, i) => `
- Case ${i + 1} [${c.channel}] (${c.engineer || "-"})
Tanggal / Date: ${fmtDate(c.date)}
Customer / Company: ${c.customer}
Type / Device Type: ${c.type}
Problem / Issue: ${c.problem}
Analisa / Analysis: ${c.analysis}
Solusi / Solution: ${c.solution}
Status / Status: ${c.status}
============================================`,
      )
      .join("");
    return header + body;
  }, [cases, start, end]);

  const cleanReportText = useMemo(() => {
    const header = `WEEKLY SUMMARY / RINGKASAN MINGGUAN - TECHNICAL SUPPORT
Periode / Period:
${fmtDate(start)} - ${fmtDate(end)}
Ringkasan Kegiatan / Activity Summary:
Monitoring OLT dan ONU / OLT and ONU Monitoring
Troubleshooting Issue Customer / Customer Issue Troubleshooting
Technical Support HSGQ Jakarta / HSGQ Jakarta Technical Support
Issue & Troubleshooting / Kendala & Penanganan:
============================================`;
    const body = cases
      .map(
        (c, i) => `
- Case ${i + 1} [${c.channel}] (${c.engineer || "-"})
Tanggal / Date: ${fmtDate(c.date)}
Customer / Company: ${c.customer}
Type / Device Type: ${c.type}
Problem / Issue: ${c.problem}
Analisa / Analysis: ${c.analysis}
Solusi / Solution: ${c.solution}
Status / Status: ${c.status}
============================================`,
      )
      .join("");
    return header + body;
  }, [cases, start, end]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function exportPdf() {
    const rows = cases
      .map(
        (c, i) => `
          <section class="case">
            <div class="case-title">Case ${i + 1} - ${escapeHtml(c.channel)}</div>
            <div class="grid">
              <div><span>Date</span><strong>${escapeHtml(fmtDate(c.date))}</strong></div>
              <div><span>Engineer</span><strong>${escapeHtml(c.engineer || "-")}</strong></div>
              <div><span>Customer / Company</span><strong>${escapeHtml(c.customer)}</strong></div>
              <div><span>Type / Device Type</span><strong>${escapeHtml(c.type)}</strong></div>
              <div class="full"><span>Problem / Issue</span><strong>${escapeHtml(c.problem)}</strong></div>
              <div class="full"><span>Analysis</span><strong>${escapeHtml(c.analysis)}</strong></div>
              <div class="full"><span>Solution</span><strong>${escapeHtml(c.solution)}</strong></div>
              <div><span>Status</span><strong>${escapeHtml(c.status)}</strong></div>
            </div>
          </section>`,
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) {
      window.alert("Popup browser diblokir. Izinkan popup untuk export PDF.");
      return;
    }

    win.document.write(`<!doctype html>
      <html>
        <head>
          <title>Weekly Report ${escapeHtml(fmtDate(start))} - ${escapeHtml(fmtDate(end))}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; line-height: 1.45; }
            .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 10px 0; background: #fff; }
            button { border: 0; border-radius: 6px; background: #2563eb; color: #fff; padding: 9px 14px; font-weight: 700; cursor: pointer; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px; }
            .brand { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: .4px; text-transform: uppercase; }
            h1 { margin: 4px 0 6px; font-size: 24px; }
            .period { color: #4b5563; font-size: 12px; }
            .summary { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
            .summary h2 { margin: 0 0 8px; font-size: 14px; }
            .summary ul { margin: 0; padding-left: 18px; font-size: 12px; }
            .case { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 12px; page-break-inside: avoid; }
            .case-title { font-weight: 700; color: #111827; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 14px; }
            .grid div { min-width: 0; }
            .grid .full { grid-column: 1 / -1; }
            span { display: block; color: #6b7280; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
            strong { display: block; color: #111827; font-size: 12px; font-weight: 500; white-space: pre-wrap; }
            .empty { color: #6b7280; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; }
            @media print { .toolbar { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div>
          <div class="header">
            <div class="brand">HSGQ Cloud</div>
            <h1>Weekly Technical Support Report</h1>
            <div class="period">${escapeHtml(fmtDate(start))} - ${escapeHtml(fmtDate(end))}</div>
          </div>
          <section class="summary">
            <h2>Activity Summary</h2>
            <ul>
              <li>Monitoring OLT dan ONU / OLT and ONU Monitoring</li>
              <li>Troubleshooting Issue Customer / Customer Issue Troubleshooting</li>
              <li>Technical Support HSGQ Jakarta / HSGQ Jakarta Technical Support</li>
            </ul>
          </section>
          ${cases.length ? rows : '<div class="empty">Tidak ada case pada rentang tanggal ini.</div>'}
        </body>
      </html>`);
    win.document.close();
    win.focus();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Field label="Dari Tanggal">
          <TextInput
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="Sampai Tanggal">
          <TextInput
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
        <Btn
          variant="ghost"
          onClick={() => {
            setStart(dateNDaysAgoISO(7));
            setEnd(todayISO());
          }}
        >
          <CalendarRange size={14} /> 7 Hari Terakhir
        </Btn>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" onClick={exportPdf}>
          <FileDown size={14} /> Export PDF
        </Btn>
        <CopyButton text={cleanReportText} />
      </div>
      <div
        style={{
          background: T.void,
          border: `1px solid ${T.line}`,
          borderRadius: 10,
          padding: 18,
          fontFamily: mono,
          fontSize: 12.5,
          color: T.ink2,
          whiteSpace: "pre-wrap",
          lineHeight: 1.6,
          maxHeight: 520,
          overflowY: "auto",
        }}
      >
        {cases.length === 0 ? (
          <span style={{ color: T.ink3 }}>
            Tidak ada case pada rentang tanggal ini.
          </span>
        ) : (
          cleanReportText
        )}
      </div>
    </div>
  );
}

/* ============================================================
   UNIT HISTORY / QUICK SEARCH SN-MAC
   ============================================================ */
function UnitHistory({ rma, wa, t }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rmaHits = rma
      .filter(
        (e) =>
          !q ||
          [
            e.ticketNo,
            e.sn,
            e.mac,
            e.customerName,
            e.company,
            e.status,
            e.finalResult,
            e.rootCause,
            e.checkingResult,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .map((e) => ({
        ref: e.ticketNo,
        channel: "RMA",
        date: e.receivedDate,
        status: e.status,
        sn: e.sn || "-",
        mac: e.mac || "-",
        customer: e.customerName || e.company || "-",
        result: e.finalResult || "-",
        note: e.rootCause || e.checkingResult || "-",
      }));
    const waHits = wa
      .filter(
        (e) =>
          !q ||
          [
            e.caseNo,
            e.sn,
            e.mac,
            e.customerName,
            e.company,
            e.status,
            e.finalAnalysis,
            e.initialProblem,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
      )
      .map((e) => ({
        ref: e.caseNo,
        channel: "WhatsApp",
        date: e.caseDate,
        status: e.status,
        sn: e.sn || "-",
        mac: e.mac || "-",
        customer: e.customerName || e.company || "-",
        result: e.finalAnalysis || "-",
        note: e.initialProblem || "-",
      }));
    return [...rmaHits, ...waHits].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [query, rma, wa]);

  const partialResults = useMemo(() => {
    if (!query.trim() || query.trim().length < 3) return [];
    const q = query.trim().toLowerCase();
    const rmaHits = rma
      .filter(
        (e) =>
          ((e.sn || "").toLowerCase().includes(q) ||
            (e.mac || "").toLowerCase().includes(q)) &&
          !results.some((r) => r.ref === e.ticketNo),
      )
      .map((e) => ({
        ref: e.ticketNo,
        channel: "RMA",
        date: e.receivedDate,
        status: e.status,
        sn: e.sn,
        mac: e.mac,
      }));
    return rmaHits.slice(0, 10);
  }, [query, rma, results]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ maxWidth: 420 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t.unitHistorySearchPlaceholder}
        />
      </div>
      {!query.trim() && (
        <InlineHint>
          {t.unitHistoryHint}
        </InlineHint>
      )}
      {query.trim() && results.length === 0 && partialResults.length === 0 && (
        <div style={{ color: T.ink3, fontSize: 13 }}>
          {t.unitHistoryNotFound.replace('"{q}"', `"${query}"`)}
        </div>
      )}
      {results.length > 0 && (
        <div className="unit-history-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {query.trim() && results.length > 1 && (
            <InlineHint tone="warn">
              {t.unitHistoryPriorWarning.replace("{n}", results.length)}
            </InlineHint>
          )}
          {results.map((r, i) => (
            <div className="unit-history-item"
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: "10px 14px",
                background: T.panel,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 99,
                  background: ledColor(r.status),
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12.5,
                  color: T.cyan,
                  minWidth: 150,
                }}
              >
                {r.ref}
              </div>
              <div style={{ fontSize: 11.5, color: T.ink3, minWidth: 80 }}>
                {r.channel}
              </div>
              <div style={{ fontSize: 12, color: T.ink2, minWidth: 90 }}>
                {fmtDate(r.date)}
              </div>
              <div style={{ fontSize: 11.5, color: T.ink3, minWidth: 180 }}>
                <span style={{ fontFamily: mono }}>{r.sn}</span> /{" "}
                <span style={{ fontFamily: mono }}>{r.mac}</span>
              </div>
              <div style={{ fontSize: 12, color: T.ink2, minWidth: 120 }}>
                {r.customer}
              </div>
              <div style={{ fontSize: 12.5, color: T.ink, flex: 1 }}>
                {r.result}
              </div>
              <div style={{ fontSize: 11.5, color: T.ink3 }}>{r.status}</div>
            </div>
          ))}
        </div>
      )}
      {partialResults.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              color: T.ink3,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {t.unitHistoryPartialMatch}
          </div>
          {partialResults.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: "8px 14px",
                fontSize: 12,
                color: T.ink2,
              }}
            >
              <span style={{ fontFamily: mono, color: T.cyan }}>{r.ref}</span>
              <span style={{ fontFamily: mono }}>
                {r.sn} / {r.mac}
              </span>
              <span>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SETTINGS / MASTER DATA
   ============================================================ */
function TagList({ label, items, onChange }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: T.ink2,
          fontFamily: sans,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((it) => (
          <span
            key={it}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 12.5,
              color: T.ink,
            }}
          >
            {it}
            <X
              size={12}
              style={{ cursor: "pointer", color: T.ink3 }}
              onClick={() => onChange(items.filter((x) => x !== it))}
            />
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <TextInput
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Tambah item..."
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        />
        <Btn
          variant="ghost"
          onClick={() => {
            if (val.trim()) {
              onChange([...items, val.trim()]);
              setVal("");
            }
          }}
        >
          <Plus size={14} />
        </Btn>
      </div>
    </div>
  );
}
function SettingsTab({ master, setMaster, t }) {
  const update = (k) => (arr) => setMaster((m) => ({ ...m, [k]: arr }));
  return (
    <div
      className="form-grid-2"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
    >
      <TagList
        label={t.settingsEngineer}
        items={master.engineers}
        onChange={update("engineers")}
      />
      <TagList
        label={t.settingsStatusRma}
        items={master.statusRMA}
        onChange={update("statusRMA")}
      />
      <TagList
        label={t.settingsStatusWa}
        items={master.statusWA}
        onChange={update("statusWA")}
      />
      <TagList
        label={t.settingsFinalResults}
        items={master.finalResults}
        onChange={update("finalResults")}
      />
      <TagList
        label={t.settingsWaitingReasons}
        items={master.waitingReasons}
        onChange={update("waitingReasons")}
      />
      <TagList
        label={t.settingsWarrantyStatuses}
        items={master.warrantyStatuses}
        onChange={update("warrantyStatuses")}
      />
      <TagList
        label={t.settingsQcResults}
        items={master.qcResults}
        onChange={update("qcResults")}
      />
      <TagList
        label={t.settingsShippingMethod}
        items={master.pengiriman}
        onChange={update("pengiriman")}
      />
      <TagList
        label={t.settingsPcbaTypes}
        items={master.pcbaTypes}
        onChange={update("pcbaTypes")}
      />
      <TagList
        label={t.settingsSuppliers}
        items={master.suppliers}
        onChange={update("suppliers")}
      />
      <TagList
        label={t.settingsWarehouseLocations}
        items={master.warehouseLocations}
        onChange={update("warehouseLocations")}
      />
      <Field label={t.settingsMinStockDefault}>
        <TextInput
          type="number"
          min="0"
          value={master.minStockDefault}
          onChange={(e) =>
            setMaster((m) => ({
              ...m,
              minStockDefault: Number(e.target.value) || 0,
            }))
          }
        />
      </Field>
    </div>
  );
}

/* ============================================================
   PCBA INVENTORY & REPAIR
   ============================================================ */
function PcbaBadge({ status }) {
  const c = pcbaLed(status);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: c,
          boxShadow: `0 0 6px ${c}99`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 12.5, color: T.ink2, fontFamily: sans }}>
        {status}
      </span>
    </span>
  );
}

function GoodsReceiptForm({ master, onSave, onClose }) {
  const [f, setF] = useState({
    serialNo: "",
    pcbaType: master.pcbaTypes[0] || "",
    product: "",
    supplier: master.suppliers[0] || "",
    warehouseLocation: master.warehouseLocations[0] || "",
    notes: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InlineHint>
        Stok masuk (goods receipt) langsung berstatus "Good" dan siap dipakai
        untuk replacement.
      </InlineHint>
      {err && <InlineHint tone="warn">{err}</InlineHint>}
      <div
        className="form-grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <Field label="No. Serial PCBA">
          <TextInput
            value={f.serialNo}
            onChange={set("serialNo")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label="Tipe PCBA">
          <Select
            options={master.pcbaTypes}
            value={f.pcbaType}
            onChange={set("pcbaType")}
          />
        </Field>
        <Field label="Produk Terkait">
          <TextInput
            value={f.product}
            onChange={set("product")}
            placeholder="cth. G04ID"
          />
        </Field>
        <Field label="Supplier">
          <Select
            options={master.suppliers}
            value={f.supplier}
            onChange={set("supplier")}
          />
        </Field>
        <Field label="Lokasi Gudang">
          <Select
            options={master.warehouseLocations}
            value={f.warehouseLocation}
            onChange={set("warehouseLocation")}
          />
        </Field>
      </div>
      <Field label="Catatan">
        <TextArea value={f.notes} onChange={set("notes")} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={() => {
            if (!f.serialNo.trim()) {
              setErr("No. Serial PCBA wajib diisi.");
              return;
            }
            setSaving(true);
            onSave(f);
            setSaving(false);
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          Simpan Stok Masuk
        </Btn>
      </div>
    </div>
  );
}

function ReplacementForm({ master, rmaOpenList, goodItems, onSave, onClose }) {
  const [f, setF] = useState({
    rmaId: "",
    newPcbaItemId: "",
    oldSerialNo: "",
    notes: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InlineHint>
        Sistem menolak otomatis kalau stok PCBA Good untuk tipe terkait kosong.
        PCBA lama yang dilepas akan otomatis masuk stok sebagai "Bad".
      </InlineHint>
      {err && <InlineHint tone="warn">{err}</InlineHint>}
      <Field label="RMA Terkait">
        <Select
          options={rmaOpenList.map((r) => r.ticketNo)}
          value={rmaOpenList.find((r) => r.id === f.rmaId)?.ticketNo || ""}
          onChange={(e) => {
            const found = rmaOpenList.find(
              (r) => r.ticketNo === e.target.value,
            );
            setF((s) => ({ ...s, rmaId: found ? found.id : "" }));
          }}
        />
      </Field>
      <Field label="PCBA Baru (stok Good)">
        <Select
          options={goodItems.map((i) => `${i.serialNo} (${i.pcbaType})`)}
          value={(() => {
            const found = goodItems.find((i) => i.id === f.newPcbaItemId);
            return found ? `${found.serialNo} (${found.pcbaType})` : "";
          })()}
          onChange={(e) => {
            const found = goodItems.find(
              (i) => `${i.serialNo} (${i.pcbaType})` === e.target.value,
            );
            setF((s) => ({ ...s, newPcbaItemId: found ? found.id : "" }));
          }}
        />
      </Field>
      {goodItems.length === 0 && (
        <InlineHint tone="warn">
          Tidak ada stok PCBA berstatus Good sama sekali. Lakukan "Terima PCBA
          Baru" dulu di tab Stok.
        </InlineHint>
      )}
      <Field label="No. Serial PCBA Lama (yang dilepas dari unit)">
        <TextInput
          value={f.oldSerialNo}
          onChange={set("oldSerialNo")}
          style={{ fontFamily: mono }}
        />
      </Field>
      <Field label="Catatan">
        <TextArea value={f.notes} onChange={set("notes")} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={async () => {
            if (!f.rmaId) return setErr("Pilih RMA terkait dulu.");
            if (!f.newPcbaItemId)
              return setErr("Pilih PCBA baru (stok Good) dulu.");
            if (!f.oldSerialNo.trim())
              return setErr("No. Serial PCBA lama wajib diisi.");
            setSaving(true);
            const res = await onSave(f);
            setSaving(false);
            if (res && res.ok === false) setErr(res.error);
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          Proses Replacement
        </Btn>
      </div>
    </div>
  );
}

function RepairForm({ master, badItems, onSave, onClose }) {
  const [f, setF] = useState({
    pcbaItemId: "",
    engineer: "",
    analysis: "",
    actionTaken: "",
    componentsReplaced: "",
    testingResult: "",
    repairResult: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const repairResultOptions = [
    "Berhasil Diperbaiki",
    "Tidak Dapat Diperbaiki",
    "Perlu Follow-up Tim China",
    "Return to Principal",
    "Scrap",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {err && <InlineHint tone="warn">{err}</InlineHint>}
      <Field label="PCBA (status Bad / Under Repair)">
        <Select
          options={badItems.map((i) => `${i.serialNo} (${i.pcbaType})`)}
          value={(() => {
            const found = badItems.find((i) => i.id === f.pcbaItemId);
            return found ? `${found.serialNo} (${found.pcbaType})` : "";
          })()}
          onChange={(e) => {
            const found = badItems.find(
              (i) => `${i.serialNo} (${i.pcbaType})` === e.target.value,
            );
            setF((s) => ({ ...s, pcbaItemId: found ? found.id : "" }));
          }}
        />
      </Field>
      {badItems.length === 0 && (
        <InlineHint tone="warn">
          Tidak ada PCBA berstatus Bad/Under Repair untuk direpair saat ini.
        </InlineHint>
      )}
      <Field label="Engineer">
        <Select
          options={master.engineers}
          value={f.engineer}
          onChange={set("engineer")}
        />
      </Field>
      <Field label="Analisis Kerusakan">
        <TextArea value={f.analysis} onChange={set("analysis")} />
      </Field>
      <Field label="Tindakan">
        <TextArea value={f.actionTaken} onChange={set("actionTaken")} />
      </Field>
      <Field label="Komponen Diganti">
        <TextArea
          value={f.componentsReplaced}
          onChange={set("componentsReplaced")}
          placeholder="cth. IC optical module x1, capacitor 10uF x2"
        />
      </Field>
      <Field label="Hasil Testing">
        <TextArea value={f.testingResult} onChange={set("testingResult")} />
      </Field>
      <Field label="Hasil Repair">
        <Select
          options={repairResultOptions}
          value={f.repairResult}
          onChange={set("repairResult")}
        />
      </Field>
      {f.repairResult === "Berhasil Diperbaiki" && (
        <InlineHint>
          PCBA akan berstatus "Repaired" dan menunggu QC sebelum resmi kembali
          ke stok Good.
        </InlineHint>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          Batal
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={() => {
            if (!f.pcbaItemId) return setErr("Pilih PCBA dulu.");
            if (!f.repairResult) return setErr("Pilih hasil repair dulu.");
            setSaving(true);
            onSave(f);
            setSaving(false);
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          Simpan Repair
        </Btn>
      </div>
    </div>
  );
}

function PcbaInventoryTab({
  pcba,
  rma,
  master,
  onGoodsReceipt,
  onReplacement,
  onRepair,
  onQc,
  t,
}) {
  const [subTab, setSubTab] = useState("stock");
  const [modal, setModal] = useState(null);

  const statusCounts = useMemo(() => {
    const m = {};
    PCBA_STATUSES.forEach((s) => (m[s] = 0));
    pcba.items.forEach((i) => {
      m[i.status] = (m[i.status] || 0) + 1;
    });
    return m;
  }, [pcba.items]);

  const lowStockTypes = useMemo(() => {
    const byType = {};
    pcba.items
      .filter((i) => i.status === "Good")
      .forEach((i) => {
        byType[i.pcbaType] = (byType[i.pcbaType] || 0) + 1;
      });
    const minStock = master.minStockDefault || 5;
    return master.pcbaTypes
      .map((type) => ({ type, stock: byType[type] || 0 }))
      .filter((x) => x.stock < minStock);
  }, [pcba.items, master.pcbaTypes, master.minStockDefault]);

  const goodItems = pcba.items.filter((i) => i.status === "Good");
  const badItems = pcba.items.filter(
    (i) => i.status === "Bad" || i.status === "Under Repair",
  );
  const rmaOpenList = rma.filter((r) => !RMA_DONE_STATUSES.includes(r.status));

  const SUB_TABS = [
    { id: "stock", label: t.pcbaStock, icon: Boxes },
    { id: "replacement", label: t.pcbaReplacement, icon: ArrowLeftRight },
    { id: "repair", label: t.pcbaRepair, icon: Wrench },
    { id: "transactions", label: t.pcbaTransactions, icon: ClipboardList },
  ];

  return (
    <div>
      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        {PCBA_STATUSES.map((s) => (
          <div
            key={s}
            style={{
              background: T.panel,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "12px 16px",
              flex: 1,
              minWidth: 110,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 0.4,
                color: T.ink3,
                textTransform: "uppercase",
                fontFamily: sans,
              }}
            >
              {s}
            </div>
            <div
              style={{
                fontSize: 22,
                fontFamily: mono,
                color: pcbaLed(s),
                marginTop: 4,
              }}
            >
              {statusCounts[s] || 0}
            </div>
          </div>
        ))}
      </div>

      {lowStockTypes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <InlineHint tone="warn">
            {t.pcbaLowStock.replace("{min}", master.minStockDefault || 5).replace("{types}", lowStockTypes.map((x) => `${x.type} (${x.stock})`).join(", "))}
          </InlineHint>
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: `1px solid ${T.line}`,
          marginBottom: 16,
        }}
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "none",
                border: "none",
                borderBottom: active
                  ? `2px solid ${T.cyan}`
                  : "2px solid transparent",
                color: active ? T.cyan : T.ink3,
                cursor: "pointer",
                fontFamily: sans,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: -1,
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {subTab === "stock" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <Btn variant="solid" onClick={() => setModal({ type: "receipt" })}>
              <Plus size={14} /> {t.pcbaReceiveNew}
            </Btn>
          </div>
          <DataTable
            columns={[
              { key: "serialNo", label: t.pcbaSerialNo, mono: true },
              { key: "pcbaType", label: t.pcbaType },
              {
                key: "status",
                label: t.pcbaAction,
                render: (r) => <PcbaBadge status={r.status} />,
              },
              { key: "supplier", label: t.pcbaSupplier },
              { key: "warehouseLocation", label: t.pcbaWarehouseLocation },
              {
                key: "createdAt",
                label: t.pcbaAction,
                render: (r) => fmtDate(r.createdAt),
              },
            ]}
            rows={pcba.items}
            emptyLabel="Belum ada PCBA di stok. Klik 'Terima PCBA Baru' untuk mulai."
          />
        </>
      )}

{subTab === "replacement" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <Btn
              variant="solid"
              onClick={() => setModal({ type: "replacement" })}
            >
              <Plus size={14} /> {t.pcbaReplacement} Baru
            </Btn>
          </div>
          <DataTable
            columns={[
              { key: "replacementNo", label: "No. Replacement", mono: true },
              {
                key: "rmaId",
                label: "RMA",
                render: (r) =>
                  rma.find((x) => x.id === r.rmaId)?.ticketNo || "-",
              },
              {
                key: "oldPcbaItemId",
                label: t.pcbaReplaceOld,
                render: (r) =>
                  pcba.items.find((i) => i.id === r.oldPcbaItemId)?.serialNo ||
                  "-",
              },
              {
                key: "newPcbaItemId",
                label: t.pcbaReplaceNew,
                render: (r) =>
                  pcba.items.find((i) => i.id === r.newPcbaItemId)?.serialNo ||
                  "-",
              },
              { key: "replacedBy", label: "Oleh" },
              {
                key: "replacedAt",
                label: "Tanggal",
                render: (r) => fmtDate(r.replacedAt),
              },
            ]}
            rows={pcba.replacements}
            emptyLabel="Belum ada replacement PCBA."
          />
        </>
      )}

      {subTab === "repair" && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 12,
            }}
          >
            <Btn variant="solid" onClick={() => setModal({ type: "repair" })}>
              <Plus size={14} /> {t.pcbaRepair} Baru
            </Btn>
          </div>
          <DataTable
            columns={[
              { key: "repairNo", label: "No. Repair", mono: true },
              {
                key: "pcbaItemId",
                label: t.pcbaRepairItem,
                render: (r) =>
                  pcba.items.find((i) => i.id === r.pcbaItemId)?.serialNo ||
                  "-",
              },
              { key: "engineer", label: "Engineer" },
              { key: "repairResult", label: t.pcbaQcResult },
              {
                key: "qcStatus",
                label: "QC",
                render: (r) =>
                  r.qcStatus ? (
                    <PcbaBadge
                      status={
                        r.qcStatus === "Passed"
                          ? "Good"
                          : r.qcStatus === "Failed"
                          ? "Bad"
                          : "Under Repair"
                      }
                    />
                  ) : (
                    "-"
                  ),
              },
              {
                key: "actions",
                label: "",
                render: (r) =>
                  r.qcStatus === "Pending" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="solid" onClick={() => onQc(r.id, "Passed")}>
                        Pass
                      </Btn>
                      <Btn
                        variant="danger"
                        onClick={() => onQc(r.id, "Failed")}
                      >
                        Fail
                      </Btn>
                    </div>
                  ) : null,
              },
            ]}
            rows={pcba.repairs}
            emptyLabel="Belum ada repair PCBA."
          />
        </>
      )}

      {subTab === "transactions" && (
        <DataTable
          columns={[
            { key: "transactionNo", label: "No. Transaksi", mono: true },
            {
              key: "pcbaItemId",
              label: t.pcbaSelectItem,
              render: (r) =>
                pcba.items.find((i) => i.id === r.pcbaItemId)?.serialNo || "-",
            },
            { key: "type", label: "Tipe" },
            {
              key: "rmaId",
              label: "RMA",
              render: (r) => rma.find((x) => x.id === r.rmaId)?.ticketNo || "-",
            },
            { key: "reason", label: t.pcbaNotes },
            {
              key: "createdAt",
              label: "Tanggal",
              render: (r) => fmtDate(r.createdAt),
            },
          ]}
          rows={pcba.transactions}
          emptyLabel="Belum ada transaksi stok. Transaksi tercatat otomatis (append-only, tidak bisa diedit/dihapus)."
        />
      )}

      {modal?.type === "receipt" && (
        <Modal
          title="TERIMA PCBA BARU (GOODS RECEIPT)"
          onClose={() => setModal(null)}
        >
          <GoodsReceiptForm
            master={master}
            onSave={(data) => {
              onGoodsReceipt(data);
              setModal(null);
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "replacement" && (
        <Modal title="REPLACEMENT PCBA" onClose={() => setModal(null)}>
          <ReplacementForm
            master={master}
            rmaOpenList={rmaOpenList}
            goodItems={goodItems}
            onSave={(data) => {
              const res = onReplacement(data);
              if (!res || res.ok !== false) setModal(null);
              return res;
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "repair" && (
        <Modal title="MULAI REPAIR PCBA" onClose={() => setModal(null)}>
          <RepairForm
            master={master}
            badItems={badItems}
            onSave={(data) => {
              onRepair(data);
              setModal(null);
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   RMA IMPORT MODAL
   ============================================================ */
function RmaImportModal({ onClose, existingRma, onImport, t, currentUserDisplayName }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const existingTicketNos = useMemo(
    () => existingRma.map((e) => e.ticketNo).filter(Boolean),
    [existingRma]
  );

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg("");
    setParseResult(null);
    setParsing(true);
    try {
      const res = await parseRmaFromExcel(selected, existingTicketNos);
      setParseResult(res);
    } catch (err) {
      setErrorMsg(err.message || "Gagal membaca file Excel.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || !parseResult.valid || parseResult.valid.length === 0) return;
    setImporting(true);

    const now = new Date().toISOString();
    const newEntries = parseResult.valid.map((item) => ({
      ...item,
      id: uid(),
      unitPhotos: [],
      labelPhotos: [],
      statusHistory: [
        {
          from: null,
          to: item.status || "",
          changedBy: currentUserDisplayName || "Excel Import",
          changedAt: now,
          note: "Tiket diimport dari Excel",
        },
      ],
    }));

    const combined = [...newEntries, ...existingRma];
    const ok = await onImport(combined);
    setImporting(false);
    if (ok !== false) {
      onClose();
    }
  };

  return (
    <Modal title={t.rmaImportModalTitle || "IMPORT RMA DARI EXCEL"} onClose={onClose} width={640}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InlineHint>
          {t.rmaImportHint || "File harus menggunakan format export dari aplikasi ini."}
        </InlineHint>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <Field label={t.rmaImportSelectFile || "Pilih file .xlsx / .xls"}>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            style={{
              fontFamily: sans,
              fontSize: 13,
              color: T.ink,
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              padding: "8px 12px",
              width: "100%",
            }}
          />
        </Field>

        {parsing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.ink2, fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            {t.rmaImportValidating || "Memvalidasi..."}
          </div>
        )}

        {parseResult && !parsing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {parseResult.headerError && (
              <InlineHint tone="warn">
                <strong>{t.rmaImportHeaderError || "Header tidak cocok"}:</strong> {parseResult.headerError}
              </InlineHint>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: T.greenDim, color: T.green, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                ✓ {parseResult.valid.length} {t.rmaImportValidRows || "Baris valid siap diimport"}
              </div>

              {parseResult.duplicates.length > 0 && (
                <div style={{ background: T.amberDim, color: T.amber, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                  ⚠ {parseResult.duplicates.length} {t.rmaImportDuplicates || "Duplikat (dilewati)"}
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div style={{ background: T.redDim, color: T.red, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                  ✕ {parseResult.errors.length} {t.rmaImportRowErrors || "Baris bermasalah"}
                </div>
              )}
            </div>

            {parseResult.errors.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: "auto", background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 6, padding: 8, fontSize: 12 }}>
                <strong style={{ color: T.red }}>{t.rmaImportRowErrors || "Detail Error Baris"}:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, color: T.ink2 }}>
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>
                      {(t.rmaImportRowLabel || "Baris")} {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose} disabled={importing}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            disabled={importing || !parseResult || parseResult.valid.length === 0}
            onClick={handleConfirmImport}
          >
            {importing && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {(t.rmaImportConfirm || "Import {n} Tiket").replace("{n}", parseResult?.valid?.length || 0)}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [tab, setTab] = useState("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [loading, setLoading] = useState(true);
  const [rma, setRma] = useState([]);
  const [wa, setWa] = useState([]);
  const [master, setMaster] = useState(DEFAULT_MASTER);
  const [pcba, setPcba] = useState(PCBA_DEFAULT);
  const [rmaModal, setRmaModal] = useState(null);
  const [rmaPreview, setRmaPreview] = useState(null);
  const [waModal, setWaModal] = useState(null);
  const [waMsgEntry, setWaMsgEntry] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    engineer: "",
    warranty: "",
    overdueOnly: false,
  });
  const [saveErr, setSaveErr] = useState("");
  const [rmaImportModal, setRmaImportModal] = useState(false);

  useEffect(() => {
    (async () => {
      const [r, w, m, p] = await Promise.all([
        storeGet(KEYS.rma, []),
        storeGet(KEYS.wa, []),
        storeGet(KEYS.master, DEFAULT_MASTER),
        storeGet(KEYS.pcba, PCBA_DEFAULT),
      ]);
      setRma(r);
      setWa(w);
      setMaster({ ...DEFAULT_MASTER, ...m });
      setPcba(p);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("hsgq_language", language);
    document.documentElement.setAttribute(
      "lang",
      language === "zh" ? "zh-CN" : language,
    );
  }, [language]);

  const saveRma = async (entry) => {
    // Check if Firebase Storage is available
    const storageAvailable = !!storage;

    // Upload any new photos that have a File object in fileRegistry.
    // Photos already saved (have a real url, no pending file) are kept as-is.
    const uploadCategory = async (photos, category) => {
      const results = [];
      for (const photo of photos) {
        const file = fileRegistry.get(photo.id);
        if (file && storageAvailable) {
          // New photo — upload to Firebase Storage
          try {
            const meta = await uploadRmaPhoto(file, entry.ticketNo, category, photo.id);
            fileRegistry.delete(photo.id);
            // Revoke local previewUrl to free memory
            if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
            results.push(meta); // clean metadata only — url is Firebase Storage URL
          } catch (err) {
            console.error(`[HSGQ] Upload ${category} gagal:`, err);
            setSaveErr(`Upload foto gagal: ${err.message}. Tiket disimpan tanpa foto tersebut.`);
            // Skip this photo — do not persist previewUrl or corrupt the ticket
          }
        } else {
          // Existing photo already in Firestore, or storage not available — keep metadata, strip previewUrl
          const { previewUrl: _p, ...rest } = photo;
          results.push(rest);
        }
      }
      return results;
    };

    const [uploadedUnitPhotos, uploadedLabelPhotos] = await Promise.all([
      uploadCategory(entry.unitPhotos || [], "unit"),
      uploadCategory(entry.labelPhotos || [], "label"),
    ]);

    const finalEntry = {
      ...entry,
      unitPhotos: uploadedUnitPhotos,
      labelPhotos: uploadedLabelPhotos,
    };

    const exists = rma.some((e) => e.id === finalEntry.id);
    const ok = await persistRma(
      exists
        ? rma.map((e) => (e.id === finalEntry.id ? finalEntry : e))
        : [finalEntry, ...rma],
    );
    if (ok) setRmaModal(null);
    return { ok: !!ok };
  };
  const persistRma = useCallback(async (arr) => {
    setRma(arr);
    const ok = await storeSet(KEYS.rma, arr);
    if (!ok) setSaveErr("Gagal menyimpan data RMA. Coba lagi.");
    return ok;
  }, []);
  const saveWa = async (entry) => {
    const exists = wa.some((e) => e.id === entry.id);
    const ok = await persistWa(
      exists ? wa.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...wa],
    );
    if (ok) setWaModal(null);
    return { ok: !!ok };
  };
  const persistWa = useCallback(async (arr) => {
    setWa(arr);
    const ok = await storeSet(KEYS.wa, arr);
    if (!ok) setSaveErr("Gagal menyimpan data WhatsApp. Coba lagi.");
    return ok;
  }, []);

  const persistPcba = useCallback(async (data) => {
    setPcba(data);
    const ok = await storeSet(KEYS.pcba, data);
    if (!ok) setSaveErr("Gagal menyimpan data PCBA. Coba lagi.");
    return ok;
  }, []);

  const onGoodsReceipt = useCallback(
    async (formData) => {
      const newItem = {
        id: uid(),
        serialNo: formData.serialNo.trim(),
        pcbaType: formData.pcbaType,
        product: formData.product.trim(),
        supplier: formData.supplier,
        warehouseLocation: formData.warehouseLocation,
        status: "Good",
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
      };
      const transaction = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: newItem.id,
        type: "Goods Receipt",
        rmaId: null,
        reason: formData.notes.trim() || "Penerimaan stok baru",
        createdAt: newItem.createdAt,
      };
      const newPcba = {
        items: [newItem, ...pcba.items],
        transactions: [transaction, ...pcba.transactions],
        replacements: pcba.replacements,
        repairs: pcba.repairs,
      };
      return persistPcba(newPcba);
    },
    [pcba, persistPcba]
  );

  const onReplacement = useCallback(
    async (formData) => {
      const newPcbaItem = pcba.items.find((i) => i.id === formData.newPcbaItemId);
      if (!newPcbaItem) return { ok: false, error: "PCBA baru tidak ditemukan." };
      if (newPcbaItem.status !== "Good") return { ok: false, error: "PCBA baru harus berstatus Good." };

      const oldItem = {
        id: uid(),
        serialNo: formData.oldSerialNo.trim(),
        pcbaType: newPcbaItem.pcbaType,
        product: newPcbaItem.product,
        supplier: newPcbaItem.supplier,
        warehouseLocation: newPcbaItem.warehouseLocation,
        status: "Bad",
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const replacement = {
        id: uid(),
        replacementNo: `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        rmaId: formData.rmaId,
        oldPcbaItemId: oldItem.id,
        newPcbaItemId: newPcbaItem.id,
        replacedBy: "Engineer",
        replacedAt: new Date().toISOString(),
      };

      const trxOut = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: newPcbaItem.id,
        type: "Replacement Out",
        rmaId: formData.rmaId,
        reason: `Replacement untuk RMA ${rma.find((x) => x.id === formData.rmaId)?.ticketNo || "-"}`,
        createdAt: new Date().toISOString(),
      };

      const trxIn = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: oldItem.id,
        type: "Replacement In (Bad)",
        rmaId: formData.rmaId,
        reason: `PCBA lama dari RMA ${rma.find((x) => x.id === formData.rmaId)?.ticketNo || "-"}`,
        createdAt: new Date().toISOString(),
      };

      const updatedItems = pcba.items.map((i) =>
        i.id === newPcbaItem.id ? { ...i, status: "Used for Replacement" } : i
      );
      const newPcba = {
        items: [oldItem, ...updatedItems],
        transactions: [trxOut, trxIn, ...pcba.transactions],
        replacements: [replacement, ...pcba.replacements],
        repairs: pcba.repairs,
      };
      return persistPcba(newPcba);
    },
    [pcba, rma, persistPcba]
  );

  const onRepair = useCallback(
    async (formData) => {
      const item = pcba.items.find((i) => i.id === formData.pcbaItemId);
      if (!item) return { ok: false, error: "PCBA tidak ditemukan." };
      if (item.status === "Good") return { ok: false, error: "PCBA Good tidak perlu direpair." };

      const repair = {
        id: uid(),
        repairNo: `RPR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: item.id,
        engineer: formData.engineer,
        analysis: formData.analysis.trim(),
        actionTaken: formData.actionTaken.trim(),
        componentsReplaced: formData.componentsReplaced.trim(),
        testingResult: formData.testingResult.trim(),
        repairResult: formData.repairResult,
        qcStatus: "Pending",
        createdAt: new Date().toISOString(),
      };

      const trx = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: item.id,
        type: "Repair Started",
        rmaId: null,
        reason: formData.analysis.trim() || "Mulai repair",
        createdAt: new Date().toISOString(),
      };

      const updatedItems = pcba.items.map((i) =>
        i.id === item.id ? { ...i, status: "Under Repair" } : i
      );
      const newPcba = {
        items: updatedItems,
        transactions: [trx, ...pcba.transactions],
        replacements: pcba.replacements,
        repairs: [repair, ...pcba.repairs],
      };
      return persistPcba(newPcba);
    },
    [pcba, persistPcba]
  );

  const onQc = useCallback(
    async (repairId, qcStatus) => {
      const repair = pcba.repairs.find((r) => r.id === repairId);
      if (!repair) return { ok: false, error: "Repair tidak ditemukan." };

      const item = pcba.items.find((i) => i.id === repair.pcbaItemId);
      if (!item) return { ok: false, error: "PCBA terkait tidak ditemukan." };

      const newStatus = qcStatus === "Passed" ? "Good" : "Bad";

      const updatedRepairs = pcba.repairs.map((r) =>
        r.id === repairId ? { ...r, qcStatus } : r
      );
      const updatedItems = pcba.items.map((i) =>
        i.id === item.id ? { ...i, status: newStatus } : i
      );

      const trx = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: item.id,
        type: qcStatus === "Passed" ? "QC Passed" : "QC Failed",
        rmaId: null,
        reason: `QC ${qcStatus} untuk repair ${repair.repairNo}`,
        createdAt: new Date().toISOString(),
      };

      const newPcba = {
        items: updatedItems,
        transactions: [trx, ...pcba.transactions],
        replacements: pcba.replacements,
        repairs: updatedRepairs,
      };
      return persistPcba(newPcba);
    },
    [pcba, persistPcba]
  );

  const unitHistoryLookup = useCallback(
    (sn, mac) => {
      const matches = (e, snField, macField) =>
        (sn && e[snField] && e[snField].toLowerCase() === sn.toLowerCase()) ||
        (mac && e[macField] && e[macField].toLowerCase() === mac.toLowerCase());
      const rmaHits = rma
        .filter((e) => matches(e, "sn", "mac"))
        .map((e) => ({ id: e.id, ref: e.ticketNo, status: e.status }));
      const waHits = wa
        .filter((e) => matches(e, "sn", "mac"))
        .map((e) => ({ id: e.id, ref: e.caseNo, status: e.status }));
      return [...rmaHits, ...waHits];
    },
    [rma, wa],
  );

  const filteredRma = useMemo(() => {
    const q = search.toLowerCase();
    return rma.filter((e) => {
      if (q && !JSON.stringify(e).toLowerCase().includes(q)) return false;
      if (filters.status && e.status !== filters.status) return false;
      if (filters.engineer && e.engineer !== filters.engineer) return false;
      if (filters.warranty && e.warrantyStatus !== filters.warranty)
        return false;
      if (filters.overdueOnly && !isOverdue(e)) return false;
      return true;
    });
  }, [rma, search, filters]);
  const filteredWa = useMemo(() => {
    const q = search.toLowerCase();
    return wa.filter((e) => !q || JSON.stringify(e).toLowerCase().includes(q));
  }, [wa, search]);

  const t = I18N[language] || I18N.id;
  const lastLoginLabel = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleString(
        language === "zh" ? "zh-CN" : language === "en" ? "en-US" : "id-ID",
      )
    : "-";

  const NAV = [
    { id: "home", label: t.home, icon: LayoutDashboard },
    { id: "rma", label: t.rmaLog, icon: PackageSearch },
    { id: "wa", label: t.waLog, icon: MessageSquare },
    { id: "unithistory", label: t.unitHistory, icon: ScanSearch },
    { id: "report", label: t.weeklyReport, icon: FileClock },
    { id: "pcba", label: t.pcbaInventory, icon: Boxes },
    { id: "settings", label: t.settings, icon: Settings2 },
  ];

  if (loading) {
    const tt = I18N[language] || I18N.id;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 500,
          background: T.void,
          color: T.ink2,
          fontFamily: sans,
          gap: 10,
        }}
      >
        <Loader2 className="spin" size={18} /> {tt.loadingData}
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const activeNavLabel = NAV.find((n) => n.id === tab)?.label || "";

  return (
    <div
      className="hsgq-app-shell"
      style={{
        display: "flex",
        minHeight: 680,
        background: T.void,
        color: T.ink,
        fontFamily: sans,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${T.line}`,
      }}
    >
      {mobileNavOpen && (
        <div
          className="hsgq-sidebar-backdrop"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <div
        className={`hsgq-sidebar${mobileNavOpen ? " mobile-open" : ""}`}
        style={{
          width: 230,
          background: T.panel,
          borderRight: `1px solid ${T.line}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <div
          onClick={() => {
            setTab("home");
            setMobileNavOpen(false);
          }}
          style={{
            padding: "18px 18px 16px",
            borderBottom: `1px solid ${T.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <img
            src={hsgqLogo}
            alt="HSGQ"
            style={{
              height: 55,
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div>
            <div
              style={{
                fontFamily: sans,
                fontWeight: 700,
                fontSize: 14.5,
                color: T.ink,
                letterSpacing: 0.1,
              }}
            >
                {"HSGQ RMA"}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: T.ink3,
                marginTop: 1,
                letterSpacing: 0.2,
              }}
            >
              RMA & Case Log Book
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: 1,
          }}
        >
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setMobileNavOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  background: active ? T.cyanDim : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: active ? T.cyan : T.ink2,
                  textAlign: "left",
                  fontFamily: sans,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={16} />
                {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="hsgq-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div
          className="hsgq-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 22px",
            background: T.panel,
            borderBottom: `1px solid ${T.line}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <button
              type="button"
              className="hsgq-mobile-menu-button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t.openMenu}
              title={t.openMenu}
            >
              <Menu size={17} />
            </button>
            <Menu size={17} color={T.ink3} className="hsgq-desktop-menu-icon" />
            <span
              style={{
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 14.5,
                color: T.ink,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeNavLabel}
            </span>
          </div>
          <div className="hsgq-header-actions">
            <button
              type="button"
              className="header-icon-button"
              title={resolvedTheme === "dark" ? "Light" : "Dark"}
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            <label className="language-select" title={t.language}>
              <Languages size={15} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <div
              className="hsgq-header-status"
              style={{
                background: isUsingFirebase ? T.greenDim : T.amberDim,
                color: isUsingFirebase ? T.green : T.amber,
              }}
            >
              {isUsingFirebase ? <Cloud size={13} /> : <CloudOff size={13} />}
              {isUsingFirebase ? t.firestoreConnected : t.localMode}
            </div>

            <UserCenter t={t} />
          </div>
        </div>

        <div
          className="hsgq-content"
          style={{ flex: 1, padding: 22, overflowY: "auto" }}
        >
          {!isUsingFirebase && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: T.amberDim,
                color: T.amber,
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 12.5,
                marginBottom: 14,
              }}
            >
              <AlertTriangle size={14} /> {t.firebaseWarning}
            </div>
          )}
          {saveErr && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: T.redDim,
                color: T.red,
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 12.5,
                marginBottom: 14,
              }}
            >
              <AlertTriangle size={14} /> {saveErr}
            </div>
          )}

          {tab === "home" && (
            <>
              <SectionHeader title={t.homeTitle} subtitle={t.homeSubtitle} />
              <Dashboard
                rma={rma}
                wa={wa}
                t={t}
                lastLoginLabel={lastLoginLabel}
              />
            </>
          )}

          {tab === "rma" && (
            <>
              <SectionHeader
                title={t.rmaPageTitle}
                subtitle={t.rmaPageSubtitle}
                action={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn
                      variant="ghost"
                      onClick={() => exportRmaToExcel(rma)}
                      title="Export seluruh data RMA ke .xlsx"
                    >
                      <FileDown size={14} /> {t.rmaExportExcel || "Export Excel"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => setRmaImportModal(true)}
                      title="Import data RMA dari file .xlsx / .xls"
                    >
                      <FileUp size={14} /> {t.rmaImportExcel || "Import Excel"}
                    </Btn>
                    <Btn
                      variant="solid"
                      onClick={() => setRmaModal({ mode: "new" })}
                    >
                      <Plus size={14} /> {t.rmaNewTicket}
                    </Btn>
                  </div>
                }
              />
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  placeholder={t.rmaSearchPlaceholder}
                />
                <Select
                  options={master.statusRMA}
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, status: e.target.value }))
                  }
                />
                <Select
                  options={master.engineers}
                  value={filters.engineer}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, engineer: e.target.value }))
                  }
                />
                <Select
                  options={master.warrantyStatuses}
                  value={filters.warranty}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, warranty: e.target.value }))
                  }
                />
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    color: T.ink2,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={filters.overdueOnly}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        overdueOnly: e.target.checked,
                      }))
                    }
                  />
                  {t.rmaOverdueOnly}
                </label>
                {(filters.status ||
                  filters.engineer ||
                  filters.warranty ||
                  filters.overdueOnly) && (
                  <Btn
                    variant="ghost"
                    onClick={() =>
                      setFilters({
                        status: "",
                        engineer: "",
                        warranty: "",
                        overdueOnly: false,
                      })
                    }
                  >
                    {t.resetFilter}
                  </Btn>
                )}
              </div>
              <DataTable
                columns={[
                  { key: "ticketNo", label: t.colTicket, mono: true },
                  {
                    key: "status",
                    label: t.colStatus,
                    render: (r) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <StatusLed status={r.status} />
                        {isOverdue(r) && <OverdueBadge />}
                      </div>
                    ),
                  },
                  { key: "engineer", label: t.colEngineer },
                  { key: "product", label: t.colProduct },
                  { key: "customerName", label: t.colCustomer },
                  { key: "warrantyStatus", label: t.colWarranty },
                  {
                    key: "receivedDate",
                    label: t.colReceived,
                    render: (r) => fmtDate(r.receivedDate),
                  },
                  {
                    key: "eta",
                    label: t.colEta,
                    render: (r) => fmtDate(r.eta),
                  },
                  {
                    key: "actions",
                    label: "",
                    render: (r) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn
                          icon={Eye}
                          onClick={() => setRmaPreview(r)}
                          title="Preview Detail"
                        />
                        <IconBtn
                          icon={MessageSquare}
                          onClick={() =>
                            setWaMsgEntry({ kind: "rma", entry: r })
                          }
                          title={t.waMessageAction}
                        />
                        <IconBtn
                          icon={Pencil}
                          onClick={() =>
                            setRmaModal({ mode: "edit", entry: r })
                          }
                          title={t.editAction}
                        />
                        <IconBtn
                          icon={Trash2}
                          danger
                          onClick={() => deleteRma(r.id)}
                          title={t.deleteAction}
                        />
                      </div>
                    ),
                  },
                ]}
                rows={filteredRma}
                emptyLabel={t.rmaEmptyList}
              />
            </>
          )}

          {tab === "wa" && (
            <>
              <SectionHeader
                title={t.waPageTitle}
                subtitle={t.waPageSubtitle}
                action={
                  <Btn
                    variant="solid"
                    onClick={() => setWaModal({ mode: "new" })}
                  >
                    <Plus size={14} /> {t.waNewCase}
                  </Btn>
                }
              />
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={t.waSearchPlaceholder}
              />
              <div style={{ height: 12 }} />
              <DataTable
                columns={[
                  { key: "caseNo", label: t.colCase, mono: true },
                  {
                    key: "status",
                    label: t.colStatus,
                    render: (r) => <StatusLed status={r.status} />,
                  },
                  { key: "engineerTag", label: t.colEngineer },
                  { key: "deviceType", label: t.colType },
                  { key: "customerName", label: t.colCustomer },
                  {
                    key: "caseDate",
                    label: t.colDate,
                    render: (r) => fmtDate(r.caseDate),
                  },
                  {
                    key: "comm",
                    label: t.colComm,
                    render: (r) => (r.commHistory || []).length + "x",
                  },
                  {
                    key: "actions",
                    label: "",
                    render: (r) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn
                          icon={MessageSquare}
                          onClick={() =>
                            setWaMsgEntry({ kind: "wa", entry: r })
                          }
                          title={t.waMessageAction}
                        />
                        <IconBtn
                          icon={Pencil}
                          onClick={() => setWaModal({ mode: "edit", entry: r })}
                          title={t.editAction}
                        />
                        <IconBtn
                          icon={Trash2}
                          danger
                          onClick={() => deleteWa(r.id)}
                          title={t.deleteAction}
                        />
                      </div>
                    ),
                  },
                ]}
                rows={filteredWa}
                emptyLabel={t.waEmptyList}
              />
            </>
          )}

          {tab === "unithistory" && (
            <>
              <SectionHeader
                title={t.unitHistory}
                subtitle={t.unitHistoryPageSubtitle}
              />
              <UnitHistory rma={rma} wa={wa} t={t} />
            </>
          )}

          {tab === "report" && (
            <>
              <SectionHeader
                title={t.weeklyReport}
                subtitle={t.reportPageSubtitle}
              />
              <WeeklyReport rma={rma} wa={wa} t={t} />
            </>
          )}

          {tab === "pcba" && (
            <>
              <SectionHeader
                title={t.pcbaInventory}
                subtitle="PCBA inventory management and repair tracking"
              />
              <PcbaInventoryTab
                pcba={pcba}
                rma={rma}
                master={master}
                onGoodsReceipt={onGoodsReceipt}
                onReplacement={onReplacement}
                onRepair={onRepair}
                onQc={onQc}
                t={t}
              />
            </>
          )}

          {tab === "settings" && (
            <>
              <SectionHeader
                title={t.settings}
                subtitle={t.settingsPageSubtitle}
              />
              <SettingsTab master={master} setMaster={setMaster} t={t} />
            </>
          )}
        </div>
      </div>

      {rmaPreview && (
        <RmaDetailModal entry={rmaPreview} onClose={() => setRmaPreview(null)} />
      )}
      {rmaModal && (
        <Modal
          title={
            rmaModal.mode === "new"
              ? t.rmaModalNewTitle
              : `${t.rmaModalEditPrefix} ${rmaModal.entry.ticketNo}`
          }
          onClose={() => setRmaModal(null)}
        >
          <RmaForm
            initial={rmaModal.entry}
            master={master}
            existingTicketNos={rma.map((e) => e.ticketNo)}
            unitHistoryLookup={unitHistoryLookup}
            onSave={saveRma}
            onClose={() => setRmaModal(null)}
            t={t}
          />
        </Modal>
      )}
      {waModal && (
        <Modal
          title={
            waModal.mode === "new"
              ? t.waModalNewTitle
              : `${t.rmaModalEditPrefix} ${waModal.entry.caseNo}`
          }
          onClose={() => setWaModal(null)}
        >
          <WaForm
            initial={waModal.entry}
            master={master}
            existingCaseNos={wa.map((e) => e.caseNo)}
            onSave={saveWa}
            onClose={() => setWaModal(null)}
            t={t}
          />
        </Modal>
      )}
      {waMsgEntry && (
        <Modal
          title={t.waMsgModalTitle}
          onClose={() => setWaMsgEntry(null)}
          width={560}
        >
          <div
            style={{
              background: T.void,
              border: `1px solid ${T.line}`,
              borderRadius: 8,
              padding: 16,
              fontFamily: mono,
              fontSize: 12.5,
              color: T.ink2,
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              maxHeight: 400,
              overflowY: "auto",
              marginBottom: 12,
            }}
          >
            {waMsgEntry.kind === "rma"
              ? rmaWaMessage(waMsgEntry.entry)
              : waWaMessage(waMsgEntry.entry)}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton
              text={
                waMsgEntry.kind === "rma"
                  ? rmaWaMessage(waMsgEntry.entry)
                  : waWaMessage(waMsgEntry.entry)
              }
              t={t}
            />
          </div>
        </Modal>
      )}
      {rmaImportModal && (
        <RmaImportModal
          onClose={() => setRmaImportModal(false)}
          existingRma={rma}
          onImport={persistRma}
          t={t}
          currentUserDisplayName={user?.displayName || user?.email || "User"}
        />
      )}
    </div>
  );
}
