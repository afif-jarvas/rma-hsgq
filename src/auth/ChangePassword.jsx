import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  KeyRound,
  LogOut,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import hsgqLogo from "../assets/hsgq-logo.png";

const COLORS = {
  blue: "#2563EB",
  blueDark: "#1D4ED8",
  bg: "#F3F4F6",
  panel: "#FFFFFF",
  text: "#111827",
  text2: "#6B7280",
  border: "#D1D5DB",
  danger: "#DC2626",
  success: "#16A34A",
  amber: "#D97706",
  amberBg: "#FEF3C7",
};

export default function ChangePassword() {
  const { user, profile, changePassword, logout } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const displayName = profile?.displayName || profile?.name || user?.displayName || user?.email?.split("@")[0] || "User";
  const email = profile?.email || user?.email || "-";
  const role = profile?.role || "User";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Password baru wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password baru minimal terdiri dari 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(newPassword);
      setSuccess("Password berhasil diubah! Mengarahkan ke menu utama...");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Gagal mengubah password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* LOGO / HEADER */}
        <div style={styles.logoWrapper}>
          <img
            src={hsgqLogo}
            alt="HSGQ"
            style={{
              height: 56,
              width: "auto",
              objectFit: "contain",
            }}
          />
          <div>
            <div style={styles.brand}>HSGQ RMA</div>
            <div style={styles.subtitle}>RMA & Case Log Book</div>
          </div>
        </div>

        {/* SECURITY NOTICE */}
        <div style={styles.noticeBox}>
          <KeyRound size={20} color={COLORS.amber} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ display: "block", color: "#92400E", fontSize: 13, marginBottom: 2 }}>
              Ganti Password Wajib
            </strong>
            <span style={{ color: "#78350F", fontSize: 12, lineHeight: 1.5 }}>
              Akun Anda menggunakan password sementara. Silakan buat password baru untuk melanjutkan ke sistem.
            </span>
          </div>
        </div>

        {/* USER INFO BADGE */}
        <div style={styles.userBadge}>
          <div style={styles.userAvatar}>{displayName.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{displayName}</div>
            <div style={styles.userEmail}>{email} • <span style={{ color: COLORS.blue, fontWeight: 600 }}>{role}</span></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Password Baru
            <div style={styles.inputWrapper}>
              <Lock size={17} style={styles.inputIcon} />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={styles.eyeButton}
              >
                {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <label style={styles.label}>
            Konfirmasi Password Baru
            <div style={styles.inputWrapper}>
              <Lock size={17} style={styles.inputIcon} />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                autoComplete="new-password"
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={styles.eyeButton}
              >
                {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && (
            <div style={styles.error}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.success}>
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryButton,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={18} style={styles.spin} />
            ) : (
              <ShieldCheck size={18} />
            )}
            {loading ? "Menyimpan..." : "Simpan & Masuk ke Dashboard"}
          </button>
        </form>

        <div style={styles.separator}>
          <span style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          <small style={{ color: "#9CA3AF", padding: "0 8px" }}>ATAU</small>
          <span style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          <LogOut size={16} />
          Keluar / Logout
        </button>

        <div style={styles.footer}>HSGQ RMA Cloud • Security Enforcement</div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: COLORS.bg,
    padding: "24px 16px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: "32px",
    boxSizing: "border-box",
    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.08)",
  },
  logoWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  brand: {
    fontSize: 16,
    fontWeight: 800,
    color: COLORS.text,
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.text2,
  },
  noticeBox: {
    display: "flex",
    gap: 10,
    padding: "12px 14px",
    background: COLORS.amberBg,
    border: "1px solid #FCD34D",
    borderRadius: 8,
    marginBottom: 18,
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    marginBottom: 20,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: COLORS.blue,
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userEmail: {
    fontSize: 11.5,
    color: COLORS.text2,
    marginTop: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    fontSize: 12,
    fontWeight: 650,
    color: COLORS.text,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9CA3AF",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: 44,
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: "0 40px",
    outline: "none",
    fontSize: 14,
    color: COLORS.text,
    background: "#FFFFFF",
  },
  eyeButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#6B7280",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  primaryButton: {
    width: "100%",
    height: 44,
    border: "none",
    borderRadius: 8,
    background: COLORS.blue,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  logoutButton: {
    width: "100%",
    height: 40,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    background: "#FFFFFF",
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 650,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  separator: {
    display: "flex",
    alignItems: "center",
    margin: "18px 0 14px",
  },
  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 7,
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 1.5,
  },
  success: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 7,
    background: "#F0FDF4",
    border: "1px solid #BBF7D0",
    color: COLORS.success,
    fontSize: 12,
    lineHeight: 1.5,
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTop: `1px solid #E5E7EB`,
    color: "#9CA3AF",
    fontSize: 11,
  },
  spin: {
    animation: "spin 1s linear infinite",
  },
};
