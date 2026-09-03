/**
 * src/components/UserManagementTab.jsx
 * User Management Dashboard & Account Administration (Administrator Role Only)
 * Powered by Local SQLite Backend API & 100% Localized
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  UserPlus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import authApi from "../api/authClient.js";
import { ROLES, PERMISSIONS, assertAuthorized } from "../auth/rbac.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const T = {
  void: "var(--bg)",
  panel: "var(--panel)",
  panel2: "var(--panel-2)",
  card: "var(--card-bg, #111a24)",
  line: "var(--line)",
  lineDim: "var(--line-dim, rgba(255,255,255,0.06))",
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  cyan: "var(--accent)",
  cyanDim: "var(--accent-dim)",
  amber: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  blue: "#3b82f6",
};

const sans = "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)";
const mono = "var(--font-mono, monospace)";

function RoleBadge({ role }) {
  const { getRole } = useLanguage();
  const r = (role || "").toLowerCase();
  let bg = `${T.green}20`;
  let color = T.green;
  let Icon = Shield;

  if (r === "administrator" || r === "admin") {
    bg = `${T.red}20`;
    color = T.red;
    Icon = ShieldAlert;
  } else if (r === "engineer" || r === "teknisi") {
    bg = `${T.blue}20`;
    color = T.blue;
    Icon = ShieldCheck;
  }

  const label = getRole(role || "Viewer");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        background: bg,
        color: color,
        border: `1px solid ${color}44`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const { getOption } = useLanguage();
  const isActive = status === "active" || status === "Active" || !status;
  const color = isActive ? T.green : T.red;
  const label = getOption(isActive ? "active" : "inactive");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 999,
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}33`,
        fontSize: 11.5,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

export default function UserManagementTab({ currentUserProfile, setToastMsg }) {
  const { t, getRole, getOption } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null); // { type: "create" | "edit" | "resetPassword" | "toggleStatus" | "delete", user }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers();
      if (res && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error("Gagal memuat daftar user:", err);
      if (setToastMsg) setToastMsg(err.message || t.notFound);
    } finally {
      setLoading(false);
    }
  }, [setToastMsg, t.notFound]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const matchSearch =
        !search ||
        (u.displayName || u.name || u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase());

      const matchRole = !roleFilter || (u.role || "").toLowerCase() === roleFilter.toLowerCase();
      const userStatus = u.status === "inactive" || u.status === "Inactive" ? "inactive" : "active";
      const matchStatus = !statusFilter || userStatus === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* TOOLBAR */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          background: T.panel,
          padding: "12px 16px",
          borderRadius: 10,
          border: `1px solid ${T.line}`,
        }}
      >
        <div style={{ position: "relative", minWidth: 220, flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.ink3 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.userMgmtSearchPlaceholder || t.searchPlaceholder || "Cari data..."}
            style={{
              width: "100%",
              height: 36,
              paddingLeft: 32,
              paddingRight: 10,
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              color: T.ink,
              fontSize: 13,
              fontFamily: sans,
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            height: 36,
            padding: "0 10px",
            background: T.panel2,
            border: `1px solid ${T.line}`,
            borderRadius: 6,
            color: T.ink,
            fontSize: 13,
            fontFamily: sans,
          }}
        >
          <option value="">{t.userMgmtAllRoles || (t.all ? `${t.all} ${t.userMgmtRole || "Role"}` : "Semua Role")}</option>
          <option value="Administrator">{getRole("Administrator")}</option>
          <option value="Engineer">{getRole("Engineer")}</option>
          <option value="Viewer">{getRole("Viewer")}</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            height: 36,
            padding: "0 10px",
            background: T.panel2,
            border: `1px solid ${T.line}`,
            borderRadius: 6,
            color: T.ink,
            fontSize: 13,
            fontFamily: sans,
          }}
        >
          <option value="">{t.userMgmtAllStatus || (t.all ? `${t.all} ${t.userMgmtStatus || "Status"}` : "Semua Status")}</option>
          <option value="active">{getOption("active")}</option>
          <option value="inactive">{getOption("inactive")}</option>
        </select>

        <button
          type="button"
          onClick={loadUsers}
          title={t.refresh || "Refresh"}
          style={{
            height: 36,
            padding: "0 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: T.panel2,
            border: `1px solid ${T.line}`,
            borderRadius: 6,
            color: T.ink,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <RotateCcw size={14} className={loading ? "spin" : ""} />
          <span>{t.refresh || "Refresh"}</span>
        </button>

        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          style={{
            height: 36,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: T.cyan,
            border: "none",
            borderRadius: 6,
            color: "#000",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            marginLeft: "auto",
          }}
        >
          <UserPlus size={15} />
          <span>{t.userMgmtAddUser || "Tambah Pengguna"}</span>
        </button>
      </div>

      {/* USERS TABLE */}
      <div
        style={{
          background: T.panel,
          borderRadius: 10,
          border: `1px solid ${T.line}`,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
            <thead>
              <tr style={{ background: T.panel2, borderBottom: `1px solid ${T.line}`, color: T.ink3, fontSize: 11.5, textTransform: "uppercase" }}>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t.userMgmtFullName || "Nama Lengkap"}</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t.userMgmtEmail || "Email"} / {t.userMgmtUsername || "Username"}</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t.userMgmtRole || "Role"}</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t.userMgmtStatus || "Status"}</th>
                <th style={{ padding: "12px 14px", fontWeight: 700 }}>{t.userMgmtCreated || "Dibuat"}</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, width: 140, minWidth: 140, textAlign: "center" }}>{t.actions || "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: T.ink3 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      <span>{t.loading || "Memuat data..."}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "36px", textAlign: "center", color: T.ink3 }}>
                    {t.notFound || "Data tidak ditemukan."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.status === "active" || u.status === "Active" || !u.status;
                  return (
                    <tr key={u.id || u.uid} style={{ borderBottom: `1px solid ${T.lineDim}`, transition: "background 0.15s ease" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 650, color: T.ink }}>
                        {u.full_name || u.displayName || u.name || "-"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ color: T.ink, fontFamily: mono, fontSize: 12.5 }}>{u.email}</div>
                        {u.username && <div style={{ color: T.ink3, fontSize: 11 }}>@{u.username}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <RoleBadge role={u.role} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <StatusBadge status={u.status} />
                      </td>
                      <td style={{ padding: "12px 14px", color: T.ink3, fontSize: 12 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: "12px 14px", width: 140, minWidth: 140, textAlign: "center" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            title={t.edit || "Edit"}
                            onClick={() => setModal({ type: "edit", user: u })}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              background: T.panel2,
                              border: `1px solid ${T.line}`,
                              color: T.ink,
                              cursor: "pointer",
                            }}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            title={t.userMgmtResetPassword || "Reset Password"}
                            onClick={() => setModal({ type: "resetPassword", user: u })}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              background: T.panel2,
                              border: `1px solid ${T.line}`,
                              color: T.amber,
                              cursor: "pointer",
                            }}
                          >
                            <KeyRound size={14} />
                          </button>

                          <button
                            type="button"
                            title={isActive ? (t.userMgmtInactive || "Nonaktifkan") : (t.userMgmtActive || "Aktifkan")}
                            onClick={() => setModal({ type: "toggleStatus", user: u })}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              background: T.panel2,
                              border: `1px solid ${T.line}`,
                              color: isActive ? T.red : T.green,
                              cursor: "pointer",
                            }}
                          >
                            {isActive ? <X size={14} /> : <Check size={14} />}
                          </button>

                          <button
                            type="button"
                            title={t.delete || "Hapus"}
                            onClick={() => setModal({ type: "delete", user: u })}
                            style={{
                              padding: "6px",
                              borderRadius: 6,
                              background: `${T.red}15`,
                              border: `1px solid ${T.red}33`,
                              color: T.red,
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {modal?.type === "create" && (
        <CreateUserModal
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadUsers();
            if (setToastMsg) setToastMsg(t.toastUserSaved || "Akun pengguna baru berhasil dibuat.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {modal?.type === "edit" && (
        <EditUserModal
          user={modal.user}
          usersList={users}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadUsers();
            if (setToastMsg) setToastMsg(t.toastUserSaved || "Data user berhasil diperbarui.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {modal?.type === "resetPassword" && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadUsers();
            if (setToastMsg) setToastMsg(t.toastPasswordReset || "Password berhasil direset.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {modal?.type === "toggleStatus" && (
        <ToggleStatusModal
          user={modal.user}
          usersList={users}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadUsers();
            if (setToastMsg) setToastMsg(t.toastUserSaved || "Status user berhasil diperbarui.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteUserModal
          user={modal.user}
          usersList={users}
          onClose={() => setModal(null)}
          onSuccess={() => {
            setModal(null);
            loadUsers();
            if (setToastMsg) setToastMsg(t.toastUserDeleted || "User berhasil dihapus.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}
    </div>
  );
}

/* ============================================================
   CREATE USER MODAL
   ============================================================ */
function CreateUserModal({ onClose, onSuccess, currentUserProfile }) {
  const { t, getRole, getOption } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(ROLES.ENGINEER);
  const [status, setStatus] = useState("active");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_CREATE, "membuat user baru");

      if (!name.trim()) return setErr(t.nameRequired || "Nama lengkap wajib diisi.");
      if (!email.trim()) return setErr(t.authRequired || "Email wajib diisi.");
      if (!password) return setErr(t.authRequired || "Password wajib diisi.");
      if (password.length < 6) return setErr(t.passwordTooShort || "Password minimal 6 karakter.");
      if (password !== confirmPassword) return setErr(t.passwordMismatch || "Konfirmasi password tidak cocok.");

      setLoading(true);
      const res = await authApi.createUser({
        full_name: name.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        status,
      });

      setLoading(false);
      if (res && res.ok) {
        onSuccess();
      } else {
        setErr(res?.error || t.profileUpdateFailed || "Gagal membuat user baru.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="profile-modal-header">
          <div>
            <h2>{t.userMgmtAddUser || "Tambah Pengguna"}</h2>
            <p>{t.userMgmtSubtitle || "Kelola akun pengguna dan hak akses"}</p>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {err && (
          <div style={{ padding: "10px 14px", background: `${T.red}18`, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.userMgmtFullName || "Nama Lengkap"}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.yourName || "Nama lengkap..."}
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.userMgmtEmail || "Email"}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@hsgq.local"
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.userMgmtRole || "Role"}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              >
                <option value={ROLES.ADMINISTRATOR}>{getRole("Administrator")}</option>
                <option value={ROLES.ENGINEER}>{getRole("Engineer")}</option>
                <option value={ROLES.VIEWER}>{getRole("Viewer")}</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.userMgmtStatus || "Status"}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              >
                <option value="active">{getOption("active")}</option>
                <option value="inactive">{getOption("inactive")}</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.password || "Password"}
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder || "Min 6 karakter"}
                  style={{ width: "100%", padding: "8px 30px 8px 12px", boxSizing: "border-box", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.ink3, cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.confirmPassword || "Konfirmasi Password"}
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder || "Ulangi password"}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer" }}
            >
              {t.cancel || "Batal"}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: T.cyan, color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {t.userMgmtCreateAccount || t.create || "Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   EDIT USER MODAL
   ============================================================ */
function EditUserModal({ user, onClose, onSuccess, currentUserProfile }) {
  const { t, getRole, getOption } = useLanguage();
  const targetUid = user.id || user.uid;
  const [name, setName] = useState(user.full_name || user.displayName || user.name || "");
  const [role, setRole] = useState(user.role || ROLES.VIEWER);
  const [status, setStatus] = useState(user.status || "active");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_UPDATE, "mengubah data user");

      setLoading(true);
      const res = await authApi.updateUser(targetUid, {
        full_name: name.trim(),
        name: name.trim(),
        role,
        status,
      });

      setLoading(false);
      if (res && res.ok) {
        onSuccess();
      } else {
        setErr(res?.error || t.profileUpdateFailed || "Gagal memperbarui user.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="profile-modal-header">
          <div>
            <h2>{t.userMgmtEditUser || "Edit Pengguna"}</h2>
            <p>{user.email}</p>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {err && (
          <div style={{ padding: "10px 14px", background: `${T.red}18`, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.userMgmtFullName || "Nama Lengkap"}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.userMgmtEmail || "Email"} ({t.readOnly || "Read Only"})
            <input
              type="text"
              value={user.email || "-"}
              disabled
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel2, color: T.ink3 }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.userMgmtRole || "Role"}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              >
                <option value={ROLES.ADMINISTRATOR}>{getRole("Administrator")}</option>
                <option value={ROLES.ENGINEER}>{getRole("Engineer")}</option>
                <option value={ROLES.VIEWER}>{getRole("Viewer")}</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              {t.userMgmtStatus || "Status"}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              >
                <option value="active">{getOption("active")}</option>
                <option value="inactive">{getOption("inactive")}</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer" }}
            >
              {t.cancel || "Batal"}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: T.cyan, color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {t.saveChanges || "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   DELETE USER MODAL
   ============================================================ */
function DeleteUserModal({ user, onClose, onSuccess, currentUserProfile }) {
  const { t } = useLanguage();
  const targetUid = user.id || user.uid;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleDelete = async () => {
    setErr("");
    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_DELETE, "menghapus user");

      setLoading(true);
      const res = await authApi.deleteUser(targetUid);
      setLoading(false);
      if (res && res.ok) {
        onSuccess();
      } else {
        setErr(res?.error || "Gagal menghapus user.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

  const userName = user.full_name || user.displayName || user.name || user.email || "-";
  const deletePrompt = (t.userMgmtConfirmDeleteMsg || "Apakah Anda yakin ingin menghapus akun pengguna {name}? Tindakan ini tidak dapat dibatalkan.").replace("{name}", userName);

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 14,
          boxShadow: "0 20px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: sans,
          position: "relative",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${T.red}18`,
                border: `1px solid ${T.red}33`,
                color: T.red,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Trash2 size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>
                {t.userMgmtConfirmDeleteTitle || "Hapus Akun"}
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.red, fontWeight: 500 }}>
                {t.deleteConfirmMessage || "Tindakan ini tidak dapat dibatalkan"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: T.ink3,
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* PROMPT & USER SUMMARY CARD */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: T.ink2 }}>
            {deletePrompt}
          </div>

          <div
            style={{
              background: T.panel2,
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: T.ink,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: T.ink2,
                  fontFamily: mono,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 2,
                }}
              >
                {user.email || "-"}
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <RoleBadge role={user.role} />
            </div>
          </div>
        </div>

        {/* ERROR MESSAGE */}
        {err && (
          <div
            style={{
              padding: "10px 12px",
              background: `${T.red}18`,
              border: `1px solid ${T.red}33`,
              color: T.red,
              borderRadius: 8,
              fontSize: 12.5,
            }}
          >
            {err}
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 8,
              border: `1px solid ${T.line}`,
              background: "transparent",
              color: T.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.cancel || "Batal"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: T.red,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Trash2 size={14} />
            )}
            {t.delete || "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOGGLE STATUS MODAL (NONAKTIFKAN / AKTIFKAN USER)
   ============================================================ */
function ToggleStatusModal({ user, onClose, onSuccess, currentUserProfile }) {
  const { t, getOption } = useLanguage();
  const targetUid = user.id || user.uid;
  const isCurrentActive = user.status === "active" || user.status === "Active" || !user.status;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleConfirm = async () => {
    setErr("");
    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_TOGGLE_STATUS, "mengubah status user");

      const nextStatus = isCurrentActive ? "inactive" : "active";
      setLoading(true);
      const res = await authApi.toggleStatus(targetUid, nextStatus);
      setLoading(false);

      if (res && res.ok) {
        onSuccess(nextStatus);
      } else {
        setErr(res?.error || "Gagal mengubah status user.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

  const title = isCurrentActive ? (t.userMgmtInactive || "Nonaktifkan Akun") : (t.userMgmtActive || "Aktifkan Akun");
  const userName = user.full_name || user.displayName || user.name || user.email;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="profile-modal-header">
          <div>
            <h2>{title}</h2>
            <p>{user.email}</p>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {err && (
          <div style={{ padding: "10px 14px", background: `${T.red}18`, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, marginBottom: 14 }}>
          {isCurrentActive
            ? (t.userMgmtConfirmDeactivateMsg || "Konfirmasi menonaktifkan akun {name}?").replace("{name}", userName)
            : (t.userMgmtConfirmActivateMsg || "Konfirmasi mengaktifkan kembali akun {name}?").replace("{name}", userName)}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer" }}
          >
            {t.cancel || "Batal"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: isCurrentActive ? T.red : T.green,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {title}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RESET PASSWORD MODAL
   ============================================================ */
function ResetPasswordModal({ user, onClose, onSuccess, currentUserProfile }) {
  const { t } = useLanguage();
  const targetUid = user.id || user.uid;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_RESET_PASSWORD, "mereset password user");

      if (!newPassword) return setErr(t.authRequired || "Password baru wajib diisi.");
      if (newPassword.length < 6) return setErr(t.passwordTooShort || "Password baru minimal 6 karakter.");
      if (newPassword !== confirmPassword) return setErr(t.passwordMismatch || "Konfirmasi password tidak cocok.");

      setLoading(true);
      const res = await authApi.resetPassword(targetUid, newPassword);
      setLoading(false);
      if (res && res.ok) {
        onSuccess();
      } else {
        setErr(res?.error || t.passwordChangeFailed || "Gagal mereset password.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="profile-modal-header">
          <div>
            <h2>{t.userMgmtResetPassword || "Reset Password User"}</h2>
            <p>{user.email || user.username}</p>
          </div>
          <button className="modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {err && (
          <div style={{ padding: "10px 14px", background: `${T.red}18`, border: `1px solid ${T.red}33`, color: T.red, borderRadius: 6, fontSize: 12.5, marginBottom: 12 }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.newPassword || "Password Baru"}
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPasswordPlaceholder || "Minimal 6 karakter"}
                style={{ width: "100%", padding: "8px 30px 8px 12px", boxSizing: "border-box", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.ink3, cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            {t.confirmPassword || "Konfirmasi Password Baru"}
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPasswordPlaceholder || "Ketik ulang password baru"}
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel, color: T.ink }}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer" }}
            >
              {t.cancel || "Batal"}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: T.amber, color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {t.userMgmtResetPassword || "Reset Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
