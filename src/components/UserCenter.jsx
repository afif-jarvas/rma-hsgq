import React, { useEffect, useState } from "react";

import {
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Settings,
  X,
  Save,
  Mail,
  Phone,
  Building2,
  MapPin,
  ChevronDown,
} from "lucide-react";

import { updateProfile } from "firebase/auth";

import { auth, saveUserProfile } from "../firebase.js";

import { useAuth } from "../auth/AuthContext.jsx";

import { useTheme } from "../context/ThemeContext.jsx";

export default function UserCenter() {
  const { user, profile, setProfile, logout } = useAuth();

  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    displayName: "",
    phone: "",
    company: "",
    address: "",
  });

  useEffect(() => {
    setForm({
      displayName: profile?.displayName || user?.displayName || "",

      phone: profile?.phone || "",

      company: profile?.company || "",

      address: profile?.address || "",
    });
  }, [profile, user]);

  const displayName =
    profile?.displayName ||
    user?.displayName ||
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
      setError("Nama tidak boleh kosong.");
      return;
    }

    if (!user) {
      return;
    }

    try {
      setSaving(true);

      /*
      Update Firebase Authentication displayName.
      */
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: form.displayName.trim(),
        });
      }

      /*
      Update Firestore profile.
      */
      await saveUserProfile(user.uid, {
        displayName: form.displayName.trim(),

        email,

        phone: form.phone.trim(),

        company: form.company.trim(),

        address: form.address.trim(),

        theme,
      });

      setProfile?.((current) => ({
        ...(current || {}),
        displayName: form.displayName.trim(),
        email,
        phone: form.phone.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        theme,
      }));

      setMessage("Profile berhasil diperbarui.");

      setTimeout(() => {
        setProfileOpen(false);
        setMessage("");
      }, 900);
    } catch (err) {
      console.error(err);

      setError(err?.message || "Gagal menyimpan profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setOpen(false);

    await logout();
  }

  function selectTheme(value) {
    setTheme(value);
  }

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

          <small>User Center</small>
        </span>

        <ChevronDown size={14} className={open ? "user-chevron-open" : ""} />
      </button>

      {/* DROPDOWN */}

      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />

          <div className="user-center-menu">
            <div className="user-menu-header">
              <span className="user-avatar large">{initial}</span>

              <div>
                <strong>{displayName}</strong>

                <span>{email}</span>
              </div>
            </div>

            <div className="user-menu-divider" />

            <button
              className="user-menu-item"
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
            >
              <User size={16} />

              <span>
                <strong>Profile</strong>

                <small>Edit informasi akun</small>
              </span>
            </button>

            <div className="user-menu-section">
              <div className="user-menu-section-title">Appearance</div>

              <div className="theme-options">
                <button
                  className={
                    theme === "light" ? "theme-option active" : "theme-option"
                  }
                  onClick={() => selectTheme("light")}
                >
                  <Sun size={15} />
                  <span>Light</span>
                </button>

                <button
                  className={
                    theme === "dark" ? "theme-option active" : "theme-option"
                  }
                  onClick={() => selectTheme("dark")}
                >
                  <Moon size={15} />
                  <span>Dark</span>
                </button>

                <button
                  className={
                    theme === "system" ? "theme-option active" : "theme-option"
                  }
                  onClick={() => selectTheme("system")}
                >
                  <Monitor size={15} />
                  <span>System</span>
                </button>
              </div>
            </div>

            <div className="user-menu-divider" />

            <button className="user-menu-item logout" onClick={handleLogout}>
              <LogOut size={16} />

              <span>Logout</span>
            </button>
          </div>
        </>
      )}

      {/* PROFILE MODAL */}

      {profileOpen && (
        <div className="profile-overlay" onClick={() => setProfileOpen(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h2>User Center</h2>

                <p>Kelola informasi profile kamu</p>
              </div>

              <button
                className="modal-close-button"
                onClick={() => setProfileOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="profile-avatar-area">
                <div className="profile-avatar">{initial}</div>

                <div>
                  <strong>{displayName}</strong>

                  <span>{email}</span>
                </div>
              </div>

              <div className="profile-grid">
                <label className="profile-field">
                  <span>
                    <User size={14} />
                    Nick Name
                  </span>

                  <input
                    value={form.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    placeholder="Nama kamu"
                  />
                </label>

                <label className="profile-field">
                  <span>
                    <Mail size={14} />
                    Email
                  </span>

                  <input value={email} disabled />
                </label>

                <label className="profile-field">
                  <span>
                    <Phone size={14} />
                    Phone
                  </span>

                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </label>

                <label className="profile-field">
                  <span>
                    <Building2 size={14} />
                    Company
                  </span>

                  <input
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    placeholder="PT HSGQ Indonesia"
                  />
                </label>

                <label className="profile-field full">
                  <span>
                    <MapPin size={14} />
                    Address
                  </span>

                  <textarea
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Alamat"
                    rows={3}
                  />
                </label>
              </div>

              <div className="profile-theme-box">
                <div>
                  <strong>Appearance</strong>

                  <span>Pilih tampilan aplikasi</span>
                </div>

                <div className="theme-options">
                  <button
                    type="button"
                    className={
                      theme === "light" ? "theme-option active" : "theme-option"
                    }
                    onClick={() => selectTheme("light")}
                  >
                    <Sun size={15} />
                    Light
                  </button>

                  <button
                    type="button"
                    className={
                      theme === "dark" ? "theme-option active" : "theme-option"
                    }
                    onClick={() => selectTheme("dark")}
                  >
                    <Moon size={15} />
                    Dark
                  </button>

                  <button
                    type="button"
                    className={
                      theme === "system"
                        ? "theme-option active"
                        : "theme-option"
                    }
                    onClick={() => selectTheme("system")}
                  >
                    <Monitor size={15} />
                    System
                  </button>
                </div>
              </div>

              {error && <div className="profile-message error">{error}</div>}

              {message && (
                <div className="profile-message success">{message}</div>
              )}

              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-cancel"
                  onClick={() => setProfileOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-save"
                  disabled={saving}
                >
                  <Save size={15} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
