import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Trash2,
  X,
  Search,
  Check,
  Copy,
  AlertTriangle,
  Loader2,
  Lock,
  User,
  Mail,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  getAllUsers,
  adminCreateUser,
  adminResetUserPassword,
  adminUpdateUserRole,
  adminDeleteUser,
} from "../firebase.js";
import { useAuth } from "../auth/AuthContext.jsx";

function generateSecureTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let pass = "HSGQ@";
  for (let i = 0; i < 6; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export default function UserManagementModal({ onClose, t }) {
  const { user: currentAuthUser, profile: currentProfile } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  // Sub-dialogs
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    username: "",
    email: "",
    role: "Engineer",
    mustChangePassword: true,
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Temporary password display modal
  const [tempPassModal, setTempPassModal] = useState(null); // { user, tempPassword, title, message }
  const [copied, setCopied] = useState(false);

  // Reset confirmation modal
  const [resetConfirmUser, setResetConfirmUser] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Delete confirmation modal
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await getAllUsers();
      // If empty and current user is here, populate current profile
      if (list.length === 0 && currentProfile) {
        setUsers([currentProfile]);
      } else {
        setUsers(list);
      }
    } catch (err) {
      console.error("Gagal load users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateError("");

    if (!createForm.name.trim()) {
      setCreateError("Nama lengkap wajib diisi.");
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError("Email / Username wajib diisi.");
      return;
    }

    let email = createForm.email.trim();
    let username = createForm.username.trim() || email.split("@")[0];
    if (!email.includes("@")) {
      email = `${username}@hsgq.local`;
    }

    const tempPassword = generateSecureTempPassword();

    try {
      setCreateLoading(true);
      const created = await adminCreateUser({
        name: createForm.name.trim(),
        username,
        email,
        role: createForm.role,
        temporaryPassword: tempPassword,
        mustChangePassword: createForm.mustChangePassword,
      });

      setCreateUserOpen(false);
      setCreateForm({
        name: "",
        username: "",
        email: "",
        role: "Engineer",
        mustChangePassword: true,
      });

      // Show temporary password modal
      setTempPassModal({
        targetUser: created,
        tempPassword,
        title: "User Baru Berhasil Dibuat",
        message:
          "User telah dibuat dengan status wajib mengganti password. Berikan password sementara berikut kepada user untuk login pertama kali.",
      });

      await loadUsers();
    } catch (err) {
      console.error(err);
      setCreateError(err?.message || "Gagal membuat user baru.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleConfirmResetPassword() {
    if (!resetConfirmUser) return;
    const tempPassword = generateSecureTempPassword();

    try {
      setResetLoading(true);
      await adminResetUserPassword(
        resetConfirmUser.uid || resetConfirmUser.id,
        tempPassword,
      );

      const target = resetConfirmUser;
      setResetConfirmUser(null);

      // Show temporary password modal
      setTempPassModal({
        targetUser: target,
        tempPassword,
        title: "Password Berhasil Direset",
        message:
          "Password sementara baru telah digenerate dan status user diubah menjadi WAJIB GANTI PASSWORD. Berikan password sementara ini kepada user.",
      });

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Gagal mereset password user.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleRoleChange(targetUser, newRole) {
    try {
      await adminUpdateUserRole(targetUser.uid || targetUser.id, newRole);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah role user.");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmUser) return;
    try {
      setDeleteLoading(true);
      await adminDeleteUser(deleteConfirmUser.uid || deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus user.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q));

    const matchRole =
      selectedRoleFilter === "all" ||
      (u.role && u.role.toLowerCase() === selectedRoleFilter.toLowerCase());

    return matchSearch && matchRole;
  });

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div
        className="profile-modal"
        style={{ maxWidth: 840, width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="profile-modal-header" style={{ padding: "18px 24px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 750, color: "#0F172A", margin: 0 }}>
                Manajemen User & Akses
              </h2>
              <p style={{ fontSize: 12, color: "#64748B", margin: "2px 0 0" }}>
                Kelola daftar pengguna, hak akses role, reset password, dan status wajib ganti password.
              </p>
            </div>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* TOOLBAR */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px 12px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <div style={{ display: "flex", gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari user (nama, email, username)..."
                style={{
                  width: "100%",
                  height: 36,
                  padding: "0 12px 0 32px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  background: "#FFFFFF",
                }}
              />
            </div>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              style={{
                height: 36,
                padding: "0 10px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                outline: "none",
                background: "#FFFFFF",
                color: "#334155",
              }}
            >
              <option value="all">Semua Role</option>
              <option value="Administrator">Administrator</option>
              <option value="Engineer">Engineer</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={loadUsers}
              title="Refresh User List"
              style={{
                height: 36,
                width: 36,
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                background: "#FFFFFF",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={15} className={loading ? "spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setCreateUserOpen(true)}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 6,
                background: "#2563EB",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 650,
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <UserPlus size={15} />
              Tambah User Baru
            </button>
          </div>
        </div>

        {/* USER LIST TABLE */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#64748B" }}>
              <Loader2 size={24} className="spin" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13 }}>Memuat data pengguna...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <Users size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: "#64748B" }}>Tidak ada user ditemukan</div>
              <div style={{ fontSize: 12 }}>Coba ubah kata kunci pencarian atau tambah user baru.</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", color: "#64748B", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Pengguna</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Role</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>Status Password</th>
                  <th style={{ padding: "10px 12px", fontWeight: 700, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const name = u.displayName || u.name || u.email?.split("@")[0] || "User";
                  const email = u.email || "-";
                  const role = u.role || "Engineer";
                  const mustChange = !!u.mustChangePassword;
                  const isCurrent = currentAuthUser?.uid === (u.uid || u.id);

                  return (
                    <tr
                      key={u.uid || u.id || u.email}
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: role === "Administrator" ? "#3B82F6" : "#0D9488",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 13,
                              flexShrink: 0,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 650, color: "#1E293B", display: "flex", alignItems: "center", gap: 6 }}>
                              {name}
                              {isCurrent && (
                                <span style={{ fontSize: 10, background: "#EFF6FF", color: "#2563EB", padding: "1px 6px", borderRadius: 4 }}>
                                  Anda
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <select
                          value={role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={isCurrent}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "1px solid #CBD5E1",
                            background:
                              role === "Administrator"
                                ? "#EFF6FF"
                                : role === "Engineer"
                                ? "#F0FDF4"
                                : "#F8FAFC",
                            color:
                              role === "Administrator"
                                ? "#1D4ED8"
                                : role === "Engineer"
                                ? "#15803D"
                                : "#475569",
                            cursor: isCurrent ? "default" : "pointer",
                          }}
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Engineer">Engineer</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px" }}>
                        {mustChange ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#FEF3C7",
                              color: "#B45309",
                              fontSize: 11.5,
                              fontWeight: 650,
                            }}
                          >
                            <ShieldAlert size={13} />
                            Wajib Ganti Password
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "#DCFCE7",
                              color: "#166534",
                              fontSize: 11.5,
                              fontWeight: 600,
                            }}
                          >
                            <ShieldCheck size={13} />
                            Password Aktif
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setResetConfirmUser(u)}
                            title="Reset password user ini"
                            style={{
                              padding: "5px 10px",
                              borderRadius: 6,
                              border: "1px solid #E2E8F0",
                              background: "#FFFFFF",
                              color: "#2563EB",
                              fontSize: 12,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              cursor: "pointer",
                            }}
                          >
                            <KeyRound size={13} />
                            Reset Password
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmUser(u)}
                              title="Hapus user"
                              style={{
                                padding: "5px 8px",
                                borderRadius: 6,
                                border: "1px solid #FEE2E2",
                                background: "#FEF2F2",
                                color: "#DC2626",
                                display: "inline-flex",
                                alignItems: "center",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="profile-cancel"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>

      {/* CREATE USER DIALOG */}
      {createUserOpen && (
        <div className="profile-overlay" style={{ zIndex: 1100 }} onClick={() => setCreateUserOpen(false)}>
          <div className="profile-modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Tambah User Baru
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748B" }}>
                  Buat user baru. Password sementara akan digenerate otomatis.
                </p>
              </div>
              <button className="modal-close-button" onClick={() => setCreateUserOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label className="profile-field">
                <span><User size={14} /> Nama Lengkap</span>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Contoh: Yusuf Shodiq"
                  required
                />
              </label>

              <label className="profile-field">
                <span><Mail size={14} /> Email / Username</span>
                <input
                  type="text"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="Contoh: yusuf@hsgq.local atau yusuf"
                  required
                />
              </label>

              <label className="profile-field">
                <span><Shield size={14} /> Role Akses</span>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  style={{
                    height: 38,
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    padding: "0 10px",
                    fontSize: 13,
                    background: "#FFFFFF",
                  }}
                >
                  <option value="Engineer">Engineer (Teknisi / Support)</option>
                  <option value="Administrator">Administrator (Akses Penuh)</option>
                  <option value="Viewer">Viewer (Hanya Lihat Laporan)</option>
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", cursor: "pointer", marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={createForm.mustChangePassword}
                  onChange={(e) => setCreateForm({ ...createForm, mustChangePassword: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "#2563EB" }}
                />
                <span>Wajibkan user mengganti password saat login pertama</span>
              </label>

              {createError && (
                <div className="profile-message error" style={{ margin: 0 }}>
                  {createError}
                </div>
              )}

              <div className="profile-actions" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="profile-cancel"
                  onClick={() => setCreateUserOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="profile-save"
                  disabled={createLoading}
                >
                  {createLoading ? <Loader2 size={15} className="spin" /> : <UserPlus size={15} />}
                  {createLoading ? "Membuat..." : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEMPORARY PASSWORD DISPLAY DIALOG */}
      {tempPassModal && (
        <div className="profile-overlay" style={{ zIndex: 1200 }}>
          <div className="profile-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#DCFCE7", color: "#15803D", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                    {tempPassModal.title}
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748B" }}>
                    User: {tempPassModal.targetUser?.name || tempPassModal.targetUser?.displayName || tempPassModal.targetUser?.email}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, marginBottom: 14 }}>
                {tempPassModal.message}
              </div>

              <div
                style={{
                  background: "#F8FAFC",
                  border: "2px dashed #93C5FD",
                  borderRadius: 10,
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                  Password Sementara:
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#FFFFFF",
                    border: "1px solid #CBD5E1",
                    borderRadius: 6,
                    padding: "8px 12px",
                  }}
                >
                  <code style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", letterSpacing: 1 }}>
                    {tempPassModal.tempPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tempPassModal.tempPassword)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: 4,
                      background: copied ? "#DCFCE7" : "#EFF6FF",
                      color: copied ? "#15803D" : "#2563EB",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 650,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  background: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#92400E",
                  lineHeight: 1.4,
                  marginBottom: 18,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Penting:</strong> Password ini hanya ditampilkan saat ini. Setelah dialog ini ditutup, password tidak dapat dilihat kembali demi keamanan.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setTempPassModal(null)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 6,
                    background: "#2563EB",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Tutup Dialog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION DIALOG */}
      {resetConfirmUser && (
        <div className="profile-overlay" style={{ zIndex: 1100 }} onClick={() => setResetConfirmUser(null)}>
          <div className="profile-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Reset Password User
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                  Anda akan mereset password untuk <strong>{resetConfirmUser.displayName || resetConfirmUser.name || resetConfirmUser.email}</strong>.
                  Sistem akan meng-generate password baru dan mewajibkan user mengganti password saat login berikutnya.
                </p>
              </div>
            </div>

            <div className="profile-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="profile-cancel"
                onClick={() => setResetConfirmUser(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="profile-save"
                style={{ background: "#D97706" }}
                disabled={resetLoading}
                onClick={handleConfirmResetPassword}
              >
                {resetLoading ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />}
                {resetLoading ? "Mereset..." : "Ya, Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmUser && (
        <div className="profile-overlay" style={{ zIndex: 1100 }} onClick={() => setDeleteConfirmUser(null)}>
          <div className="profile-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#FEF2F2", color: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  Hapus User
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                  Apakah Anda yakin ingin menghapus user <strong>{deleteConfirmUser.displayName || deleteConfirmUser.name || deleteConfirmUser.email}</strong>?
                </p>
              </div>
            </div>

            <div className="profile-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="profile-cancel"
                onClick={() => setDeleteConfirmUser(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="profile-save"
                style={{ background: "#DC2626" }}
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
              >
                {deleteLoading ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                {deleteLoading ? "Menghapus..." : "Hapus User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
