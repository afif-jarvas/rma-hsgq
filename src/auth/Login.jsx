import React, { useState } from "react";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";

import { auth, saveUserProfile, isUsingFirebase } from "../firebase.js";

import {
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  ArrowLeft,
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

function getFirebaseErrorMessage(error) {
  if (!error?.code) {
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "Format email tidak valid.";

    case "auth/user-not-found":
      return "Akun dengan email tersebut tidak ditemukan.";

    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email atau password salah.";

    case "auth/email-already-in-use":
      return "Email tersebut sudah terdaftar.";

    case "auth/weak-password":
      return "Password terlalu lemah. Gunakan minimal 6 karakter.";

    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa saat.";

    case "auth/network-request-failed":
      return "Koneksi internet bermasalah.";

    default:
      return error.message || "Terjadi kesalahan.";
  }
}

export default function Login() {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  function resetMessages() {
    setMessage("");
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    resetMessages();

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");

      return;
    }

    if (!auth || !isUsingFirebase) {
      setError(
        "Firebase belum dikonfigurasi. Isi firebaseConfig terlebih dahulu.",
      );

      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error(err);

      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    resetMessages();

    if (!name.trim()) {
      setError("Nama wajib diisi.");

      return;
    }

    if (!email.trim()) {
      setError("Email wajib diisi.");

      return;
    }

    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.");

      return;
    }

    if (!auth || !isUsingFirebase) {
      setError(
        "Firebase belum dikonfigurasi. Isi firebaseConfig terlebih dahulu.",
      );

      return;
    }

    try {
      setLoading(true);

      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      /*
      Simpan nama ke Firebase Authentication.
      */

      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      /*
      Simpan profile lengkap ke Firestore.
      */

      await saveUserProfile(credential.user.uid, {
        displayName: name.trim(),
        email: email.trim(),
        phone: "",
        company: "",
        address: "",
        theme: "system",
        createdAt: new Date().toISOString(),
      });

      /*
      onAuthStateChanged akan menangani
      perpindahan ke aplikasi.
      */
    } catch (err) {
      console.error(err);

      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();

    resetMessages();

    if (!email.trim()) {
      setError("Masukkan email terlebih dahulu.");

      return;
    }

    if (!auth || !isUsingFirebase) {
      setError("Firebase belum dikonfigurasi.");

      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        "Email untuk reset password sudah dikirim. Silakan cek inbox.",
      );
    } catch (err) {
      console.error(err);

      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function changeMode(newMode) {
    resetMessages();

    setMode(newMode);
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
              height: 60,
              width: "auto",
              objectFit: "contain",
            }}
          />

          <div>
            <div style={styles.brand}>HSGQ RMA</div>

            <div style={styles.subtitle}>RMA & Case Log Book</div>
          </div>
        </div>

        {/* LOGIN */}

        {mode === "login" && (
          <>
            <div style={styles.heading}>Welcome Back</div>

            <div style={styles.description}>
              Sign in untuk melanjutkan ke HSGQ RMA.
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
              <label style={styles.label}>
                Email
                <div style={styles.inputWrapper}>
                  <Mail size={17} style={styles.inputIcon} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    style={styles.input}
                  />
                </div>
              </label>

              <label style={styles.label}>
                Password
                <div style={styles.inputWrapper}>
                  <Lock size={17} style={styles.inputIcon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error && <div style={styles.error}>{error}</div>}

              {message && <div style={styles.success}>{message}</div>}

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
                  <LogIn size={18} />
                )}

                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => changeMode("forgot")}
              style={styles.linkButton}
            >
              Forgot password?
            </button>

            <div style={styles.separator}>
              <span />
              <small>OR</small>
              <span />
            </div>

            <div style={styles.bottomText}>Belum punya akun?</div>

            <button
              type="button"
              onClick={() => changeMode("register")}
              style={styles.secondaryButton}
            >
              <UserPlus size={17} />
              Create Account
            </button>
          </>
        )}

        {/* REGISTER */}

        {mode === "register" && (
          <>
            <button
              type="button"
              onClick={() => changeMode("login")}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>

            <div style={styles.heading}>Create Account</div>

            <div style={styles.description}>
              Buat akun untuk menggunakan HSGQ RMA.
            </div>

            <form onSubmit={handleRegister} style={styles.form}>
              <label style={styles.label}>
                Name
                <div style={styles.inputWrapper}>
                  <User size={17} style={styles.inputIcon} />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    autoComplete="name"
                    style={styles.input}
                  />
                </div>
              </label>

              <label style={styles.label}>
                Email
                <div style={styles.inputWrapper}>
                  <Mail size={17} style={styles.inputIcon} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    style={styles.input}
                  />
                </div>
              </label>

              <label style={styles.label}>
                Password
                <div style={styles.inputWrapper}>
                  <Lock size={17} style={styles.inputIcon} />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    style={styles.input}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {error && <div style={styles.error}>{error}</div>}

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
                  <UserPlus size={18} />
                )}

                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div style={styles.bottomText}>Sudah punya akun?</div>

            <button
              type="button"
              onClick={() => changeMode("login")}
              style={styles.secondaryButton}
            >
              Sign In
            </button>
          </>
        )}

        {/* FORGOT PASSWORD */}

        {mode === "forgot" && (
          <>
            <button
              type="button"
              onClick={() => changeMode("login")}
              style={styles.backButton}
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>

            <div style={styles.heading}>Reset Password</div>

            <div style={styles.description}>
              Masukkan email akunmu. Kami akan mengirimkan link untuk membuat
              password baru.
            </div>

            <form onSubmit={handleForgotPassword} style={styles.form}>
              <label style={styles.label}>
                Email
                <div style={styles.inputWrapper}>
                  <Mail size={17} style={styles.inputIcon} />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    style={styles.input}
                  />
                </div>
              </label>

              {error && <div style={styles.error}>{error}</div>}

              {message && <div style={styles.success}>{message}</div>}

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
                  <Mail size={18} />
                )}

                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}

        <div style={styles.footer}>HSGQ RMA Cloud</div>
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
    maxWidth: 430,
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
    marginBottom: 32,
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

  heading: {
    fontSize: 24,
    fontWeight: 750,
    color: COLORS.text,
    marginBottom: 7,
  },

  description: {
    fontSize: 13,
    lineHeight: 1.6,
    color: COLORS.text2,
    marginBottom: 24,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 17,
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
  },

  secondaryButton: {
    width: "100%",
    height: 42,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    background: "#FFFFFF",
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 650,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  linkButton: {
    border: "none",
    background: "transparent",
    color: COLORS.blue,
    fontSize: 12,
    cursor: "pointer",
    padding: "12px 0 0",
    width: "100%",
  },

  separator: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "8px 0 2px",
  },

  bottomText: {
    textAlign: "center",
    color: COLORS.text2,
    fontSize: 12,
  },

  backButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    marginBottom: 20,
    color: COLORS.blue,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
  },

  error: {
    padding: "10px 12px",
    borderRadius: 7,
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 1.5,
  },

  success: {
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
    marginTop: 28,
    paddingTop: 18,
    borderTop: `1px solid #E5E7EB`,
    color: "#9CA3AF",
    fontSize: 11,
  },

  spin: {
    animation: "spin 1s linear infinite",
  },
};
