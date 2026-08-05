import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { storeGet, storeSet, isUsingFirebase } from "./firebase.js";
import UserCenter from "./components/UserCenter.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import { useTheme } from "./context/ThemeContext.jsx";

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
  },
  en: {
    home: "Home",
    rmaLog: "RMA Log Book",
    waLog: "WhatsApp Log",
    unitHistory: "Unit History",
    weeklyReport: "Weekly Report",
    settings: "Settings",
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
  },
  zh: {
    home: "主页",
    rmaLog: "RMA 记录",
    waLog: "WhatsApp 记录",
    unitHistory: "设备历史",
    weeklyReport: "周报",
    settings: "设置",
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
};
// storeGet & storeSet sekarang diimpor dari ./firebase.js (Firestore / localStorage fallback)

/* ============================================================
   UTILS
   ============================================================ */
const pad2 = (n) => String(n).padStart(2, "0");
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
function CopyButton({ text }) {
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
      {copied ? "Tersalin" : "Salin"}
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
}) {
  const isEdit = !!initial;
  const [tab, setTab] = useState("overview");
  const [f, setF] = useState(
    initial || {
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
      receivedTime: "",
      receivedBy: "",
      doNumber: "",
      courierName: "",
      physicalCondition: "",
      accessories: "",
      unitQty: 1,
      receivingNotes: "",
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
          changedBy: "",
          changedAt: new Date().toISOString(),
          note: "Tiket dibuat",
        },
      ],
    },
  );
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const priorMatches = useMemo(() => {
    if (!f.sn && !f.mac) return [];
    return unitHistoryLookup(f.sn, f.mac).filter((h) => h.id !== f.id);
  }, [f.sn, f.mac, unitHistoryLookup, f.id]);

  const handleSave = () => {
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
    onSave({ ...f, eta, statusHistory });
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
      {RMA_TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
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
            <Icon size={13} /> {t.label}
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
          <History size={13} /> Timeline
        </button>
      )}
    </div>
  );

  return (
    <div>
      {Tabs}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
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
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
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
              <Select
                options={master.engineers}
                value={f.receivedBy}
                onChange={set("receivedBy")}
              />
            </Field>
            <Field label="Estimasi Selesai (ETA)" hint="Default masuk + 3 hari">
              <TextInput type="date" value={f.eta} onChange={set("eta")} />
            </Field>
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
          <Field label="Catatan Receiving">
            <TextArea
              value={f.receivingNotes}
              onChange={set("receivingNotes")}
            />
          </Field>
          <InlineHint>
            Foto unit/label SN/MAC belum bisa diunggah di versi web ini — perlu
            backend penyimpanan file sungguhan (Tahap 3+).
          </InlineHint>
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
        <Btn variant="ghost" onClick={onClose}>
          Batal
        </Btn>
        <Btn variant="solid" onClick={handleSave}>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(f.commHistory || []).map((c) => (
            <div
              key={c.id}
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
        <Btn variant="ghost" onClick={onClose}>
          Batal
        </Btn>
        <Btn variant="solid" onClick={() => onSave(f)}>
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
        border: `1px solid ${T.line}`,
        borderRadius: 8,
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
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
      <div
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
              <XAxis dataKey="name" stroke={T.ink3} fontSize={11} />
              <YAxis stroke={T.ink3} fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="cases" name={t.cases} fill={T.cyan} radius={[4, 4, 0, 0]} />
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
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div
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
              <XAxis dataKey="name" stroke={T.ink3} fontSize={11} />
              <YAxis stroke={T.ink3} fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name={t.count} fill={T.amber} radius={[4, 4, 0, 0]} />
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
                }}
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
function WeeklyReport({ rma, wa }) {
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
function UnitHistory({ rma, wa }) {
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
          placeholder="Filter SN, MAC, customer, case..."
        />
      </div>
      {!query.trim() && (
        <InlineHint>
          Cari SN/MAC untuk melihat apakah unit ini pernah punya riwayat RMA
          atau case WhatsApp sebelumnya — berguna sebelum bikin tiket baru untuk
          unit yang sama.
        </InlineHint>
      )}
      {query.trim() && results.length === 0 && partialResults.length === 0 && (
        <div style={{ color: T.ink3, fontSize: 13 }}>
          Tidak ditemukan riwayat untuk "{query}". Unit ini baru pertama kali
          masuk sistem.
        </div>
      )}
      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {query.trim() && results.length > 1 && (
            <InlineHint tone="warn">
              ⚠ Unit ini pernah memiliki {results.length} riwayat sebelumnya.
            </InlineHint>
          )}
          {results.map((r, i) => (
            <div
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
            Kecocokan sebagian
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
function SettingsTab({ master, setMaster }) {
  const update = (k) => (arr) => setMaster((m) => ({ ...m, [k]: arr }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <TagList
        label="Engineer"
        items={master.engineers}
        onChange={update("engineers")}
      />
      <TagList
        label="Status RMA (alur utama)"
        items={master.statusRMA}
        onChange={update("statusRMA")}
      />
      <TagList
        label="Status WhatsApp"
        items={master.statusWA}
        onChange={update("statusWA")}
      />
      <TagList
        label="Hasil Akhir"
        items={master.finalResults}
        onChange={update("finalResults")}
      />
      <TagList
        label="Alasan Menunggu"
        items={master.waitingReasons}
        onChange={update("waitingReasons")}
      />
      <TagList
        label="Status Warranty"
        items={master.warrantyStatuses}
        onChange={update("warrantyStatuses")}
      />
      <TagList
        label="Hasil QC"
        items={master.qcResults}
        onChange={update("qcResults")}
      />
      <TagList
        label="Metode Pengiriman"
        items={master.pengiriman}
        onChange={update("pengiriman")}
      />
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [tab, setTab] = useState("home");
  const [language, setLanguage] = useState(getStoredLanguage);
  const [loading, setLoading] = useState(true);
  const [rma, setRma] = useState([]);
  const [wa, setWa] = useState([]);
  const [master, setMaster] = useState(DEFAULT_MASTER);
  const [rmaModal, setRmaModal] = useState(null);
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

  useEffect(() => {
    (async () => {
      const [r, w, m] = await Promise.all([
        storeGet(KEYS.rma, []),
        storeGet(KEYS.wa, []),
        storeGet(KEYS.master, DEFAULT_MASTER),
      ]);
      setRma(r);
      setWa(w);
      setMaster({ ...DEFAULT_MASTER, ...m });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem("hsgq_language", language);
    document.documentElement.setAttribute("lang", language === "zh" ? "zh-CN" : language);
  }, [language]);

  const persistRma = useCallback(async (arr) => {
    setRma(arr);
    const ok = await storeSet(KEYS.rma, arr);
    if (!ok) setSaveErr("Gagal menyimpan data RMA. Coba lagi.");
  }, []);
  const persistWa = useCallback(async (arr) => {
    setWa(arr);
    const ok = await storeSet(KEYS.wa, arr);
    if (!ok) setSaveErr("Gagal menyimpan data WhatsApp. Coba lagi.");
  }, []);
  useEffect(() => {
    storeSet(KEYS.master, master);
  }, [master]);

  const saveRma = (entry) => {
    const exists = rma.some((e) => e.id === entry.id);
    persistRma(
      exists
        ? rma.map((e) => (e.id === entry.id ? entry : e))
        : [entry, ...rma],
    );
    setRmaModal(null);
  };
  const saveWa = (entry) => {
    const exists = wa.some((e) => e.id === entry.id);
    persistWa(
      exists ? wa.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...wa],
    );
    setWaModal(null);
  };
  const deleteRma = (id) => persistRma(rma.filter((e) => e.id !== id));
  const deleteWa = (id) => persistWa(wa.filter((e) => e.id !== id));

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
    { id: "settings", label: t.settings, icon: Settings2 },
  ];

  if (loading) {
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
        <Loader2 className="spin" size={18} /> Memuat data...
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
      <div
        className="hsgq-sidebar"
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
          style={{
            padding: "18px 18px 16px",
            borderBottom: `1px solid ${T.line}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: T.cyan,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Wifi size={17} color="#FFFFFF" />
          </div>
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
              HSGQ Cloud
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
                onClick={() => setTab(n.id)}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Menu size={17} color={T.ink3} />
            <span
              style={{
                fontFamily: sans,
                fontWeight: 600,
                fontSize: 14.5,
                color: T.ink,
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
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <label className="language-select" title={t.language}>
              <Languages size={15} />
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
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

            <UserCenter />
          </div>
        </div>

        <div className="hsgq-content" style={{ flex: 1, padding: 22, overflowY: "auto" }}>
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
              <AlertTriangle size={14} /> Firebase belum dikonfigurasi di{" "}
              <code style={{ fontFamily: mono }}>src/firebase.js</code> — data
              disimpan sementara di localStorage browser ini saja.
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
              <SectionHeader
                title={t.homeTitle}
                subtitle={t.homeSubtitle}
              />
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
                title="RMA Log Book"
                subtitle="Daftar tiket RMA — Receiving, Diagnosis, Waiting, Warranty, QC, Shipping"
                action={
                  <Btn
                    variant="solid"
                    onClick={() => setRmaModal({ mode: "new" })}
                  >
                    <Plus size={14} /> Tiket Baru
                  </Btn>
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
                  placeholder="Cari tiket, customer, SN, MAC..."
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
                  Overdue saja
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
                    Reset Filter
                  </Btn>
                )}
              </div>
              <DataTable
                columns={[
                  { key: "ticketNo", label: "Ticket", mono: true },
                  {
                    key: "status",
                    label: "Status",
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
                  { key: "engineer", label: "Engineer" },
                  { key: "product", label: "Produk" },
                  { key: "customerName", label: "Customer" },
                  { key: "warrantyStatus", label: "Warranty" },
                  {
                    key: "receivedDate",
                    label: "Masuk",
                    render: (r) => fmtDate(r.receivedDate),
                  },
                  { key: "eta", label: "ETA", render: (r) => fmtDate(r.eta) },
                  {
                    key: "actions",
                    label: "",
                    render: (r) => (
                      <div style={{ display: "flex", gap: 6 }}>
                        <IconBtn
                          icon={MessageSquare}
                          onClick={() =>
                            setWaMsgEntry({ kind: "rma", entry: r })
                          }
                          title="Pesan WA"
                        />
                        <IconBtn
                          icon={Pencil}
                          onClick={() =>
                            setRmaModal({ mode: "edit", entry: r })
                          }
                          title="Edit"
                        />
                        <IconBtn
                          icon={Trash2}
                          danger
                          onClick={() => deleteRma(r.id)}
                          title="Hapus"
                        />
                      </div>
                    ),
                  },
                ]}
                rows={filteredRma}
                emptyLabel="Belum ada tiket RMA yang cocok dengan filter. Klik 'Tiket Baru' untuk mulai."
              />
            </>
          )}

          {tab === "wa" && (
            <>
              <SectionHeader
                title="WhatsApp Log Book"
                subtitle="Daftar case kendala via WhatsApp + riwayat komunikasi"
                action={
                  <Btn
                    variant="solid"
                    onClick={() => setWaModal({ mode: "new" })}
                  >
                    <Plus size={14} /> Case Baru
                  </Btn>
                }
              />
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Cari case, customer, SN, MAC..."
              />
              <div style={{ height: 12 }} />
              <DataTable
                columns={[
                  { key: "caseNo", label: "Case", mono: true },
                  {
                    key: "status",
                    label: "Status",
                    render: (r) => <StatusLed status={r.status} />,
                  },
                  { key: "engineerTag", label: "Engineer" },
                  { key: "deviceType", label: "Type" },
                  { key: "customerName", label: "Customer" },
                  {
                    key: "caseDate",
                    label: "Tanggal",
                    render: (r) => fmtDate(r.caseDate),
                  },
                  {
                    key: "comm",
                    label: "Komunikasi",
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
                          title="Pesan WA"
                        />
                        <IconBtn
                          icon={Pencil}
                          onClick={() => setWaModal({ mode: "edit", entry: r })}
                          title="Edit"
                        />
                        <IconBtn
                          icon={Trash2}
                          danger
                          onClick={() => deleteWa(r.id)}
                          title="Hapus"
                        />
                      </div>
                    ),
                  },
                ]}
                rows={filteredWa}
                emptyLabel="Belum ada case WhatsApp. Klik 'Case Baru' untuk mulai."
              />
            </>
          )}

          {tab === "unithistory" && (
            <>
              <SectionHeader
                title="Unit History"
                subtitle="Quick search riwayat unit berdasarkan SN/MAC lintas RMA & WhatsApp Case"
              />
              <UnitHistory rma={rma} wa={wa} />
            </>
          )}

          {tab === "report" && (
            <>
              <SectionHeader
                title="Weekly Report"
                subtitle="Ringkasan mingguan otomatis dari RMA + WhatsApp log"
              />
              <WeeklyReport rma={rma} wa={wa} />
            </>
          )}

          {tab === "settings" && (
            <>
              <SectionHeader
                title="Pengaturan"
                subtitle="Kelola daftar Engineer, status, dan opsi lainnya"
              />
              <SettingsTab master={master} setMaster={setMaster} />
            </>
          )}
        </div>
      </div>

      {rmaModal && (
        <Modal
          title={
            rmaModal.mode === "new"
              ? "TIKET RMA BARU"
              : `EDIT ${rmaModal.entry.ticketNo}`
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
          />
        </Modal>
      )}
      {waModal && (
        <Modal
          title={
            waModal.mode === "new"
              ? "CASE WHATSAPP BARU"
              : `EDIT ${waModal.entry.caseNo}`
          }
          onClose={() => setWaModal(null)}
        >
          <WaForm
            initial={waModal.entry}
            master={master}
            existingCaseNos={wa.map((e) => e.caseNo)}
            onSave={saveWa}
            onClose={() => setWaModal(null)}
          />
        </Modal>
      )}
      {waMsgEntry && (
        <Modal
          title="PESAN KONFIRMASI WHATSAPP"
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
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
