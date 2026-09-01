import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  ChevronUp,
  ArrowUpDown,
  ListFilter,
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
  Cpu,
  RotateCcw,
  Users,
  ShieldAlert,
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
import rmaApi from "./api/rmaClient.js";
import waApi from "./api/waClient.js";
import pcbaApi from "./api/pcbaClient.js";
import masterApi from "./api/masterClient.js";
import { uploadLocalRmaPhoto } from "./api/uploadClient.js";
import UserCenter from "./components/UserCenter.jsx";
import UserManagementTab from "./components/UserManagementTab.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { PERMISSIONS, ROLES } from "./auth/rbac.js";

import hsgqLogo from "./assets/hsgq-logo.png";
import { exportRmaToExcel, parseRmaFromExcel } from "./utils/excelRma.js";
import { exportWaToExcel, parseWaFromExcel } from "./utils/excelWa.js";
import { exportPcbaToExcel, parsePcbaFromExcel, CHINA_SHIPMENT_COLUMNS, REPLACEMENT_COLUMNS } from "./utils/excelPcba.js";

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
    settingsPcbaReceivedBy: "PCBA Received By",
    settingsMinStockDefault: "Minimum Stok Default (unit)",
    // PCBA Inventory
    pcbaStock: "Stok",
    pcbaReplacement: "Replacement",
    pcbaSendToChina: "Kirim PCBA Bad ke China",
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
    pcbaSendToChinaItem: "PCBA Bad untuk Dikirim ke China",
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
    add: "Tambah",
    addItemPlaceholder: "Tambah item...",
    searchPlaceholder: "Cari...",
    copy: "Salin",
    copied: "Tersalin",
    copyFailed: "Gagal menyalin",
    editAction: "Edit",
    deleteAction: "Hapus",
    waMessageAction: "Pesan WA",
    resetFilter: "Reset Filter",
    colTicket: "Ticket",
    colCase: "Case",
    colStatus: "Status",
    colEngineer: "Engineer",
    colProduct: "Produk",
    errCustomerPhoneRequired: "Nomor HP Customer wajib diisi.",
    errDeviceTypeRequired: "Type Perangkat wajib diisi.",
    errSnRequired: "SN wajib diisi.",
    errMacRequired: "MAC wajib diisi.",
    weeklyReportTitle: "RINGKASAN MINGGUAN - TECHNICAL SUPPORT",
    weeklyReportPeriod: "Periode",
    weeklyReportActivitySummary: "Ringkasan Kegiatan",
    weeklyReportMonitoring: "Monitoring OLT dan ONU",
    weeklyReportTroubleshooting: "Troubleshooting Issue Customer",
    weeklyReportSupport: "Technical Support HSGQ Jakarta",
    weeklyReportIssueSection: "Kendala & Penanganan",
    weeklyReportDateLabel: "Tanggal",
    weeklyReportCustomerLabel: "Customer / Perusahaan",
    weeklyReportTypeLabel: "Tipe Perangkat",
    weeklyReportProblemLabel: "Kendala",
    weeklyReportAnalysisLabel: "Analisa",
    weeklyReportSolutionLabel: "Solusi",
    weeklyReportStatusLabel: "Status",
    weeklyReportSolvedOn: "Selesai pada {date}",
    weeklyReportFollowUp: "Follow up / monitoring",
    statusCompleted: "Selesai",
    statusCustomerReceived: "Diterima Customer",
    statusOnProgress: "Sedang Diperbaiki",
    statusOnChecking: "Sedang Dicek",
    statusWaiting: "Menunggu",
    pcbaStatusRepaired: "Repaired",
    pcbaSubtitle: "Manajemen inventaris dan perbaikan PCBA",
    colCompany: "Perusahaan",
    colPhone: "No. HP",
    colInitialProblem: "Kendala Awal",
    colFinalAnalysis: "Analisa Akhir",
    colSolvedDate: "Tgl Solved",
    colCaseAge: "Umur (Hari)",
    colDetail: "Detail",
    viewDetail: "Lihat Detail",
    pcbaEmptyStock: "Belum ada PCBA di stok. Klik 'Terima PCBA Baru' untuk mulai.",
    pcbaEmptyReplacement: "Belum ada replacement PCBA.",
    pcbaEmptySendToChina: "Belum ada data pengiriman PCBA Bad ke China. Klik 'Kirim PCBA Bad ke China' untuk mencatat.",
    pcbaEmptyTransactions: "Belum ada transaksi stok. Transaksi tercatat otomatis (append-only, tidak bisa diedit/dihapus).",
    pcbaNewReplacement: "Replacement Baru",
    pcbaNoReplacement: "No. Replacement",
    pcbaSendToChinaTitle: "KIRIM PCBA BAD KE CHINA",
    pcbaNoTransaction: "No. Transaksi",
    pcbaReceiveNewTitle: "TERIMA PCBA BARU (GOODS RECEIPT)",
    pcbaReplacementTitle: "REPLACEMENT PCBA",
    pcbaDeleteConfirmTitle: "KONFIRMASI HAPUS PCBA",
    pcbaStockHistory: "Riwayat Transaksi Stok ({n})",
    pcbaChinaShipmentHistory: "Riwayat Kirim ke China ({n})",
    close: "Tutup",
    analysis: "Analisis",
    action: "Tindakan",
    pcbaSaveStockIn: "Simpan Stok Masuk",
    pcbaReceivedDate: "Tanggal Penerimaan",
    pcbaReceivedBy: "Penerima PCBA",
    pcbaDeleteConfirmMsg: "Data PCBA akan dihapus dan tindakan ini tidak dapat dibatalkan.",
    pcbaDeleteReferencedMsg: "PCBA ini sudah memiliki riwayat replacement atau pengiriman dan tidak dapat dihapus untuk menjaga integritas data audit.",
    pcbaTypeOverview: "Ringkasan Tipe PCBA",
    pcbaNoTypesConfigured: "Belum ada Tipe PCBA terkonfigurasi.",
    pcbaTotalStock: "Total Stok",
    pcbaDeleteFailed: "Gagal menghapus PCBA. Silakan coba lagi.",
    pcbaDupeSerial: "No. Serial PCBA ini sudah terdaftar di stok.",
    pcbaErrReceivedDateRequired: "Tanggal Penerimaan wajib diisi.",
    pcbaErrReceivedByRequired: "Penerima PCBA wajib diisi.",
    pcbaColReceivedDate: "Tanggal Penerimaan",
    pcbaColReceivedBy: "Penerima",
    pcbaRelatedRma: "RMA Terkait",
    pcbaSearchRmaPlaceholder: "Cari nomor RMA (misal: 20260813)...",
    pcbaSelectRmaPlaceholder: "— Pilih RMA Terkait —",
    pcbaNoRmaFound: "RMA tidak ditemukan",
    pcbaUnlinkedRma: "— Tidak terkait RMA —",
    pcbaSnNotFoundInRma: "SN PCBA tidak ditemukan pada RMA terkait.",
    pcbaSelectRmaFirstPlaceholder: "Pilih RMA terkait terlebih dahulu...",
    pcbaNewGoodStock: "PCBA Baru (stok Good)",
    pcbaOldSerialLabel: "No. Serial PCBA Lama (yang dilepas dari unit)",
    pcbaProcessReplacement: "Proses Replacement",
    pcbaSelectBadItem: "Pilih dari Daftar PCBA Bad",
    pcbaNoBadItemsAvailable: "Tidak ada PCBA dengan status Bad di stok saat ini.",
    editReplacementTitle: "EDIT REPLACEMENT PCBA",
    editChinaShipmentTitle: "EDIT PENGIRIMAN KE CHINA",
    colChinaStatus: "Status Kirim China",
    statusSent: "Sent",
    statusNotSent: "Belum Dikirim",
    toastPcbaSentToChina: "PCBA Bad berhasil dicatat untuk dikirim ke China.",
    toastShipmentDeleted: "Data pengiriman ke China dibatalkan dan status PCBA kembali ke Bad.",
    toastPcbaUpdated: "Data PCBA berhasil diperbarui.",
    toastPcbaDeleted: "Item PCBA berhasil dihapus.",
    toastReplacementUpdated: "Data replacement berhasil diperbarui.",
    toastChinaShipmentUpdated: "Data pengiriman ke China berhasil diperbarui.",
    toastTransactionDeleted: "Transaksi berhasil dihapus.",
    deleteTransactionTitle: "KONFIRMASI HAPUS TRANSAKSI",
    deleteTransactionMsg: "Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.",
    deleteReplacementTitle: "KONFIRMASI HAPUS REPLACEMENT",
    deleteReplacementMsg: "Apakah Anda yakin ingin menghapus data replacement ini? Status PCBA baru akan dikembalikan menjadi Good.",
    toastReplacementDeleted: "Data replacement berhasil dihapus.",
    deleteChinaShipmentTitle: "KONFIRMASI BATALKAN PENGIRIMAN",
    deleteChinaShipmentMsg: "Apakah Anda yakin ingin membatalkan/menghapus data pengiriman ini? Status PCBA terkait akan dikembalikan menjadi Bad.",
    pcbaImportExcel: "Import Excel",
    pcbaImportModalTitle: "IMPORT PCBA DARI EXCEL",
    pcbaImportHint: "File Excel harus memiliki kolom: 'PCBA Serial No.', 'PCBA Type', dan 'Date'.",
    pcbaImportValidCount: "PCBA valid siap diimport",
    pcbaImportButton: "Import PCBA",
    toastPcbaImportSuccess: "Import berhasil. {count} PCBA berhasil ditambahkan ke inventory.",
    userManagement: "User Management",
    userManagementSubtitle: "Kelola akun pengguna, role hak akses, dan status akun",
    accessDeniedTitle: "403 AKSES DITOLAK",
    accessDeniedMsg: "Anda tidak memiliki izin (Permission Denied) untuk mengakses halaman ini.",
    forbiddenAction: "Tindakan ditolak: Anda tidak memiliki izin untuk operasi ini.",
    toastWaDeleted: "Case WhatsApp {no} berhasil dihapus.",
    toastWaSaved: "Case WhatsApp berhasil disimpan.",
    waSaveFailed: "Gagal menyimpan case. Coba lagi.",
    toastRmaDeleted: "Tiket RMA {no} berhasil dihapus.",
    deleteWaTitle: "HAPUS CASE WHATSAPP",
    deleteRmaTitle: "HAPUS TIKET RMA",
    deleteConfirmText: "Apakah Anda yakin ingin menghapus {type} berikut?",
    waCase: "case WhatsApp",
    rmaTicket: "tiket RMA",
    waImportTotalDetected: "Total terdeteksi: {n} baris",
    waImportDupeHandlingTitle: "Penanganan Duplikat:",
    waImportDupeSkipNote: "({n} record duplikat dilewati)",
    waImportDupeNewNote: "(generate Nomor Case baru)",
    rmaInfoTicket: "Informasi Tiket",
    rmaInfoReceiving: "Receiving",
    rmaInfoPhysical: "Kondisi Fisik",
    rmaUnitPhotos: "Foto Unit Perangkat",
    rmaLabelPhotos: "Foto Label SN / MAC",
    rmaCustomerComplaint: "Keluhan Customer",
    rmaPhysicalDamageNotes: "Catatan Kerusakan Fisik",
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
    rmaSortBy: "Urutkan",
    rmaSortNewest: "Terbaru (Masuk)",
    rmaSortOldest: "Terlama (Masuk)",
    rmaSortLastUpdated: "Status Terbaru",
    rmaSortOldestUpdated: "Status Terlama",
    rmaShowing: "Menampilkan {shown} dari {total} tiket",
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
    rmaQcResult: "Hasil Akhir",
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
    waExportExcel: "Export Excel",
    waImportExcel: "Import Excel",
    waImportModalTitle: "IMPORT WHATSAPP LOG DARI EXCEL",
    waImportSelectFile: "Pilih file .xlsx / .xls",
    waImportHint: "File harus menggunakan format Excel standar (LOGBOOKWhatsAPP.xlsx). Kolom wajib: Nama Customer dan Kendala Awal.",
    waImportValidating: "Memvalidasi...",
    waImportHeaderError: "Header tidak cocok",
    waImportRowErrors: "Baris bermasalah",
    waImportDuplicates: "Duplikat terdeteksi",
    waImportValidRows: "Baris valid siap diimport",
    waImportConfirm: "Import {n} Case",
    waImportSuccess: "Berhasil mengimport {n} case WhatsApp baru.",
    waImportRowLabel: "Baris",
    waImportDupeSkip: "Dilewati",
    waImportDupeImportNew: "Import duplikat sebagai case baru",
    waExportAll: "Export Semua Record ({n})",
    waExportFiltered: "Export Record Difilter ({n})",
    fromDate: "Dari Tanggal",
    toDate: "Sampai Tanggal",
    applyFilter: "Terapkan",
    resetDate: "Reset Tanggal",
    today: "Hari Ini",
    last7Days: "7 Hari Terakhir",
    last30Days: "30 Hari Terakhir",
    thisMonth: "Bulan Ini",
    lastMonth: "Bulan Lalu",
    thisYear: "Tahun Ini",
    totalWaCases: "Total Case",
    noDataForDateRange: "Tidak ada data pada rentang tanggal yang dipilih.",
    presetSelect: "Pilih Preset",
    customRange: "Custom (Bebas)",
    colChannel: "Channel",
    colProblem: "Kendala / Analisa",
    unitHistoryShowing: "Menampilkan {shown} dari {total} riwayat unit",
    noDataToExport: "Tidak ada data untuk diexport.",
    colShipped: "Tgl Dikirim",
    colDiagnosis: "Diagnosis (Kendala Awal)",
    colFinalResult: "Hasil Akhir",
    totalUnitHistory: "Total Riwayat Unit",
    totalUnitHistoryHeading: "TOTAL RIWAYAT UNIT",
    sectionRma: "RMA",
    sectionWa: "WHATSAPP",
    totalRmaBadge: "Total RMA",
    totalWaBadge: "Total WhatsApp",
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
    copyFailed: "Failed to copy",
    editAction: "Edit",
    deleteAction: "Delete",
    waMessageAction: "WA Message",
    resetFilter: "Reset Filter",
    colTicket: "Ticket",
    colCase: "Case",
    colStatus: "Status",
    colEngineer: "Engineer",
    colProduct: "Product",
    errCustomerPhoneRequired: "Customer phone number is required.",
    errDeviceTypeRequired: "Device type is required.",
    errSnRequired: "SN is required.",
    errMacRequired: "MAC is required.",
    weeklyReportTitle: "WEEKLY SUMMARY - TECHNICAL SUPPORT",
    weeklyReportPeriod: "Period",
    weeklyReportActivitySummary: "Activity Summary",
    weeklyReportMonitoring: "OLT and ONU Monitoring",
    weeklyReportTroubleshooting: "Customer Issue Troubleshooting",
    weeklyReportSupport: "HSGQ Jakarta Technical Support",
    weeklyReportIssueSection: "Issue & Troubleshooting",
    weeklyReportDateLabel: "Date",
    weeklyReportCustomerLabel: "Customer / Company",
    weeklyReportTypeLabel: "Device Type",
    weeklyReportProblemLabel: "Problem / Issue",
    weeklyReportAnalysisLabel: "Analysis",
    weeklyReportSolutionLabel: "Solution",
    weeklyReportStatusLabel: "Status",
    weeklyReportSolvedOn: "Completed on {date}",
    weeklyReportFollowUp: "Follow up / monitoring",
    statusCompleted: "Completed",
    statusCustomerReceived: "Customer Received",
    statusOnProgress: "On Progress",
    statusOnChecking: "On Checking",
    statusWaiting: "Waiting",
    pcbaStatusRepaired: "Repaired",
    pcbaSubtitle: "PCBA inventory management and repair tracking",
    colCompany: "Company",
    colPhone: "Phone No.",
    colInitialProblem: "Initial Problem",
    colFinalAnalysis: "Final Analysis",
    colSolvedDate: "Solved Date",
    colCaseAge: "Age (Days)",
    colDetail: "Detail",
    viewDetail: "View Detail",
    pcbaEmptyStock: "No PCBA in stock. Click 'Receive New PCBA' to begin.",
    pcbaEmptyReplacement: "No PCBA replacements.",
    pcbaEmptySendToChina: "No Bad PCBA shipments to China. Click 'Send Bad PCBA to China' to record.",
    pcbaEmptyTransactions: "No stock transactions. Transactions are logged automatically (append-only, cannot be edited/deleted).",
    pcbaNewReplacement: "New Replacement",
    pcbaNoReplacement: "Replacement No.",
    pcbaSendToChinaTitle: "SEND BAD PCBA TO CHINA",
    pcbaNoTransaction: "Transaction No.",
    pcbaReceiveNewTitle: "RECEIVE NEW PCBA (GOODS RECEIPT)",
    pcbaReplacementTitle: "REPLACEMENT PCBA",
    pcbaDeleteConfirmTitle: "CONFIRM DELETE PCBA",
    pcbaStockHistory: "Stock Transaction History ({n})",
    pcbaChinaShipmentHistory: "Shipment to China History ({n})",
    close: "Close",
    analysis: "Analysis",
    action: "Action",
    pcbaSaveStockIn: "Save Stock In",
    pcbaReceivedDate: "Received Date",
    pcbaReceivedBy: "Received By",
    pcbaDeleteConfirmMsg: "This PCBA record will be permanently deleted.",
    pcbaDeleteReferencedMsg: "This PCBA has replacement or shipment history and cannot be deleted to preserve audit integrity.",
    pcbaDeleteFailed: "Failed to delete PCBA. Please try again.",
    pcbaDupeSerial: "This PCBA serial number already exists in stock.",
    pcbaErrReceivedDateRequired: "Received Date is required.",
    pcbaErrReceivedByRequired: "Received By is required.",
    pcbaColReceivedDate: "Received Date",
    pcbaColReceivedBy: "Received By",
    pcbaRelatedRma: "Related RMA",
    pcbaSearchRmaPlaceholder: "Search RMA number (e.g. 20260813)...",
    pcbaSelectRmaPlaceholder: "— Select Related RMA —",
    pcbaNoRmaFound: "No RMA found",
    pcbaUnlinkedRma: "— Not linked to RMA —",
    pcbaSnNotFoundInRma: "PCBA SN not found in related RMA.",
    pcbaSelectRmaFirstPlaceholder: "Select related RMA first...",
    pcbaNewGoodStock: "New PCBA (Good stock)",
    pcbaOldSerialLabel: "Old PCBA Serial No. (removed from unit)",
    pcbaProcessReplacement: "Process Replacement",
    pcbaSelectBadItem: "Select from Bad PCBA List",
    pcbaNoBadItemsAvailable: "No PCBA with Bad status available in stock.",
    editReplacementTitle: "EDIT PCBA REPLACEMENT",
    editChinaShipmentTitle: "EDIT SHIPMENT TO CHINA",
    colChinaStatus: "China Status",
    statusSent: "Sent",
    statusNotSent: "Not Sent",
    toastPcbaSentToChina: "Bad PCBA successfully recorded as sent to China.",
    toastShipmentDeleted: "Shipment to China cancelled and PCBA status restored to Bad.",
    toastPcbaUpdated: "PCBA data updated successfully.",
    toastPcbaDeleted: "PCBA item deleted successfully.",
    toastReplacementUpdated: "Replacement record updated successfully.",
    toastChinaShipmentUpdated: "China shipment data updated successfully.",
    pcbaTypeOverview: "PCBA Type Overview",
    pcbaNoTypesConfigured: "No PCBA types configured.",
    pcbaTotalStock: "Total Stock",
    toastTransactionDeleted: "Transaction deleted successfully.",
    deleteTransactionTitle: "CONFIRM DELETE TRANSACTION",
    deleteTransactionMsg: "Are you sure you want to delete this transaction? This action cannot be undone.",
    deleteReplacementTitle: "CONFIRM DELETE REPLACEMENT",
    deleteReplacementMsg: "Are you sure you want to delete this replacement record? The new PCBA status will be restored to Good.",
    toastReplacementDeleted: "Replacement record deleted successfully.",
    deleteChinaShipmentTitle: "CONFIRM CANCEL SHIPMENT",
    deleteChinaShipmentMsg: "Are you sure you want to cancel this shipment? The PCBA status will revert to Bad.",
    pcbaImportExcel: "Import Excel",
    pcbaImportModalTitle: "IMPORT PCBA FROM EXCEL",
    pcbaImportHint: "Excel file must contain columns: 'PCBA Serial No.', 'PCBA Type', and 'Date'.",
    pcbaImportValidCount: "valid PCBA ready to import",
    pcbaImportButton: "Import PCBA",
    toastPcbaImportSuccess: "Import successful. {count} PCBA added to inventory.",
    userManagement: "User Management",
    userManagementSubtitle: "Manage user accounts, RBAC roles, and account statuses",
    accessDeniedTitle: "403 ACCESS DENIED",
    accessDeniedMsg: "You do not have permission to access this page.",
    forbiddenAction: "Forbidden: You do not have permission for this operation.",
    toastWaDeleted: "WhatsApp case {no} deleted successfully.",
    toastWaSaved: "WhatsApp case saved successfully.",
    waSaveFailed: "Failed to save case. Try again.",
    toastRmaDeleted: "RMA ticket {no} deleted successfully.",
    deleteWaTitle: "DELETE WHATSAPP CASE",
    deleteRmaTitle: "DELETE RMA TICKET",
    deleteConfirmText: "Are you sure you want to delete the following {type}?",
    waCase: "WhatsApp case",
    rmaTicket: "RMA ticket",
    waImportTotalDetected: "Total detected: {n} rows",
    waImportDupeHandlingTitle: "Duplicate Handling:",
    waImportDupeSkipNote: "({n} duplicate records skipped)",
    waImportDupeNewNote: "(generate new Case Number)",
    rmaInfoTicket: "Ticket Information",
    rmaInfoReceiving: "Receiving",
    rmaInfoPhysical: "Physical Condition",
    rmaUnitPhotos: "Device Unit Photos",
    rmaLabelPhotos: "SN / MAC Label Photos",
    rmaCustomerComplaint: "Customer Complaint",
    rmaPhysicalDamageNotes: "Physical Damage Notes",
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
    rmaSortBy: "Sort by",
    rmaSortNewest: "Newest (Received)",
    rmaSortOldest: "Oldest (Received)",
    rmaSortLastUpdated: "Last Status Update",
    rmaSortOldestUpdated: "Oldest Status Update",
    rmaShowing: "Showing {shown} of {total} tickets",
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
    settingsPcbaReceivedBy: "PCBA Received By",
    settingsMinStockDefault: "Default Minimum Stock (unit)",
    // PCBA Inventory
    pcbaStock: "Stock",
    pcbaReplacement: "Replacement",
    pcbaSendToChina: "Send Bad PCBA to China",
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
    pcbaSendToChinaItem: "Bad PCBA for Shipment to China",
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
    waExportExcel: "Export Excel",
    waImportExcel: "Import Excel",
    waImportModalTitle: "IMPORT WHATSAPP LOG FROM EXCEL",
    waImportSelectFile: "Select .xlsx / .xls file",
    waImportHint: "File must use the standard Excel format (LOGBOOKWhatsAPP.xlsx). Required columns: Customer Name and Initial Problem.",
    waImportValidating: "Validating...",
    waImportHeaderError: "Header mismatch",
    waImportRowErrors: "Invalid rows",
    waImportDuplicates: "Duplicates detected",
    waImportValidRows: "Valid rows ready to import",
    waImportConfirm: "Import {n} Cases",
    waImportSuccess: "Successfully imported {n} new WhatsApp cases.",
    waImportRowLabel: "Row",
    waImportDupeSkip: "Skipped",
    waImportDupeImportNew: "Import duplicates as new cases",
    waExportAll: "Export All Records ({n})",
    waExportFiltered: "Export Filtered Records ({n})",
    fromDate: "From Date",
    toDate: "To Date",
    applyFilter: "Apply",
    resetDate: "Reset Date",
    today: "Today",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    totalWaCases: "Total Cases",
    noDataForDateRange: "No data found for the selected date range",
    presetSelect: "Select Preset",
    customRange: "Custom Range",
    colChannel: "Channel",
    colProblem: "Issue / Analysis",
    unitHistoryShowing: "Showing {shown} of {total} unit history records",
    noDataToExport: "No data to export.",
    colShipped: "Shipped Date",
    colDiagnosis: "Diagnosis (Initial Problem)",
    colFinalResult: "Final Result",
    totalUnitHistory: "Total Unit History",
    totalUnitHistoryHeading: "TOTAL UNIT HISTORY",
    sectionRma: "RMA",
    sectionWa: "WHATSAPP",
    totalRmaBadge: "Total RMA",
    totalWaBadge: "Total WhatsApp",
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
    copyFailed: "复制失败",
    editAction: "编辑",
    deleteAction: "删除",
    waMessageAction: "WA 消息",
    resetFilter: "重置筛选",
    colTicket: "工单号",
    colCase: "案例编号",
    colStatus: "状态",
    colEngineer: "工程师",
    colProduct: "产品",
    errCustomerPhoneRequired: "客户电话号码为必填项。",
    errDeviceTypeRequired: "设备型号为必填项。",
    errSnRequired: "SN 为必填项。",
    errMacRequired: "MAC 为必填项。",
    weeklyReportTitle: "每周摘要 - 技术支持",
    weeklyReportPeriod: "时间段",
    weeklyReportActivitySummary: "活动摘要",
    weeklyReportMonitoring: "OLT 和 ONU 监控",
    weeklyReportTroubleshooting: "客户故障排查",
    weeklyReportSupport: "HSGQ 雅加达技术支持",
    weeklyReportIssueSection: "问题与排查",
    weeklyReportDateLabel: "日期",
    weeklyReportCustomerLabel: "客户 / 公司",
    weeklyReportTypeLabel: "设备型号",
    weeklyReportProblemLabel: "问题",
    weeklyReportAnalysisLabel: "分析",
    weeklyReportSolutionLabel: "解决方案",
    weeklyReportStatusLabel: "状态",
    weeklyReportSolvedOn: "完成于 {date}",
    weeklyReportFollowUp: "跟进 / 监控",
    statusCompleted: "已完成",
    statusCustomerReceived: "客户已收货",
    statusOnProgress: "处理中",
    statusOnChecking: "检测中",
    statusWaiting: "等待中",
    pcbaStatusRepaired: "已修复",
    pcbaSubtitle: "PCBA 库存管理与维修跟踪",
    colCompany: "公司",
    colPhone: "电话号码",
    colInitialProblem: "初始故障描述",
    colFinalAnalysis: "最终分析",
    colSolvedDate: "解决日期",
    colCaseAge: "时长 (天)",
    colDetail: "详情",
    viewDetail: "查看详情",
    pcbaEmptyStock: "库存中暂无 PCBA。点击「接收新 PCBA」开始。",
    pcbaEmptyReplacement: "暂无 PCBA 替换记录。",
    pcbaEmptySendToChina: "暂无寄送至中国的不良 PCBA 记录。点击「寄送不良 PCBA 至中国」开始记录。",
    pcbaEmptyTransactions: "暂无库存交易记录。交易将自动记录（仅追加，不可编辑/删除）。",
    pcbaNewReplacement: "新替换",
    pcbaNoReplacement: "替换编号",
    pcbaSendToChinaTitle: "寄送不良 PCBA 至中国",
    pcbaNoTransaction: "交易编号",
    pcbaReceiveNewTitle: "接收新 PCBA (入库)",
    pcbaReplacementTitle: "PCBA 替换",
    pcbaDeleteConfirmTitle: "确认删除 PCBA",
    pcbaStockHistory: "库存交易历史 ({n})",
    pcbaChinaShipmentHistory: "寄送中国历史 ({n})",
    close: "关闭",
    analysis: "分析",
    action: "处理措施",
    pcbaSaveStockIn: "保存入库",
    pcbaReceivedDate: "接收日期",
    pcbaReceivedBy: "接收人",
    pcbaDeleteConfirmMsg: "此 PCBA 记录将被永久删除。",
    pcbaDeleteReferencedMsg: "此 PCBA 已有交易/寄送记录，无法永久删除。",
    pcbaDeleteFailed: "删除 PCBA 失败，请重试。",
    pcbaDupeSerial: "此 PCBA 序列号在库存中已存在。",
    pcbaErrReceivedDateRequired: "接收日期为必填项。",
    pcbaErrReceivedByRequired: "接收人为必填项。",
    pcbaColReceivedDate: "接收日期",
    pcbaColReceivedBy: "接收人",
    pcbaRelatedRma: "相关 RMA",
    pcbaSearchRmaPlaceholder: "搜索工单号 (例如: 20260813)...",
    pcbaSelectRmaPlaceholder: "— 选择关联工单 —",
    pcbaNoRmaFound: "未找到相关工单",
    pcbaUnlinkedRma: "— 未关联工单 —",
    pcbaSnNotFoundInRma: "相关工单中未找到 PCBA 序列号。",
    pcbaSelectRmaFirstPlaceholder: "请先选择关联工单...",
    pcbaNewGoodStock: "新 PCBA (良品库存)",
    pcbaOldSerialLabel: "旧 PCBA 序列号 (拆卸于设备)",
    pcbaProcessReplacement: "处理替换",
    pcbaSelectBadItem: "从不良品列表中选择",
    pcbaNoBadItemsAvailable: "库存中暂无不良品状态的 PCBA。",
    editReplacementTitle: "编辑 PCBA 替换",
    editChinaShipmentTitle: "编辑寄送中国记录",
    colChinaStatus: "寄送中国状态",
    statusSent: "已寄送",
    statusNotSent: "未寄送",
    toastPcbaSentToChina: "不良 PCBA 已成功记录寄送至中国。",
    toastShipmentDeleted: "寄送中国记录已取消，PCBA 状态已恢复为不良品。",
    toastPcbaUpdated: "PCBA 数据更新成功。",
    toastPcbaDeleted: "PCBA 项目删除成功。",
    toastReplacementUpdated: "替换记录更新成功。",
    toastChinaShipmentUpdated: "寄送中国记录更新成功。",
    pcbaTypeOverview: "PCBA 类型概览",
    pcbaNoTypesConfigured: "尚未配置 PCBA 类型。",
    pcbaTotalStock: "库存总数",
    toastTransactionDeleted: "交易成功删除。",
    deleteTransactionTitle: "确认删除交易",
    deleteTransactionMsg: "您确定要删除此交易吗？此操作无法撤销。",
    deleteReplacementTitle: "确认删除替换",
    deleteReplacementMsg: "您确定要删除此替换记录吗？新 PCBA 状态将恢复为良品。",
    toastReplacementDeleted: "替换记录成功删除。",
    deleteChinaShipmentTitle: "确认取消寄送",
    deleteChinaShipmentMsg: "您确定要取消此寄送记录吗？相关 PCBA 状态将恢复为不良品。",
    pcbaImportExcel: "从 Excel 导入",
    pcbaImportModalTitle: "从 EXCEL 导入 PCBA",
    pcbaImportHint: "Excel 文件必须包含列：'PCBA Serial No.'、'PCBA Type' 和 'Date'。",
    pcbaImportValidCount: "个有效 PCBA 准备导入",
    pcbaImportButton: "导入 PCBA",
    toastPcbaImportSuccess: "导入成功。已将 {count} 个 PCBA 添加到库存。",
    userManagement: "用户管理",
    userManagementSubtitle: "管理用户账户、权限角色及账户状态",
    accessDeniedTitle: "403 访问被拒绝",
    accessDeniedMsg: "您没有权限访问此页面。",
    forbiddenAction: "禁止操作：您没有执行此操作的权限。",
    toastWaDeleted: "WhatsApp 案例 {no} 删除成功。",
    toastWaSaved: "案例保存成功。",
    waSaveFailed: "案例保存失败。请重试。",
    toastRmaDeleted: "RMA 工单 {no} 删除成功。",
    deleteWaTitle: "删除 WHATSAPP 案例",
    deleteRmaTitle: "删除 RMA 工单",
    deleteConfirmText: "确定要删除此 {type} 吗？",
    waCase: "WhatsApp 案例",
    rmaTicket: "RMA 工单",
    waImportTotalDetected: "共检测到：{n} 行",
    waImportDupeHandlingTitle: "重复项处理：",
    waImportDupeSkipNote: "(跳过 {n} 条重复记录)",
    waImportDupeNewNote: "(生成新的案例编号)",
    rmaInfoTicket: "工单信息",
    rmaInfoReceiving: "接收信息",
    rmaInfoPhysical: "外观状况",
    rmaUnitPhotos: "设备外观照片",
    rmaLabelPhotos: "SN / MAC 标签照片",
    rmaCustomerComplaint: "客户故障描述",
    rmaPhysicalDamageNotes: "外观损坏备注",
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
    rmaSortBy: "排序",
    rmaSortNewest: "最新（接收日期）",
    rmaSortOldest: "最早（接收日期）",
    rmaSortLastUpdated: "最新状态更新",
    rmaSortOldestUpdated: "最早状态更新",
    rmaShowing: "显示 {shown} / {total} 张工单",
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
    settingsPcbaReceivedBy: "PCBA 接收人",
    settingsMinStockDefault: "默认最低库存（件）",
    // PCBA Inventory
    pcbaStock: "库存",
    pcbaReplacement: "替换",
    pcbaSendToChina: "寄送不良 PCBA 至中国",
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
    pcbaSendToChinaItem: "寄送至中国的不良 PCBA",
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
    waExportExcel: "导出 Excel",
    waImportExcel: "导入 Excel",
    waImportModalTitle: "从 EXCEL 导入 WHATSAPP 日志",
    waImportSelectFile: "选择 .xlsx / .xls 文件",
    waImportHint: "文件必须使用标准 Excel 格式 (LOGBOOKWhatsAPP.xlsx)。必填列：Customer Name 和 Initial Problem。",
    waImportValidating: "验证中...",
    waImportHeaderError: "列标题不匹配",
    waImportRowErrors: "无效行",
    waImportDuplicates: "检测到重复项",
    waImportValidRows: "有效行，准备导入",
    waImportConfirm: "导入 {n} 个案例",
    waImportSuccess: "成功导入 {n} 个新 WhatsApp 案例。",
    waImportRowLabel: "行",
    waImportDupeSkip: "已跳过",
    waImportDupeImportNew: "将重复项导入为新案例",
    waExportAll: "导出所有记录 ({n})",
    waExportFiltered: "导出已筛选记录 ({n})",
    fromDate: "开始日期",
    toDate: "结束日期",
    applyFilter: "应用",
    resetDate: "重置日期",
    today: "今天",
    last7Days: "最近 7 天",
    last30Days: "最近 30 天",
    thisMonth: "本月",
    lastMonth: "上个月",
    thisYear: "今年",
    totalWaCases: "案例总数",
    noDataForDateRange: "所选日期范围内没有数据",
    presetSelect: "选择预设",
    customRange: "自定义范围",
    colChannel: "渠道",
    colProblem: "故障 / 分析",
    unitHistoryShowing: "显示 {shown} / {total} 条设备历史记录",
    noDataToExport: "没有要导出的数据。",
    colShipped: "发货日期",
    colDiagnosis: "诊断 (初始问题)",
    colFinalResult: "最终结果",
    totalUnitHistory: "设备历史总数",
    totalUnitHistoryHeading: "设备历史总数",
    sectionRma: "RMA",
    sectionWa: "WHATSAPP",
    totalRmaBadge: "RMA 总数",
    totalWaBadge: "WhatsApp 总数",
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
// RMA_DONE_NORMALIZED: explicit set of lowercase-trimmed status strings that
// represent a genuinely completed/closed RMA case.
// Rules:
//   - Always lowercase + trimmed for comparison (handles whitespace & casing variance)
//   - "Selesai" is included: some RMA records use this WA-originated status
//   - "Closed" and "Customer Received" are the two canonical done statuses
//   - Do NOT use substring matching — only exact normalized matches
const RMA_DONE_NORMALIZED = new Set([
  "selesai",
  "closed",
  "customer received",
]);
// Keep the old array for any external code that may reference it directly,
// but ALL business logic must go through isRmaDone().
const RMA_DONE_STATUSES = ["Closed", "Customer Received", "Selesai"];

// isRmaDone: the single source of truth for "is this RMA completed?"
// Returns true if the status, after trimming and lowercasing, is in RMA_DONE_NORMALIZED.
// This handles:
//   - "Selesai", "selesai", "  Selesai  " (whitespace-padded)
//   - "Closed", "closed", "CLOSED"
//   - "Customer Received"
function isRmaDone(status) {
  if (!status) return false;
  return RMA_DONE_NORMALIZED.has(String(status).trim().toLowerCase());
}

// WhatsApp Done Status Whitelist
const WA_DONE_NORMALIZED = new Set(["selesai", "closed"]);
function isWaDone(status) {
  if (!status) return false;
  return WA_DONE_NORMALIZED.has(String(status).trim().toLowerCase());
}

function isWaOverdue(waEntry) {
  if (!waEntry || !waEntry.caseDate) return false;
  // A completed case or case with solvedDate is NEVER overdue
  if (isWaDone(waEntry.status) || waEntry.solvedDate) return false;
  // Target SLA resolution is 3 days from caseDate
  const targetDate = addDaysISO(waEntry.caseDate, 3);
  return targetDate < todayISO();
}
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
const OPTION_DICT = {
  // Statuses (WhatsApp & RMA & PCBA)
  "on progress": { id: "On Progress", en: "In Progress", zh: "进行中" },
  "selesai": { id: "Selesai", en: "Completed", zh: "已完成" },
  "closed": { id: "Selesai", en: "Closed", zh: "已关闭" },
  "fu tim china": { id: "FU Tim China", en: "Follow Up China Team", zh: "中国团队跟进" },
  "belum ditag": { id: "Belum Ditag", en: "Not Tagged", zh: "尚未标记" },
  "unit diterima": { id: "Unit Diterima", en: "Unit Received", zh: "设备已接收" },
  "sedang dicek": { id: "Sedang Dicek", en: "On Checking", zh: "检测中" },
  "on checking": { id: "Sedang Dicek", en: "On Checking", zh: "检测中" },
  "dicek": { id: "Sedang Dicek", en: "On Checking", zh: "检测中" },
  "menunggu": { id: "Menunggu", en: "Waiting", zh: "等待中" },
  "waiting": { id: "Menunggu", en: "Waiting", zh: "等待中" },
  "sedang diperbaiki": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "repairing": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "under repair": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "qc/testing": { id: "QC/Testing", en: "QC/Testing", zh: "QC/测试" },
  "ready to ship": { id: "Ready to Ship", en: "Ready to Ship", zh: "准备发货" },
  "shipped": { id: "Shipped", en: "Shipped", zh: "已发货" },
  "customer received": { id: "Customer Received", en: "Customer Received", zh: "客户已收货" },
  "pending": { id: "Pending", en: "Pending", zh: "待处理" },
  "repaired": { id: "Repaired", en: "Repaired", zh: "已修复" },
  "good": { id: "Good", en: "Good", zh: "良品" },
  "bad": { id: "Bad", en: "Bad", zh: "不良品" },
  "used for replacement": { id: "Used for Replacement", en: "Used for Replacement", zh: "用于替换" },
  "scrap": { id: "Scrap", en: "Scrap", zh: "报废" },
  "scrapped": { id: "Scrap", en: "Scrapped", zh: "已报废" },
  "sent": { id: "Sent", en: "Sent", zh: "已寄送" },
  "sent to china": { id: "Sent to China", en: "Sent to China", zh: "已寄送中国" },
  "kirim ke china": { id: "Sent to China", en: "Sent to China", zh: "已寄送中国" },
  "passed": { id: "Passed", en: "Passed", zh: "通过" },
  "pass": { id: "Pass", en: "Pass", zh: "通过" },
  "failed": { id: "Failed", en: "Failed", zh: "未通过" },
  "fail": { id: "Fail", en: "Fail", zh: "未通过" },

  // Final Results & Actions (Hasil Akhir & Tindakan)
  "normal": { id: "Normal", en: "Normal", zh: "正常" },
  "repair": { id: "Repair", en: "Repair", zh: "维修" },
  "replace pcba": { id: "Replace PCBA", en: "Replace PCBA", zh: "更换 PCBA" },
  "replace unit": { id: "Replace Unit", en: "Replace Unit", zh: "更换整机" },
  "tidak dapat diperbaiki": { id: "Tidak Dapat Diperbaiki", en: "Cannot be Repaired", zh: "无法维修" },
  "rejected": { id: "Rejected", en: "Rejected", zh: "已拒绝" },
  "berhasil diperbaiki": { id: "Berhasil Diperbaiki", en: "Successfully Repaired", zh: "维修成功" },
  "perlu follow-up tim china": { id: "Perlu Follow-up Tim China", en: "Follow-up China Team Needed", zh: "需要中国团队跟进" },
  "return to principal": { id: "Return to Principal", en: "Return to Principal", zh: "退回原厂" },

  // Waiting Reasons (Alasan Menunggu)
  "spare part": { id: "Spare Part", en: "Spare Part", zh: "备件" },
  "pending spare": { id: "Pending Spare", en: "Pending Spare", zh: "等待备件" },
  "firmware": { id: "Firmware", en: "Firmware", zh: "固件" },
  "hq / china": { id: "HQ / China", en: "HQ / China", zh: "总部 / 中国" },
  "customer information": { id: "Customer Information", en: "Customer Information", zh: "客户信息" },
  "other": { id: "Other", en: "Other", zh: "其他" },

  // Warranty Statuses (Status Garansi)
  "in warranty": { id: "In Warranty", en: "In Warranty", zh: "保修期内" },
  "garansi ada": { id: "Garansi Ada", en: "In Warranty", zh: "保修期内" },
  "out of warranty": { id: "Out of Warranty", en: "Out of Warranty", zh: "过保" },
  "garansi habis": { id: "Garansi Habis", en: "Out of Warranty", zh: "过保" },
  "warranty unknown": { id: "Warranty Unknown", en: "Warranty Unknown", zh: "保修未知" },
  "garansi tidak diketahui": { id: "Garansi Tidak Diketahui", en: "Warranty Unknown", zh: "保修未知" },

  // Shipping Methods / Pengiriman
  "expedisi": { id: "EXPEDISI", en: "Expedition", zh: "物流快递" },
  "cja jakarta": { id: "CJA JAKARTA", en: "CJA Jakarta", zh: "CJA 雅加达" },
  "cja surabaya": { id: "CJA SURABAYA", en: "CJA Surabaya", zh: "CJA 泗水" },
};

function getLocalizedOption(val, t, lang) {
  if (!val) return "—";
  const str = String(val).trim();
  const key = str.toLowerCase();
  const found = OPTION_DICT[key];
  if (!found) return str;

  const currentLang = lang || (t?._lang) || localStorage.getItem("hsgq_language") || "id";
  return found[currentLang] || found.id || str;
}

function getLocalizedStatus(status, t, lang) {
  return getLocalizedOption(status, t, lang);
}

function StatusLed({ status, size = 8, t }) {
  const c = ledColor(status);
  const displayLabel = getLocalizedStatus(status, t);

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
        {displayLabel}
      </span>
    </span>
  );
}
function isOverdue(rma) {
  // A completed/closed case is NEVER overdue, regardless of ETA.
  if (!rma.eta || isRmaDone(rma.status)) return false;
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
    "Selesai",
  ],
  statusWA: ["On Progress", "Selesai", "FU Tim China", "Belum Ditag"],
  finalResults: [
    "Normal",
    "Replace",
    "Repair",
    "Service",
    "Return",
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
  pcbaReceivedBy: ["Yusuf", "Danang", "Aris", "Yusuf(Afif)", "Aris(Abdiel)"],
  minStockDefault: 5,
};

const PCBA_DEFAULT = {
  items: [],
  transactions: [],
  replacements: [],
  repairs: [],
  chinaShipments: [],
};
const PCBA_STATUSES = [
  "Good",
  "Bad",
  "Under Repair",
  "Repaired",
  "Used for Replacement",
  "Scrapped",
  "Sent to China",
  "Sent",
];
function pcbaLed(status) {
  if (status === "Good") return T.green;
  if (status === "Bad" || status === "Scrapped") return T.red;
  if (status === "Under Repair" || status === "Repaired") return T.amber;
  if (status === "Used for Replacement") return T.grey;
  if (status === "Sent to China" || status === "Sent") return T.cyan;
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
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const dateNDaysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const addDaysISO = (iso, n) => {
  if (!iso) return "";
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
function parseToISODate(val) {
  if (!val) return "";
  const str = String(val).trim();
  if (!str) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split("/");
    const d = pad2(parts[0]);
    const m = pad2(parts[1]);
    const y = parts[2].slice(0, 4);
    return `${y}-${m}-${d}`;
  }

  const dt = new Date(str);
  if (!isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = pad2(dt.getMonth() + 1);
    const d = pad2(dt.getDate());
    return `${y}-${m}-${d}`;
  }

  return "";
}
function parseDateForSort(val) {
  if (!val) return 0;
  const iso = parseToISODate(val);
  if (iso) {
    const t = new Date(iso).getTime();
    return isNaN(t) ? 0 : t;
  }
  const t = new Date(val).getTime();
  return isNaN(t) ? 0 : t;
}
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
    </div>
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
function Select({ options, t, translateOptions = true, ...props }) {
  const currentLang = localStorage.getItem("hsgq_language") || "id";
  const curT = t || I18N[currentLang] || I18N.id;

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
            {translateOptions ? getLocalizedOption(o, curT, currentLang) : o}
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
function SearchableRmaSelect({ rmaList = [], value, onChange, t, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedRma = useMemo(() => {
    return (rmaList || []).find((r) => r.id === value || r.ticketNo === value);
  }, [rmaList, value]);

  // Realtime search filtering by Ticket No, Customer, Device, SN, and Status
  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rmaList || [];
    return (rmaList || []).filter((r) => {
      const ticket = (r.ticketNo || "").toLowerCase();
      const customer = (r.customerName || r.customer || "").toLowerCase();
      const model = (r.deviceType || r.product || r.model || "").toLowerCase();
      const sn = (r.sn || "").toLowerCase();
      const status = (r.status || "").toLowerCase();
      return (
        ticket.includes(q) ||
        customer.includes(q) ||
        model.includes(q) ||
        sn.includes(q) ||
        status.includes(q)
      );
    });
  }, [rmaList, search]);

  // Click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const handleSelect = (chosenId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof onChange === "function") {
      onChange(chosenId);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        style={{
          ...inputBase,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          userSelect: "none",
          minHeight: 38,
          boxSizing: "border-box",
          borderColor: isOpen ? T.cyan : T.line,
          boxShadow: isOpen ? `0 0 0 1px ${T.cyan}` : "none",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            paddingRight: 6,
          }}
        >
          {selectedRma ? (
            <>
              <span style={{ fontFamily: mono, fontWeight: 700, color: T.cyan }}>
                {selectedRma.ticketNo}
              </span>
              {(selectedRma.customerName || selectedRma.customer || selectedRma.deviceType) && (
                <span
                  style={{
                    color: T.ink3,
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  — {[selectedRma.customerName || selectedRma.customer, selectedRma.deviceType].filter(Boolean).join(" • ")}
                </span>
              )}
            </>
          ) : (
            <span style={{ color: T.ink3 }}>
              {t?.pcbaSelectRmaPlaceholder || "— Pilih RMA Terkait —"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {selectedRma && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect("", e);
              }}
              title="Hapus pilihan"
              style={{
                background: "transparent",
                border: "none",
                color: T.ink3,
                cursor: "pointer",
                padding: "2px 4px",
                display: "flex",
                alignItems: "center",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = T.red)}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.ink3)}
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown
            size={14}
            color={isOpen ? T.cyan : T.ink3}
            style={{
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>
      </div>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 1000,
            background: T.panel,
            border: `1px solid ${T.line}`,
            borderRadius: 8,
            boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search Header */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: `1px solid ${T.line}`,
              background: T.panel2,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={14} color={T.ink3} style={{ flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t?.pcbaSearchRmaPlaceholder || "Cari nomor RMA (misal: 20260813)..."}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: T.ink,
                fontSize: 13,
                fontFamily: sans,
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                } else if (e.key === "Enter" && filteredList.length === 1) {
                  handleSelect(filteredList[0].id || filteredList[0].ticketNo, e);
                }
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.ink3,
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* List of RMA Items */}
          <div
            style={{
              maxHeight: 230,
              overflowY: "auto",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Deselect / Unlink item */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => handleSelect("", e)}
              style={{
                width: "100%",
                border: "none",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12.5,
                color: !value ? T.cyan : T.ink3,
                background: !value ? T.cyanDim : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: sans,
              }}
              onMouseEnter={(e) => {
                if (value) e.currentTarget.style.background = T.panel2;
              }}
              onMouseLeave={(e) => {
                if (value) e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{t?.pcbaUnlinkedRma || "— Tidak terkait RMA —"}</span>
              {!value && <Check size={14} color={T.cyan} />}
            </button>

            {/* RMA matches (rendered up to 100 items for high performance) */}
            {filteredList.slice(0, 100).map((r) => {
              const rmaKey = r.id || r.ticketNo;
              const isSelected = r.id === value || r.ticketNo === value;
              return (
                <button
                  type="button"
                  key={rmaKey}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleSelect(rmaKey, e)}
                  style={{
                    width: "100%",
                    border: "none",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: isSelected ? T.cyanDim : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    transition: "background 0.15s ease",
                    fontFamily: sans,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = T.panel2;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: mono,
                          fontWeight: 700,
                          fontSize: 13,
                          color: isSelected ? T.cyan : T.ink,
                        }}
                      >
                        {r.ticketNo}
                      </span>
                      {r.status && (
                        <span
                          style={{
                            fontSize: 10.5,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: `${T.cyan}18`,
                            color: T.cyan,
                            fontWeight: 600,
                          }}
                        >
                          {r.status}
                        </span>
                      )}
                    </div>
                    {(r.customerName || r.customer || r.deviceType || r.sn) && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: T.ink3,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {[
                          r.customerName || r.customer,
                          r.deviceType || r.product,
                          r.sn ? `SN: ${r.sn}` : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    )}
                  </div>

                  {isSelected && <Check size={14} color={T.cyan} style={{ flexShrink: 0 }} />}
                </button>
              );
            })}

            {/* Empty state */}
            {filteredList.length === 0 && (
              <div
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  color: T.ink3,
                  fontSize: 12.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Search size={18} color={T.ink3} />
                <span>{t?.pcbaNoRmaFound || "RMA tidak ditemukan"}</span>
                {search && (
                  <span style={{ fontSize: 11, color: T.ink3, opacity: 0.8 }}>
                    Keyword: "{search}"
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
async function copyToClipboard(text) {
  if (!text) return false;
  // 1. Try modern Clipboard API if supported in current context
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, attempting fallback:", err);
    }
  }

  // 2. Safe fallback for HTTP / restricted origins / older browsers
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    textarea.setAttribute("readonly", "");
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Boolean(successful);
  } catch (err) {
    console.error("document.execCommand copy fallback failed:", err);
    return false;
  }
}

function CopyButton({ text, t }) {
  const tt = t || I18N.id;
  const [status, setStatus] = useState("idle"); // "idle" | "success" | "error"

  const handleCopy = async () => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 1800);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2200);
    }
  };

  const isSuccess = status === "success";
  const isError = status === "error";

  const label = isSuccess
    ? tt.copied || "Tersalin"
    : isError
    ? tt.copyFailed || "Gagal menyalin"
    : tt.copy || "Salin";

  return (
    <Btn
      variant={isSuccess ? "solid" : "ghost"}
      style={isError ? { color: T.red, borderColor: T.red } : undefined}
      onClick={handleCopy}
    >
      {isSuccess ? (
        <Check size={14} />
      ) : isError ? (
        <AlertTriangle size={14} />
      ) : (
        <Copy size={14} />
      )}{" "}
      {label}
    </Btn>
  );
}
function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick && onClick(e);
      }}
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
   DATE RANGE & STATS SUMMARY HELPERS
   ============================================================ */
function getPresetDates(presetKey) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (presetKey === "today") {
    const today = todayISO();
    return { from: today, to: today };
  }
  if (presetKey === "last7") {
    return { from: dateNDaysAgoISO(6), to: todayISO() };
  }
  if (presetKey === "last30") {
    return { from: dateNDaysAgoISO(29), to: todayISO() };
  }
  if (presetKey === "thisMonth") {
    const from = `${year}-${pad2(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${pad2(month + 1)}-${pad2(lastDay)}`;
    return { from, to };
  }
  if (presetKey === "lastMonth") {
    const prevMonthDate = new Date(year, month - 1, 1);
    const pmYear = prevMonthDate.getFullYear();
    const pmMonth = prevMonthDate.getMonth();
    const from = `${pmYear}-${pad2(pmMonth + 1)}-01`;
    const lastDay = new Date(pmYear, pmMonth + 1, 0).getDate();
    const to = `${pmYear}-${pad2(pmMonth + 1)}-${pad2(lastDay)}`;
    return { from, to };
  }
  if (presetKey === "thisYear") {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    return { from, to };
  }
  return { from: "", to: "" };
}

function StatusSummaryCards({
  title,
  totalCount,
  statusList,
  filteredRows,
  baseRows,
  selectedStatus,
  onSelectStatus,
  t,
  extraBadges,
}) {
  const rowsForCounting = baseRows || filteredRows || [];
  const displayTotal = baseRows ? baseRows.length : totalCount;

  const countsByStatus = useMemo(() => {
    const map = {};
    (statusList || []).forEach((st) => {
      const lower = st.trim().toLowerCase();
      map[st] = rowsForCounting.filter(
        (r) => (r.status || "").trim().toLowerCase() === lower
      ).length;
    });
    return map;
  }, [statusList, rowsForCounting]);

  const isTotalActive = !selectedStatus;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      <div
        className="summary-card-clickable"
        onClick={() => onSelectStatus && onSelectStatus(null)}
        title={t.filterAll || "Klik untuk menampilkan semua data"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          background: isTotalActive ? T.cyanDim : T.panel,
          border: isTotalActive ? `2px solid ${T.cyan}` : `1px solid ${T.cyan}44`,
          boxShadow: isTotalActive ? `0 0 0 2px ${T.cyan}33` : "none",
          borderRadius: 8,
          fontSize: 12.5,
          fontFamily: sans,
          cursor: "pointer",
        }}
      >
        <span style={{ color: T.cyan, fontWeight: isTotalActive ? 700 : 600 }}>
          {title}:
        </span>
        <span style={{ color: T.ink, fontWeight: 700, fontSize: 14 }}>
          {displayTotal}
        </span>
      </div>

      {(extraBadges || []).map((badge, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: badge.bg || T.panel,
            border: `1px solid ${badge.borderColor || T.line}`,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: sans,
          }}
        >
          <span style={{ color: badge.color || T.cyan, fontWeight: 600 }}>
            {badge.label}:
          </span>
          <span style={{ color: T.ink, fontWeight: 700 }}>
            {badge.count}
          </span>
        </div>
      ))}

      {(statusList || []).map((st) => {
        const count = countsByStatus[st] || 0;
        const color = ledColor(st);
        const localizedLabel = getLocalizedStatus(st, t);
        const isActive =
          selectedStatus &&
          selectedStatus.trim().toLowerCase() === st.trim().toLowerCase();

        return (
          <div
            key={st}
            className="summary-card-clickable"
            onClick={() => onSelectStatus && onSelectStatus(isActive ? null : st)}
            title={`Klik untuk memfilter status: ${localizedLabel}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              background: isActive ? `${color}18` : T.panel,
              border: isActive ? `2px solid ${color}` : `1px solid ${T.line}`,
              boxShadow: isActive ? `0 0 0 2px ${color}33` : "none",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: sans,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 0 2px ${color}22`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: isActive ? T.ink : T.ink2,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {localizedLabel}:
            </span>
            <span style={{ color: T.ink, fontWeight: 700 }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function DateRangeToolbar({
  search,
  setSearch,
  searchPlaceholder,
  overdueOnly,
  setOverdueOnly,
  overdueLabel,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  preset,
  onSelectPreset,
  onResetDate,
  onResetAll,
  hasActiveFilters,
  t,
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={searchPlaceholder}
      />

      {setOverdueOnly && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            color: T.ink2,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            style={{ accentColor: T.cyan }}
          />
          {overdueLabel || t.rmaOverdueOnly || "Overdue saja"}
        </label>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
          background: T.panel,
          padding: "4px 8px",
          borderRadius: 8,
          border: `1px solid ${T.line}`,
        }}
      >
        <CalendarRange size={14} color={T.ink3} />
        <span style={{ fontSize: 12, color: T.ink2 }}>{t.fromDate || "Dari"}:</span>
        <TextInput
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            onSelectPreset("custom");
          }}
          style={{ padding: "4px 8px", fontSize: 12, width: 130 }}
        />

        <span style={{ fontSize: 12, color: T.ink2 }}>{t.toDate || "Sampai"}:</span>
        <TextInput
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            onSelectPreset("custom");
          }}
          style={{ padding: "4px 8px", fontSize: 12, width: 130 }}
        />

        <select
          value={preset}
          onChange={(e) => onSelectPreset(e.target.value)}
          style={{
            ...inputBase,
            padding: "4px 8px",
            fontSize: 12,
            width: "auto",
            cursor: "pointer",
          }}
        >
          <option value="">{t.presetSelect || "Pilih Preset"}</option>
          <option value="custom">{t.customRange || "Custom (Bebas)"}</option>
          <option value="today">{t.today || "Hari Ini"}</option>
          <option value="last7">{t.last7Days || "7 Hari Terakhir"}</option>
          <option value="last30">{t.last30Days || "30 Hari Terakhir"}</option>
          <option value="thisMonth">{t.thisMonth || "Bulan Ini"}</option>
          <option value="lastMonth">{t.lastMonth || "Bulan Lalu"}</option>
          <option value="thisYear">{t.thisYear || "Tahun Ini"}</option>
        </select>

        {(fromDate || toDate || preset) && (
          <Btn
            variant="ghost"
            onClick={onResetDate}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            {t.resetDate || "Reset Tanggal"}
          </Btn>
        )}
      </div>

      {hasActiveFilters && (
        <Btn variant="ghost" onClick={onResetAll}>
          {t.resetFilter || "Reset Filter"}
        </Btn>
      )}
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

function RmaDetailModal({ entry, onClose, t }) {
  const [lightbox, setLightbox] = useState(null); // { photo, category }

  const unitPhotos = Array.isArray(entry.unitPhotos) ? entry.unitPhotos : [];
  const labelPhotos = Array.isArray(entry.labelPhotos) ? entry.labelPhotos : [];

  const tt = t || I18N.id;

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

          <Section title={tt.rmaInfoTicket || "Informasi Tiket"} icon={PackageSearch}>
            <Row label={tt.colTicket || "No. Tiket"} value={entry.ticketNo} />
            <Row label={tt.colStatus || "Status"} value={getLocalizedStatus(entry.status, tt)} />
            <Row label={tt.colEngineer || "Engineer"} value={entry.engineer} />
            <Row label={tt.colProduct || "Produk"} value={entry.product} />
            <Row label={tt.colCustomer || "Customer"} value={entry.customerName} />
            <Row label={tt.colPhone || "No. HP Customer"} value={entry.customerPhone} />
            <Row label={tt.colWarranty || "Garansi"} value={getLocalizedOption(entry.warrantyStatus, tt)} />
            <Row label="SN" value={entry.sn} />
            <Row label="MAC" value={entry.mac} />
            <Row label={tt.rmaCustomerComplaint || "Keluhan Customer"} value={entry.customerComplaint} />
          </Section>

          <Section title={tt.rmaInfoReceiving || "Receiving"} icon={Truck}>
            <Row label={tt.colReceived || "Tanggal Masuk"} value={fmtDate(entry.receivedDate)} />
            <Row label={tt.rmaReceivedTime || "Jam Diterima"} value={entry.receivedTime} />
            <Row label={tt.rmaReceivedBy || "Diterima Oleh"} value={entry.receivedBy} />
            <Row label={tt.colEta || "ETA"} value={fmtDate(entry.eta)} />
            <Row label={tt.rmaDoNumber || "No. DO / Surat Jalan"} value={entry.doNumber} />
            <Row label={tt.rmaCourierName || "Pengirim / Kurir"} value={entry.courierName} />
            <Row label={tt.rmaUnitQty || "Jumlah Unit"} value={entry.unitQty} />
          </Section>

          <Section title={tt.rmaInfoPhysical || "Kondisi Fisik"} icon={AlertTriangle}>
            <Row label={tt.rmaPhysicalCondition || "Kondisi Fisik Saat Diterima"} value={entry.physicalCondition} />
            <Row label={tt.rmaAccessories || "Kelengkapan / Accessories"} value={entry.accessories} />
            <Row label={tt.rmaPhysicalDamageNotes || "Catatan Kerusakan Fisik"} value={entry.physicalDamageNotes} />
            <Row label={tt.rmaReceivingNotes || "Catatan Receiving"} value={entry.receivingNotes} />
          </Section>

          {unitPhotos.length > 0 && (
            <Section title={tt.rmaUnitPhotos || "Foto Unit Perangkat"} icon={ScanSearch}>
              <PhotoGrid photos={unitPhotos} category="Foto Unit" />
            </Section>
          )}

          {labelPhotos.length > 0 && (
            <Section title={tt.rmaLabelPhotos || "Foto Label SN / MAC"} icon={ScanSearch}>
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
      receivedBy: "",
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

  const finalResultOptions = useMemo(() => {
    const defaultList = ["Normal", "Replace", "Repair", "Service", "Return"];
    const customList = master.finalResults || [];
    return Array.from(new Set([...defaultList, ...customList]));
  }, [master.finalResults]);

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
    const tt = t || I18N.id;

    if (!f.sn || !f.sn.trim()) {
      setFormError(tt.errSnRequired || "SN wajib diisi.");
      return;
    }
    if (!f.mac || !f.mac.trim()) {
      setFormError(tt.errMacRequired || "MAC wajib diisi.");
      return;
    }
    if (!f.customerPhone || !f.customerPhone.trim()) {
      setFormError(tt.errCustomerPhoneRequired || "Nomor HP Customer wajib diisi.");
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
              options={finalResultOptions}
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
            <Field label={t.rmaFinalResult || "Hasil Akhir"}>
              <Select
                options={finalResultOptions}
                value={f.finalResult}
                onChange={set("finalResult")}
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
function WaForm({ initial, master, existingCaseNos, onSave, onClose, t }) {
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
      engineerTag: master.engineers?.[0] || "",
      status: master.statusWA?.[0] || "Waiting",
      finalAnalysis: "",
      solvedDate: "",
      notes: "",
      commHistory: [],
    },
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const tt = t || I18N.id;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const addComm = () =>
    setF((s) => ({
      ...s,
      commHistory: [
        ...(s.commHistory || []),
        { id: uid(), date: todayISO(), handledBy: master.engineers?.[0] || "", summary: "", result: "" },
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

    if (!f.customerPhone || !f.customerPhone.trim()) {
      setFormError(tt.errCustomerPhoneRequired || "Nomor HP Customer wajib diisi.");
      return;
    }
    if (!f.deviceType || !f.deviceType.trim()) {
      setFormError(tt.errDeviceTypeRequired || "Type Perangkat wajib diisi.");
      return;
    }

    setSaving(true);
    const result = await onSave(f);
    setSaving(false);
    if (!result?.ok) {
      setFormError(tt.waSaveFailed || "Gagal menyimpan case. Coba lagi.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        className="form-grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <Field label={tt.waCaseNo || "No. Case"}>
          <TextInput
            value={f.caseNo}
            onChange={set("caseNo")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label={tt.waCaseDate || "Tanggal Case"}>
          <TextInput
            type="date"
            value={f.caseDate}
            onChange={set("caseDate")}
          />
        </Field>
        <Field label={tt.waEngineerTag || "Engineer / Tagging"}>
          <Select
            options={master.engineers}
            value={f.engineerTag}
            onChange={set("engineerTag")}
          />
        </Field>
        <Field label={tt.colStatus || "Status"}>
          <Select
            options={master.statusWA}
            value={f.status}
            onChange={set("status")}
          />
        </Field>
        <Field label={tt.waCustomerName || "Nama Customer"}>
          <TextInput value={f.customerName} onChange={set("customerName")} />
        </Field>
        <Field label={tt.colCompany || "Perusahaan"}>
          <TextInput value={f.company} onChange={set("company")} />
        </Field>
        <Field label={tt.colPhone || "No. HP Customer"}>
          <TextInput value={f.customerPhone} onChange={set("customerPhone")} />
        </Field>
        <Field label={tt.colType || "Type Perangkat"}>
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
        <Field label={tt.colSolvedDate || "Tanggal Solved"}>
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
                  width: c.width,
                  minWidth: c.minWidth || c.width,
                  maxWidth: c.maxWidth || c.width,
                  boxSizing: "border-box",
                  ...(c.headerStyle || {}),
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
                    width: c.width,
                    minWidth: c.minWidth || c.width,
                    maxWidth: c.maxWidth || c.width,
                    boxSizing: "border-box",
                    ...(c.cellStyle || {}),
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
   RMA TABLE — per-column sort & filter (Excel-style)
   ============================================================ */

// COLUMN DEFINITIONS for RmaTable:
// key        — field name on the RMA entry object
// label      — display label (from t)
// type       — "text" | "date" | "status" (drives sort comparator)
// filterable — whether to show value-filter checkboxes
// sortable   — whether to show sort options
// valueKey   — actual field to read for unique values (defaults to key)

function ColFilterPopover({ col, rows, colFilter, onApply, onClose, t, popoverRef, style }) {
  // colFilter shape: { sort: "asc"|"desc"|null, values: Set<string> }
  const currentSort = colFilter?.sort ?? null;
  const currentValues = colFilter?.values ?? null; // null = all

  // Collect all unique raw values from current (unfiltered) row set for THIS column
  const allValues = useMemo(() => {
    const vk = col.valueKey || col.key;
    const seen = new Set();
    rows.forEach((r) => {
      const v = r[vk];
      if (v !== undefined && v !== null && v !== "") {
        const strVal = String(v).trim();
        if (col.key === "status" && strVal.toLowerCase() === "closed") return;
        seen.add(strVal);
      }
    });
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [rows, col.key, col.valueKey]);

  const [localSort, setLocalSort] = useState(currentSort);
  const [localValues, setLocalValues] = useState(
    currentValues !== null ? new Set(currentValues) : null
  );
  const [valSearch, setValSearch] = useState("");

  const filteredVals = valSearch
    ? allValues.filter((v) => v.toLowerCase().includes(valSearch.toLowerCase()))
    : allValues;

  const isAllChecked = localValues === null;
  const toggleAll = () => {
    if (isAllChecked) {
      // deselect all
      setLocalValues(new Set());
    } else {
      setLocalValues(null); // null = all
    }
  };
  const toggleValue = (v) => {
    if (localValues === null) {
      // was all — now select only this one unchecked — invert
      const s = new Set(allValues);
      s.delete(v);
      setLocalValues(s);
    } else {
      const s = new Set(localValues);
      if (s.has(v)) s.delete(v);
      else s.add(v);
      setLocalValues(s.size === allValues.length ? null : s);
    }
  };
  const isChecked = (v) => localValues === null || localValues.has(v);

  const applyLabel = t?.apply || "Terapkan";
  const clearLabel = t?.clearColFilter || "Hapus Filter Kolom ini";
  const allLabel = t?.allValues || "Semua";

  const sortLabels = col.type === "date"
    ? { asc: t?.sortOldestNewest || "Terlama → Terbaru", desc: t?.sortNewestOldest || "Terbaru → Terlama" }
    : col.type === "numeric"
    ? { asc: "Kecil → Besar (1 → 9)", desc: "Besar → Kecil (9 → 1)" }
    : { asc: t?.sortAZ || "A → Z", desc: t?.sortZA || "Z → A" };

  const isOnlySort = col.filterable === false || allValues.length === 0;

  return (
    <div
      ref={popoverRef}
      style={{
        zIndex: 99999,
        background: T.panel,
        border: `1px solid ${T.line}`,
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        minWidth: isOnlySort ? 195 : 210,
        maxWidth: isOnlySort ? 225 : 260,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Sort options */}
      {col.sortable !== false && (
        <div style={{ borderBottom: isOnlySort ? "none" : `1px solid ${T.line}`, padding: "5px 4px" }}>
          {["asc", "desc"].map((dir) => (
            <button
              key={dir}
              onClick={() => setLocalSort(localSort === dir ? null : dir)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 10px",
                border: "none",
                borderRadius: 6,
                background: localSort === dir ? T.cyanDim : "transparent",
                color: localSort === dir ? T.cyan : T.ink2,
                fontSize: 12.5,
                fontFamily: sans,
                cursor: "pointer",
                textAlign: "left",
                fontWeight: localSort === dir ? 600 : 400,
              }}
            >
              {dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {sortLabels[dir]}
            </button>
          ))}
        </div>
      )}

      {/* Value filter */}
      {col.filterable !== false && allValues.length > 0 && (
        <div>
          {/* Search within values */}
          {allValues.length > 6 && (
            <div style={{ padding: "6px 8px", borderBottom: `1px solid ${T.line}` }}>
              <div style={{ position: "relative" }}>
                <Search size={12} color={T.ink3} style={{ position: "absolute", left: 7, top: 7 }} />
                <input
                  value={valSearch}
                  onChange={(e) => setValSearch(e.target.value)}
                  placeholder={t?.searchValues || "Cari nilai..."}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    height: 28,
                    paddingLeft: 24,
                    paddingRight: 8,
                    border: `1px solid ${T.line}`,
                    borderRadius: 6,
                    background: T.void,
                    color: T.ink,
                    fontSize: 12,
                    fontFamily: sans,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          )}
          {/* All option */}
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: 12.5,
                fontFamily: sans,
                color: T.ink,
                borderBottom: `1px solid ${T.line}`,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={toggleAll}
                style={{ accentColor: T.cyan }}
              />
              {allLabel}
            </label>
            {filteredVals.map((v) => (
              <label
                key={v}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontFamily: sans,
                  color: T.ink2,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked(v)}
                  onChange={() => toggleValue(v)}
                  style={{ accentColor: T.cyan }}
                />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 8px",
          borderTop: `1px solid ${T.line}`,
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => onApply({ sort: null, values: null })}
          style={{
            flex: 1,
            fontSize: 11.5,
            padding: "5px 8px",
            border: `1px solid ${T.line}`,
            borderRadius: 6,
            background: "transparent",
            color: T.ink3,
            cursor: "pointer",
            fontFamily: sans,
          }}
        >
          {clearLabel}
        </button>
        <button
          onClick={() =>
            onApply({
              sort: localSort,
              values: localValues === null ? null : [...localValues],
            })
          }
          style={{
            flex: 1,
            fontSize: 11.5,
            padding: "5px 8px",
            border: "none",
            borderRadius: 6,
            background: T.cyan,
            color: "#fff",
            cursor: "pointer",
            fontFamily: sans,
            fontWeight: 600,
          }}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}

function RmaTable({ columns, rows, allRows, colFilters, onColFilter, t, emptyLabel }) {
  const [openCol, setOpenCol] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const popoverRef = useRef(null);

  // Close popover on outside click or escape key
  useEffect(() => {
    if (!openCol) return;
    const handler = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !anchorEl?.contains(e.target)
      ) {
        setOpenCol(null);
        setAnchorEl(null);
        setAnchorRect(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpenCol(null);
        setAnchorEl(null);
        setAnchorRect(null);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCol, anchorEl]);

  // Keep popover position synchronized on scroll or resize
  useEffect(() => {
    if (!openCol || !anchorEl) return;
    const updatePos = () => {
      const rect = anchorEl.getBoundingClientRect();
      if (
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        setOpenCol(null);
        setAnchorEl(null);
        setAnchorRect(null);
        return;
      }
      setAnchorRect(rect);
    };
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [openCol, anchorEl]);

  const activeCol = useMemo(
    () => columns.find((c) => c.key === openCol),
    [columns, openCol]
  );

  const popoverPos = useMemo(() => {
    if (!anchorRect) return { top: 0, left: 0 };
    const isOnlySort = activeCol?.filterable === false;
    const estHeight = isOnlySort ? 115 : 300;
    const width = isOnlySort ? 205 : 240;
    let left = anchorRect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    if (left < 12) {
      left = 12;
    }
    let top = anchorRect.bottom + 4;
    if (top + estHeight > window.innerHeight && anchorRect.top - estHeight > 10) {
      top = Math.max(10, anchorRect.top - estHeight - 4);
    }
    return { top, left };
  }, [anchorRect, activeCol]);

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
          minWidth: 780,
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr style={{ background: T.panel2 }}>
            {columns.map((col) => {
              const cf = colFilters[col.key];
              const hasSort = cf?.sort;
              const hasValFilter = cf?.values !== null && cf?.values !== undefined;
              const isActive = hasSort || hasValFilter;
              const isOpen = openCol === col.key;

              return (
                <th
                  key={col.key}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    color: isActive ? T.cyan : T.ink3,
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    fontFamily: sans,
                    borderBottom: `1px solid ${T.line}`,
                    whiteSpace: "nowrap",
                    position: "relative",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span>{col.label}</span>
                    {/* Sort indicator */}
                    {hasSort && (
                      <span style={{ color: T.cyan }}>
                        {cf.sort === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    )}
                    {/* Filter/sort toggle icon — only for filterable/sortable cols */}
                    {(col.sortable !== false || col.filterable !== false) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOpen) {
                            setOpenCol(null);
                            setAnchorEl(null);
                            setAnchorRect(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setAnchorEl(e.currentTarget);
                            setAnchorRect(rect);
                            setOpenCol(col.key);
                          }
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          background: isActive ? T.cyanDim : "transparent",
                          border: isActive ? `1px solid ${T.cyan}44` : `1px solid transparent`,
                          borderRadius: 4,
                          padding: "1px 3px",
                          cursor: "pointer",
                          color: isActive ? T.cyan : T.ink3,
                          lineHeight: 1,
                        }}
                        title={col.label}
                      >
                        {isActive ? <ListFilter size={11} /> : <ArrowUpDown size={11} />}
                      </button>
                    )}
                  </div>
                </th>
              );
            })}
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
              style={{ borderBottom: `1px solid ${T.line}` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.panel2)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "9px 12px",
                    color: T.ink,
                    fontFamily: col.mono ? mono : sans,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {openCol && activeCol && anchorRect && typeof document !== "undefined" &&
        createPortal(
          <ColFilterPopover
            popoverRef={popoverRef}
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
            }}
            col={activeCol}
            rows={allRows}
            colFilter={colFilters[activeCol.key]}
            t={t}
            onApply={(applied) => {
              onColFilter(activeCol.key, applied);
              setOpenCol(null);
              setAnchorEl(null);
              setAnchorRect(null);
            }}
            onClose={() => {
              setOpenCol(null);
              setAnchorEl(null);
              setAnchorRect(null);
            }}
          />,
          document.body
        )}
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
    (e) => !isRmaDone(e.status),
  ).length;
  const rmaClosed = rma.filter((e) =>
    isRmaDone(e.status),
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
  const tt = t || I18N.id;
  const [preset, setPreset] = useState("last7");
  const [start, setStart] = useState(() => getPresetDates("last7")?.from || dateNDaysAgoISO(6));
  const [end, setEnd] = useState(() => getPresetDates("last7")?.to || todayISO());

  const applyPreset = useCallback((presetKey) => {
    setPreset(presetKey);
    if (presetKey === "custom") return;
    if (!presetKey) {
      setStart("");
      setEnd("");
      return;
    }
    const { from, to } = getPresetDates(presetKey);
    setStart(from || "");
    setEnd(to || "");
  }, []);

  const resetDate = useCallback(() => {
    applyPreset("last7");
  }, [applyPreset]);

  const isInvalidRange = Boolean(start && end && start > end);

  const cases = useMemo(() => {
    if (isInvalidRange) return [];
    const inRange = (d) => {
      if (!d) return false;
      const iso = parseToISODate(d);
      if (!iso) return false;
      if (start && iso < start) return false;
      if (end && iso > end) return false;
      return true;
    };

    // RMA cases ALWAYS first (priority 0), sorted Date DESC
    const rmaCases = rma
      .filter((e) => inRange(e.receivedDate))
      .map((e) => ({
        channel: "RMA",
        priority: 0,
        engineer: e.engineer,
        date: e.receivedDate,
        customer: e.customerName || e.company || "-",
        type: e.product || "-",
        problem: e.initialProblem || "-",
        analysis:
          [e.checkingResult, e.rootCause ? `Root cause: ${e.rootCause}` : ""]
            .filter(Boolean)
            .join(" | ") || "-",
        solution: isRmaDone(e.status)
          ? { isDone: true, doneDate: e.closedDate || e.customerReceivedDate }
          : { isDone: false, action: e.actionTaken },
        status: e.status || "-",
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    // WhatsApp cases ALWAYS second (priority 1), sorted Date DESC
    const waCases = wa
      .filter((e) => inRange(e.caseDate))
      .map((e) => ({
        channel: "WhatsApp",
        priority: 1,
        engineer: e.engineerTag,
        date: e.caseDate,
        customer: e.customerName || e.company || "-",
        type: e.deviceType || "-",
        problem: e.initialProblem || "-",
        analysis: e.finalAnalysis || "-",
        solution: isWaDone(e.status)
          ? { isDone: true, doneDate: e.solvedDate }
          : { isDone: false, action: e.finalAnalysis },
        status: e.status || "-",
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    // Combine: RMA first, then WA
    return [...rmaCases, ...waCases];
  }, [rma, wa, start, end]);

  const cleanReportText = useMemo(() => {
    const header = `${tt.weeklyReportTitle || "RINGKASAN MINGGUAN - TECHNICAL SUPPORT"}
${tt.weeklyReportPeriod || "Periode"}:
${fmtDate(start) || "—"} - ${fmtDate(end) || "—"}

${tt.weeklyReportActivitySummary || "Ringkasan Kegiatan"}:
- ${tt.weeklyReportMonitoring || "Monitoring OLT dan ONU"}
- ${tt.weeklyReportTroubleshooting || "Troubleshooting Issue Customer"}
- ${tt.weeklyReportSupport || "Technical Support HSGQ Jakarta"}

${tt.weeklyReportIssueSection || "Kendala & Penanganan"}:
============================================`;

    const body = cases
      .map((c, i) => {
        const solText = c.solution.isDone
          ? (tt.weeklyReportSolvedOn || "Selesai pada {date}").replace(
              "{date}",
              fmtDate(c.solution.doneDate)
            )
          : c.solution.action || tt.weeklyReportFollowUp || "Follow up / monitoring";

        const locStatus = getLocalizedStatus(c.status, tt);

        return `
- Case ${i + 1} [${c.channel}] (${c.engineer || "-"})
${tt.weeklyReportDateLabel || "Tanggal"}: ${fmtDate(c.date)}
${tt.weeklyReportCustomerLabel || "Customer / Perusahaan"}: ${c.customer}
${tt.weeklyReportTypeLabel || "Tipe Perangkat"}: ${c.type}
${tt.weeklyReportProblemLabel || "Kendala"}: ${c.problem}
${tt.weeklyReportAnalysisLabel || "Analisa"}: ${c.analysis}
${tt.weeklyReportSolutionLabel || "Solusi"}: ${solText}
${tt.weeklyReportStatusLabel || "Status"}: ${locStatus}
============================================`;
      })
      .join("");

    return header + body;
  }, [cases, start, end, tt]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function exportPdf() {
    if (isInvalidRange) {
      window.alert(tt.errInvalidDateRange || "Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai Tanggal'.");
      return;
    }

    const rows = cases
      .map((c, i) => {
        const solText = c.solution.isDone
          ? (tt.weeklyReportSolvedOn || "Selesai pada {date}").replace(
              "{date}",
              fmtDate(c.solution.doneDate)
            )
          : c.solution.action || tt.weeklyReportFollowUp || "Follow up / monitoring";
        const locStatus = getLocalizedStatus(c.status, tt);

        return `
          <section class="case">
            <div class="case-title">Case ${i + 1} - ${escapeHtml(c.channel)}</div>
            <div class="grid">
              <div><span>${escapeHtml(tt.weeklyReportDateLabel || "Date")}</span><strong>${escapeHtml(fmtDate(c.date))}</strong></div>
              <div><span>${escapeHtml(tt.colEngineer || "Engineer")}</span><strong>${escapeHtml(c.engineer || "-")}</strong></div>
              <div><span>${escapeHtml(tt.weeklyReportCustomerLabel || "Customer / Company")}</span><strong>${escapeHtml(c.customer)}</strong></div>
              <div><span>${escapeHtml(tt.weeklyReportTypeLabel || "Device Type")}</span><strong>${escapeHtml(c.type)}</strong></div>
              <div class="full"><span>${escapeHtml(tt.weeklyReportProblemLabel || "Problem / Issue")}</span><strong>${escapeHtml(c.problem)}</strong></div>
              <div class="full"><span>${escapeHtml(tt.weeklyReportAnalysisLabel || "Analysis")}</span><strong>${escapeHtml(c.analysis)}</strong></div>
              <div class="full"><span>${escapeHtml(tt.weeklyReportSolutionLabel || "Solution")}</span><strong>${escapeHtml(solText)}</strong></div>
              <div><span>${escapeHtml(tt.weeklyReportStatusLabel || "Status")}</span><strong>${escapeHtml(locStatus)}</strong></div>
            </div>
          </section>`;
      })
      .join("");

    const win = window.open("", "_blank");
    if (!win) {
      window.alert(tt.weeklyReportPopupBlocked || "Popup browser diblokir. Izinkan popup untuk export PDF.");
      return;
    }

    win.document.write(`<!doctype html>
      <html>
        <head>
          <title>${escapeHtml(tt.weeklyReportTitle || "Weekly Report")} ${escapeHtml(fmtDate(start))} - ${escapeHtml(fmtDate(end))}</title>
          <style>
            @page { size: A4; margin: 16mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; line-height: 1.45; }
            .toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 10px 0; background: #fff; }
            button { border: 0; border-radius: 6px; background: #2563eb; color: #fff; padding: 9px 14px; font-weight: 700; cursor: pointer; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 22px; }
            .header-text { flex: 1; min-width: 0; }
            .header-logo { height: 135px; width: auto; max-width: 380px; object-fit: contain; flex-shrink: 0; margin-left: 24px; }
            .brand { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: .4px; text-transform: uppercase; }
            h1 { margin: 4px 0 6px; font-size: 24px; color: #111827; }
            .period { color: #4b5563; font-size: 12px; }
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
          <div class="toolbar"><button onclick="window.print()">${escapeHtml(tt.reportExportPdf || "Print / Save PDF")}</button></div>
          <div class="header">
            <div class="header-text">
              <div class="brand">HSGQ Indonesia</div>
              <h1>${escapeHtml(tt.weeklyReportTitle || "Weekly Technical Support Report")}</h1>
              <div class="period">${escapeHtml(fmtDate(start))} - ${escapeHtml(fmtDate(end))}</div>
            </div>
            <img src="${hsgqLogo}" class="header-logo" alt="HSGQ Logo" />
          </div>
          ${cases.length ? rows : `<div class="empty">${escapeHtml(tt.reportEmptyRange || "Tidak ada case pada rentang tanggal ini.")}</div>`}
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
        <Field label={tt.weeklyReportFromDate || tt.reportFromDate || "Dari Tanggal"}>
          <TextInput
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              setPreset("custom");
            }}
          />
        </Field>

        <Field label={tt.weeklyReportToDate || tt.reportToDate || "Sampai Tanggal"}>
          <TextInput
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              setPreset("custom");
            }}
          />
        </Field>

        <Field label={tt.presetSelect || "Preset Rentang"}>
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            style={{
              ...inputBase,
              padding: "7px 10px",
              fontSize: 13,
              width: "auto",
              cursor: "pointer",
            }}
          >
            <option value="">{tt.presetSelect || "Pilih Preset"}</option>
            <option value="custom">{tt.customRange || "Custom (Bebas)"}</option>
            <option value="today">{tt.today || "Hari Ini"}</option>
            <option value="last7">{tt.weeklyReportLast7Days || tt.last7Days || "7 Hari Terakhir"}</option>
            <option value="last30">{tt.last30Days || "30 Hari Terakhir"}</option>
            <option value="thisMonth">{tt.thisMonth || "Bulan Ini"}</option>
            <option value="lastMonth">{tt.lastMonth || "Bulan Lalu"}</option>
            <option value="thisYear">{tt.thisYear || "Tahun Ini"}</option>
          </select>
        </Field>

        {preset !== "last7" && (
          <Btn variant="ghost" onClick={resetDate} style={{ marginBottom: 1 }}>
            {tt.resetDate || "Reset (7 Hari)"}
          </Btn>
        )}

        <div style={{ flex: 1 }} />

        <Btn variant="ghost" onClick={exportPdf} disabled={isInvalidRange}>
          <FileDown size={14} /> {tt.weeklyReportExportPdf || tt.reportExportPdf || "Export PDF"}
        </Btn>
        <CopyButton text={cleanReportText} t={tt} />
      </div>

      {isInvalidRange && (
        <InlineHint tone="warn">
          {tt.errInvalidDateRange || "Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai Tanggal'."}
        </InlineHint>
      )}

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
        {isInvalidRange ? (
          <span style={{ color: T.red }}>
            {tt.errInvalidDateRange || "Tanggal 'Dari' tidak boleh lebih besar dari 'Sampai Tanggal'."}
          </span>
        ) : cases.length === 0 ? (
          <span style={{ color: T.ink3 }}>
            {tt.weeklyReportEmptyRange || tt.reportEmptyRange || "Tidak ada case pada rentang tanggal ini."}
          </span>
        ) : (
          cleanReportText
        )}
      </div>
    </div>
  );
}

/* ============================================================
   UNIT HISTORY SUMMARY (3-Group Layout: Total / RMA / WhatsApp)
   ============================================================ */
/* ============================================================
   UNIT HISTORY SUMMARY (3-Group Layout: Total / RMA / WhatsApp)
   ============================================================ */
function UnitHistorySummary({
  baseRows,
  filteredRows,
  channelFilter,
  statusFilter,
  onSelectSummary,
  master,
  t,
}) {
  const rowsForCounting = Array.isArray(baseRows)
    ? baseRows
    : Array.isArray(filteredRows)
    ? filteredRows
    : [];

  const rmaRows = useMemo(
    () => rowsForCounting.filter((r) => r && r.channel === "RMA"),
    [rowsForCounting]
  );
  const waRows = useMemo(
    () => rowsForCounting.filter((r) => r && r.channel === "WhatsApp"),
    [rowsForCounting]
  );

  const rmaStatusList = useMemo(() => {
    const defaultList = [
      "Unit Diterima",
      "Sedang Dicek",
      "Menunggu",
      "Sedang Diperbaiki",
      "QC/Testing",
      "Ready to Ship",
      "Shipped",
      "Customer Received",
      "Selesai",
    ];
    const masterList = Array.isArray(master?.statusRMA) ? master.statusRMA : defaultList;
    const set = new Set();
    masterList.forEach((s) => s && typeof s === "string" && set.add(s.trim()));
    rmaRows.forEach((r) => {
      const st = String(r?.status || "").trim();
      if (st && st !== "-") set.add(st);
    });
    return Array.from(set);
  }, [master?.statusRMA, rmaRows]);

  const waStatusList = useMemo(() => {
    const defaultList = [
      "On Progress",
      "Selesai",
      "FU Tim China",
      "Belum Ditag",
    ];
    const masterList = Array.isArray(master?.statusWA) ? master.statusWA : defaultList;
    const set = new Set();
    masterList.forEach((s) => s && typeof s === "string" && set.add(s.trim()));
    waRows.forEach((r) => {
      const st = String(r?.status || "").trim();
      if (st && st !== "-") set.add(st);
    });
    return Array.from(set);
  }, [master?.statusWA, waRows]);

  const rmaStatusCounts = useMemo(() => {
    const map = {};
    rmaStatusList.forEach((st) => {
      const lower = String(st || "").trim().toLowerCase();
      map[st] = rmaRows.filter(
        (r) => String(r?.status || "").trim().toLowerCase() === lower
      ).length;
    });
    return map;
  }, [rmaStatusList, rmaRows]);

  const waStatusCounts = useMemo(() => {
    const map = {};
    waStatusList.forEach((st) => {
      const lower = String(st || "").trim().toLowerCase();
      map[st] = waRows.filter(
        (r) => String(r?.status || "").trim().toLowerCase() === lower
      ).length;
    });
    return map;
  }, [waStatusList, waRows]);

  const isTotalAllActive = !channelFilter && !statusFilter;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginBottom: 14,
      }}
    >
      {/* ── Group A: TOTAL RIWAYAT UNIT ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: T.ink3,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: sans,
          }}
        >
          {t?.totalUnitHistoryHeading || "TOTAL RIWAYAT UNIT"}
        </div>
        <button
          type="button"
          className="summary-card-clickable"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectSummary && onSelectSummary(null, null);
          }}
          title={t?.filterAll || "Klik untuk menampilkan seluruh riwayat unit"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            background: isTotalAllActive ? T.panel2 : T.panel,
            border: isTotalAllActive ? `2px solid ${T.cyan}` : `1px solid ${T.line}`,
            boxShadow: isTotalAllActive ? `0 0 0 1px ${T.cyan}` : "none",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: sans,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span style={{ color: T.cyan, fontWeight: isTotalAllActive ? 700 : 600 }}>
            {t?.totalUnitHistoryBadge || "Total Riwayat Unit"}:
          </span>
          <span style={{ color: T.ink, fontWeight: 700, fontSize: 16 }}>
            {rowsForCounting.length}
          </span>
        </button>
      </div>

      {/* ── Group B: RMA ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: T.cyan,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: sans,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{t?.sectionRma || "RMA"}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {/* Total RMA Card */}
          {(() => {
            const isRmaTotalActive = channelFilter === "RMA" && !statusFilter;
            return (
              <button
                type="button"
                className="summary-card-clickable"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSummary &&
                    onSelectSummary(isRmaTotalActive ? null : "RMA", null);
                }}
                title="Klik untuk memfilter semua kasus RMA"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isRmaTotalActive ? T.panel2 : T.panel,
                  border: isRmaTotalActive
                    ? `2px solid ${T.cyan}`
                    : `1px solid ${T.line}`,
                  boxShadow: isRmaTotalActive ? `0 0 0 1px ${T.cyan}` : "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ color: T.cyan, fontWeight: 600 }}>
                  {t?.totalRmaBadge || "Total RMA"}:
                </span>
                <span style={{ color: T.ink, fontWeight: 700 }}>
                  {rmaRows.length}
                </span>
              </button>
            );
          })()}

          {/* RMA Status Badges */}
          {rmaStatusList.map((st) => {
            const count = rmaStatusCounts[st] || 0;
            const color = ledColor(st);
            const localizedLabel = getLocalizedStatus(st, t);
            const isActive =
              channelFilter === "RMA" &&
              statusFilter &&
              String(statusFilter).trim().toLowerCase() === String(st).trim().toLowerCase();

            return (
              <button
                key={st}
                type="button"
                className="summary-card-clickable"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSummary &&
                    onSelectSummary(isActive ? null : "RMA", isActive ? null : st);
                }}
                title={`Klik untuk memfilter RMA status: ${localizedLabel}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  background: isActive ? T.panel2 : T.panel,
                  border: isActive ? `2px solid ${color}` : `1px solid ${T.line}`,
                  boxShadow: isActive ? `0 0 0 1px ${color}` : "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: isActive ? T.ink : T.ink2,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {localizedLabel}:
                </span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Group C: WHATSAPP ── */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: T.green,
            textTransform: "uppercase",
            marginBottom: 6,
            fontFamily: sans,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: T.green,
            }}
          />
          <span>{t?.sectionWa || "WHATSAPP"}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {/* Total WhatsApp Card */}
          {(() => {
            const isWaTotalActive = channelFilter === "WhatsApp" && !statusFilter;
            return (
              <button
                type="button"
                className="summary-card-clickable"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSummary &&
                    onSelectSummary(isWaTotalActive ? null : "WhatsApp", null);
                }}
                title="Klik untuk memfilter semua kasus WhatsApp"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isWaTotalActive ? T.panel2 : T.panel,
                  border: isWaTotalActive
                    ? `2px solid ${T.green}`
                    : `1px solid ${T.line}`,
                  boxShadow: isWaTotalActive ? `0 0 0 1px ${T.green}` : "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ color: T.green, fontWeight: 600 }}>
                  {t?.totalWaBadge || "Total WhatsApp"}:
                </span>
                <span style={{ color: T.ink, fontWeight: 700 }}>
                  {waRows.length}
                </span>
              </button>
            );
          })()}

          {/* WhatsApp Status Badges */}
          {waStatusList.map((st) => {
            const count = waStatusCounts[st] || 0;
            const color = ledColor(st);
            const localizedLabel = getLocalizedStatus(st, t);
            const isActive =
              channelFilter === "WhatsApp" &&
              statusFilter &&
              String(statusFilter).trim().toLowerCase() === String(st).trim().toLowerCase();

            return (
              <button
                key={st}
                type="button"
                className="summary-card-clickable"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSummary &&
                    onSelectSummary(isActive ? null : "WhatsApp", isActive ? null : st);
                }}
                title={`Klik untuk memfilter WhatsApp status: ${localizedLabel}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  background: isActive ? T.panel2 : T.panel,
                  border: isActive ? `2px solid ${color}` : `1px solid ${T.line}`,
                  boxShadow: isActive ? `0 0 0 1px ${color}` : "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: sans,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: isActive ? T.ink : T.ink2,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {localizedLabel}:
                </span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   UNIT HISTORY / QUICK SEARCH SN-MAC
   ============================================================ */
function UnitHistory({ rma = [], wa = [], master, t, onSelectDetail }) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [preset, setPreset] = useState("");
  const [colFilters, setColFilters] = useState({});
  const [channelFilter, setChannelFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const onColFilter = useCallback((colKey, applied) => {
    setColFilters((prev) => {
      if (!applied || (!applied.sort && (applied.values === null || applied.values === undefined))) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return { ...prev, [colKey]: applied };
    });
  }, []);

  const applyPreset = useCallback((presetKey) => {
    setPreset(presetKey);
    if (presetKey === "custom") return;
    if (!presetKey) {
      setFromDate("");
      setToDate("");
      return;
    }
    const { from, to } = getPresetDates(presetKey);
    setFromDate(from || "");
    setToDate(to || "");
  }, []);

  const resetDate = useCallback(() => {
    setFromDate("");
    setToDate("");
    setPreset("");
  }, []);

  const resetAll = useCallback(() => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPreset("");
    setColFilters({});
    setChannelFilter(null);
    setStatusFilter(null);
  }, []);

  // Combine RMA and WhatsApp entries into a single history array
  const combinedRows = useMemo(() => {
    const safeRma = Array.isArray(rma) ? rma : [];
    const safeWa = Array.isArray(wa) ? wa : [];

    const rmaMapped = safeRma.map((e) => ({
      id: `rma-${e?.id || e?.ticketNo || uid()}`,
      ref: String(e?.ticketNo || "-"),
      channel: "RMA",
      date: String(e?.receivedDate || ""),
      status: String(e?.status || "-"),
      sn: String(e?.sn || "-"),
      mac: String(e?.mac || "-"),
      customer: String(e?.customerName || e?.company || "-"),
      product: String(e?.product || "-"),
      issue: String(e?.initialProblem || e?.symptom || e?.checkingResult || e?.rootCause || e?.finalResult || "-"),
      engineer: String(e?.engineer || "-"),
      raw: e,
    }));

    const waMapped = safeWa.map((e) => ({
      id: `wa-${e?.id || e?.caseNo || uid()}`,
      ref: String(e?.caseNo || "-"),
      channel: "WhatsApp",
      date: String(e?.caseDate || ""),
      status: String(e?.status || "-"),
      sn: String(e?.sn || "-"),
      mac: String(e?.mac || "-"),
      customer: String(e?.customerName || e?.company || "-"),
      product: String(e?.deviceType || "-"),
      issue: String(e?.initialProblem || e?.finalAnalysis || e?.notes || "-"),
      engineer: String(e?.engineerTag || "-"),
      raw: e,
    }));

    return [...rmaMapped, ...waMapped];
  }, [rma, wa]);

  const baseFilteredUnitHistory = useMemo(() => {
    const q = (search || "").toLowerCase().trim();

    let result = combinedRows.filter((e) => {
      if (q) {
        const haystack = [
          e.ref,
          e.channel,
          e.status,
          e.product,
          e.sn,
          e.mac,
          e.customer,
          e.issue,
          getLocalizedStatus(e.status, t),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Date range filter
    if (fromDate || toDate) {
      result = result.filter((e) => {
        if (!e.date) return false;
        const d = parseToISODate(e.date);
        if (!d) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    // Per-column value filters
    if (colFilters && typeof colFilters === "object") {
      Object.entries(colFilters).forEach(([colKey, cf]) => {
        if (!cf || cf.values === null || cf.values === undefined) return;
        const vals = new Set(cf.values);
        if (vals.size === 0) {
          result = [];
          return;
        }
        result = result.filter((e) => vals.has(String(e?.[colKey] ?? "")));
      });
    }

    return result;
  }, [combinedRows, search, fromDate, toDate, colFilters, t]);

  const filteredUnitHistory = useMemo(() => {
    let result = Array.isArray(baseFilteredUnitHistory) ? baseFilteredUnitHistory : [];

    if (channelFilter) {
      result = result.filter((e) => e && e.channel === channelFilter);
    }

    if (statusFilter) {
      const lower = String(statusFilter).trim().toLowerCase();
      result = result.filter(
        (e) => String(e?.status || "").trim().toLowerCase() === lower
      );
    }

    // Sorting
    const sortEntry = Object.entries(colFilters || {}).find(([, cf]) => cf?.sort);
    if (sortEntry) {
      const [sortKey, { sort }] = sortEntry;
      const isDateCol = sortKey === "date";
      result = [...result].sort((a, b) => {
        let av = a?.[sortKey] ?? "";
        let bv = b?.[sortKey] ?? "";
        if (isDateCol) {
          const da = av ? new Date(av).getTime() : 0;
          const db = bv ? new Date(bv).getTime() : 0;
          const validDa = isNaN(da) ? 0 : da;
          const validDb = isNaN(db) ? 0 : db;
          return sort === "asc" ? validDa - validDb : validDb - validDa;
        }
        const cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
        return sort === "asc" ? cmp : -cmp;
      });
    } else {
      // Default: newest date first
      result = [...result].sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")));
    }

    return result;
  }, [baseFilteredUnitHistory, channelFilter, statusFilter, colFilters]);

  const columns = [
    {
      key: "ref",
      label: t?.colTicket || "Ticket / Case",
      mono: true,
      render: (r) => (
        <span style={{ color: T.cyan, fontWeight: 600 }}>{r.ref}</span>
      ),
    },
    {
      key: "channel",
      label: t?.colChannel || "Channel",
      render: (r) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            fontSize: 12,
            fontWeight: 600,
            color: r.channel === "RMA" ? T.cyan : T.green,
            background: "transparent",
          }}
        >
          {r.channel === "WhatsApp" ? "● WhatsApp" : r.channel}
        </span>
      ),
    },
    {
      key: "status",
      label: t?.colStatus || "Status",
      type: "status",
      render: (r) => <StatusLed status={r.status} t={t} />,
    },
    {
      key: "product",
      label: t?.colProduct || "Produk / Type",
    },
    {
      key: "engineer",
      label: t?.colEngineer || "Engineer",
    },
    {
      key: "date",
      label: t?.colDate || "Tanggal",
      type: "date",
      filterable: false,
      render: (r) => fmtDate(r.date),
    },
    {
      key: "sn",
      label: "SN",
      mono: true,
      render: (r) => {
        const val = String(r.sn || "-");
        const isLong = val.length > 15;
        const displayVal = isLong ? val.slice(0, 15) + "..." : val;
        return (
          <span title={val} style={{ fontFamily: mono, fontSize: 12 }}>
            {displayVal}
          </span>
        );
      },
    },
    {
      key: "mac",
      label: "MAC",
      mono: true,
      render: (r) => {
        const val = String(r.mac || "-");
        const isLong = val.length > 17;
        const displayVal = isLong ? val.slice(0, 17) + "..." : val;
        return (
          <span title={val} style={{ fontFamily: mono, fontSize: 12 }}>
            {displayVal}
          </span>
        );
      },
    },
    {
      key: "customer",
      label: t?.colCustomer || "Customer",
    },
    {
      key: "issue",
      label: t?.colProblem || "Kendala / Analisa",
      render: (r) => {
        const text = String(r.issue || "-");
        if (text.length <= 35) return text;
        return (
          <span title={text}>
            {text.slice(0, 35)}...
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      sortable: false,
      filterable: false,
      render: (r) => (
        <IconBtn
          icon={Eye}
          onClick={() => onSelectDetail && onSelectDetail(r.channel, r.raw)}
          title={t?.viewDetail || "Lihat detail"}
        />
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* ── Unit History Toolbar ── */}
      <DateRangeToolbar
        search={search}
        setSearch={setSearch}
        searchPlaceholder={t?.unitHistorySearchPlaceholder || "Cari SN, MAC, customer, case, RMA..."}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        preset={preset}
        onSelectPreset={applyPreset}
        onResetDate={resetDate}
        onResetAll={resetAll}
        hasActiveFilters={
          Object.keys(colFilters || {}).length > 0 ||
          search ||
          fromDate ||
          toDate ||
          preset ||
          Boolean(channelFilter) ||
          Boolean(statusFilter)
        }
        t={t}
      />

      {/* ── 3-Group Summary (Total / RMA / WhatsApp) ── */}
      <UnitHistorySummary
        baseRows={baseFilteredUnitHistory}
        filteredRows={filteredUnitHistory}
        channelFilter={channelFilter}
        statusFilter={statusFilter}
        onSelectSummary={(ch, st) => {
          setChannelFilter(ch);
          setStatusFilter(st);
        }}
        master={master}
        t={t}
      />

      {search.trim() && filteredUnitHistory.length > 1 && (
        <InlineHint tone="warn">
          {t?.unitHistoryPriorWarning ? t.unitHistoryPriorWarning.replace("{n}", filteredUnitHistory.length) : `Ditemukan ${filteredUnitHistory.length} riwayat unit.`}
        </InlineHint>
      )}

      {/* Record Count */}
      <div
        style={{
          fontSize: 12,
          color: T.ink2,
          fontFamily: sans,
        }}
      >
        {(t?.unitHistoryShowing || "Menampilkan {shown} dari {total} riwayat unit")
          .replace("{shown}", filteredUnitHistory.length)
          .replace("{total}", combinedRows.length)}
      </div>

      {/* ── Table (reusing RmaTable) ── */}
      <RmaTable
        allRows={combinedRows}
        rows={filteredUnitHistory}
        colFilters={colFilters}
        onColFilter={onColFilter}
        t={t}
        emptyLabel={
          (fromDate || toDate) && filteredUnitHistory.length === 0
            ? (t?.noDataForDateRange || "Tidak ada data pada rentang tanggal yang dipilih.")
            : search.trim() && filteredUnitHistory.length === 0
            ? (t?.unitHistoryNotFound ? t.unitHistoryNotFound.replace('"{q}"', `"${search}"`) : "Tidak ditemukan riwayat unit.")
            : "Belum ada riwayat unit."
        }
        columns={columns}
      />
    </div>
  );
}

/* ============================================================
   SETTINGS / MASTER DATA
   ============================================================ */
function TagList({ label, items = [], onChange, t, isViewer = false }) {
  const [val, setVal] = useState("");
  const currentLang = localStorage.getItem("hsgq_language") || "id";
  const curT = t || I18N[currentLang] || I18N.id;

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
            {getLocalizedOption(it, curT, currentLang)}
            {!isViewer && (
              <X
                size={12}
                style={{ cursor: "pointer", color: T.ink3 }}
                onClick={() => onChange(items.filter((x) => x !== it))}
              />
            )}
          </span>
        ))}
      </div>
      {!isViewer && (
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
      )}
    </div>
  );
}
function SettingsTab({ master, setMaster, t, isViewer = false }) {
  const update = (k) => (arr) => {
    if (isViewer) return;
    setMaster((m) => {
      const next = { ...m, [k]: arr };
      masterApi.update(next).catch((err) => console.error("Gagal update master data ke SQLite:", err));
      return next;
    });
  };
  return (
    <div
      className="form-grid-2"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
    >
      <TagList
        label={t.settingsEngineer}
        items={master.engineers || []}
        onChange={update("engineers")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsStatusRma}
        items={master.statusRMA || []}
        onChange={update("statusRMA")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsStatusWa}
        items={master.statusWA || []}
        onChange={update("statusWA")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsFinalResults}
        items={master.finalResults || []}
        onChange={update("finalResults")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsWaitingReasons}
        items={master.waitingReasons || []}
        onChange={update("waitingReasons")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsWarrantyStatuses}
        items={master.warrantyStatuses || []}
        onChange={update("warrantyStatuses")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsQcResults}
        items={master.qcResults || []}
        onChange={update("qcResults")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsShippingMethod}
        items={master.pengiriman || []}
        onChange={update("pengiriman")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsPcbaTypes}
        items={master.pcbaTypes || []}
        onChange={update("pcbaTypes")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsSuppliers}
        items={master.suppliers || []}
        onChange={update("suppliers")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsWarehouseLocations}
        items={master.warehouseLocations || []}
        onChange={update("warehouseLocations")}
        t={t}
        isViewer={isViewer}
      />
      <TagList
        label={t.settingsPcbaReceivedBy || "PCBA Received By"}
        items={master.pcbaReceivedBy || []}
        onChange={update("pcbaReceivedBy")}
        t={t}
        isViewer={isViewer}
      />
      <Field label={t.settingsMinStockDefault}>
        <TextInput
          type="number"
          min="0"
          disabled={isViewer}
          value={master.minStockDefault}
          onChange={(e) => {
            if (isViewer) return;
            setMaster((m) => {
              const next = {
                ...m,
                minStockDefault: Number(e.target.value) || 0,
              };
              storeSet(KEYS.master, next);
              return next;
            });
          }}
        />
      </Field>
    </div>
  );
}

/* ============================================================
   PCBA INVENTORY & REPAIR
   ============================================================ */
function PcbaBadge({ status, t }) {
  const c = pcbaLed(status);
  const displayLabel = getLocalizedStatus(status, t);
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
        {displayLabel}
      </span>
    </span>
  );
}

function GoodsReceiptForm({ master, pcbaItems = [], onSave, onClose, t }) {
  const pcbaRecList =
    master.pcbaReceivedBy && master.pcbaReceivedBy.length > 0
      ? master.pcbaReceivedBy
      : master.engineers || [];

  const [f, setF] = useState({
    serialNo: "",
    pcbaType: master.pcbaTypes[0] || "",
    product: "",
    supplier: master.suppliers[0] || "",
    warehouseLocation: master.warehouseLocations[0] || "",
    receivedDate: todayISO(),
    receivedBy: pcbaRecList[0] || "",
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
        <Field label={t.pcbaSerialNo || "No. Serial PCBA"}>
          <TextInput
            value={f.serialNo}
            onChange={set("serialNo")}
            style={{ fontFamily: mono }}
          />
        </Field>
        <Field label={t.pcbaType || "Tipe PCBA"}>
          <Select
            options={master.pcbaTypes}
            value={f.pcbaType}
            onChange={set("pcbaType")}
          />
        </Field>
        <Field label={t.pcbaProduct || "Produk Terkait"}>
          <TextInput
            value={f.product}
            onChange={set("product")}
            placeholder="cth. G04ID"
          />
        </Field>
        <Field label={t.pcbaSupplier || "Supplier"}>
          <Select
            options={master.suppliers}
            value={f.supplier}
            onChange={set("supplier")}
          />
        </Field>
        <Field label={t.pcbaWarehouseLocation || "Lokasi Gudang"}>
          <Select
            options={master.warehouseLocations}
            value={f.warehouseLocation}
            onChange={set("warehouseLocation")}
          />
        </Field>

        <Field label={t.pcbaReceivedDate || "Tanggal Penerimaan"}>
          <TextInput
            type="date"
            value={f.receivedDate}
            onChange={set("receivedDate")}
          />
        </Field>
        <Field label={t.pcbaReceivedBy || "Penerima PCBA"}>
          <Select
            options={pcbaRecList}
            value={f.receivedBy}
            onChange={set("receivedBy")}
          />
        </Field>
      </div>
      <Field label={t.pcbaNotes || "Catatan"}>
        <TextArea value={f.notes} onChange={set("notes")} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          {t.cancel || "Batal"}
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={async () => {
            const sn = f.serialNo.trim();
            if (!sn) {
              setErr(t.errSnRequired || "No. Serial PCBA wajib diisi.");
              return;
            }
            const isDupe = pcbaItems.some(
              (i) => (i.serialNo || "").trim().toLowerCase() === sn.toLowerCase()
            );
            if (isDupe) {
              setErr(t.pcbaDupeSerial || `No. Serial PCBA "${sn}" sudah terdaftar di stok.`);
              return;
            }
            if (!f.receivedDate) {
              setErr(t.pcbaErrReceivedDateRequired || "Tanggal Penerimaan wajib diisi.");
              return;
            }
            if (!f.receivedBy || !f.receivedBy.trim()) {
              setErr(t.pcbaErrReceivedByRequired || "Penerima PCBA wajib diisi.");
              return;
            }
            setSaving(true);
            const ok = await onSave(f);
            setSaving(false);
            if (ok === false) {
              setErr(t.waSaveFailed || "Gagal menyimpan data.");
            }
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          {t.pcbaSaveStockIn || "Simpan Stok Masuk"}
        </Btn>
      </div>
    </div>
  );
}

function PcbaDetailModal({ item, pcba, rma, onClose, t }) {
  if (!item) return null;

  const itemTransactions = (pcba.transactions || []).filter((t) => t.pcbaItemId === item.id);
  const itemChinaShipments = (pcba.chinaShipments || []).filter((s) => s.pcbaItemId === item.id);

  return (
    <Modal title={`DETAIL PCBA — ${item.serialNo || "-"}`} onClose={onClose} width={640}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "75vh", overflowY: "auto", paddingRight: 4 }}>
        {/* Status Header */}
        <div
          style={{
            display: "flex",
            gap: 12,
            background: T.panel2,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${T.line}`,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              {t.pcbaSerialNo || "No. Serial PCBA"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: mono, color: T.ink, marginTop: 2 }}>
              {item.serialNo}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              {t.colStatus || "Status"}
            </div>
            <div style={{ marginTop: 4 }}>
              <PcbaBadge status={item.status} t={t} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              {t.pcbaReceivedDate || "Tanggal Penerimaan"}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2 }}>
              {fmtDate(item.receivedDate || item.createdAt)}
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            background: T.panel,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${T.line}`,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaType || "Tipe PCBA"}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{item.pcbaType || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaProduct || "Produk Terkait"}</div>
            <div style={{ fontSize: 13, color: T.ink }}>{item.product || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaSupplier || "Supplier"}</div>
            <div style={{ fontSize: 13, color: T.ink }}>{item.supplier || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaWarehouseLocation || "Lokasi Gudang"}</div>
            <div style={{ fontSize: 13, color: T.ink }}>{item.warehouseLocation || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaReceivedDate || "Tanggal Penerimaan"}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{fmtDate(item.receivedDate || item.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>{t.pcbaReceivedBy || "Penerima PCBA"}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{item.receivedBy || "—"}</div>
          </div>
        </div>

        {/* Notes */}
        {item.notes && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{t.pcbaNotes || "Catatan"}</div>
            <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.ink, whiteSpace: "pre-wrap" }}>
              {item.notes}
            </div>
          </div>
        )}

        {/* Transactions History */}
        {itemTransactions.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
              {(t.pcbaStockHistory || "Riwayat Transaksi Stok ({n})").replace("{n}", itemTransactions.length)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {itemTransactions.map((trx) => (
                <div
                  key={trx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: T.panel2,
                    border: `1px solid ${T.line}`,
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ fontFamily: mono, fontWeight: 600, color: T.cyan }}>{trx.transactionNo}</span>
                    <span style={{ marginLeft: 8, color: T.ink }}>{trx.type}</span>
                    {trx.reason && <span style={{ marginLeft: 8, color: T.ink3 }}>— {trx.reason}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: T.ink3 }}>{fmtDate(trx.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* China Shipments History */}
        {itemChinaShipments.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
              {(t.pcbaChinaShipmentHistory || "Riwayat Kirim ke China ({n})").replace("{n}", itemChinaShipments.length)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {itemChinaShipments.map((shp) => (
                <div
                  key={shp.id}
                  style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 6, padding: "8px 12px", fontSize: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontFamily: mono, fontWeight: 600, color: T.cyan }}>{shp.shipmentNo || shp.id}</span>
                    <span style={{ color: T.ink3 }}>{fmtDate(shp.date || shp.createdAt)}</span>
                  </div>
                  {shp.macAddress && shp.macAddress !== "-" && (
                    <div style={{ color: T.ink2, marginBottom: 2 }}>
                      MAC: <span style={{ fontFamily: mono }}>{shp.macAddress}</span>
                    </div>
                  )}
                  {shp.notes && <div style={{ color: T.ink2 }}>{t.pcbaNotes || "Catatan"}: {shp.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="solid" onClick={onClose}>
            {t.close || "Tutup"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function EditPcbaModal({ item, pcbaItems = [], master, onSave, onClose, t }) {
  const pcbaRecList =
    master.pcbaReceivedBy && master.pcbaReceivedBy.length > 0
      ? master.pcbaReceivedBy
      : master.engineers || [];

  const [f, setF] = useState({
    serialNo: item.serialNo || "",
    pcbaType: item.pcbaType || master.pcbaTypes[0] || "",
    product: item.product || "",
    supplier: item.supplier || master.suppliers[0] || "",
    warehouseLocation: item.warehouseLocation || master.warehouseLocations[0] || "",
    status: item.status || "Good",
    receivedDate: item.receivedDate || parseToISODate(item.createdAt) || todayISO(),
    receivedBy: item.receivedBy || pcbaRecList[0] || "",
    notes: item.notes || "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={`${t.editAction || "EDIT"} PCBA — ${item.serialNo}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && <InlineHint tone="warn">{err}</InlineHint>}
        <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t.pcbaSerialNo || "No. Serial PCBA"}>
            <TextInput
              value={f.serialNo}
              onChange={set("serialNo")}
              style={{ fontFamily: mono }}
            />
          </Field>
          <Field label={t.pcbaType || "Tipe PCBA"}>
            <Select
              options={master.pcbaTypes}
              value={f.pcbaType}
              onChange={set("pcbaType")}
            />
          </Field>
          <Field label={t.pcbaProduct || "Produk Terkait"}>
            <TextInput
              value={f.product}
              onChange={set("product")}
              placeholder="cth. G04ID"
            />
          </Field>
          <Field label={t.pcbaSupplier || "Supplier"}>
            <Select
              options={master.suppliers}
              value={f.supplier}
              onChange={set("supplier")}
            />
          </Field>
          <Field label={t.pcbaWarehouseLocation || "Lokasi Gudang"}>
            <Select
              options={master.warehouseLocations}
              value={f.warehouseLocation}
              onChange={set("warehouseLocation")}
            />
          </Field>
          <Field label={t.colStatus || "Status"}>
            <Select
              options={PCBA_STATUSES}
              value={f.status}
              onChange={set("status")}
            />
          </Field>
          <Field label={t.pcbaReceivedDate || "Tanggal Penerimaan"}>
            <TextInput
              type="date"
              value={f.receivedDate}
              onChange={set("receivedDate")}
            />
          </Field>
          <Field label={t.pcbaReceivedBy || "Penerima PCBA"}>
            <Select
              options={pcbaRecList}
              value={f.receivedBy}
              onChange={set("receivedBy")}
            />
          </Field>
        </div>
        <Field label={t.pcbaNotes || "Catatan"}>
          <TextArea value={f.notes} onChange={set("notes")} />
        </Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            disabled={saving}
            onClick={async () => {
              const sn = f.serialNo.trim();
              if (!sn) {
                setErr(t.errSnRequired || "No. Serial PCBA wajib diisi.");
                return;
              }
              const isDupe = pcbaItems.some(
                (i) => i.id !== item.id && (i.serialNo || "").trim().toLowerCase() === sn.toLowerCase()
              );
              if (isDupe) {
                setErr(t.pcbaDupeSerial || `No. Serial PCBA "${sn}" sudah terdaftar pada item lain.`);
                return;
              }
              if (!f.receivedDate) {
                setErr(t.pcbaErrReceivedDateRequired || "Tanggal Penerimaan wajib diisi.");
                return;
              }
              if (!f.receivedBy || !f.receivedBy.trim()) {
                setErr(t.pcbaErrReceivedByRequired || "Penerima PCBA wajib diisi.");
                return;
              }
              setSaving(true);
              const ok = await onSave(item.id, {
                ...item,
                serialNo: sn,
                pcbaType: f.pcbaType,
                product: f.product.trim(),
                supplier: f.supplier,
                warehouseLocation: f.warehouseLocation,
                status: f.status,
                receivedDate: f.receivedDate,
                receivedBy: f.receivedBy,
                notes: f.notes.trim(),
              });
              setSaving(false);
              if (ok) onClose();
              else setErr(t.waSaveFailed || "Gagal menyimpan perubahan.");
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
            {t.saveChanges || "Simpan Perubahan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function DeletePcbaModal({ item, pcba, onDelete, onClose, t }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!item) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    const ok = await onDelete(item.id);
    setDeleting(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg(t.pcbaDeleteFailed || "Gagal menghapus PCBA. Silakan coba lagi.");
    }
  };

  return (
    <Modal title={t.pcbaDeleteConfirmTitle || "KONFIRMASI HAPUS PCBA"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: T.ink }}>
          {t.pcbaDeleteConfirmMsg || "Data PCBA akan dihapus dan tindakan ini tidak dapat dibatalkan."}
        </div>
        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaSerialNo || "No. Serial PCBA"}:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.ink }}>{item.serialNo}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaType || "Tipe PCBA"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{item.pcbaType}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colStatus || "Status"}:</div>
            <div style={{ marginTop: 2 }}><PcbaBadge status={item.status} t={t} /></div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaSupplier || "Supplier"}:</div>
            <div style={{ color: T.ink }}>{item.supplier || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaWarehouseLocation || "Lokasi Gudang"}:</div>
            <div style={{ color: T.ink }}>{item.warehouseLocation || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaReceivedDate || "Tanggal Penerimaan"}:</div>
            <div style={{ color: T.ink, fontWeight: 600 }}>{fmtDate(item.receivedDate || item.createdAt)}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaReceivedBy || "Penerima PCBA"}:</div>
            <div style={{ color: T.ink, fontWeight: 600 }}>{item.receivedBy || "-"}</div>
          </div>
        </div>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={deleting}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            style={{ background: T.red, borderColor: T.red }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {t.deleteAction || "Hapus"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function TransactionDetailModal({ transaction, pcba, rma, onClose, t }) {
  if (!transaction) return null;

  const item = (pcba.items || []).find((i) => i.id === transaction.pcbaItemId);
  const rmaTicket = (rma || []).find((x) => x.id === transaction.rmaId);

  return (
    <Modal title={`DETAIL TRANSAKSI — ${transaction.transactionNo || "-"}`} onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaNoTransaction || "No. Transaksi"}:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{transaction.transactionNo}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colType || "Tipe Transaksi"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{transaction.type}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaSerialNo || "No. Serial PCBA"}:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{item?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaType || "Tipe PCBA"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{item?.pcbaType || "-"}</div>
          </div>
          {rmaTicket && (
            <div>
              <div style={{ color: T.ink3 }}>RMA:</div>
              <div style={{ fontWeight: 600, color: T.cyan }}>{rmaTicket.ticketNo}</div>
            </div>
          )}
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaColReceivedBy || t.pcbaReceivedBy || "Penerima / Oleh"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{transaction.receivedBy || transaction.performedBy || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colDate || "Tanggal Transaksi"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{fmtDate(transaction.createdAt)}</div>
          </div>
        </div>

        {transaction.reason && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{t.pcbaNotes || "Catatan / Alasan"}</div>
            <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.ink, whiteSpace: "pre-wrap" }}>
              {transaction.reason}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="solid" onClick={onClose}>
            {t.close || "Tutup"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function DeleteTransactionModal({ transaction, pcba, onDelete, onClose, t }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!transaction) return null;
  const item = (pcba.items || []).find((i) => i.id === transaction.pcbaItemId);

  const handleConfirm = async () => {
    setDeleting(true);
    const ok = await onDelete(transaction.id);
    setDeleting(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg(t.pcbaDeleteFailed || "Gagal menghapus transaksi. Silakan coba lagi.");
    }
  };

  return (
    <Modal title={t.deleteTransactionTitle || "KONFIRMASI HAPUS TRANSAKSI"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: T.ink }}>
          {t.deleteTransactionMsg || "Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan."}
        </div>

        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaNoTransaction || "No. Transaksi"}:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{transaction.transactionNo}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colType || "Tipe Transaksi"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{transaction.type}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaSerialNo || "No. Serial PCBA"}:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{item?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colDate || "Tanggal"}:</div>
            <div style={{ color: T.ink, fontWeight: 600 }}>{fmtDate(transaction.createdAt)}</div>
          </div>
        </div>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={deleting}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            style={{ background: T.red, borderColor: T.red }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {t.deleteAction || "Hapus"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ReplacementDetailModal({ replacement, pcba, rma, onClose, t }) {
  if (!replacement) return null;

  const rmaTicket = (rma || []).find((x) => x.id === replacement.rmaId);
  const oldItem = (pcba.items || []).find((i) => i.id === replacement.oldPcbaItemId);
  const newItem = (pcba.items || []).find((i) => i.id === replacement.newPcbaItemId);
  const isSentToChina = (pcba.chinaShipments || []).some(
    (s) => s.pcbaItemId === replacement.oldPcbaItemId || (oldItem?.serialNo && (s.serialNumber === oldItem.serialNo || s.serialNo === oldItem.serialNo))
  ) || oldItem?.status === "Sent" || oldItem?.status === "Sent to China";

  return (
    <Modal title={`DETAIL REPLACEMENT — ${replacement.replacementNo || "-"}`} onClose={onClose} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaNoReplacement || "No. Replacement"}:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{replacement.replacementNo}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaRelatedRma || "Tiket RMA Terkait"}:</div>
            <div style={{ fontWeight: 600, color: T.cyan }}>{rmaTicket?.ticketNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaReplaceOld || "PCBA Lama (Dilepas)"}:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{oldItem?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaType || "Tipe PCBA"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{newItem?.pcbaType || replacement.pcbaType || oldItem?.pcbaType || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colChinaStatus || "Status Kirim China"}:</div>
            <div>
              {isSentToChina ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${T.cyan}22`, color: T.cyan, fontSize: 11.5, fontWeight: 700, border: `1px solid ${T.cyan}44` }}>
                  <Truck size={12} />
                  {t.statusSent || "Sent"}
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: `${T.red}18`, color: T.red, fontSize: 11.5, fontWeight: 600, border: `1px solid ${T.red}33` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.red }} />
                  {oldItem?.status ? getLocalizedStatus(oldItem.status, t) : (t.statusNotSent || "Belum Dikirim")}
                </span>
              )}
            </div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaReplaceNew || "PCBA Baru (Dipasang)"}:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{newItem?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colEngineer || "Diproses Oleh"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{replacement.replacedBy || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colDate || "Tanggal Replacement"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{fmtDate(replacement.replacedAt)}</div>
          </div>
        </div>

        {replacement.notes && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{t.pcbaNotes || "Catatan"}</div>
            <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.ink }}>{replacement.notes}</div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="solid" onClick={onClose}>
            {t.close || "Tutup"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function EditReplacementModal({ replacement, pcba, rma, master, onSave, onClose, t }) {
  if (!replacement) return null;
  const oldItem = (pcba.items || []).find((i) => i.id === replacement.oldPcbaItemId);

  const selectableNewItems = useMemo(() => {
    return (pcba.items || []).filter((i) => i.status === "Good" || i.id === replacement.newPcbaItemId);
  }, [pcba.items, replacement.newPcbaItemId]);

  const [rmaId, setRmaId] = useState(replacement.rmaId || "");
  const [newPcbaItemId, setNewPcbaItemId] = useState(replacement.newPcbaItemId || "");
  const [oldSerialNo, setOldSerialNo] = useState(oldItem?.serialNo || "");
  const [replacedBy, setReplacedBy] = useState(replacement.replacedBy || master.engineers?.[0] || "");
  const [replacedAt, setReplacedAt] = useState(
    replacement.replacedAt ? replacement.replacedAt.slice(0, 10) : todayISO()
  );
  const [notes, setNotes] = useState(replacement.notes || "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const rmaOpenList = useMemo(() => {
    return (rma || []).filter((r) => {
      const st = (r.status || "").toLowerCase();
      return st !== "dibatalkan" || r.id === replacement.rmaId;
    });
  }, [rma, replacement.rmaId]);

  const handleRmaChange = (newRmaId) => {
    const selectedRma = (rmaOpenList || []).find((r) => r.id === newRmaId || r.ticketNo === newRmaId);
    const sn = selectedRma ? (selectedRma.sn || selectedRma.serialNo || "").trim() : "";
    setRmaId(newRmaId);
    setOldSerialNo(sn);
    if (err) setErr("");
  };

  const isRmaSelected = Boolean(rmaId);
  const isSnMissing = isRmaSelected && !oldSerialNo;

  return (
    <Modal title={t.editReplacementTitle || "EDIT REPLACEMENT PCBA"} onClose={onClose} width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && <InlineHint tone="warn">{err}</InlineHint>}

        <Field label={t.pcbaRelatedRma || "RMA Terkait"}>
          <SearchableRmaSelect
            rmaList={rmaOpenList}
            value={rmaId}
            onChange={handleRmaChange}
            t={t}
          />
        </Field>

        <Field label={t.pcbaNewGoodStock || "PCBA Baru (Stok Dipasang)"}>
          <Select
            options={selectableNewItems.map((i) => `${i.serialNo} (${i.pcbaType})`)}
            value={(() => {
              const found = selectableNewItems.find((i) => i.id === newPcbaItemId);
              return found ? `${found.serialNo} (${found.pcbaType})` : "";
            })()}
            onChange={(e) => {
              const found = selectableNewItems.find(
                (i) => `${i.serialNo} (${i.pcbaType})` === e.target.value
              );
              setNewPcbaItemId(found ? found.id : "");
            }}
          />
        </Field>

        <Field
          label={t.pcbaOldSerialLabel || "No. Serial PCBA Lama (yang dilepas dari unit)"}
          hint={
            isSnMissing ? (
              <span style={{ color: T.amber, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} /> {t.pcbaSnNotFoundInRma || "SN PCBA tidak ditemukan pada RMA terkait."}
              </span>
            ) : null
          }
        >
          <TextInput
            value={oldSerialNo}
            readOnly
            placeholder={
              !isRmaSelected
                ? t.pcbaSelectRmaFirstPlaceholder || "Pilih RMA terkait terlebih dahulu..."
                : t.pcbaSnNotFoundInRma || "SN PCBA tidak ditemukan pada RMA terkait."
            }
            style={{
              fontFamily: mono,
              background: T.panel,
              cursor: "not-allowed",
              color: oldSerialNo ? T.cyan : T.ink3,
              fontWeight: oldSerialNo ? 700 : 400,
              borderColor: isSnMissing ? T.amber : T.line,
            }}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t.colEngineer || "Engineer"}>
            <Select
              options={master.engineers || []}
              value={replacedBy}
              onChange={(e) => setReplacedBy(e.target.value)}
            />
          </Field>

          <Field label={t.colDate || "Tanggal Replacement"}>
            <TextInput
              type="date"
              value={replacedAt}
              onChange={(e) => setReplacedAt(e.target.value)}
            />
          </Field>
        </div>

        <Field label={t.pcbaNotes || "Catatan"}>
          <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            disabled={saving}
            onClick={async () => {
              if (!rmaId) return setErr("Pilih RMA terkait dulu.");
              if (!newPcbaItemId) return setErr("Pilih PCBA baru dulu.");
              if (!oldSerialNo.trim()) return setErr("No. Serial PCBA lama wajib diisi.");
              if (!replacedBy) return setErr("Pilih engineer yang melakukan replacement.");
              if (!replacedAt) return setErr("Tanggal replacement wajib diisi.");

              setSaving(true);
              const ok = await onSave(replacement.id, {
                rmaId,
                newPcbaItemId,
                oldSerialNo: oldSerialNo.trim(),
                replacedBy,
                replacedAt: replacedAt.length === 10 ? `${replacedAt}T00:00:00.000Z` : replacedAt,
                notes: notes.trim(),
              });
              setSaving(false);
              if (ok) {
                onClose();
              } else {
                setErr("Gagal menyimpan perubahan replacement.");
              }
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
            {t.saveAction || "Simpan Perubahan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function DeleteReplacementModal({ replacement, pcba, rma, onDelete, onClose, t }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!replacement) return null;
  const rmaTicket = (rma || []).find((x) => x.id === replacement.rmaId);

  const handleConfirm = async () => {
    setDeleting(true);
    const ok = await onDelete(replacement.id);
    setDeleting(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg(t.pcbaDeleteFailed || "Gagal menghapus replacement. Silakan coba lagi.");
    }
  };

  return (
    <Modal title={t.deleteReplacementTitle || "KONFIRMASI HAPUS REPLACEMENT"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: T.ink }}>
          {t.deleteReplacementMsg || "Apakah Anda yakin ingin menghapus data replacement ini? Status PCBA baru akan dikembalikan menjadi Good."}
        </div>

        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaNoReplacement || "No. Replacement"}:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{replacement.replacementNo}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>RMA:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{rmaTicket?.ticketNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colEngineer || "Engineer"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{replacement.replacedBy || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colDate || "Tanggal"}:</div>
            <div style={{ color: T.ink, fontWeight: 600 }}>{fmtDate(replacement.replacedAt)}</div>
          </div>
        </div>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={deleting}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            style={{ background: T.red, borderColor: T.red }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {t.deleteAction || "Hapus"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function EditChinaShipmentModal({ shipment, pcba, onSave, onClose, t }) {
  if (!shipment) return null;
  const item = (pcba.items || []).find((i) => i.id === shipment.pcbaItemId);

  const [serialNumber, setSerialNumber] = useState(shipment.serialNumber || shipment.serialNo || item?.serialNo || "");
  const [macAddress, setMacAddress] = useState(shipment.macAddress || shipment.mac || item?.mac || "");
  const [date, setDate] = useState(
    shipment.date ? shipment.date.slice(0, 10) : (shipment.createdAt ? shipment.createdAt.slice(0, 10) : todayISO())
  );
  const [notes, setNotes] = useState(shipment.notes || "");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={t.editChinaShipmentTitle || "EDIT PENGIRIMAN KE CHINA"} onClose={onClose} width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && <InlineHint tone="warn">{err}</InlineHint>}

        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: T.ink3, fontSize: 11 }}>No. Pengiriman:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan, fontSize: 13 }}>{shipment.shipmentNo || shipment.id}</div>
          </div>
          <div>
            <div style={{ color: T.ink3, fontSize: 11 }}>Tipe PCBA:</div>
            <div style={{ fontWeight: 600, color: T.ink, fontSize: 13 }}>{item?.pcbaType || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3, fontSize: 11 }}>Status Item:</div>
            <div>
              <PcbaBadge status={item?.status || "Sent"} t={t} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="No. Serial (SN)">
            <TextInput
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              style={{ fontFamily: mono }}
            />
          </Field>

          <Field label="MAC Address">
            <TextInput
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              style={{ fontFamily: mono }}
            />
          </Field>
        </div>

        <Field label={t.colDate || "Tanggal Kirim"}>
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field label={t.pcbaNotes || "Catatan Kerusakan / Keterangan"}>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Catatan kendala / keterangan pengiriman..."
          />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            disabled={saving}
            onClick={async () => {
              if (!serialNumber.trim()) return setErr("No. Serial (SN) wajib diisi.");
              if (!date) return setErr("Tanggal pengiriman wajib diisi.");

              setSaving(true);
              const ok = await onSave(shipment.id, {
                serialNumber: serialNumber.trim(),
                serialNo: serialNumber.trim(),
                macAddress: macAddress.trim() || "-",
                mac: macAddress.trim() || "-",
                date,
                notes: notes.trim(),
              });
              setSaving(false);
              if (ok) {
                onClose();
              } else {
                setErr("Gagal menyimpan perubahan pengiriman.");
              }
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
            {t.saveAction || "Simpan Perubahan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ChinaShipmentDetailModal({ shipment, pcba, onClose, t }) {
  if (!shipment) return null;
  const item = (pcba.items || []).find((i) => i.id === shipment.pcbaItemId);

  return (
    <Modal title={`DETAIL PENGIRIMAN KE CHINA — ${shipment.serialNumber || shipment.serialNo || "-"}`} onClose={onClose} width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>No. Pengiriman:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{shipment.shipmentNo || shipment.id}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>No. Serial (SN):</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{shipment.serialNumber || shipment.serialNo || item?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>MAC Address:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{shipment.macAddress || shipment.mac || item?.mac || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colDate || "Tanggal Kirim"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{fmtDate(shipment.date || shipment.createdAt)}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.pcbaType || "Tipe PCBA"}:</div>
            <div style={{ fontWeight: 600, color: T.ink }}>{item?.pcbaType || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>{t.colStatus || "Status Item"}:</div>
            <div>
              <PcbaBadge status={item?.status || "Sent"} t={t} />
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>
            {t.pcbaNotes || "Catatan Kerusakan / Keterangan"}
          </div>
          <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.ink, whiteSpace: "pre-wrap" }}>
            {shipment.notes && shipment.notes.trim() ? shipment.notes : "-"}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <Btn variant="solid" onClick={onClose}>
            {t.close || "Tutup"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function DeleteChinaShipmentModal({ shipment, pcba, onDelete, onClose, t }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!shipment) return null;
  const item = (pcba.items || []).find((i) => i.id === shipment.pcbaItemId);

  const handleConfirm = async () => {
    setDeleting(true);
    const ok = await onDelete(shipment.id);
    setDeleting(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg("Gagal membatalkan pengiriman. Silakan coba lagi.");
    }
  };

  return (
    <Modal title={t.deleteChinaShipmentTitle || "KONFIRMASI BATALKAN PENGIRIMAN"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 13, color: T.ink }}>
          {t.deleteChinaShipmentMsg || "Apakah Anda yakin ingin membatalkan/menghapus data pengiriman ini? Status PCBA terkait akan dikembalikan menjadi Bad."}
        </div>

        <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12.5 }}>
          <div>
            <div style={{ color: T.ink3 }}>No. Pengiriman:</div>
            <div style={{ fontWeight: 700, fontFamily: mono, color: T.cyan }}>{shipment.shipmentNo || shipment.id}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>Serial Number (SN):</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{shipment.serialNumber || shipment.serialNo || item?.serialNo || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>MAC Address:</div>
            <div style={{ fontWeight: 600, fontFamily: mono, color: T.ink }}>{shipment.macAddress || shipment.mac || "-"}</div>
          </div>
          <div>
            <div style={{ color: T.ink3 }}>Tanggal:</div>
            <div style={{ color: T.ink, fontWeight: 600 }}>{fmtDate(shipment.date || shipment.createdAt)}</div>
          </div>
        </div>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose} disabled={deleting}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            style={{ background: T.red, borderColor: T.red }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {t.deleteAction || "Hapus / Batalkan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function ReplacementForm({ master, rmaOpenList, goodItems, onSave, onClose, t }) {
  const [f, setF] = useState({
    rmaId: "",
    newPcbaItemId: "",
    oldSerialNo: "",
    replacedBy: master.engineers?.[0] || "",
    notes: "",
  });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRmaChange = (newRmaId) => {
    const selectedRma = (rmaOpenList || []).find((r) => r.id === newRmaId || r.ticketNo === newRmaId);
    const sn = selectedRma ? (selectedRma.sn || selectedRma.serialNo || "").trim() : "";
    setF((s) => ({
      ...s,
      rmaId: newRmaId,
      oldSerialNo: sn,
    }));
    if (err) setErr("");
  };

  const isRmaSelected = Boolean(f.rmaId);
  const isSnMissing = isRmaSelected && !f.oldSerialNo;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InlineHint>
        Sistem menolak otomatis kalau stok PCBA Good untuk tipe terkait kosong.
        PCBA lama yang dilepas akan otomatis masuk stok sebagai "Bad".
      </InlineHint>
      {err && <InlineHint tone="warn">{err}</InlineHint>}
      <Field label={t.pcbaRelatedRma || "RMA Terkait"}>
        <SearchableRmaSelect
          rmaList={rmaOpenList}
          value={f.rmaId}
          onChange={handleRmaChange}
          t={t}
        />
      </Field>
      <Field label={t.pcbaNewGoodStock || "PCBA Baru (stok Good)"}>
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
      <Field
        label={t.pcbaOldSerialLabel || "No. Serial PCBA Lama (yang dilepas dari unit)"}
        hint={
          isSnMissing ? (
            <span style={{ color: T.amber, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={12} /> {t.pcbaSnNotFoundInRma || "SN PCBA tidak ditemukan pada RMA terkait."}
            </span>
          ) : null
        }
      >
        <TextInput
          value={f.oldSerialNo}
          readOnly
          placeholder={
            !isRmaSelected
              ? t.pcbaSelectRmaFirstPlaceholder || "Pilih RMA terkait terlebih dahulu..."
              : t.pcbaSnNotFoundInRma || "SN PCBA tidak ditemukan pada RMA terkait."
          }
          style={{
            fontFamily: mono,
            background: T.panel,
            cursor: "not-allowed",
            color: f.oldSerialNo ? T.cyan : T.ink3,
            fontWeight: f.oldSerialNo ? 700 : 400,
            borderColor: isSnMissing ? T.amber : T.line,
          }}
        />
      </Field>
      <Field label={t.colEngineer || "Engineer"}>
        <Select
          options={master.engineers}
          value={f.replacedBy}
          onChange={set("replacedBy")}
        />
      </Field>
      <Field label={t.pcbaNotes || "Catatan"}>
        <TextArea value={f.notes} onChange={set("notes")} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          {t.cancel || "Batal"}
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={async () => {
            if (!f.rmaId) return setErr("Pilih RMA terkait dulu.");
            if (!f.newPcbaItemId)
              return setErr("Pilih PCBA baru (stok Good) dulu.");
            if (!f.oldSerialNo.trim())
              return setErr(t.pcbaSnNotFoundInRma || "SN PCBA tidak ditemukan pada RMA terkait.");
            if (!f.replacedBy)
              return setErr("Pilih engineer yang melakukan replacement.");
            setSaving(true);
            const res = await onSave(f);
            setSaving(false);
            if (res && res.ok === false) setErr(res.error);
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          {t.pcbaProcessReplacement || "Proses Replacement"}
        </Btn>
      </div>
    </div>
  );
}

function SendToChinaForm({ pcba, onSave, onClose, t }) {
  const badItems = useMemo(() => {
    return (pcba.items || []).filter((i) => i.status === "Bad");
  }, [pcba.items]);

  const [selectedItemId, setSelectedItemId] = useState(badItems[0]?.id || "");
  const [manualSn, setManualSn] = useState(badItems[0]?.serialNo || "");
  const [macAddress, setMacAddress] = useState(badItems[0]?.mac || "");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedItemId(id);
    const item = badItems.find((i) => i.id === id);
    if (item) {
      setManualSn(item.serialNo || "");
      if (item.mac) setMacAddress(item.mac);
      setErr("");
    }
  };

  const handleSnBlur = () => {
    const trimmed = manualSn.trim();
    if (!trimmed) return;
    const found = (pcba.items || []).find(
      (i) => (i.serialNo || "").toLowerCase() === trimmed.toLowerCase()
    );
    if (found) {
      setSelectedItemId(found.id);
      if (found.mac && !macAddress) setMacAddress(found.mac);
      if (found.status !== "Bad") {
        setErr(`Peringatan: PCBA dengan SN "${trimmed}" berstatus "${found.status}". Hanya PCBA berstatus "Bad" yang dapat dikirim ke China.`);
      } else {
        setErr("");
      }
    } else {
      setSelectedItemId("");
      setErr(`SN "${trimmed}" tidak ditemukan di inventaris PCBA.`);
    }
  };

  const selectedItem = (pcba.items || []).find(
    (i) => i.id === selectedItemId || (manualSn.trim() && (i.serialNo || "").toLowerCase() === manualSn.trim().toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InlineHint>
        Khusus untuk mencatat PCBA berstatus Bad yang dikirim ke China untuk proses perbaikan.
        Stok Bad akan otomatis berkurang dan riwayat pengiriman tercatat di sistem.
      </InlineHint>
      {err && <InlineHint tone="warn">{err}</InlineHint>}

      {badItems.length === 0 ? (
        <InlineHint tone="warn">
          {t.pcbaNoBadItemsAvailable || "Tidak ada PCBA dengan status Bad di stok saat ini."}
        </InlineHint>
      ) : (
        <Field label={t.pcbaSelectBadItem || "Pilih dari Daftar PCBA Bad"}>
          <select
            value={selectedItemId}
            onChange={handleSelectChange}
            style={{
              ...inputBase,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <option value="">-- {t.pcbaSelectItem || "Pilih PCBA"} --</option>
            {badItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.serialNo} ({item.pcbaType || "Unknown"} - {item.supplier || "Supplier"})
              </option>
            ))}
          </select>
        </Field>
      )}

      <div
        className="form-grid-2"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <Field label="No. Serial (SN)">
          <TextInput
            value={manualSn}
            onChange={(e) => {
              setManualSn(e.target.value);
              setErr("");
            }}
            onBlur={handleSnBlur}
            placeholder="Contoh: ABC123456"
            style={{ fontFamily: mono }}
          />
        </Field>

        <Field label="MAC Address">
          <TextInput
            value={macAddress}
            onChange={(e) => setMacAddress(e.target.value)}
            placeholder="Contoh: AA:BB:CC:DD:EE:FF"
            style={{ fontFamily: mono }}
          />
        </Field>

        <Field label={t.colDate || "Tanggal Kirim"}>
          <TextInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        <Field label={t.colStatus || "Status Saat Ini"}>
          <div
            style={{
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              height: 38,
              boxSizing: "border-box",
            }}
          >
            {selectedItem ? (
              <PcbaBadge status={selectedItem.status} t={t} />
            ) : (
              <span style={{ color: T.ink3 }}>Belum dipilih</span>
            )}
          </div>
        </Field>
      </div>

      <Field label={t.pcbaNotes || "Catatan Kerusakan / Keterangan"}>
        <TextArea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: PON tidak detect, Power issue, chip terbakar..."
          rows={3}
        />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose} disabled={saving}>
          {t.cancel || "Batal"}
        </Btn>
        <Btn
          variant="solid"
          disabled={saving}
          onClick={async () => {
            const snTrimmed = manualSn.trim();
            if (!snTrimmed) {
              return setErr("No. Serial (SN) wajib diisi.");
            }

            const targetItem = (pcba.items || []).find(
              (i) => (i.id === selectedItemId) || ((i.serialNo || "").toLowerCase() === snTrimmed.toLowerCase())
            );

            if (!targetItem) {
              return setErr(`PCBA dengan SN "${snTrimmed}" tidak ditemukan di inventaris.`);
            }

            if (targetItem.status !== "Bad") {
              return setErr(
                `Hanya PCBA dengan status "Bad" yang dapat dikirim ke China. Status item saat ini adalah "${targetItem.status}".`
              );
            }

            if (!date) {
              return setErr("Tanggal pengiriman wajib diisi.");
            }

            setSaving(true);
            const res = await onSave({
              pcbaItemId: targetItem.id,
              serialNumber: targetItem.serialNo,
              serialNo: targetItem.serialNo,
              macAddress: macAddress.trim() || targetItem.mac || "-",
              mac: macAddress.trim() || targetItem.mac || "-",
              date: date,
              notes: notes.trim(),
            });
            setSaving(false);

            if (res && res.ok === false) {
              setErr(res.error || "Gagal menyimpan pengiriman.");
            }
          }}
        >
          {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}{" "}
          {t.pcbaSendToChina || "Kirim PCBA Bad ke China"}
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
  onBulkImportPcba,
  onEditPcbaItem,
  onDeletePcbaItem,
  onDeletePcbaTransaction,
  onDeleteReplacement,
  onEditReplacement,
  onSendToChina,
  onEditChinaShipment,
  onDeleteChinaShipment,
  onReplacement,
  setToastMsg,
  t,
  isViewer = false,
}) {
  const [subTab, setSubTab] = useState("stock");
  const [modal, setModal] = useState(null);

  const rmaOpenList = useMemo(() => {
    return (rma || []).filter((r) => {
      const st = (r.status || "").toLowerCase();
      return st !== "dibatalkan";
    });
  }, [rma]);

  const goodItems = useMemo(() => {
    return (pcba.items || []).filter((i) => i.status === "Good");
  }, [pcba.items]);

  const badItems = useMemo(() => {
    return (pcba.items || []).filter((i) => i.status === "Bad");
  }, [pcba.items]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const suppliers = useMemo(() => {
    const set = new Set();
    (pcba.items || []).forEach((i) => i.supplier && set.add(i.supplier));
    return Array.from(set).sort();
  }, [pcba.items]);

  const locations = useMemo(() => {
    const set = new Set();
    (pcba.items || []).forEach((i) => i.warehouseLocation && set.add(i.warehouseLocation));
    return Array.from(set).sort();
  }, [pcba.items]);

  const filteredStockItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (pcba.items || []).filter((item) => {
      if (q) {
        const haystack = [
          item.serialNo,
          item.pcbaType,
          item.status,
          getLocalizedStatus(item.status, t),
          item.supplier,
          item.warehouseLocation,
          item.receivedBy,
          item.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter && item.pcbaType !== typeFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (supplierFilter && item.supplier !== supplierFilter) return false;
      if (locationFilter && item.warehouseLocation !== locationFilter) return false;
      return true;
    });
  }, [pcba.items, search, typeFilter, statusFilter, supplierFilter, locationFilter, t]);

  const filteredReplacements = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (pcba.replacements || []).filter((r) => {
      const newItem = (pcba.items || []).find((i) => i.id === r.newPcbaItemId);
      const oldItem = (pcba.items || []).find((i) => i.id === r.oldPcbaItemId);
      const rmaTicket = (rma || []).find((x) => x.id === r.rmaId);

      if (typeFilter) {
        const matchNew = newItem?.pcbaType === typeFilter;
        const matchOld = oldItem?.pcbaType === typeFilter;
        if (!matchNew && !matchOld) return false;
      }

      if (statusFilter) {
        const matchNewStatus = newItem?.status === statusFilter;
        const matchOldStatus = oldItem?.status === statusFilter;
        if (!matchNewStatus && !matchOldStatus) return false;
      }

      if (supplierFilter) {
        const matchSupplier = newItem?.supplier === supplierFilter || oldItem?.supplier === supplierFilter;
        if (!matchSupplier) return false;
      }

      if (locationFilter) {
        const matchLocation = newItem?.warehouseLocation === locationFilter || oldItem?.warehouseLocation === locationFilter;
        if (!matchLocation) return false;
      }

      if (q) {
        const haystack = [
          r.replacementNo,
          rmaTicket?.ticketNo,
          newItem?.serialNo,
          newItem?.pcbaType,
          r.pcbaType,
          oldItem?.serialNo,
          oldItem?.pcbaType,
          r.replacedBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [pcba.replacements, pcba.items, rma, search, typeFilter, statusFilter, supplierFilter, locationFilter]);

  const filteredChinaShipments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (pcba.chinaShipments || []).filter((s) => {
      const item = (pcba.items || []).find((i) => i.id === s.pcbaItemId);

      if (typeFilter) {
        if (item?.pcbaType !== typeFilter) return false;
      }

      if (supplierFilter) {
        if (item?.supplier !== supplierFilter) return false;
      }

      if (locationFilter) {
        if (item?.warehouseLocation !== locationFilter) return false;
      }

      if (q) {
        const haystack = [
          s.shipmentNo,
          s.serialNumber,
          s.serialNo,
          s.macAddress,
          s.mac,
          s.notes,
          item?.pcbaType,
          item?.supplier,
          item?.warehouseLocation,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [pcba.chinaShipments, pcba.items, search, typeFilter, supplierFilter, locationFilter]);

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (pcba.transactions || []).filter((t) => {
      const item = (pcba.items || []).find((i) => i.id === t.pcbaItemId);
      const rmaTicket = (rma || []).find((x) => x.id === t.rmaId);

      if (typeFilter) {
        if (item?.pcbaType !== typeFilter) return false;
      }

      if (statusFilter) {
        if (item?.status !== statusFilter) return false;
      }

      if (supplierFilter) {
        if (item?.supplier !== supplierFilter) return false;
      }

      if (locationFilter) {
        if (item?.warehouseLocation !== locationFilter) return false;
      }

      if (q) {
        const haystack = [
          t.transactionNo,
          item?.serialNo,
          item?.pcbaType,
          t.type,
          rmaTicket?.ticketNo,
          t.reason,
          t.receivedBy,
          t.performedBy,
          item?.receivedBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [pcba.transactions, pcba.items, rma, search, typeFilter, statusFilter, supplierFilter, locationFilter]);

  const statusCounts = useMemo(() => {
    const m = {};
    PCBA_STATUSES.forEach((s) => (m[s] = 0));
    (pcba.items || []).forEach((i) => {
      if (!typeFilter || i.pcbaType === typeFilter) {
        m[i.status] = (m[i.status] || 0) + 1;
      }
    });
    return m;
  }, [pcba.items, typeFilter]);

  const pcbaTypeStats = useMemo(() => {
    const defaultTypes = ["G02ID", "G04ID", "G08ID", "E04ID", "XE08ID"];
    const configuredTypes = Array.isArray(master?.pcbaTypes) && master.pcbaTypes.length > 0 ? master.pcbaTypes : defaultTypes;
    const itemTypes = (pcba?.items || []).map((i) => i.pcbaType).filter(Boolean);
    const types = Array.from(new Set([...configuredTypes, ...itemTypes]));

    const statsMap = {};
    types.forEach((type) => {
      statsMap[type] = {
        type,
        total: 0,
        Good: 0,
        Bad: 0,
        "Under Repair": 0,
        Repaired: 0,
        "Used for Replacement": 0,
        Scrapped: 0,
        "Sent to China": 0,
      };
    });

    (pcba?.items || []).forEach((item) => {
      const type = item.pcbaType;
      if (type && statsMap[type]) {
        statsMap[type].total += 1;
        if (statsMap[type][item.status] !== undefined) {
          statsMap[type][item.status] += 1;
        }
      }
    });

    return types.map((type) => statsMap[type]);
  }, [master?.pcbaTypes, pcba?.items]);

  const SUB_TABS = [
    { id: "stock", label: t.pcbaStock, icon: Boxes },
    { id: "replacement", label: t.pcbaReplacement, icon: ArrowLeftRight },
    { id: "chinaShipments", label: t.pcbaSendToChina || "Kirim PCBA Bad ke China", icon: Truck },
    { id: "transactions", label: t.pcbaTransactions, icon: ClipboardList },
  ];

  return (
    <div>
      {/* PCBA TYPE OVERVIEW MINI DASHBOARD */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: T.ink,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Cpu size={15} style={{ color: T.cyan }} />
          {t.pcbaTypeOverview || "Ringkasan Tipe PCBA"}
        </div>

        {pcbaTypeStats.length === 0 ? (
          <InlineHint tone="warn">
            {t.pcbaNoTypesConfigured || "Belum ada Tipe PCBA terkonfigurasi di Settings."}
          </InlineHint>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            {pcbaTypeStats.map((st) => {
              const isActive = typeFilter === st.type;
              return (
                <div
                  key={st.type}
                  onClick={() => {
                    setTypeFilter((prev) => (prev === st.type ? "" : st.type));
                  }}
                  style={{
                    background: isActive ? T.panel2 : T.panel,
                    border: `1px solid ${isActive ? T.cyan : T.line}`,
                    boxShadow: isActive ? `0 0 0 1px ${T.cyan}` : "none",
                    borderRadius: 8,
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease-in-out",
                  }}
                  title={`Klik header untuk memfilter tipe: ${st.type}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                      borderBottom: `1px solid ${T.line}`,
                      paddingBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontWeight: 700,
                        fontSize: 13,
                        color: isActive ? T.cyan : T.ink,
                      }}
                    >
                      {st.type}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: mono,
                        fontWeight: 700,
                        color: T.cyan,
                        background: T.panel2,
                        padding: "2px 6px",
                        borderRadius: 4,
                        border: `1px solid ${T.line}`,
                      }}
                    >
                      {t.pcbaTotalStock || "Total"}: {st.total}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "3px 6px",
                      fontSize: 11,
                    }}
                  >
                    {PCBA_STATUSES.map((statusKey) => {
                      const isStatusActive = typeFilter === st.type && statusFilter === statusKey;
                      const count = st[statusKey] || 0;
                      return (
                        <div
                          key={statusKey}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypeFilter(st.type);
                            setStatusFilter((prev) => (typeFilter === st.type && prev === statusKey ? "" : statusKey));
                          }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "2px 5px",
                            borderRadius: 4,
                            background: isStatusActive ? T.panel2 : "transparent",
                            border: `1px solid ${isStatusActive ? T.cyan : "transparent"}`,
                            cursor: "pointer",
                            gridColumn: statusKey === "Used for Replacement" || statusKey === "Scrapped" ? "span 2" : "span 1",
                            transition: "all 0.15s ease",
                          }}
                          title={`Klik untuk filter: ${st.type} + ${getLocalizedStatus(statusKey, t)}`}
                        >
                          <span style={{ color: isStatusActive ? T.cyan : T.ink3, fontWeight: isStatusActive ? 600 : 400 }}>
                            {getLocalizedStatus(statusKey, t)}:
                          </span>
                          <span style={{ fontFamily: mono, fontWeight: 700, color: pcbaLed(statusKey) }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
      >
        {PCBA_STATUSES.map((s) => (
          <div
            key={s}
            onClick={() => setStatusFilter((prev) => (prev === s ? "" : s))}
            style={{
              background: statusFilter === s ? T.panel2 : T.panel,
              border: `1px solid ${statusFilter === s ? T.cyan : T.line}`,
              boxShadow: statusFilter === s ? `0 0 0 1px ${T.cyan}` : "none",
              borderRadius: 10,
              padding: "12px 16px",
              flex: 1,
              minWidth: 110,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title={`Klik untuk memfilter status: ${getLocalizedStatus(s, t)}`}
          >
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 0.4,
                color: statusFilter === s ? T.cyan : T.ink3,
                textTransform: "uppercase",
                fontFamily: sans,
                fontWeight: statusFilter === s ? 600 : 400,
              }}
            >
              {getLocalizedStatus(s, t)}
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

      {/* GLOBAL SEARCH & FILTER TOOLBAR */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t.pcbaSearchPlaceholder || "Cari SN, Type, Supplier, Lokasi..."}
        />

        {/* Filter Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            ...inputBase,
            padding: "4px 8px",
            fontSize: 12,
            width: "auto",
            cursor: "pointer",
          }}
        >
          <option value="">{t.filterType || "Semua Type"}</option>
          {pcbaTypeStats.map((st) => (
            <option key={st.type} value={st.type}>
              {st.type}
            </option>
          ))}
        </select>

        {/* Filter Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            ...inputBase,
            padding: "4px 8px",
            fontSize: 12,
            width: "auto",
            cursor: "pointer",
          }}
        >
          <option value="">{t.filterStatus || "Semua Status"}</option>
          {PCBA_STATUSES.map((st) => (
            <option key={st} value={st}>
              {getLocalizedStatus(st, t)}
            </option>
          ))}
        </select>

        {/* Filter Supplier Dropdown */}
        {suppliers.length > 0 && (
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            style={{
              ...inputBase,
              padding: "4px 8px",
              fontSize: 12,
              width: "auto",
              cursor: "pointer",
            }}
          >
            <option value="">{t.filterSupplier || "Semua Supplier"}</option>
            {suppliers.map((sup) => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>
        )}

        {/* Filter Location Dropdown */}
        {locations.length > 0 && (
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{
              ...inputBase,
              padding: "4px 8px",
              fontSize: 12,
              width: "auto",
              cursor: "pointer",
            }}
          >
            <option value="">{t.filterLocation || "Semua Lokasi"}</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}

        {(search || typeFilter || statusFilter || supplierFilter || locationFilter) && (
          <Btn
            variant="ghost"
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setStatusFilter("");
              setSupplierFilter("");
              setLocationFilter("");
            }}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            <RotateCcw size={12} /> {t.resetFilter || "Reset Filter"}
          </Btn>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Btn
            variant="ghost"
            onClick={() => {
              let exportItems = filteredStockItems;
              let namePrefix = "PCBA_Inventory_Stock";
              let customCols = null;
              let sheetName = "PCBA_Stock";

              if (subTab === "replacement") {
                exportItems = filteredReplacements.map((r) => {
                  const rmaTicket = (rma || []).find((x) => x.id === r.rmaId);
                  const oldItem = (pcba.items || []).find((i) => i.id === r.oldPcbaItemId);
                  const newItem = (pcba.items || []).find((i) => i.id === r.newPcbaItemId);
                  const isSent = (pcba.chinaShipments || []).some(
                    (s) => s.pcbaItemId === r.oldPcbaItemId || (oldItem?.serialNo && (s.serialNumber === oldItem.serialNo || s.serialNo === oldItem.serialNo))
                  ) || oldItem?.status === "Sent" || oldItem?.status === "Sent to China";

                  return {
                    ...r,
                    rmaTicketNo: rmaTicket?.ticketNo || "-",
                    oldSerialNo: oldItem?.serialNo || "-",
                    pcbaType: newItem?.pcbaType || r.pcbaType || oldItem?.pcbaType || "-",
                    chinaStatus: isSent ? "Sent" : (oldItem?.status || "Bad"),
                    newSerialNo: newItem?.serialNo || "-",
                  };
                });
                namePrefix = "PCBA_Inventory_Replacement";
                customCols = REPLACEMENT_COLUMNS;
                sheetName = "Replacements";
              } else if (subTab === "chinaShipments") {
                exportItems = filteredChinaShipments;
                namePrefix = "PCBA_Bad_Kirim_Ke_China";
                customCols = CHINA_SHIPMENT_COLUMNS;
                sheetName = "Kirim_Ke_China";
              } else if (subTab === "transactions") {
                exportItems = filteredTransactions;
                namePrefix = "PCBA_Inventory_Transactions";
                sheetName = "Transactions";
              }

              if (exportItems.length === 0) {
                if (setToastMsg) setToastMsg(t.noDataToExport || "Tidak ada data untuk diexport.");
                exportPcbaToExcel([], `${namePrefix}_Empty`, customCols, sheetName);
                return;
              }
              const isFiltered = Boolean(search || typeFilter || statusFilter || supplierFilter || locationFilter);
              exportPcbaToExcel(exportItems, isFiltered ? `${namePrefix}_Filtered` : namePrefix, customCols, sheetName);
            }}
            title="Export data (sesuai filter) ke .xlsx"
          >
            <FileDown size={14} /> {t.rmaExportExcel || "Export Excel"}
          </Btn>

          {!isViewer && subTab === "stock" && (
            <Btn
              variant="ghost"
              onClick={() => setModal({ type: "import" })}
              title="Import data PCBA dari file Excel"
            >
              <FileUp size={14} /> {t.pcbaImportExcel || "Import Excel"}
            </Btn>
          )}

          {!isViewer && subTab === "stock" && (
            <Btn variant="solid" onClick={() => setModal({ type: "receipt" })}>
              <Plus size={14} /> {t.pcbaReceiveNew}
            </Btn>
          )}
          {!isViewer && subTab === "replacement" && (
            <Btn variant="solid" onClick={() => setModal({ type: "replacement" })}>
              <Plus size={14} /> {t.pcbaNewReplacement || "Replacement Baru"}
            </Btn>
          )}
          {!isViewer && subTab === "chinaShipments" && (
            <Btn variant="solid" onClick={() => setModal({ type: "sendToChina" })}>
              <Plus size={14} /> {t.pcbaSendToChina || "Kirim PCBA Bad ke China"}
            </Btn>
          )}
        </div>
      </div>

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
        <DataTable
          columns={[
            { key: "serialNo", label: t.pcbaSerialNo || "No. Serial PCBA", mono: true },
            { key: "pcbaType", label: t.pcbaType || "Tipe PCBA" },
            {
              key: "status",
              label: t.colStatus || "Status",
              render: (r) => <PcbaBadge status={r.status} t={t} />,
            },
            { key: "supplier", label: t.pcbaSupplier || "Supplier" },
            { key: "warehouseLocation", label: t.pcbaWarehouseLocation || "Lokasi Gudang" },
            {
              key: "receivedDate",
              label: t.pcbaColReceivedDate || t.pcbaReceivedDate || "Tanggal Penerimaan",
              render: (r) => fmtDate(r.receivedDate || r.createdAt),
            },
            {
              key: "receivedBy",
              label: t.pcbaColReceivedBy || t.pcbaReceivedBy || "Penerima",
              render: (r) => r.receivedBy || "-",
            },
            {
              key: "notes",
              label: t.pcbaNotes || "Catatan",
              width: 280,
              minWidth: 280,
              maxWidth: 280,
              render: (r) => {
                const text = r.notes && r.notes.trim() ? r.notes.trim() : "-";
                return (
                  <div
                    title={r.notes && r.notes.trim() ? r.notes.trim() : undefined}
                    style={{
                      width: 280,
                      minWidth: 280,
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    {text}
                  </div>
                );
              },
            },
            {
              key: "actions",
              label: t.pcbaAction || "Aksi",
              render: (r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn
                    icon={Eye}
                    onClick={() => setModal({ type: "view", item: r })}
                    title={t.viewDetail || "Detail"}
                  />
                  {!isViewer && (
                    <>
                      <IconBtn
                        icon={Pencil}
                        onClick={() => setModal({ type: "edit", item: r })}
                        title={t.editAction || "Edit"}
                      />
                      <IconBtn
                        icon={Trash2}
                        danger
                        onClick={() => setModal({ type: "delete", item: r })}
                        title={t.deleteAction || "Hapus"}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={filteredStockItems}
          emptyLabel={
            search || typeFilter || statusFilter || supplierFilter || locationFilter
              ? (t.noDataForDateRange || "Tidak ada data yang memenuhi filter.")
              : (t.pcbaEmptyStock || "Belum ada PCBA di stok. Klik 'Terima PCBA Baru' untuk mulai.")
          }
        />
      )}

      {subTab === "replacement" && (
        <DataTable
          columns={[
            { key: "replacementNo", label: t.pcbaNoReplacement || "No. Replacement", mono: true },
            {
              key: "rmaId",
              label: "RMA",
              render: (r) =>
                rma.find((x) => x.id === r.rmaId)?.ticketNo || "-",
            },
            {
              key: "oldPcbaItemId",
              label: t.pcbaReplaceOld || "PCBA Lama",
              render: (r) =>
                pcba.items.find((i) => i.id === r.oldPcbaItemId)?.serialNo ||
                "-",
            },
            {
              key: "pcbaType",
              label: t.pcbaType || "Tipe PCBA",
              render: (r) => {
                const newItem = (pcba.items || []).find((i) => i.id === r.newPcbaItemId);
                const oldItem = (pcba.items || []).find((i) => i.id === r.oldPcbaItemId);
                return newItem?.pcbaType || r.pcbaType || oldItem?.pcbaType || "-";
              },
            },
            {
              key: "chinaStatus",
              label: t.colChinaStatus || "Status Kirim China",
              render: (r) => {
                const oldItem = (pcba.items || []).find((i) => i.id === r.oldPcbaItemId);
                const isSent = (pcba.chinaShipments || []).some(
                  (s) => s.pcbaItemId === r.oldPcbaItemId || (oldItem?.serialNo && (s.serialNumber === oldItem.serialNo || s.serialNo === oldItem.serialNo))
                ) || oldItem?.status === "Sent" || oldItem?.status === "Sent to China";

                if (isSent) {
                  return (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: `${T.cyan}22`,
                        color: T.cyan,
                        fontSize: 11.5,
                        fontWeight: 700,
                        border: `1px solid ${T.cyan}44`,
                      }}
                      title="PCBA Bad ini sudah dikirim ke China"
                    >
                      <Truck size={12} />
                      {t.statusSent || "Sent"}
                    </span>
                  );
                }

                return (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 999,
                      background: `${T.red}18`,
                      color: T.red,
                      fontSize: 11.5,
                      fontWeight: 600,
                      border: `1px solid ${T.red}33`,
                    }}
                    title="PCBA Bad ini belum dikirim ke China"
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.red }} />
                    {oldItem?.status ? getLocalizedStatus(oldItem.status, t) : (t.statusNotSent || "Belum Dikirim")}
                  </span>
                );
              },
            },
            {
              key: "newPcbaItemId",
              label: t.pcbaReplaceNew || "PCBA Baru",
              render: (r) =>
                pcba.items.find((i) => i.id === r.newPcbaItemId)?.serialNo ||
                "-",
            },
            { key: "replacedBy", label: t.colEngineer || "Oleh" },
            {
              key: "replacedAt",
              label: t.colDate || "Tanggal",
              render: (r) => fmtDate(r.replacedAt),
            },
            {
              key: "actions",
              label: t.pcbaAction || "Aksi",
              render: (r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn
                    icon={Eye}
                    onClick={() => setModal({ type: "viewReplacement", item: r })}
                    title={t.viewDetail || "Detail"}
                  />
                  {!isViewer && (
                    <>
                      <IconBtn
                        icon={Pencil}
                        onClick={() => setModal({ type: "editReplacement", item: r })}
                        title={t.editAction || "Edit"}
                      />
                      <IconBtn
                        icon={Trash2}
                        danger
                        onClick={() => setModal({ type: "deleteReplacement", item: r })}
                        title={t.deleteAction || "Hapus"}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={filteredReplacements}
          emptyLabel={
            search || typeFilter || statusFilter || supplierFilter || locationFilter
              ? (t.noDataForDateRange || "Tidak ada data yang memenuhi filter.")
              : (t.pcbaEmptyReplacement || "Belum ada replacement PCBA.")
          }
        />
      )}

      {subTab === "chinaShipments" && (
        <DataTable
          columns={[
            {
              key: "serialNumber",
              label: "SN",
              mono: true,
              render: (r) => r.serialNumber || r.serialNo || "-",
            },
            {
              key: "macAddress",
              label: "MAC",
              mono: true,
              render: (r) => r.macAddress || r.mac || "-",
            },
            {
              key: "date",
              label: t.colDate || "Tanggal",
              render: (r) => fmtDate(r.date || r.createdAt),
            },
            {
              key: "notes",
              label: t.pcbaNotes || "Catatan",
              width: 280,
              minWidth: 280,
              maxWidth: 280,
              render: (r) => {
                const text = r.notes && r.notes.trim() ? r.notes.trim() : "-";
                return (
                  <div
                    title={r.notes && r.notes.trim() ? r.notes.trim() : undefined}
                    style={{
                      width: 280,
                      minWidth: 280,
                      maxWidth: 280,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                    }}
                  >
                    {text}
                  </div>
                );
              },
            },
            {
              key: "actions",
              label: t.pcbaAction || "Action",
              render: (r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn
                    icon={Eye}
                    onClick={() => setModal({ type: "viewChinaShipment", item: r })}
                    title={t.viewDetail || "Detail"}
                  />
                  {!isViewer && (
                    <>
                      <IconBtn
                        icon={Pencil}
                        onClick={() => setModal({ type: "editChinaShipment", item: r })}
                        title={t.editAction || "Edit"}
                      />
                      <IconBtn
                        icon={Trash2}
                        danger
                        onClick={() => setModal({ type: "deleteChinaShipment", item: r })}
                        title={t.deleteAction || "Hapus"}
                      />
                    </>
                  )}
                </div>
              ),
            },
          ]}
          rows={filteredChinaShipments}
          emptyLabel={
            search || typeFilter || supplierFilter || locationFilter
              ? (t.noDataForDateRange || "Tidak ada data yang memenuhi filter.")
              : (t.pcbaEmptySendToChina || "Belum ada data pengiriman PCBA Bad ke China.")
          }
        />
      )}

      {subTab === "transactions" && (
        <DataTable
          columns={[
            { key: "transactionNo", label: t.pcbaNoTransaction || "No. Transaksi", mono: true },
            {
              key: "pcbaItemId",
              label: t.pcbaSerialNo || "Serial PCBA",
              render: (r) =>
                pcba.items.find((i) => i.id === r.pcbaItemId)?.serialNo || "-",
            },
            { key: "type", label: t.colType || "Tipe" },
            {
              key: "rmaId",
              label: "RMA",
              render: (r) => rma.find((x) => x.id === r.rmaId)?.ticketNo || "-",
            },
            { key: "reason", label: t.pcbaNotes || "Catatan" },
            {
              key: "receivedBy",
              label: t.pcbaColReceivedBy || t.pcbaReceivedBy || "Penerima / Oleh",
              render: (r) => {
                const item = pcba.items.find((i) => i.id === r.pcbaItemId);
                return (item && item.receivedBy) || r.receivedBy || r.performedBy || "-";
              },
            },
            {
              key: "createdAt",
              label: t.colDate || "Tanggal",
              render: (r) => fmtDate(r.createdAt),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <IconBtn
                    icon={Eye}
                    onClick={() => setModal({ type: "viewTrx", item: r })}
                    title={t.viewDetail || "Detail"}
                  />
                  {!isViewer && (
                    <IconBtn
                      icon={Trash2}
                      danger
                      onClick={() => setModal({ type: "deleteTrx", item: r })}
                      title={t.deleteAction || "Hapus"}
                    />
                  )}
                </div>
              ),
            },
          ]}
          rows={filteredTransactions}
          emptyLabel={
            search || typeFilter || statusFilter || supplierFilter || locationFilter
              ? (t.noDataForDateRange || "Tidak ada data yang memenuhi filter.")
              : (t.pcbaEmptyTransactions || "Belum ada transaksi stok.")
          }
        />
      )}

      {modal?.type === "receipt" && (
        <Modal
          title={t.pcbaReceiveNewTitle || "TERIMA PCBA BARU (GOODS RECEIPT)"}
          onClose={() => setModal(null)}
        >
          <GoodsReceiptForm
            master={master}
            pcbaItems={pcba.items}
            onSave={(data) => {
              onGoodsReceipt(data);
              setModal(null);
            }}
            onClose={() => setModal(null)}
            t={t}
          />
        </Modal>
      )}
      {modal?.type === "view" && (
        <PcbaDetailModal
          item={modal.item}
          pcba={pcba}
          rma={rma}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "viewTrx" && (
        <TransactionDetailModal
          transaction={modal.item}
          pcba={pcba}
          rma={rma}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "viewReplacement" && (
        <ReplacementDetailModal
          replacement={modal.item}
          pcba={pcba}
          rma={rma}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "editReplacement" && (
        <EditReplacementModal
          replacement={modal.item}
          pcba={pcba}
          rma={rma}
          master={master}
          onSave={async (repId, updatedData) => {
            const ok = await onEditReplacement(repId, updatedData);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "viewChinaShipment" && (
        <ChinaShipmentDetailModal
          shipment={modal.item}
          pcba={pcba}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "editChinaShipment" && (
        <EditChinaShipmentModal
          shipment={modal.item}
          pcba={pcba}
          onSave={async (shipmentId, updatedData) => {
            const ok = await onEditChinaShipment(shipmentId, updatedData);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "edit" && (
        <EditPcbaModal
          item={modal.item}
          pcbaItems={pcba.items}
          master={master}
          onSave={async (itemId, updatedData) => {
            const ok = await onEditPcbaItem(itemId, updatedData);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "delete" && (
        <DeletePcbaModal
          item={modal.item}
          pcba={pcba}
          onDelete={async (itemId) => {
            const ok = await onDeletePcbaItem(itemId);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "deleteTrx" && (
        <DeleteTransactionModal
          transaction={modal.item}
          pcba={pcba}
          onDelete={async (trxId) => {
            const ok = await onDeletePcbaTransaction(trxId);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "deleteReplacement" && (
        <DeleteReplacementModal
          replacement={modal.item}
          pcba={pcba}
          rma={rma}
          onDelete={async (repId) => {
            const ok = await onDeleteReplacement(repId);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "deleteChinaShipment" && (
        <DeleteChinaShipmentModal
          shipment={modal.item}
          pcba={pcba}
          onDelete={async (shipmentId) => {
            const ok = await onDeleteChinaShipment(shipmentId);
            return ok;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
      {modal?.type === "replacement" && (
        <Modal title={t.pcbaReplacementTitle || "REPLACEMENT PCBA"} onClose={() => setModal(null)}>
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
            t={t}
          />
        </Modal>
      )}
      {modal?.type === "sendToChina" && (
        <Modal
          title={t.pcbaSendToChinaTitle || "KIRIM PCBA BAD KE CHINA"}
          onClose={() => setModal(null)}
        >
          <SendToChinaForm
            pcba={pcba}
            onSave={async (data) => {
              const res = await onSendToChina(data);
              if (!res || res.ok !== false) setModal(null);
              return res;
            }}
            onClose={() => setModal(null)}
            t={t}
          />
        </Modal>
      )}
      {modal?.type === "import" && (
        <PcbaImportModal
          existingPcba={pcba.items || []}
          master={master}
          onImport={async (validItems, batchOptions) => {
            const res = await onBulkImportPcba(validItems, batchOptions);
            return res;
          }}
          onClose={() => setModal(null)}
          t={t}
        />
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

function WaImportModal({ existingWa, onImport, onClose, t }) {
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState("skip"); // "skip" | "import_new"

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setErrorMsg("");
    try {
      const res = await parseWaFromExcel(file, existingWa);
      setParseResult(res);
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses file Excel.");
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;

    let itemsToProcess = [...parseResult.valid];
    if (duplicateMode === "import_new" && parseResult.duplicates.length > 0) {
      const dupeEntries = parseResult.duplicates.map((d) => d.entry);
      itemsToProcess = [...itemsToProcess, ...dupeEntries];
    }

    if (itemsToProcess.length === 0) {
      setErrorMsg("Tidak ada data valid untuk diimport.");
      return;
    }

    setImporting(true);

    const existingCaseNos = existingWa.map((e) => e.caseNo).filter(Boolean);

    const newEntries = itemsToProcess.map((item) => {
      let caseNo = item.caseNo;
      const isDupe = parseResult.duplicates.some((d) => d.entry === item);
      if (!caseNo || isDupe || existingCaseNos.includes(caseNo)) {
        caseNo = genTicket("CASE", existingCaseNos);
      }
      existingCaseNos.push(caseNo);

      return {
        ...item,
        id: uid(),
        caseNo,
        commHistory: item.commHistory || [],
      };
    });

    const combined = [...newEntries, ...existingWa];
    const ok = await onImport(combined);
    setImporting(false);
    if (ok !== false) {
      onClose();
    }
  };

  const totalDetected = parseResult
    ? parseResult.valid.length + parseResult.duplicates.length + parseResult.errors.length
    : 0;

  const importCount = parseResult
    ? duplicateMode === "import_new"
      ? parseResult.valid.length + parseResult.duplicates.length
      : parseResult.valid.length
    : 0;

  return (
    <Modal title={t.waImportModalTitle || "IMPORT WHATSAPP LOG DARI EXCEL"} onClose={onClose} width={640}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InlineHint>
          {t.waImportHint || "File harus menggunakan format Excel (LOGBOOKWhatsAPP.xlsx). Kolom wajib: Nama Customer dan Kendala Awal."}
        </InlineHint>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <Field label={t.waImportSelectFile || "Pilih file .xlsx / .xls"}>
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
            {t.waImportValidating || "Memvalidasi..."}
          </div>
        )}

        {parseResult && !parsing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {parseResult.headerError && (
              <InlineHint tone="warn">
                <strong>{t.waImportHeaderError || "Header tidak cocok"}:</strong> {parseResult.headerError}
              </InlineHint>
            )}

            <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>
              {(t.waImportTotalDetected || "Total terdeteksi: {n} baris").replace("{n}", totalDetected)}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: T.greenDim, color: T.green, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                ✓ {parseResult.valid.length} {t.waImportValidRows || "Baris valid"}
              </div>

              {parseResult.duplicates.length > 0 && (
                <div style={{ background: T.amberDim, color: T.amber, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                  ⚠ {parseResult.duplicates.length} {t.waImportDuplicates || "Duplikat terdeteksi"}
                </div>
              )}

              {parseResult.errors.length > 0 && (
                <div style={{ background: T.redDim, color: T.red, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                  ✕ {parseResult.errors.length} {t.waImportRowErrors || "Baris bermasalah"}
                </div>
              )}
            </div>

            {/* Options for handling duplicates */}
            {parseResult.duplicates.length > 0 && (
              <div style={{ background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 6, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>
                  {t.waImportDupeHandlingTitle || "Penanganan Duplikat:"}
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.ink2, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="dupeHandling"
                    value="skip"
                    checked={duplicateMode === "skip"}
                    onChange={() => setDuplicateMode("skip")}
                    style={{ accentColor: T.cyan }}
                  />
                  {t.waImportDupeSkip || "Dilewati"} {(t.waImportDupeSkipNote || "({n} record duplikat dilewati)").replace("{n}", parseResult.duplicates.length)}
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.ink2, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="dupeHandling"
                    value="import_new"
                    checked={duplicateMode === "import_new"}
                    onChange={() => setDuplicateMode("import_new")}
                    style={{ accentColor: T.cyan }}
                  />
                  {t.waImportDupeImportNew || "Import duplikat sebagai case baru"} {t.waImportDupeNewNote || "(generate Nomor Case baru)"}
                </label>
              </div>
            )}

            {/* Error row details */}
            {parseResult.errors.length > 0 && (
              <div style={{ maxHeight: 120, overflowY: "auto", background: T.panel2, border: `1px solid ${T.line}`, borderRadius: 6, padding: 8, fontSize: 12 }}>
                <strong style={{ color: T.red }}>{t.waImportRowErrors || "Detail Error Baris"}:</strong>
                <ul style={{ margin: "4px 0 0 16px", padding: 0, color: T.ink2 }}>
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>
                      {(t.waImportRowLabel || "Baris")} {err.row}: {err.message}
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
            disabled={importing || !parseResult || importCount === 0}
            onClick={handleConfirmImport}
          >
            {importing && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {(t.waImportConfirm || "Import {n} Case").replace("{n}", importCount)}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================
   PCBA IMPORT MODAL (BULK IMPORT DARI EXCEL)
   ============================================================ */
function PcbaImportModal({ existingPcba, master, onImport, onClose, t }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [batchOptions, setBatchOptions] = useState({
    supplier: master?.suppliers?.[0] || "-",
    warehouseLocation: master?.warehouseLocations?.[0] || "Gudang Utama",
    receivedBy: master?.pcbaReceivedBy?.[0] || "Excel Import",
  });

  const existingSerialNos = useMemo(
    () => (existingPcba || []).map((i) => i.serialNo).filter(Boolean),
    [existingPcba]
  );

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg("");
    setParseResult(null);
    setParsing(true);
    try {
      const res = await parsePcbaFromExcel(selected, existingSerialNos);
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
    setErrorMsg("");
    try {
      const res = await onImport(parseResult.valid, batchOptions);
      setImporting(false);
      if (res && res.ok !== false) {
        onClose();
      } else if (res && res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setImporting(false);
      setErrorMsg(err.message || "Gagal melakukan import data PCBA.");
    }
  };

  return (
    <Modal title={t.pcbaImportModalTitle || "IMPORT PCBA DARI EXCEL"} onClose={onClose} width={700}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InlineHint>
          {t.pcbaImportHint || "Pilih file Excel yang memiliki kolom: 'PCBA Serial No.', 'PCBA Type', dan 'Date'."}
        </InlineHint>

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <Field label={t.rmaImportSelectFile || "Pilih file .xlsx / .xls"}>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
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
              boxSizing: "border-box",
            }}
          />
        </Field>

        {parsing && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.ink2, fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            {t.rmaImportValidating || "Membaca dan memvalidasi file Excel..."}
          </div>
        )}

        {parseResult && !parsing && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {parseResult.headerError ? (
              <InlineHint tone="warn">
                <strong>{t.rmaImportHeaderError || "Header tidak cocok"}:</strong> {parseResult.headerError}
              </InlineHint>
            ) : (
              <>
                {/* Summary Badges */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ background: `${T.green}20`, color: T.green, border: `1px solid ${T.green}44`, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}>
                    ✓ {parseResult.valid.length} {t.pcbaImportValidCount || "PCBA Siap Diimport"}
                  </div>

                  {parseResult.duplicates.length > 0 && (
                    <div style={{ background: `${T.amber}20`, color: T.amber, border: `1px solid ${T.amber}44`, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}>
                      ⚠ {parseResult.duplicates.length} {t.rmaImportDuplicates || "Duplikat (Dilewati)"}
                    </div>
                  )}

                  {parseResult.errors.length > 0 && (
                    <div style={{ background: `${T.red}20`, color: T.red, border: `1px solid ${T.red}44`, padding: "8px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 700 }}>
                      ✕ {parseResult.errors.length} {t.rmaImportRowErrors || "Error / Data Kosong"}
                    </div>
                  )}
                </div>

                {/* Batch default settings (Supplier, Location, Received By) */}
                <div
                  style={{
                    background: T.panel2,
                    border: `1px solid ${T.line}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                  }}
                >
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2, display: "block", marginBottom: 4 }}>
                      Supplier
                    </label>
                    <select
                      value={batchOptions.supplier}
                      onChange={(e) => setBatchOptions({ ...batchOptions, supplier: e.target.value })}
                      style={{
                        width: "100%",
                        height: 32,
                        padding: "0 8px",
                        background: T.panel,
                        border: `1px solid ${T.line}`,
                        borderRadius: 6,
                        color: T.ink,
                        fontSize: 12,
                      }}
                    >
                      {(master?.suppliers || ["-"]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2, display: "block", marginBottom: 4 }}>
                      Lokasi Gudang
                    </label>
                    <select
                      value={batchOptions.warehouseLocation}
                      onChange={(e) => setBatchOptions({ ...batchOptions, warehouseLocation: e.target.value })}
                      style={{
                        width: "100%",
                        height: 32,
                        padding: "0 8px",
                        background: T.panel,
                        border: `1px solid ${T.line}`,
                        borderRadius: 6,
                        color: T.ink,
                        fontSize: 12,
                      }}
                    >
                      {(master?.warehouseLocations || ["Gudang Utama"]).map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: T.ink2, display: "block", marginBottom: 4 }}>
                      Diterima Oleh
                    </label>
                    <input
                      type="text"
                      value={batchOptions.receivedBy}
                      onChange={(e) => setBatchOptions({ ...batchOptions, receivedBy: e.target.value })}
                      placeholder="Nama penerima..."
                      style={{
                        width: "100%",
                        height: 32,
                        padding: "0 8px",
                        background: T.panel,
                        border: `1px solid ${T.line}`,
                        borderRadius: 6,
                        color: T.ink,
                        fontSize: 12,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Preview Table */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                    Preview Data ({parseResult.allRows.length} baris):
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: `1px solid ${T.line}`, borderRadius: 8, background: T.panel2 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: T.panel, borderBottom: `1px solid ${T.line}`, position: "sticky", top: 0, zIndex: 1 }}>
                          <th style={{ padding: "8px 10px", color: T.ink2, fontWeight: 700, width: 40, textAlign: "center" }}>No.</th>
                          <th style={{ padding: "8px 10px", color: T.ink2, fontWeight: 700 }}>PCBA Serial No.</th>
                          <th style={{ padding: "8px 10px", color: T.ink2, fontWeight: 700 }}>PCBA Type</th>
                          <th style={{ padding: "8px 10px", color: T.ink2, fontWeight: 700 }}>Date</th>
                          <th style={{ padding: "8px 10px", color: T.ink2, fontWeight: 700 }}>Status Validasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parseResult.allRows.map((r, idx) => {
                          const isValid = r.status === "valid";
                          const isDup = r.status === "duplicate";
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${T.lineDim}`, background: isValid ? "transparent" : isDup ? `${T.amber}0a` : `${T.red}0a` }}>
                              <td style={{ padding: "6px 10px", textAlign: "center", color: T.ink3, fontFamily: mono }}>{idx + 1}</td>
                              <td style={{ padding: "6px 10px", fontWeight: 600, color: T.ink, fontFamily: mono }}>{r.serialNo}</td>
                              <td style={{ padding: "6px 10px", color: T.ink }}>{r.pcbaType}</td>
                              <td style={{ padding: "6px 10px", color: T.ink2 }}>{r.receivedDate ? fmtDate(r.receivedDate) : "-"}</td>
                              <td style={{ padding: "6px 10px" }}>
                                {isValid ? (
                                  <span style={{ color: T.green, fontWeight: 600, fontSize: 11 }}>✓ Siap Diimport</span>
                                ) : isDup ? (
                                  <span style={{ color: T.amber, fontWeight: 600, fontSize: 11 }} title={r.message}>⚠ {r.message}</span>
                                ) : (
                                  <span style={{ color: T.red, fontWeight: 600, fontSize: 11 }} title={r.message}>✕ {r.message}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose} disabled={importing}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            onClick={handleConfirmImport}
            disabled={importing || !parseResult || !parseResult.valid || parseResult.valid.length === 0}
          >
            {importing ? (
              <>
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                {t.rmaImporting || "Mengimport..."}
              </>
            ) : (
              <>
                <FileUp size={14} />
                {parseResult?.valid?.length
                  ? `Import ${parseResult.valid.length} PCBA`
                  : (t.pcbaImportButton || "Import PCBA")}
              </>
            )}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function DeleteConfirmModal({ confirmState, onConfirm, onClose, t }) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const entry = confirmState?.entry;
  const isWa = confirmState?.kind === "wa";
  const refNo = isWa ? entry?.caseNo : entry?.ticketNo;

  const handleConfirm = async () => {
    setDeleting(true);
    setErrorMsg("");
    const ok = await onConfirm(confirmState);
    setDeleting(false);
    if (ok !== false) {
      onClose();
    } else {
      setErrorMsg(
        isWa
          ? "Gagal menghapus case WhatsApp dari Firestore."
          : "Gagal menghapus RMA dari Firestore."
      );
    }
  };

  return (
    <Modal
      title={isWa ? (t.deleteWaTitle || "HAPUS CASE WHATSAPP") : (t.deleteRmaTitle || "HAPUS TIKET RMA")}
      onClose={onClose}
      width={420}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontSize: 13, color: T.ink, margin: 0 }}>
          {(t.deleteConfirmText || "Apakah Anda yakin ingin menghapus {type} berikut?").replace("{type}", isWa ? (t.waCase || "case WhatsApp") : (t.rmaTicket || "tiket RMA"))}
        </p>

        <div
          style={{
            background: T.panel2,
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${T.line}`,
            fontWeight: 700,
            fontSize: 14,
            color: T.cyan,
            fontFamily: mono,
          }}
        >
          {refNo || "-"}
        </div>

        {entry?.customerName && (
          <div style={{ fontSize: 12.5, color: T.ink2 }}>
            {t.colCustomer || "Customer"}: <strong>{entry.customerName}</strong>{" "}
            {entry.company ? `(${entry.company})` : ""}
          </div>
        )}

        {errorMsg && <InlineHint tone="warn">{errorMsg}</InlineHint>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
          <Btn variant="ghost" onClick={onClose} disabled={deleting}>
            {t.cancel || "Batal"}
          </Btn>
          <Btn
            variant="solid"
            style={{ background: T.red, borderColor: T.red }}
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {t.deleteAction || "Hapus"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function WaDetailModal({ entry, onClose, t }) {
  if (!entry) return null;

  const isSolved = isWaDone(entry.status) || Boolean(entry.solvedDate);
  const caseAge = daysBetween(entry.caseDate, entry.solvedDate || todayISO());

  // Deterministic summary based on actual stored fields
  const summaryText = `Customer ${entry.customerName || "-"}${entry.company ? ` (${entry.company})` : ""} melaporkan kendala pada perangkat ${entry.deviceType || "-"}${entry.sn ? ` (SN: ${entry.sn})` : ""}. Case dibuka pada tanggal ${fmtDate(entry.caseDate)} dan ditangani oleh engineer ${entry.engineerTag || "-"}. Status saat ini: ${entry.status || "-"}${isSolved ? ` (selesai dalam ${caseAge} hari)` : ` (aktif selama ${caseAge} hari)`}.`;

  return (
    <Modal title={`DETAIL CASE — ${entry.caseNo || "-"}`} onClose={onClose} width={620}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "75vh",
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {/* Top Header Stats */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            background: T.panel2,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${T.line}`,
          }}
        >
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              Status
            </div>
            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <StatusLed status={entry.status} />
              {isWaOverdue(entry) && <OverdueBadge />}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              Tanggal Case
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2 }}>
              {fmtDate(entry.caseDate)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              Tanggal Solved
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2 }}>
              {fmtDate(entry.solvedDate) || "—"}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 11, color: T.ink3, textTransform: "uppercase", fontWeight: 600 }}>
              Umur Case
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginTop: 2 }}>
              {caseAge !== "" ? `${caseAge} Hari` : "—"}
            </div>
          </div>
        </div>

        {/* Customer & Device Meta Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            background: T.panel,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${T.line}`,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>Customer</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
              {entry.customerName || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>Perusahaan</div>
            <div style={{ fontSize: 13, color: T.ink }}>{entry.company || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>No. HP</div>
            <div style={{ fontSize: 13, fontFamily: mono, color: T.ink }}>
              {entry.customerPhone || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>Perangkat</div>
            <div style={{ fontSize: 13, color: T.ink }}>{entry.deviceType || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>SN</div>
            <div style={{ fontSize: 13, fontFamily: mono, color: T.ink }}>
              {entry.sn || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>MAC</div>
            <div style={{ fontSize: 13, fontFamily: mono, color: T.ink }}>
              {entry.mac || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.ink3 }}>Engineer Tag</div>
            <div style={{ fontSize: 13, color: T.ink }}>{entry.engineerTag || "—"}</div>
          </div>
        </div>

        {/* Case Summary */}
        <div
          style={{
            background: T.cyanDim,
            border: `1px solid ${T.cyan}33`,
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: T.cyan,
              textTransform: "uppercase",
              marginBottom: 4,
              letterSpacing: 0.3,
            }}
          >
            Ringkasan Case (Summary)
          </div>
          <div style={{ fontSize: 12.5, color: T.ink, lineHeight: 1.5 }}>
            {summaryText}
          </div>
        </div>

        {/* Full Original Initial Problem */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
            Kendala Awal (Initial Problem)
          </div>
          <div
            style={{
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: T.ink,
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {entry.initialProblem || "—"}
          </div>
        </div>

        {/* Final Analysis if present */}
        {entry.finalAnalysis && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
              Analisa Akhir (Final Analysis)
            </div>
            <div
              style={{
                background: T.panel2,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                color: T.ink,
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
              }}
            >
              {entry.finalAnalysis}
            </div>
          </div>
        )}

        {/* Notes if present */}
        {entry.notes && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
              Keterangan / Notes
            </div>
            <div
              style={{
                background: T.panel2,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12.5,
                color: T.ink2,
                whiteSpace: "pre-wrap",
              }}
            >
              {entry.notes}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <Btn variant="solid" onClick={onClose}>
            Tutup
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
  const { user, profile, role, isAdministrator, isEngineer, isViewer, can, assert } = useAuth();
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
  // colFilters: per-column filter/sort state
  // shape: { [colKey]: { sort: "asc"|"desc"|null, values: string[]|null } }
  // values=null means "all values" (no filter)
  const [colFilters, setColFilters] = useState({});
  const [waColFilters, setWaColFilters] = useState({});
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [waOverdueOnly, setWaOverdueOnly] = useState(false);
  const [rmaStatusFilter, setRmaStatusFilter] = useState(null);
  const [waStatusFilter, setWaStatusFilter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [waDetailModal, setWaDetailModal] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const [rmaFromDate, setRmaFromDate] = useState("");
  const [rmaToDate, setRmaToDate] = useState("");
  const [rmaPreset, setRmaPreset] = useState("");

  const [waFromDate, setWaFromDate] = useState("");
  const [waToDate, setWaToDate] = useState("");
  const [waPreset, setWaPreset] = useState("");

  const applyRmaPreset = useCallback((presetKey) => {
    setRmaPreset(presetKey);
    if (presetKey === "custom") {
      return;
    }
    if (!presetKey) {
      setRmaFromDate("");
      setRmaToDate("");
      return;
    }
    const { from, to } = getPresetDates(presetKey);
    setRmaFromDate(from);
    setRmaToDate(to);
  }, []);

  const applyWaPreset = useCallback((presetKey) => {
    setWaPreset(presetKey);
    if (presetKey === "custom") {
      return;
    }
    if (!presetKey) {
      setWaFromDate("");
      setWaToDate("");
      return;
    }
    const { from, to } = getPresetDates(presetKey);
    setWaFromDate(from);
    setWaToDate(to);
  }, []);

  const resetRmaDate = useCallback(() => {
    setRmaFromDate("");
    setRmaToDate("");
    setRmaPreset("");
  }, []);

  const resetWaDate = useCallback(() => {
    setWaFromDate("");
    setWaToDate("");
    setWaPreset("");
  }, []);

  const onColFilter = useCallback((colKey, applied) => {
    setColFilters((prev) => {
      if (!applied.sort && applied.values === null) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return { ...prev, [colKey]: applied };
    });
  }, []);

  const onWaColFilter = useCallback((colKey, applied) => {
    setWaColFilters((prev) => {
      if (!applied.sort && applied.values === null) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return { ...prev, [colKey]: applied };
    });
  }, []);

  const resetAllFilters = useCallback(() => {
    setColFilters({});
    setOverdueOnly(false);
    setSearch("");
    setRmaFromDate("");
    setRmaToDate("");
    setRmaPreset("");
    setRmaStatusFilter(null);
  }, [setSearch]);

  const resetAllWaFilters = useCallback(() => {
    setWaColFilters({});
    setWaOverdueOnly(false);
    setSearch("");
    setWaFromDate("");
    setWaToDate("");
    setWaPreset("");
    setWaStatusFilter(null);
  }, [setSearch]);
  const [saveErr, setSaveErr] = useState("");
  const [rmaImportModal, setRmaImportModal] = useState(false);
  const [waImportModal, setWaImportModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r, w, m, p] = await Promise.all([
          rmaApi.getAll(),
          waApi.getAll(),
          masterApi.get(),
          pcbaApi.getAll(),
        ]);
        setRma(r || []);
        setWa(w || []);
        const loadedMaster = { ...DEFAULT_MASTER, ...m };
        if (!loadedMaster.pcbaReceivedBy || loadedMaster.pcbaReceivedBy.length === 0) {
          loadedMaster.pcbaReceivedBy = (m && m.engineers && m.engineers.length > 0)
            ? [...m.engineers]
            : [...DEFAULT_MASTER.pcbaReceivedBy];
        }
        setMaster(loadedMaster);
        setPcba({
          ...PCBA_DEFAULT,
          ...p,
          chinaShipments: (p && Array.isArray(p.chinaShipments)) ? p.chinaShipments : [],
        });
      } catch (err) {
        console.error("Gagal memuat data SQLite:", err);
        setSaveErr("Gagal memuat data dari database server SQLite.");
      } finally {
        setLoading(false);
      }
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
    const isNew = !rma.some((e) => e.id === entry.id);
    try {
      assert(
        isNew ? PERMISSIONS.RMA_CREATE : PERMISSIONS.RMA_UPDATE,
        isNew ? "membuat tiket RMA baru" : "mengedit tiket RMA"
      );
    } catch (authErr) {
      setSaveErr(authErr.message);
      setToastMsg(authErr.message);
      return { ok: false, error: authErr.message };
    }

    // Upload any new photos that have a File object in fileRegistry.
    const uploadCategory = async (photos, category) => {
      const results = [];
      for (const photo of photos) {
        const file = fileRegistry.get(photo.id);
        if (file) {
          try {
            const meta = await uploadLocalRmaPhoto(file, entry.ticketNo, category, photo.id);
            fileRegistry.delete(photo.id);
            if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
            results.push(meta);
          } catch (err) {
            console.error(`Upload ${category} foto gagal:`, err);
            setSaveErr(`Upload foto gagal: ${err.message}. Tiket disimpan tanpa foto tersebut.`);
          }
        } else {
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

    try {
      if (isNew) {
        const saved = await rmaApi.create(finalEntry);
        setRma((prev) => [saved || finalEntry, ...prev.filter((e) => e.id !== finalEntry.id)]);
      } else {
        const saved = await rmaApi.update(finalEntry.id, finalEntry);
        setRma((prev) => prev.map((e) => (e.id === finalEntry.id ? (saved || finalEntry) : e)));
      }
      setRmaModal(null);
      const curT = I18N[language] || I18N.id;
      setToastMsg(curT.toastRmaSaved || "Tiket RMA berhasil disimpan.");
      return { ok: true };
    } catch (err) {
      console.error("Save RMA gagal:", err);
      setSaveErr(err.message || "Gagal menyimpan tiket RMA.");
      return { ok: false, error: err.message };
    }
  };

  const persistRma = useCallback(async (arr) => {
    try {
      assert(PERMISSIONS.RMA_UPDATE, "menyimpan data RMA");
    } catch (authErr) {
      setToastMsg(authErr.message);
      setSaveErr(authErr.message);
      return false;
    }
    setRma(arr);
    try {
      await rmaApi.bulkImport(arr);
      return true;
    } catch (err) {
      setSaveErr("Gagal menyimpan data RMA ke database SQLite.");
      return false;
    }
  }, [assert, setToastMsg]);

  const saveWa = async (entry) => {
    const isNew = !wa.some((e) => e.id === entry.id);
    try {
      assert(
        isNew ? PERMISSIONS.WA_CREATE : PERMISSIONS.WA_UPDATE,
        isNew ? "membuat case WhatsApp baru" : "mengedit case WhatsApp"
      );
    } catch (authErr) {
      setSaveErr(authErr.message);
      setToastMsg(authErr.message);
      return { ok: false, error: authErr.message };
    }

    try {
      if (isNew) {
        const saved = await waApi.create(entry);
        setWa((prev) => [saved || entry, ...prev.filter((e) => e.id !== entry.id)]);
      } else {
        const saved = await waApi.update(entry.id, entry);
        setWa((prev) => prev.map((e) => (e.id === entry.id ? (saved || entry) : e)));
      }
      const curT = I18N[language] || I18N.id;
      setToastMsg(curT.toastWaSaved || "Case WhatsApp berhasil disimpan.");
      setWaModal(null);
      return { ok: true };
    } catch (err) {
      console.error("Save WA gagal:", err);
      setSaveErr(err.message || "Gagal menyimpan case WhatsApp.");
      return { ok: false, error: err.message };
    }
  };

  const persistWa = useCallback(async (arr) => {
    try {
      assert(PERMISSIONS.WA_UPDATE, "menyimpan data WhatsApp");
    } catch (authErr) {
      setToastMsg(authErr.message);
      setSaveErr(authErr.message);
      return false;
    }
    setWa(arr);
    try {
      await waApi.bulkImport(arr);
      return true;
    } catch (err) {
      setSaveErr("Gagal menyimpan data WhatsApp ke database SQLite.");
      return false;
    }
  }, [assert, setToastMsg]);

  const persistPcba = useCallback(async (data) => {
    try {
      assert(PERMISSIONS.PCBA_UPDATE, "menyimpan data PCBA");
    } catch (authErr) {
      setToastMsg(authErr.message);
      setSaveErr(authErr.message);
      return false;
    }
    setPcba(data);
    try {
      await pcbaApi.syncAll(data);
      return true;
    } catch (err) {
      console.error("Save PCBA error:", err);
      setSaveErr("Gagal menyimpan data PCBA ke database SQLite. Coba lagi.");
      return false;
    }
  }, [assert, setToastMsg]);

  const onGoodsReceipt = useCallback(
    async (formData) => {
      try {
        assert(PERMISSIONS.PCBA_CREATE, "menerima stok PCBA baru");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }
      const receivedDate = formData.receivedDate || todayISO();
      const receivedBy = formData.receivedBy ? formData.receivedBy.trim() : "-";
      const newItem = {
        id: uid(),
        serialNo: formData.serialNo.trim(),
        pcbaType: formData.pcbaType,
        product: formData.product.trim(),
        supplier: formData.supplier,
        warehouseLocation: formData.warehouseLocation,
        status: "Good",
        receivedDate,
        receivedBy,
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString(),
      };
      const transaction = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: newItem.id,
        type: "Goods Receipt",
        rmaId: null,
        receivedDate,
        receivedBy,
        performedBy: receivedBy,
        reason: formData.notes.trim() || `Penerimaan stok baru (${receivedBy})`,
        createdAt: newItem.createdAt,
      };
      const newPcba = {
        items: [newItem, ...pcba.items],
        transactions: [transaction, ...pcba.transactions],
        replacements: pcba.replacements,
        repairs: pcba.repairs || [],
        chinaShipments: pcba.chinaShipments || [],
      };
      return persistPcba(newPcba);
    },
    [pcba, persistPcba, assert, setToastMsg]
  );

  const onBulkImportPcba = useCallback(
    async (importedRows, batchOptions = {}) => {
      try {
        assert(PERMISSIONS.PCBA_CREATE, "mengimport data PCBA dari Excel");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return { ok: false, error: authErr.message };
      }

      if (!importedRows || importedRows.length === 0) {
        return { ok: false, error: "Tidak ada data PCBA yang valid untuk diimport." };
      }

      const now = new Date().toISOString();
      const newItems = [];
      const newTransactions = [];

      importedRows.forEach((row, idx) => {
        const receivedDate = row.receivedDate || todayISO();
        const receivedBy = batchOptions.receivedBy?.trim() || row.receivedBy?.trim() || (profile?.displayName || user?.displayName || "Excel Import");
        const supplier = batchOptions.supplier || row.supplier || (master.suppliers?.[0] || "-");
        const warehouseLocation = batchOptions.warehouseLocation || row.warehouseLocation || (master.warehouseLocations?.[0] || "Gudang Utama");

        const newItem = {
          id: uid(),
          serialNo: String(row.serialNo).trim(),
          pcbaType: String(row.pcbaType).trim(),
          product: row.product?.trim() || "",
          supplier,
          warehouseLocation,
          status: "Good",
          receivedDate,
          receivedBy,
          notes: row.notes?.trim() || "Import dari Excel",
          createdAt: now,
        };

        const transaction = {
          id: uid(),
          transactionNo: `TRX-${receivedDate.replace(/-/g, "")}-${String(Date.now() + idx).slice(-4)}`,
          pcbaItemId: newItem.id,
          type: "Goods Receipt",
          rmaId: null,
          receivedDate,
          receivedBy,
          performedBy: receivedBy,
          reason: `Import stok PCBA (${receivedBy})`,
          createdAt: now,
        };

        newItems.push(newItem);
        newTransactions.push(transaction);
      });

      const newPcba = {
        items: [...newItems, ...pcba.items],
        transactions: [...newTransactions, ...pcba.transactions],
        replacements: pcba.replacements,
        repairs: pcba.repairs || [],
        chinaShipments: pcba.chinaShipments || [],
      };

      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        const msg = (curT.toastPcbaImportSuccess || "Import berhasil. {count} PCBA berhasil ditambahkan ke inventory.")
          .replace("{count}", newItems.length);
        setToastMsg(msg);
      }
      return { ok: !!ok, count: newItems.length };
    },
    [pcba, persistPcba, assert, setToastMsg, master, profile, user, language]
  );

  const onReplacement = useCallback(
    async (formData) => {
      try {
        assert(PERMISSIONS.PCBA_CREATE, "membuat replacement PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return { ok: false, error: authErr.message };
      }

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

      const engineerName = formData.replacedBy ? formData.replacedBy.trim() : "Engineer";
      const replacement = {
        id: uid(),
        replacementNo: `REP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        rmaId: formData.rmaId,
        oldPcbaItemId: oldItem.id,
        newPcbaItemId: newPcbaItem.id,
        pcbaType: newPcbaItem.pcbaType,
        replacedBy: engineerName,
        replacedAt: new Date().toISOString(),
      };

      const trxOut = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: newPcbaItem.id,
        type: "Replacement Out",
        rmaId: formData.rmaId,
        receivedBy: engineerName,
        performedBy: engineerName,
        reason: `Replacement untuk RMA ${rma.find((x) => x.id === formData.rmaId)?.ticketNo || "-"} (${engineerName})`,
        createdAt: new Date().toISOString(),
      };

      const trxIn = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: oldItem.id,
        type: "Replacement In (Bad)",
        rmaId: formData.rmaId,
        receivedBy: engineerName,
        performedBy: engineerName,
        reason: `PCBA lama dari RMA ${rma.find((x) => x.id === formData.rmaId)?.ticketNo || "-"} (${engineerName})`,
        createdAt: new Date().toISOString(),
      };

      const updatedItems = pcba.items.map((i) =>
        i.id === newPcbaItem.id ? { ...i, status: "Used for Replacement" } : i
      );
      const newPcba = {
        items: [oldItem, ...updatedItems],
        transactions: [trxOut, trxIn, ...pcba.transactions],
        replacements: [replacement, ...pcba.replacements],
        repairs: pcba.repairs || [],
        chinaShipments: pcba.chinaShipments || [],
      };
      return persistPcba(newPcba);
    },
    [pcba, rma, persistPcba, assert, setToastMsg]
  );

  const onSendToChina = useCallback(
    async (formData) => {
      try {
        assert(PERMISSIONS.PCBA_CREATE, "mencatat pengiriman PCBA ke China");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return { ok: false, error: authErr.message };
      }

      const item = (pcba.items || []).find((i) => i.id === formData.pcbaItemId);
      if (!item) return { ok: false, error: "PCBA tidak ditemukan." };
      if (item.status !== "Bad") {
        return {
          ok: false,
          error: `Hanya PCBA dengan status Bad yang boleh dikirim ke China. Status item ini adalah "${item.status}".`,
        };
      }

      const shipmentDate = formData.date || todayISO();
      const shipment = {
        id: uid(),
        shipmentNo: `SHP-CN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: item.id,
        serialNumber: item.serialNo,
        serialNo: item.serialNo,
        macAddress: formData.macAddress || formData.mac || item.mac || "-",
        mac: formData.macAddress || formData.mac || item.mac || "-",
        date: shipmentDate,
        notes: (formData.notes || "").trim(),
        createdAt: new Date().toISOString(),
      };

      const trx = {
        id: uid(),
        transactionNo: `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`,
        pcbaItemId: item.id,
        type: "Send Bad PCBA to China",
        rmaId: null,
        previousStatus: "Bad",
        action: "Sent to China",
        reason: formData.notes?.trim() ? `Kirim PCBA Bad ke China (${formData.notes.trim()})` : "Kirim PCBA Bad ke China",
        createdAt: new Date().toISOString(),
        date: shipmentDate,
      };

      // Update PCBA item status to "Sent to China" (so Bad stock decreases by 1, persistent)
      const updatedItems = (pcba.items || []).map((i) =>
        i.id === item.id ? { ...i, status: "Sent to China", mac: (shipment.macAddress && shipment.macAddress !== "-") ? shipment.macAddress : i.mac } : i
      );

      const newPcba = {
        ...pcba,
        items: updatedItems,
        transactions: [trx, ...(pcba.transactions || [])],
        chinaShipments: [shipment, ...(pcba.chinaShipments || [])],
      };

      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastPcbaSentToChina || "PCBA Bad berhasil dicatat dikirim ke China.");
      }
      return { ok: !!ok };
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onEditChinaShipment = useCallback(
    async (shipmentId, updatedData) => {
      try {
        assert(PERMISSIONS.PCBA_UPDATE, "mengedit pengiriman ke China");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const shipment = (pcba.chinaShipments || []).find((s) => s.id === shipmentId);
      if (!shipment) return false;

      const updatedItems = (pcba.items || []).map((item) => {
        if (item.id === shipment.pcbaItemId) {
          return {
            ...item,
            serialNo: updatedData.serialNumber || item.serialNo,
            mac: (updatedData.macAddress && updatedData.macAddress !== "-") ? updatedData.macAddress : item.mac,
          };
        }
        return item;
      });

      const updatedShipments = (pcba.chinaShipments || []).map((s) =>
        s.id === shipmentId ? { ...s, ...updatedData } : s
      );

      const newPcba = {
        ...pcba,
        items: updatedItems,
        chinaShipments: updatedShipments,
      };

      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastChinaShipmentUpdated || "Data pengiriman ke China berhasil diperbarui.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onDeleteChinaShipment = useCallback(
    async (shipmentId) => {
      try {
        assert(PERMISSIONS.PCBA_DELETE, "membatalkan pengiriman ke China");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const shipment = (pcba.chinaShipments || []).find((s) => s.id === shipmentId);
      if (!shipment) return false;

      // Revert PCBA item status back to "Bad"
      const updatedItems = (pcba.items || []).map((item) => {
        if (item.id === shipment.pcbaItemId && (item.status === "Sent to China" || item.status === "Sent")) {
          return { ...item, status: "Bad" };
        }
        return item;
      });

      const updatedShipments = (pcba.chinaShipments || []).filter((s) => s.id !== shipmentId);
      const newPcba = {
        ...pcba,
        items: updatedItems,
        chinaShipments: updatedShipments,
      };

      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastShipmentDeleted || "Pengiriman ke China berhasil dibatalkan dan status PCBA kembali Bad.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onEditPcbaItem = useCallback(
    async (itemId, updatedItemData) => {
      try {
        assert(PERMISSIONS.PCBA_UPDATE, "mengedit item PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const updatedItems = pcba.items.map((i) => (i.id === itemId ? updatedItemData : i));
      const updatedTrx = (pcba.transactions || []).map((t) => {
        if (t.pcbaItemId === itemId) {
          return {
            ...t,
            receivedBy: updatedItemData.receivedBy || t.receivedBy,
            receivedDate: updatedItemData.receivedDate || t.receivedDate,
          };
        }
        return t;
      });
      const newPcba = { ...pcba, items: updatedItems, transactions: updatedTrx };
      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastPcbaUpdated || "Data PCBA berhasil diperbarui.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onDeletePcbaItem = useCallback(
    async (itemId) => {
      try {
        assert(PERMISSIONS.PCBA_DELETE, "menghapus item PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const updatedItems = pcba.items.filter((i) => i.id !== itemId);
      const updatedTrx = (pcba.transactions || []).filter((t) => t.pcbaItemId !== itemId);
      const newPcba = { ...pcba, items: updatedItems, transactions: updatedTrx };
      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastPcbaDeleted || "Item PCBA berhasil dihapus.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onDeletePcbaTransaction = useCallback(
    async (trxId) => {
      try {
        assert(PERMISSIONS.PCBA_DELETE, "menghapus transaksi PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const updatedTrx = (pcba.transactions || []).filter((t) => t.id !== trxId);
      const newPcba = { ...pcba, transactions: updatedTrx };
      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastTransactionDeleted || "Transaksi berhasil dihapus.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onEditReplacement = useCallback(
    async (repId, updatedData) => {
      try {
        assert(PERMISSIONS.PCBA_UPDATE, "mengedit replacement PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const rep = (pcba.replacements || []).find((r) => r.id === repId);
      if (!rep) return false;

      let updatedItems = pcba.items || [];
      if (updatedData.newPcbaItemId && updatedData.newPcbaItemId !== rep.newPcbaItemId) {
        updatedItems = updatedItems.map((item) => {
          if (item.id === rep.newPcbaItemId && item.status === "Used for Replacement") {
            return { ...item, status: "Good" };
          }
          if (item.id === updatedData.newPcbaItemId && item.status === "Good") {
            return { ...item, status: "Used for Replacement" };
          }
          return item;
        });
      }

      if (updatedData.oldSerialNo && rep.oldPcbaItemId) {
        updatedItems = updatedItems.map((item) => {
          if (item.id === rep.oldPcbaItemId) {
            return { ...item, serialNo: updatedData.oldSerialNo };
          }
          return item;
        });
      }

      const targetNewPcbaId = updatedData.newPcbaItemId || rep.newPcbaItemId;
      const targetNewItem = (updatedItems || []).find((i) => i.id === targetNewPcbaId);

      const updatedReplacements = (pcba.replacements || []).map((r) =>
        r.id === repId
          ? {
              ...r,
              ...updatedData,
              pcbaType: targetNewItem?.pcbaType || r.pcbaType,
            }
          : r
      );

      const newPcba = {
        ...pcba,
        items: updatedItems,
        replacements: updatedReplacements,
      };

      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastReplacementUpdated || "Data replacement berhasil diperbarui.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
  );

  const onDeleteReplacement = useCallback(
    async (repId) => {
      try {
        assert(PERMISSIONS.PCBA_DELETE, "menghapus replacement PCBA");
      } catch (authErr) {
        setToastMsg(authErr.message);
        return false;
      }

      const rep = (pcba.replacements || []).find((r) => r.id === repId);
      if (!rep) return false;

      const updatedItems = (pcba.items || []).map((item) => {
        if (item.id === rep.newPcbaItemId && item.status === "Used for Replacement") {
          return { ...item, status: "Good" };
        }
        return item;
      });

      const updatedReplacements = (pcba.replacements || []).filter((r) => r.id !== repId);
      const newPcba = { ...pcba, items: updatedItems, replacements: updatedReplacements };
      const ok = await persistPcba(newPcba);
      if (ok) {
        const curT = I18N[language] || I18N.id;
        setToastMsg(curT.toastReplacementDeleted || "Data replacement berhasil dihapus.");
      }
      return ok;
    },
    [pcba, persistPcba, language, assert, setToastMsg]
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

  const rmaStatusList = useMemo(() => {
    const base = master.statusRMA || DEFAULT_MASTER.statusRMA;
    const set = new Set(
      (base || [])
        .map((s) => String(s).trim())
        .filter((s) => s.toLowerCase() !== "closed")
    );
    (rma || []).forEach((e) => {
      if (e.status && e.status.trim()) {
        const trimmed = e.status.trim();
        if (trimmed.toLowerCase() === "closed") return;
        if (!Array.from(set).some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
          set.add(trimmed);
        }
      }
    });
    return Array.from(set);
  }, [master.statusRMA, rma]);

  const waStatusList = useMemo(() => {
    const base = master.statusWA || DEFAULT_MASTER.statusWA;
    const set = new Set((base || []).map((s) => String(s).trim()));
    (wa || []).forEach((e) => {
      if (e.status && e.status.trim()) {
        const trimmed = e.status.trim();
        if (!Array.from(set).some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
          set.add(trimmed);
        }
      }
    });
    return Array.from(set);
  }, [master.statusWA, wa]);

  const baseFilteredRma = useMemo(() => {
    const q = search.toLowerCase().trim();

    // Step 1: text search across key fields
    let result = rma.filter((e) => {
      if (q) {
        const haystack = [
          e.ticketNo, e.customerName, e.company, e.sn, e.mac,
          e.engineer, e.product, e.initialProblem, e.symptom,
          e.notes, e.trackingNo,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Step 2: Date range filter on receivedDate
    if (rmaFromDate || rmaToDate) {
      result = result.filter((e) => {
        if (!e.receivedDate) return false;
        const d = parseToISODate(e.receivedDate);
        if (!d) return false;
        if (rmaFromDate && d < rmaFromDate) return false;
        if (rmaToDate && d > rmaToDate) return false;
        return true;
      });
    }

    // Step 3: overdue filter
    if (overdueOnly) result = result.filter(isOverdue);

    // Step 4: per-column value filters
    const keyMap = { warrantyStatus: "warrantyStatus" };
    Object.entries(colFilters).forEach(([colKey, cf]) => {
      if (!cf || cf.values === null) return;
      const vals = new Set(cf.values);
      if (vals.size === 0) { result = []; return; }
      const vk = keyMap[colKey] || colKey;
      result = result.filter((e) => vals.has(String(e[vk] ?? "")));
    });

    return result;
  }, [rma, search, rmaFromDate, rmaToDate, overdueOnly, colFilters]);

  const filteredRma = useMemo(() => {
    let result = baseFilteredRma;

    if (rmaStatusFilter) {
      const lower = rmaStatusFilter.trim().toLowerCase();
      result = result.filter(
        (e) => (e.status || "").trim().toLowerCase() === lower
      );
    }

    // Step 5: sorting — use the FIRST column that has a sort defined
    const sortEntry = Object.entries(colFilters).find(([, cf]) => cf?.sort);
    if (sortEntry) {
      const [sortKey, { sort }] = sortEntry;
      const isDate = ["receivedDate", "eta", "closedDate", "shippedDate"].includes(sortKey);
      result = [...result].sort((a, b) => {
        let av = a[sortKey] ?? "";
        let bv = b[sortKey] ?? "";
        if (isDate) {
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          const da = parseDateForSort(av);
          const db = parseDateForSort(bv);
          return sort === "asc" ? da - db : db - da;
        }
        const cmp = String(av).localeCompare(String(bv), undefined, { sensitivity: "base" });
        return sort === "asc" ? cmp : -cmp;
      });
    } else {
      // Default: newest receivedDate first
      result = [...result].sort((a, b) => {
        const da = parseDateForSort(a.receivedDate);
        const db = parseDateForSort(b.receivedDate);
        return db - da;
      });
    }

    return result;
  }, [baseFilteredRma, rmaStatusFilter, colFilters]);

  const baseFilteredWa = useMemo(() => {
    const q = search.toLowerCase().trim();

    // Step 1: Text search across WA schema fields
    let result = wa.filter((e) => {
      if (q) {
        const haystack = [
          e.caseNo,
          e.customerPhone,
          e.customerName,
          e.company,
          e.deviceType,
          e.sn,
          e.mac,
          e.initialProblem,
          e.engineerTag,
          e.status,
          e.finalAnalysis,
          e.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Step 2: Date range filter on caseDate
    if (waFromDate || waToDate) {
      result = result.filter((e) => {
        if (!e.caseDate) return false;
        const d = parseToISODate(e.caseDate);
        if (!d) return false;
        if (waFromDate && d < waFromDate) return false;
        if (waToDate && d > waToDate) return false;
        return true;
      });
    }

    // Step 3: Overdue filter
    if (waOverdueOnly) {
      result = result.filter(isWaOverdue);
    }

    // Step 4: Per-column value filters
    Object.entries(waColFilters).forEach(([colKey, cf]) => {
      if (!cf || cf.values === null) return;
      const vals = new Set(cf.values);
      if (vals.size === 0) {
        result = [];
        return;
      }
      result = result.filter((e) => {
        let val;
        if (colKey === "caseAge") {
          val = String(daysBetween(e.caseDate, e.solvedDate || todayISO()));
        } else {
          val = String(e[colKey] ?? "");
        }
        return vals.has(val);
      });
    });

    return result;
  }, [wa, search, waFromDate, waToDate, waOverdueOnly, waColFilters]);

  const filteredWa = useMemo(() => {
    let result = baseFilteredWa;

    if (waStatusFilter) {
      const lower = waStatusFilter.trim().toLowerCase();
      result = result.filter(
        (e) => (e.status || "").trim().toLowerCase() === lower
      );
    }

    // Step 5: Sorting — use the FIRST column that has a sort defined
    const sortEntry = Object.entries(waColFilters).find(([, cf]) => cf?.sort);
    if (sortEntry) {
      const [sortKey, { sort }] = sortEntry;
      const isDate = ["caseDate", "solvedDate"].includes(sortKey);
      const isNumeric = ["caseAge"].includes(sortKey);

      result = [...result].sort((a, b) => {
        if (isNumeric) {
          const numA = Number(daysBetween(a.caseDate, a.solvedDate || todayISO())) || 0;
          const numB = Number(daysBetween(b.caseDate, b.solvedDate || todayISO())) || 0;
          return sort === "asc" ? numA - numB : numB - numA;
        }

        if (isDate) {
          const av = a[sortKey] ?? "";
          const bv = b[sortKey] ?? "";
          if (!av && !bv) return 0;
          if (!av) return 1;
          if (!bv) return -1;
          const da = parseDateForSort(av);
          const db = parseDateForSort(bv);
          return sort === "asc" ? da - db : db - da;
        }

        // Text comparison (case-insensitive)
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
        return sort === "asc" ? cmp : -cmp;
      });
    } else {
      // Default: newest caseDate first
      result = [...result].sort((a, b) => {
        const da = parseDateForSort(a.caseDate);
        const db = parseDateForSort(b.caseDate);
        return db - da;
      });
    }

    return result;
  }, [baseFilteredWa, waStatusFilter, waColFilters]);

  const handleConfirmDelete = async ({ kind, entry }) => {
    try {
      assert(
        kind === "wa" ? PERMISSIONS.WA_DELETE : PERMISSIONS.RMA_DELETE,
        kind === "wa" ? "menghapus case WhatsApp" : "menghapus tiket RMA"
      );
    } catch (authErr) {
      setToastMsg(authErr.message);
      return false;
    }

    const curT = I18N[language] || I18N.id;
    if (kind === "wa") {
      const updated = wa.filter((e) => e.id !== entry.id);
      const ok = await persistWa(updated);
      if (ok) {
        setToastMsg((curT.toastWaDeleted || "Case WhatsApp {no} berhasil dihapus.").replace("{no}", entry.caseNo));
        return true;
      }
      return false;
    } else if (kind === "rma") {
      const updated = rma.filter((e) => e.id !== entry.id);
      const ok = await persistRma(updated);
      if (ok) {
        setToastMsg((curT.toastRmaDeleted || "Tiket RMA {no} berhasil dihapus.").replace("{no}", entry.ticketNo));
        return true;
      }
      return false;
    }
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(""), 4000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

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
    ...(isAdministrator
      ? [{ id: "users", label: t.userManagement || "User Management", icon: Users }]
      : []),
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
        height: "100vh",
        maxHeight: "100vh",
        background: T.void,
        color: T.ink,
        fontFamily: sans,
        borderRadius: 0,
        overflow: "hidden",
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
          height: "100%",
          background: T.panel,
          borderRight: `1px solid ${T.line}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflowY: "auto",
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
          height: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflow: "hidden",
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
                background: T.greenDim,
                color: T.green,
              }}
            >
              <Wifi size={13} />
              {"SQLite Server Connected"}
            </div>

            <UserCenter t={t} />
          </div>
        </div>

        <div
          className="hsgq-content"
          style={{ flex: 1, padding: 22, overflowY: "auto" }}
        >
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
                      onClick={() => {
                        if (filteredRma.length === 0) {
                          setToastMsg(t.noDataToExport || "Tidak ada data untuk diexport.");
                          exportRmaToExcel([], "RMA_Export_Empty");
                          return;
                        }
                        const isFiltered = Boolean(rmaFromDate || rmaToDate || search || overdueOnly || Object.keys(colFilters).length > 0);
                        exportRmaToExcel(filteredRma, isFiltered ? "RMA_Logbook_Filtered" : "RMA_Export");
                      }}
                      title="Export data RMA (sesuai filter) ke .xlsx"
                    >
                      <FileDown size={14} /> {t.rmaExportExcel || "Export Excel"}
                    </Btn>
                    {!isViewer && (
                      <>
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
                      </>
                    )}
                  </div>
                }
              />
              {/* ── Toolbar: search + overdue + date range + preset + reset ── */}
              <DateRangeToolbar
                search={search}
                setSearch={setSearch}
                searchPlaceholder={t.rmaSearchPlaceholder}
                overdueOnly={overdueOnly}
                setOverdueOnly={setOverdueOnly}
                overdueLabel={t.rmaOverdueOnly}
                fromDate={rmaFromDate}
                setFromDate={setRmaFromDate}
                toDate={rmaToDate}
                setToDate={setRmaToDate}
                preset={rmaPreset}
                onSelectPreset={applyRmaPreset}
                onResetDate={resetRmaDate}
                onResetAll={resetAllFilters}
                hasActiveFilters={
                  Object.keys(colFilters).length > 0 ||
                  overdueOnly ||
                  search ||
                  rmaFromDate ||
                  rmaToDate ||
                  rmaPreset ||
                  Boolean(rmaStatusFilter)
                }
                t={t}
              />
              {/* ── Dynamic Status Summary Cards ── */}
              <StatusSummaryCards
                title={t.totalRma || "Total RMA"}
                totalCount={baseFilteredRma.length}
                statusList={rmaStatusList}
                filteredRows={filteredRma}
                baseRows={baseFilteredRma}
                selectedStatus={rmaStatusFilter}
                onSelectStatus={(st) => setRmaStatusFilter((prev) => (prev === st ? null : st))}
                t={t}
              />
              {/* Record count */}
              <div
                style={{
                  fontSize: 12,
                  color: T.ink2,
                  marginBottom: 8,
                  fontFamily: sans,
                }}
              >
                {(t.rmaShowing || "Menampilkan {shown} dari {total} tiket")
                  .replace("{shown}", filteredRma.length)
                  .replace("{total}", rma.length)}
              </div>
              {/* ── RMA Table with per-column sort/filter ── */}
              <RmaTable
                allRows={rma}
                rows={filteredRma}
                colFilters={colFilters}
                onColFilter={onColFilter}
                t={t}
                emptyLabel={
                  (rmaFromDate || rmaToDate) && filteredRma.length === 0
                    ? (t.noDataForDateRange || "Tidak ada data pada rentang tanggal yang dipilih.")
                    : t.rmaEmptyList
                }
                columns={[
                  {
                    key: "ticketNo",
                    label: t.colTicket,
                    mono: true,
                    type: "text",
                    filterable: false,
                  },
                  {
                    key: "status",
                    label: t.colStatus,
                    type: "status",
                    render: (r) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusLed status={r.status} />
                        {isOverdue(r) && <OverdueBadge />}
                      </div>
                    ),
                  },
                  {
                    key: "engineer",
                    label: t.colEngineer,
                    type: "text",
                  },
                  {
                    key: "product",
                    label: t.colProduct,
                    type: "text",
                  },
                  {
                    key: "sn",
                    label: "SN",
                    mono: true,
                    type: "text",
                    render: (r) => {
                      const val = r.sn || "-";
                      const isLong = val.length > 15;
                      const displayVal = isLong ? val.slice(0, 15) + "..." : val;
                      return (
                        <span title={val} style={{ fontFamily: mono, fontSize: 12 }}>
                          {displayVal}
                        </span>
                      );
                    },
                  },
                  {
                    key: "mac",
                    label: "MAC",
                    mono: true,
                    type: "text",
                    render: (r) => {
                      const val = r.mac || "-";
                      const isLong = val.length > 17;
                      const displayVal = isLong ? val.slice(0, 17) + "..." : val;
                      return (
                        <span title={val} style={{ fontFamily: mono, fontSize: 12 }}>
                          {displayVal}
                        </span>
                      );
                    },
                  },
                  {
                    key: "initialProblem",
                    label: t.colDiagnosis || t.rmaInitialProblem || "Diagnosis (Kendala Awal)",
                    type: "text",
                    render: (r) => {
                      const text = r.initialProblem || r.symptom || "-";
                      if (text.length <= 30) return text;
                      return <span title={text}>{text.slice(0, 30)}...</span>;
                    },
                  },
                  {
                    key: "finalResult",
                    label: t.colFinalResult || t.rmaFinalResult || "Hasil Akhir",
                    type: "text",
                    render: (r) => {
                      const val = r.finalResult || r.qcResult || "-";
                      return (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: r.finalResult || r.qcResult ? T.cyanDim : "transparent",
                            color: r.finalResult || r.qcResult ? T.cyan : T.ink3,
                          }}
                        >
                          {val}
                        </span>
                      );
                    },
                  },
                  {
                    key: "customerName",
                    label: t.colCustomer,
                    type: "text",
                  },
                  {
                    key: "customerPhone",
                    label: t.colPhone || t.rmaCustomerPhone || "No. HP Customer",
                    mono: true,
                    type: "text",
                    render: (r) => r.customerPhone || "-",
                  },
                  {
                    key: "warrantyStatus",
                    label: t.colWarranty,
                    type: "text",
                  },
                  {
                    key: "receivedDate",
                    label: t.colReceived,
                    type: "date",
                    filterable: false,
                    render: (r) => fmtDate(r.receivedDate),
                  },
                  {
                    key: "eta",
                    label: t.colEta,
                    type: "date",
                    filterable: false,
                    render: (r) => fmtDate(r.eta),
                  },
                  {
                    key: "shippedDate",
                    label: t.colShipped || t.rmaShippedDate || "Tgl Dikirim",
                    type: "date",
                    filterable: false,
                    render: (r) => fmtDate(r.shippedDate),
                  },
                  {
                    key: "actions",
                    label: "",
                    sortable: false,
                    filterable: false,
                    render: (r) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn icon={Eye} onClick={() => setRmaPreview(r)} title={t.viewDetail || "Preview Detail"} />
                        <IconBtn
                          icon={MessageSquare}
                          onClick={() => setWaMsgEntry({ kind: "rma", entry: r })}
                          title={t.waMessageAction}
                        />
                        {!isViewer && (
                          <>
                            <IconBtn
                              icon={Pencil}
                              onClick={() => setRmaModal({ mode: "edit", entry: r })}
                              title={t.editAction}
                            />
                            <IconBtn
                              icon={Trash2}
                              danger
                              onClick={() => setDeleteConfirm({ kind: "rma", entry: r })}
                              title={t.deleteAction}
                            />
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}

          {tab === "wa" && (
            <>
              <SectionHeader
                title={t.waPageTitle}
                subtitle={t.waPageSubtitle}
                action={
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        if (filteredWa.length === 0) {
                          setToastMsg(t.noDataToExport || "Tidak ada data untuk diexport.");
                          exportWaToExcel([], "LOGBOOK_WhatsApp_Empty");
                          return;
                        }
                        const isFiltered = Boolean(waFromDate || waToDate || search || waOverdueOnly || Object.keys(waColFilters).length > 0);
                        exportWaToExcel(filteredWa, isFiltered ? "LOGBOOK_WhatsApp_Filtered" : "LOGBOOK_WhatsApp");
                      }}
                      title="Export data WhatsApp Log (sesuai filter) ke .xlsx"
                    >
                      <FileDown size={14} /> {t.waExportExcel || "Export Excel"}
                    </Btn>
                    {!isViewer && (
                      <>
                        <Btn
                          variant="ghost"
                          onClick={() => setWaImportModal(true)}
                          title="Import WhatsApp Log dari file .xlsx / .xls"
                        >
                          <FileUp size={14} /> {t.waImportExcel || "Import Excel"}
                        </Btn>
                        <Btn
                          variant="solid"
                          onClick={() => setWaModal({ mode: "new" })}
                        >
                          <Plus size={14} /> {t.waNewCase}
                        </Btn>
                      </>
                    )}
                  </div>
                }
              />
              {/* ── WhatsApp Toolbar ── */}
              <DateRangeToolbar
                search={search}
                setSearch={setSearch}
                searchPlaceholder={t.waSearchPlaceholder}
                overdueOnly={waOverdueOnly}
                setOverdueOnly={setWaOverdueOnly}
                overdueLabel={t.rmaOverdueOnly || "Overdue saja"}
                fromDate={waFromDate}
                setFromDate={setWaFromDate}
                toDate={waToDate}
                setToDate={setWaToDate}
                preset={waPreset}
                onSelectPreset={applyWaPreset}
                onResetDate={resetWaDate}
                onResetAll={resetAllWaFilters}
                hasActiveFilters={
                  Object.keys(waColFilters).length > 0 ||
                  waOverdueOnly ||
                  search ||
                  waFromDate ||
                  waToDate ||
                  waPreset ||
                  Boolean(waStatusFilter)
                }
                t={t}
              />
              {/* ── Dynamic Status Summary Cards ── */}
              <StatusSummaryCards
                title={t.totalWaCases || "Total Case"}
                totalCount={baseFilteredWa.length}
                statusList={waStatusList}
                filteredRows={filteredWa}
                baseRows={baseFilteredWa}
                selectedStatus={waStatusFilter}
                onSelectStatus={(st) => setWaStatusFilter((prev) => (prev === st ? null : st))}
                t={t}
              />
              {/* Record count */}
              <div
                style={{
                  fontSize: 12,
                  color: T.ink2,
                  marginBottom: 8,
                  fontFamily: sans,
                }}
              >
                {(t.waShowing || "Menampilkan {shown} dari {total} case")
                  .replace("{shown}", filteredWa.length)
                  .replace("{total}", wa.length)}
              </div>
              <RmaTable
                allRows={wa}
                rows={filteredWa}
                colFilters={waColFilters}
                onColFilter={onWaColFilter}
                t={t}
                emptyLabel={
                  (waFromDate || waToDate) && filteredWa.length === 0
                    ? (t.noDataForDateRange || "Tidak ada data pada rentang tanggal yang dipilih.")
                    : t.waEmptyList
                }
                columns={[
                  {
                    key: "caseNo",
                    label: t.colCase || "No. Case",
                    mono: true,
                    type: "text",
                  },
                  {
                    key: "status",
                    label: t.colStatus || "Status",
                    type: "status",
                    render: (r) => (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusLed status={r.status} t={t} />
                        {isWaOverdue(r) && <OverdueBadge t={t} />}
                      </div>
                    ),
                  },
                  {
                    key: "engineerTag",
                    label: t.colEngineer || "Engineer",
                    type: "text",
                  },
                  {
                    key: "customerName",
                    label: t.colCustomer || "Nama Customer",
                    type: "text",
                  },
                  {
                    key: "company",
                    label: t.colCompany || "Perusahaan",
                    type: "text",
                  },
                  {
                    key: "customerPhone",
                    label: t.colPhone || "No. HP",
                    mono: true,
                    type: "text",
                  },
                  {
                    key: "deviceType",
                    label: t.colType || "Perangkat",
                    type: "text",
                  },
                  {
                    key: "sn",
                    label: "SN",
                    mono: true,
                    type: "text",
                    render: (r) => {
                      const val = r.sn || "-";
                      const isLong = val.length > 15;
                      const displayVal = isLong ? val.slice(0, 15) + "..." : val;
                      return (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 12,
                            maxWidth: 110,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                          title={val}
                        >
                          {displayVal}
                        </span>
                      );
                    },
                  },
                  {
                    key: "mac",
                    label: "MAC",
                    mono: true,
                    type: "text",
                    render: (r) => {
                      const val = r.mac || "-";
                      const isLong = val.length > 17;
                      const displayVal = isLong ? val.slice(0, 17) + "..." : val;
                      return (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 12,
                            maxWidth: 120,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                          }}
                          title={val}
                        >
                          {displayVal}
                        </span>
                      );
                    },
                  },
                  {
                    key: "initialProblem",
                    label: t.colInitialProblem || "Kendala Awal",
                    type: "text",
                    render: (r) => {
                      const text = r.initialProblem || "-";
                      const isLong = text.length > 35;
                      const displayText = isLong ? text.slice(0, 35) + "..." : text;
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            maxWidth: 240,
                          }}
                        >
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={text}
                          >
                            {displayText}
                          </span>
                          {isLong && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setWaDetailModal(r);
                              }}
                              title={t.viewDetail || "Lihat selengkapnya"}
                              aria-label={t.viewDetail || "Lihat selengkapnya"}
                              style={{
                                background: T.cyanDim,
                                border: `1px solid ${T.cyan}44`,
                                color: T.cyan,
                                borderRadius: 4,
                                padding: "2px 5px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                fontSize: 11,
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              <Eye size={12} style={{ marginRight: 3 }} /> {t.colDetail || "Detail"}
                            </button>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    key: "finalAnalysis",
                    label: t.colFinalAnalysis || "Analisa Akhir",
                    type: "text",
                    render: (r) => {
                      const text = r.finalAnalysis || "-";
                      if (text.length <= 30) return text;
                      return text.slice(0, 30) + "...";
                    },
                  },
                  {
                    key: "caseDate",
                    label: t.colDate || "Tgl Case",
                    type: "date",
                    filterable: false,
                    render: (r) => fmtDate(r.caseDate),
                  },
                  {
                    key: "solvedDate",
                    label: t.colSolvedDate || "Tgl Solved",
                    type: "date",
                    filterable: false,
                    render: (r) => fmtDate(r.solvedDate),
                  },
                  {
                    key: "caseAge",
                    label: t.colCaseAge || "Umur (Hari)",
                    type: "numeric",
                    filterable: false,
                    render: (r) => {
                      const days = daysBetween(r.caseDate, r.solvedDate || todayISO());
                      return days !== "" ? `${days} ${t.rmaDays || "hari"}` : "-";
                    },
                  },
                  {
                    key: "actions",
                    label: "",
                    sortable: false,
                    filterable: false,
                    render: (r) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn
                          icon={Eye}
                          onClick={() => setWaDetailModal(r)}
                          title={t.viewDetail || "Lihat selengkapnya"}
                        />
                        <IconBtn
                          icon={MessageSquare}
                          onClick={() => setWaMsgEntry({ kind: "wa", entry: r })}
                          title={t.waMessageAction}
                        />
                        {!isViewer && (
                          <>
                            <IconBtn
                              icon={Pencil}
                              onClick={() => setWaModal({ mode: "edit", entry: r })}
                              title={t.editAction}
                            />
                            <IconBtn
                              icon={Trash2}
                              danger
                              onClick={() => setDeleteConfirm({ kind: "wa", entry: r })}
                              title={t.deleteAction}
                            />
                          </>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </>
          )}

          {tab === "unithistory" && (
            <>
              <SectionHeader
                title={t.unitHistory}
                subtitle={t.unitHistoryPageSubtitle}
              />
              <UnitHistory
                rma={rma}
                wa={wa}
                master={master}
                t={t}
                onSelectDetail={(channel, raw) =>
                  channel === "RMA" ? setRmaPreview(raw) : setWaDetailModal(raw)
                }
              />
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
                subtitle={t.pcbaSubtitle || "Manajemen inventaris dan perbaikan PCBA"}
              />
              <PcbaInventoryTab
                pcba={pcba}
                rma={rma}
                master={master}
                onGoodsReceipt={onGoodsReceipt}
                onBulkImportPcba={onBulkImportPcba}
                onEditPcbaItem={onEditPcbaItem}
                onDeletePcbaItem={onDeletePcbaItem}
                onDeletePcbaTransaction={onDeletePcbaTransaction}
                onDeleteReplacement={onDeleteReplacement}
                onEditReplacement={onEditReplacement}
                onSendToChina={onSendToChina}
                onEditChinaShipment={onEditChinaShipment}
                onDeleteChinaShipment={onDeleteChinaShipment}
                onReplacement={onReplacement}
                setToastMsg={setToastMsg}
                t={t}
                isViewer={isViewer}
              />
            </>
          )}

          {tab === "settings" && (
            <>
              <SectionHeader
                title={t.settings}
                subtitle={t.settingsPageSubtitle}
              />
              <SettingsTab master={master} setMaster={setMaster} t={t} isViewer={isViewer} />
            </>
          )}

          {tab === "users" && (
            isAdministrator ? (
              <>
                <SectionHeader
                  title={t.userManagement || "User Management"}
                  subtitle={t.userManagementSubtitle || "Kelola akun pengguna, role hak akses, dan status akun"}
                />
                <UserManagementTab
                  currentUserProfile={profile}
                  t={t}
                  setToastMsg={setToastMsg}
                />
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  textAlign: "center",
                  background: T.panel,
                  border: `1px solid ${T.line}`,
                  borderRadius: 10,
                  marginTop: 20,
                }}
              >
                <ShieldAlert size={48} color={T.red} style={{ marginBottom: 16 }} />
                <h2 style={{ fontSize: 20, color: T.red, marginBottom: 8, fontWeight: 700, fontFamily: sans }}>
                  {t.accessDeniedTitle || "403 AKSES DITOLAK"}
                </h2>
                <p style={{ fontSize: 14, color: T.ink2, maxWidth: 460, marginBottom: 20, fontFamily: sans }}>
                  {t.accessDeniedMsg || "Anda tidak memiliki izin (Permission Denied) untuk mengakses halaman ini."}
                </p>
                <Btn variant="solid" onClick={() => setTab("home")}>
                  Kembali ke Dashboard
                </Btn>
              </div>
            )
          )}
        </div>
      </div>

      {rmaPreview && (
        <RmaDetailModal entry={rmaPreview} onClose={() => setRmaPreview(null)} t={t} />
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
      {waImportModal && (
        <WaImportModal
          onClose={() => setWaImportModal(false)}
          existingWa={wa}
          onImport={persistWa}
          t={t}
        />
      )}
      {waDetailModal && (
        <WaDetailModal
          entry={waDetailModal}
          onClose={() => setWaDetailModal(null)}
          t={t}
        />
      )}
      {deleteConfirm && (
        <DeleteConfirmModal
          confirmState={deleteConfirm}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteConfirm(null)}
          t={t}
        />
      )}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 10000,
            background: T.greenDim,
            color: T.green,
            border: `1px solid ${T.green}`,
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Check size={16} />
          <span>{toastMsg}</span>
          <button
            onClick={() => setToastMsg("")}
            style={{
              background: "none",
              border: "none",
              color: T.green,
              cursor: "pointer",
              marginLeft: 8,
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
