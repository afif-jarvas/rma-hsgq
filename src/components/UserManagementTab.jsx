/**
 * src/components/UserManagementTab.jsx
 * User Management Dashboard & Account Administration (Administrator Role Only)
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Loader2,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  getUsersList,
  adminCreateAccount,
  adminUpdateAccount,
  adminDeleteAccount,
} from "../firebase.js";
import { ROLES, USER_STATUS, PERMISSIONS, assertAuthorized } from "../auth/rbac.js";

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
  const r = (role || "").toLowerCase();
  let bg = `${T.green}20`;
  let color = T.green;
  let label = "VIEWER";
  let Icon = Shield;

  if (r === "administrator" || r === "admin") {
    bg = `${T.red}20`;
    color = T.red;
    label = "ADMINISTRATOR";
    Icon = ShieldAlert;
  } else if (r === "engineer" || r === "teknisi") {
    bg = `${T.blue}20`;
    color = T.blue;
    label = "ENGINEER";
    Icon = ShieldCheck;
  }

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
  const isActive = status === "active" || status === "Active" || !status;
  const color = isActive ? T.green : T.red;

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
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function isLastActiveAdmin(userList, targetUid) {
  const activeAdmins = (userList || []).filter(
    (u) =>
      (u.role === "Administrator" || u.role === "administrator") &&
      (u.status === "active" || u.status === "Active" || !u.status)
  );
  return activeAdmins.length <= 1 && activeAdmins.some((u) => u.uid === targetUid || u.id === targetUid);
}

export default function UserManagementTab({ currentUserProfile, t, setToastMsg }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null); // { type: "create" | "edit" | "resetPassword" | "delete", user }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getUsersList();
      setUsers(list);
    } catch (err) {
      console.error("Gagal memuat daftar user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const matchSearch =
        !search ||
        (u.displayName || u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase());

      const matchRole = !roleFilter || (u.role || "").toLowerCase() === roleFilter.toLowerCase();
      const userStatus = u.status === "inactive" || u.status === "Inactive" ? "inactive" : "active";
      const matchStatus = !statusFilter || userStatus === statusFilter.toLowerCase();

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleToggleStatus = async (targetUser) => {
    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_TOGGLE_STATUS, "mengubah status user");

      const isCurrentActive = targetUser.status === "active" || targetUser.status === "Active" || !targetUser.status;
      const targetUid = targetUser.uid || targetUser.id;

      // Self-Role & Last-Admin Protection
      if (isCurrentActive && isLastActiveAdmin(users, targetUid)) {
        alert("Aksi ditolak: Sistem harus memiliki minimal satu Administrator yang aktif.");
        return;
      }

      const nextStatus = isCurrentActive ? "inactive" : "active";
      const res = await adminUpdateAccount(targetUid, { status: nextStatus });
      if (res.ok) {
        if (setToastMsg) setToastMsg(`Status user ${targetUser.displayName || targetUser.email} diubah menjadi ${nextStatus}.`);
        loadUsers();
      } else {
        alert(res.error || "Gagal mengubah status user.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
            placeholder="Cari nama, username, email..."
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
          <option value="">Semua Role</option>
          <option value="Administrator">Administrator</option>
          <option value="Engineer">Engineer</option>
          <option value="Viewer">Viewer</option>
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
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {(search || roleFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setRoleFilter("");
              setStatusFilter("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              height: 36,
              padding: "0 10px",
              background: "transparent",
              border: `1px solid ${T.line}`,
              borderRadius: 6,
              color: T.ink2,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} /> Reset Filter
          </button>
        )}

        <div style={{ marginLeft: "auto" }}>
          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 36,
              padding: "0 14px",
              background: T.cyan,
              color: "#000",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            <UserPlus size={15} /> Tambah User Baru
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div
        style={{
          background: T.panel,
          border: `1px solid ${T.line}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.panel2, borderBottom: `1px solid ${T.line}` }}>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2, width: 50, textAlign: "center" }}>No.</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2 }}>Nama Pengguna</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2 }}>Email / Username</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2 }}>Role</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2 }}>Status</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2 }}>Terdaftar</th>
                <th style={{ padding: "12px 14px", fontWeight: 700, color: T.ink2, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: T.ink3 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Memuat data user...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: T.ink3 }}>
                    Tidak ada akun pengguna yang memenuhi filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const uid = u.uid || u.id;
                  const isActive = u.status === "active" || u.status === "Active" || !u.status;
                  const isCurrent = currentUserProfile?.uid === uid || currentUserProfile?.id === uid;

                  return (
                    <tr
                      key={uid}
                      style={{
                        borderBottom: `1px solid ${T.lineDim}`,
                        background: isCurrent ? `${T.cyan}08` : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 14px",
                          textAlign: "center",
                          color: T.ink3,
                          fontFamily: mono,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: T.ink, display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{u.displayName || u.name || "-"}</span>
                            {isCurrent && (
                              <span style={{ fontSize: 10, background: T.cyan, color: "#000", padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>
                                YOU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: T.ink3 }}>{u.company || u.phone || "HSGQ Team"}</div>
                        </div>
                      </td>

                      <td style={{ padding: "12px 14px", fontFamily: mono, color: T.ink2 }}>
                        {u.email || "-"}
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <RoleBadge role={u.role} />
                      </td>

                      <td style={{ padding: "12px 14px" }}>
                        <StatusBadge status={u.status} />
                      </td>

                      <td style={{ padding: "12px 14px", color: T.ink3, fontSize: 12 }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID") : "-"}
                      </td>

                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            title="Edit User"
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
                            title={isActive ? "Nonaktifkan User" : "Aktifkan User"}
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
                            title="Hapus User"
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
            if (setToastMsg) setToastMsg("Akun pengguna baru berhasil dibuat.");
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
            if (setToastMsg) setToastMsg("Data user berhasil diperbarui.");
          }}
          currentUserProfile={currentUserProfile}
        />
      )}

      {modal?.type === "toggleStatus" && (
        <ToggleStatusModal
          user={modal.user}
          usersList={users}
          onClose={() => setModal(null)}
          onSuccess={(newStatus) => {
            setModal(null);
            loadUsers();
            if (setToastMsg) {
              setToastMsg(
                newStatus === "active"
                  ? `User ${modal.user.displayName || modal.user.email} berhasil diaktifkan.`
                  : `User ${modal.user.displayName || modal.user.email} berhasil dinonaktifkan.`
              );
            }
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
            if (setToastMsg) setToastMsg("User berhasil dihapus.");
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

      if (!name.trim()) return setErr("Nama lengkap wajib diisi.");
      if (!email.trim()) return setErr("Email wajib diisi.");
      if (!password) return setErr("Password wajib diisi.");
      if (password.length < 6) return setErr("Password minimal 6 karakter.");
      if (password !== confirmPassword) return setErr("Konfirmasi password tidak cocok.");

      setLoading(true);
      const res = await adminCreateAccount({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        status,
      });

      setLoading(false);
      if (res.ok) {
        onSuccess();
      } else {
        setErr(res.error || "Gagal membuat user baru.");
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
            <h2>Tambah Akun Pengguna</h2>
            <p>Buat akun baru untuk Administrator, Engineer, atau Viewer</p>
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
            Nama Lengkap
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@hsgq.com"
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
              >
                <option value={ROLES.ADMINISTRATOR}>Administrator (Full Access)</option>
                <option value={ROLES.ENGINEER}>Engineer (Operational CRUD)</option>
                <option value={ROLES.VIEWER}>Viewer (Read Only)</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              Password
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 karakter"
                  style={{ width: "100%", padding: "8px 30px 8px 12px", boxSizing: "border-box", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
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
              Konfirmasi Password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
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
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: T.cyan, color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Buat Akun
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
function EditUserModal({ user, usersList, onClose, onSuccess, currentUserProfile }) {
  const targetUid = user.uid || user.id;
  const [name, setName] = useState(user.displayName || user.name || "");
  const [role, setRole] = useState(user.role || ROLES.VIEWER);
  const [status, setStatus] = useState(user.status || "active");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_UPDATE, "mengubah data user");

      // Last-Admin Protection
      const isDemotingAdmin =
        (user.role === "Administrator" || user.role === "administrator") &&
        role !== "Administrator" &&
        role !== "administrator";
      const isDeactivatingAdmin =
        (user.role === "Administrator" || user.role === "administrator") &&
        status !== "active" &&
        status !== "Active";

      if ((isDemotingAdmin || isDeactivatingAdmin) && isLastActiveAdmin(usersList, targetUid)) {
        return setErr("Aksi ditolak: Sistem harus memiliki minimal satu Administrator yang aktif.");
      }

      setLoading(true);
      const res = await adminUpdateAccount(targetUid, {
        displayName: name.trim(),
        name: name.trim(),
        role,
        status,
      });

      setLoading(false);
      if (res.ok) {
        onSuccess();
      } else {
        setErr(res.error || "Gagal memperbarui user.");
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
            <h2>Edit Akun Pengguna</h2>
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
            Nama Lengkap
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
            Email (Read Only)
            <input
              type="text"
              value={user.email || "-"}
              disabled
              style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel2, color: T.ink3 }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
              >
                <option value={ROLES.ADMINISTRATOR}>Administrator</option>
                <option value={ROLES.ENGINEER}>Engineer</option>
                <option value={ROLES.VIEWER}>Viewer</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600 }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.line}`, background: T.panel }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 6, border: "none", background: T.cyan, color: "#000", fontWeight: 700, cursor: "pointer" }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Simpan Perubahan
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
function DeleteUserModal({ user, usersList, onClose, onSuccess, currentUserProfile }) {
  const targetUid = user.uid || user.id;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const isBlockedLastAdmin =
    (user.role === "Administrator" || user.role === "administrator") &&
    isLastActiveAdmin(usersList, targetUid);

  const handleDelete = async () => {
    setErr("");
    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_DELETE, "menghapus user");

      if (isBlockedLastAdmin) {
        return setErr("Aksi ditolak: Tidak dapat menghapus satu-satunya Administrator yang aktif.");
      }

      setLoading(true);
      const res = await adminDeleteAccount(targetUid);
      setLoading(false);
      if (res.ok) {
        onSuccess();
      } else {
        setErr("Gagal menghapus user.");
      }
    } catch (error) {
      setLoading(false);
      setErr(error.message);
    }
  };

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
                Hapus Akun
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: T.red, fontWeight: 500 }}>
                Tindakan ini tidak dapat dibatalkan
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
            Apakah Anda yakin ingin menghapus akun ini?
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
                {user.displayName || user.name || "-"}
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

        {/* LAST ADMIN BLOCKING NOTICE */}
        {isBlockedLastAdmin && (
          <div
            style={{
              display: "flex",
              gap: 10,
              padding: 12,
              background: `${T.amber}18`,
              border: `1px solid ${T.amber}33`,
              borderRadius: 8,
              color: T.amber,
              fontSize: 12.5,
              lineHeight: 1.4,
            }}
          >
            <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Perlindungan Administrator Terakhir:</strong> Akun ini adalah satu-satunya Administrator aktif dalam sistem dan tidak boleh dihapus.
            </div>
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
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading || isBlockedLastAdmin}
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
              cursor: isBlockedLastAdmin ? "not-allowed" : "pointer",
              opacity: isBlockedLastAdmin ? 0.5 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Trash2 size={14} />
            )}
            Hapus Akun
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TOGGLE STATUS MODAL (NONAKTIFKAN / AKTIFKAN USER)
   ============================================================ */
function ToggleStatusModal({ user, usersList, onClose, onSuccess, currentUserProfile }) {
  const targetUid = user.uid || user.id;
  const isCurrentActive = user.status === "active" || user.status === "Active" || !user.status;
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const isBlockedLastAdmin =
    isCurrentActive &&
    (user.role === "Administrator" || user.role === "administrator") &&
    isLastActiveAdmin(usersList, targetUid);

  const handleConfirm = async () => {
    setErr("");
    try {
      assertAuthorized(currentUserProfile, PERMISSIONS.USER_TOGGLE_STATUS, "mengubah status user");

      if (isBlockedLastAdmin) {
        return setErr("Aksi ditolak: Sistem harus memiliki minimal satu Administrator yang aktif.");
      }

      setLoading(true);
      const nextStatus = isCurrentActive ? "inactive" : "active";
      const res = await adminUpdateAccount(targetUid, { status: nextStatus });
      setLoading(false);

      if (res.ok) {
        onSuccess(nextStatus);
      } else {
        setErr(res.error || "Gagal mengubah status user.");
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
            <h2 style={{ color: isCurrentActive ? T.red : T.green }}>
              {isCurrentActive ? "Nonaktifkan User?" : "Aktifkan User?"}
            </h2>
            <p>
              {isCurrentActive
                ? "Akun yang dinonaktifkan tidak dapat login ke sistem"
                : "Akun yang diaktifkan akan dapat login kembali"}
            </p>
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

        {isBlockedLastAdmin ? (
          <div style={{ display: "flex", gap: 10, padding: 12, background: `${T.amber}18`, border: `1px solid ${T.amber}33`, borderRadius: 6, color: T.amber, fontSize: 13, marginBottom: 14 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Perlindungan Administrator Terakhir:</strong> Akun ini adalah satu-satunya Administrator aktif dalam sistem dan tidak boleh dinonaktifkan.
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: T.ink, marginBottom: 14, lineHeight: 1.5 }}>
            {isCurrentActive ? (
              <>
                Apakah Anda yakin ingin menonaktifkan user <strong>{user.displayName || user.name || user.email}</strong>? User tidak akan dapat masuk ke sistem hingga diaktifkan kembali.
              </>
            ) : (
              <>
                Apakah Anda yakin ingin mengaktifkan user <strong>{user.displayName || user.name || user.email}</strong>? User akan dapat kembali masuk dan menggunakan sistem.
              </>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${T.line}`, background: "transparent", color: T.ink, cursor: "pointer" }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isBlockedLastAdmin}
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
              cursor: isBlockedLastAdmin ? "not-allowed" : "pointer",
              opacity: isBlockedLastAdmin ? 0.5 : 1,
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {isCurrentActive ? "Nonaktifkan User" : "Aktifkan User"}
          </button>
        </div>
      </div>
    </div>
  );
}
