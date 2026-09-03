import React, { useState } from "react";
import authApi from "../api/authClient.js";
import { useAuth } from "./AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  Mail,
  Lock,
  ShieldCheck,
  Languages,
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
};

export default function Login() {
  const { inactiveError, loginWithUser } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function resetMessages() {
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    resetMessages();

    const inputVal = email.trim();
    if (!inputVal || !password) {
      setError(t.authRequired || "Email/Username dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login(inputVal, password);

      if (res && res.ok) {
        if (typeof loginWithUser === "function") {
          loginWithUser(res.user, res.profile, res.token);
        }
      } else {
        if (res?.error && res.error.toLowerCase().includes("nonaktif")) {
          setError(t.accountInactive || "Akun Anda telah dinonaktifkan. Hubungi Administrator.");
        } else {
          setError(t.invalidCredentials || "Email/Username atau password salah.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t.invalidCredentials || "Email/Username atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* TOPBAR LANGUAGE SWITCHER */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <div style={styles.langSelectWrapper}>
            <Languages size={14} color="#6B7280" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.langSelect}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LOGO & HEADER */}
        <div style={styles.header}>
          <img src={hsgqLogo} alt="HSGQ Logo" style={styles.logo} />
          <div>
            <h1 style={styles.title}>{t.appName || "HSGQ INDONESIA"}</h1>
            <p style={styles.subtitle}>{t.appSubtitle || "RMA & Support Management System"}</p>
          </div>
        </div>

        <div style={{ marginTop: 24, marginBottom: 20 }}>
          <h2 style={styles.heading}>{t.loginHeading || "Masuk ke Akun"}</h2>
          <p style={styles.description}>
            {t.loginDescription || "Gunakan email atau username terdaftar untuk mengakses aplikasi."}
          </p>
        </div>

        {/* INACTIVE ACCOUNT ERROR (FROM WATCHDOG / SESSION) */}
        {inactiveError && !error && (
          <div style={{ ...styles.error, marginBottom: 16 }}>
            {t.accountInactive || inactiveError}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div style={{ ...styles.error, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>
            <span>{t.emailOrUsername || "Email atau Username"}</span>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="text"
                placeholder={t.emailOrUsernamePlaceholder || "nama@hsgq.local atau username"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                autoComplete="username"
                autoFocus
              />
            </div>
          </label>

          <label style={styles.label}>
            <span>{t.password || "Password"}</span>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t.passwordPlaceholder || "Masukkan password Anda"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                title={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.primaryButton,
              opacity: loading ? 0.7 : 1,
              marginTop: 6,
            }}
          >
            {loading ? (
              <Loader2 size={16} style={styles.spin} />
            ) : (
              <LogIn size={16} />
            )}
            <span>{loading ? (t.loggingIn || "Memverifikasi...") : (t.loginButton || "Masuk")}</span>
          </button>
        </form>

        <div style={styles.footer}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <ShieldCheck size={14} color="#9CA3AF" />
            <span>{t.secureAuthFooter || "Secure Server Authentication • HSGQ Indonesia"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F0F2F5",
    padding: "24px 16px",
    boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 440,
    background: "#FFFFFF",
    borderRadius: 12,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
    padding: "28px 32px 28px",
    boxSizing: "border-box",
    border: "1px solid #E5E7EB",
  },

  langSelectWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 6,
    background: "#F3F4F6",
    border: "1px solid #E5E7EB",
  },

  langSelect: {
    background: "transparent",
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    outline: "none",
    cursor: "pointer",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 20,
    borderBottom: "1px solid #F3F4F6",
  },

  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },

  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: COLORS.text,
    letterSpacing: 0.4,
  },

  subtitle: {
    margin: "3px 0 0",
    fontSize: 12,
    color: COLORS.text2,
  },

  heading: {
    margin: 0,
    fontSize: 22,
    fontWeight: 750,
    color: COLORS.text,
    marginBottom: 6,
  },

  description: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: COLORS.text2,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
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
    height: 42,
    boxSizing: "border-box",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: "0 38px 0 38px",
    outline: "none",
    fontSize: 13.5,
    color: COLORS.text,
    background: "#FFFFFF",
    transition: "border-color 0.15s ease",
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
    transition: "background 0.15s ease",
  },

  error: {
    padding: "10px 14px",
    borderRadius: 8,
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: COLORS.danger,
    fontSize: 12.5,
    lineHeight: 1.5,
  },

  footer: {
    textAlign: "center",
    marginTop: 24,
    paddingTop: 16,
    borderTop: `1px solid #F3F4F6`,
    color: "#9CA3AF",
    fontSize: 11.5,
  },

  spin: {
    animation: "spin 1s linear infinite",
  },
};
