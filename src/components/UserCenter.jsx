import React, { useEffect, useState } from "react";
import {
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  X,
  Save,
  Mail,
  Phone,
  Building2,
  MapPin,
  ChevronDown,
  KeyRound,
  Lock,
} from "lucide-react";
import authApi from "../api/authClient.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function UserCenter() {
  const { user, profile, setProfile, logout, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, getRole } = useLanguage();

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "password"
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    company: "",
    address: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setForm({
      displayName: profile?.displayName || profile?.full_name || user?.displayName || user?.full_name || "",
      phone: profile?.phone || user?.phone || "",
      company: profile?.company || user?.company || "",
      address: profile?.address || user?.address || "",
    });
  }, [profile, user]);

  const displayName =
    profile?.displayName ||
    profile?.full_name ||
    user?.displayName ||
    user?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  const email = user?.email || profile?.email || "-";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.displayName.trim()) {
      setError(t.nameRequired || "Nama tidak boleh kosong.");
      return;
    }

    const currentUid = user?.id || user?.uid || profile?.id || profile?.uid;
    if (!currentUid) return;

    try {
      setSaving(true);
      const updatedProfile = {
        displayName: form.displayName.trim(),
        full_name: form.displayName.trim(),
        name: form.displayName.trim(),
        email,
        phone: form.phone.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        theme,
      };

      try {
        await authApi.updateUser(currentUid, updatedProfile);
      } catch (_) {}

      setProfile?.((current) => ({
        ...(current || {}),
        ...updatedProfile,
      }));

      setMessage(t.profileUpdated || "Profile berhasil diperbarui.");
      setTimeout(() => {
        setProfileOpen(false);
        setMessage("");
      }, 900);
    } catch (err) {
      console.error(err);
      setError(err?.message || t.profileUpdateFailed || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!passwordForm.newPassword) {
      setError(t.authRequired || "Password baru wajib diisi.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError(t.passwordTooShort || "Password baru minimal 6 karakter.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError(t.passwordMismatch || "Konfirmasi password baru tidak cocok.");
      return;
    }

    try {
      setSaving(true);
      const res = await authApi.changePassword(null, passwordForm.newPassword);
      if (res && res.ok) {
        setMessage(t.passwordChangedSuccess || "Password akun Anda berhasil diperbarui.");
        setPasswordForm({ newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setProfileOpen(false);
          setMessage("");
        }, 1200);
      } else {
        setError(res?.error || t.passwordChangeFailed || "Gagal mengubah password.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || t.passwordChangeFailed || "Gagal mengubah password.");
    } finally {
      setSaving(false);
    }
  }

  const roleDisplay = getRole(role || "Viewer");
  const isAdm = (role || "").toLowerCase() === "administrator" || (role || "").toLowerCase() === "admin";
  const isEng = (role || "").toLowerCase() === "engineer" || (role || "").toLowerCase() === "teknisi";
  const roleColor = isAdm ? "#EF4444" : isEng ? "#3B82F6" : "#10B981";

  return (
    <>
      {/* USER BUTTON */}
      <button
        type="button"
        className="user-center-trigger"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="user-avatar">{initial}</span>

        <span className="user-trigger-info">
          <strong>{displayName}</strong>
          <small style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                display: "inline-block",
                padding: "1px 5px",
                borderRadius: 4,
                fontSize: 9.5,
                fontWeight: 700,
                background: `${roleColor}22`,
                color: roleColor,
                border: `1px solid ${roleColor}44`,
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              {roleDisplay}
            </span>
          </small>
        </span>

        <ChevronDown size={14} className={open ? "user-chevron-open" : ""} />
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />

          <div className="user-center-menu">
            <div className="user-menu-header">
              <span className="user-avatar large">{initial}</span>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <strong>{displayName}</strong>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      background: `${roleColor}22`,
                      color: roleColor,
                      border: `1px solid ${roleColor}44`,
                      textTransform: "uppercase",
                    }}
                  >
                    {roleDisplay}
                  </span>
                </div>

                <span>{email}</span>
              </div>
            </div>

            <div className="user-menu-divider" />

            <button
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                setActiveTab("profile");
                setProfileOpen(true);
              }}
            >
              <User size={16} />
              <span>
                <strong>{t.profile}</strong>
                <small>{t.editAccountInfo}</small>
              </span>
            </button>

            <button
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                setActiveTab("password");
                setProfileOpen(true);
              }}
            >
              <KeyRound size={16} />
              <span>
                <strong>{t.changePassword}</strong>
                <small>{t.changePasswordSubtitle}</small>
              </span>
            </button>

            <div className="user-menu-section">
              <div className="user-menu-section-title">{t.appearance}</div>

              <div className="theme-options">
                <button
                  type="button"
                  className={theme === "light" ? "theme-option active" : "theme-option"}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={15} />
                  <span>{t.light}</span>
                </button>

                <button
                  type="button"
                  className={theme === "dark" ? "theme-option active" : "theme-option"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={15} />
                  <span>{t.dark}</span>
                </button>

                <button
                  type="button"
                  className={theme === "system" ? "theme-option active" : "theme-option"}
                  onClick={() => setTheme("system")}
                >
                  <Monitor size={15} />
                  <span>{t.system}</span>
                </button>
              </div>
            </div>

            <div className="user-menu-divider" />

            <button className="user-menu-item logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>{t.logout}</span>
            </button>
          </div>
        </>
      )}

      {/* PROFILE & PASSWORD MODAL */}
      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="profile-modal-header">
              <div>
                <h2>{activeTab === "profile" ? t.userCenter : t.changePassword}</h2>
                <p>{activeTab === "profile" ? t.manageProfile : t.changePasswordSubtitle}</p>
              </div>

              <button
                className="modal-close-button"
                onClick={() => setProfileOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--line)", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => { setActiveTab("profile"); setMessage(""); setError(""); }}
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "profile" ? "2px solid #2563EB" : "2px solid transparent",
                  color: activeTab === "profile" ? "#2563EB" : "var(--ink-2)",
                  fontWeight: activeTab === "profile" ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t.profile}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("password"); setMessage(""); setError(""); }}
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "password" ? "2px solid #2563EB" : "2px solid transparent",
                  color: activeTab === "password" ? "#2563EB" : "var(--ink-2)",
                  fontWeight: activeTab === "password" ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t.changePassword}
              </button>
            </div>

            {activeTab === "profile" ? (
              <form onSubmit={handleSaveProfile}>
                <div className="profile-avatar-area">
                  <div className="profile-avatar">{initial}</div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <strong>{displayName}</strong>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: `${roleColor}22`,
                          color: roleColor,
                          border: `1px solid ${roleColor}44`,
                          textTransform: "uppercase",
                        }}
                      >
                        {roleDisplay}
                      </span>
                    </div>

                    <span>{email}</span>
                  </div>
                </div>

                <div className="profile-grid">
                  <label className="profile-field">
                    <span>
                      <User size={14} />
                      {t.nickName}
                    </span>
                    <input
                      value={form.displayName}
                      onChange={(e) => updateField("displayName", e.target.value)}
                      placeholder={t.yourName}
                    />
                  </label>

                  <label className="profile-field">
                    <span>
                      <Mail size={14} />
                      {t.email}
                    </span>
                    <input value={email} disabled />
                  </label>

                  <label className="profile-field">
                    <span>
                      <Phone size={14} />
                      {t.phone}
                    </span>
                    <input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder={t.phonePlaceholder}
                    />
                  </label>

                  <label className="profile-field">
                    <span>
                      <Building2 size={14} />
                      {t.company}
                    </span>
                    <input
                      value={form.company}
                      onChange={(e) => updateField("company", e.target.value)}
                      placeholder={t.companyPlaceholder}
                    />
                  </label>

                  <label className="profile-field full">
                    <span>
                      <MapPin size={14} />
                      {t.address}
                    </span>
                    <textarea
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder={t.addressPlaceholder}
                      rows={3}
                    />
                  </label>
                </div>

                <div className="profile-theme-box">
                  <div>
                    <strong>{t.appearance}</strong>
                    <span>{t.selectAppearance}</span>
                  </div>

                  <div className="theme-options">
                    <button
                      type="button"
                      className={theme === "light" ? "theme-option active" : "theme-option"}
                      onClick={() => setTheme("light")}
                    >
                      <Sun size={15} />
                      {t.light}
                    </button>

                    <button
                      type="button"
                      className={theme === "dark" ? "theme-option active" : "theme-option"}
                      onClick={() => setTheme("dark")}
                    >
                      <Moon size={15} />
                      {t.dark}
                    </button>

                    <button
                      type="button"
                      className={theme === "system" ? "theme-option active" : "theme-option"}
                      onClick={() => setTheme("system")}
                    >
                      <Monitor size={15} />
                      {t.system}
                    </button>
                  </div>
                </div>

                {error && <div className="profile-message error">{error}</div>}
                {message && <div className="profile-message success">{message}</div>}

                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-cancel"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    className="profile-save"
                    disabled={saving}
                  >
                    <Save size={15} />
                    {saving ? t.saving : t.saveChanges}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label className="profile-field full">
                    <span>
                      <Lock size={14} />
                      {t.newPassword}
                    </span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder={t.newPasswordPlaceholder}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)" }}
                    />
                  </label>

                  <label className="profile-field full">
                    <span>
                      <Lock size={14} />
                      {t.confirmPassword}
                    </span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder={t.confirmPasswordPlaceholder}
                      style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--panel)" }}
                    />
                  </label>
                </div>

                {error && <div className="profile-message error" style={{ marginTop: 14 }}>{error}</div>}
                {message && <div className="profile-message success" style={{ marginTop: 14 }}>{message}</div>}

                <div className="profile-actions" style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    className="profile-cancel"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t.cancel}
                  </button>

                  <button
                    type="submit"
                    className="profile-save"
                    disabled={saving}
                  >
                    <KeyRound size={15} />
                    {saving ? t.saving : t.changePassword}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
