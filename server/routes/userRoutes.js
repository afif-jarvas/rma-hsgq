import { Router } from "express";
import db, { hashPasswordServer } from "../db.js";
import { requireAuth, requireAdmin, deleteAllUserSessions } from "../auth.js";

const router = Router();

// All user management routes require valid authentication & Administrator role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/users
 * List all users
 */
router.get("/", (req, res) => {
  const usersStmt = db.prepare(`
    SELECT id, full_name, username, email, role, status, phone, company, address, theme, created_at, updated_at, last_login_at, previous_login_at
    FROM users
    ORDER BY created_at DESC
  `);
  const users = usersStmt.all().map((u) => ({
    ...u,
    uid: u.id,
    name: u.full_name,
    displayName: u.full_name,
  }));

  res.json({ ok: true, users });
});

/**
 * POST /api/users
 * Create a new user account (Administrator only)
 */
router.post("/", (req, res) => {
  const { name, full_name, email, username, role, status, password, phone, company, address } = req.body;

  const cleanName = String(full_name || name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanUsername = String(username || cleanEmail.split("@")[0] || "").trim().toLowerCase();
  const cleanRole = String(role || "Viewer").trim();
  const cleanStatus = String(status || "active").trim().toLowerCase();
  const cleanPassword = String(password || "");

  // 1. Validation
  if (!cleanName) {
    return res.status(400).json({ ok: false, error: "Nama lengkap wajib diisi." });
  }
  if (!cleanEmail) {
    return res.status(400).json({ ok: false, error: "Email wajib diisi." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ ok: false, error: "Format email tidak valid." });
  }
  if (!cleanPassword) {
    return res.status(400).json({ ok: false, error: "Password wajib diisi." });
  }
  if (cleanPassword.length < 6) {
    return res.status(400).json({ ok: false, error: "Password minimal 6 karakter." });
  }

  const validRoles = ["Administrator", "Engineer", "Viewer"];
  if (!validRoles.includes(cleanRole)) {
    return res.status(400).json({ ok: false, error: `Role tidak valid. Pilihan: ${validRoles.join(", ")}.` });
  }

  const validStatuses = ["active", "inactive"];
  if (!validStatuses.includes(cleanStatus)) {
    return res.status(400).json({ ok: false, error: "Status tidak valid. Pilihan: active, inactive." });
  }

  // 2. Check for duplicate email or username
  const dupCheck = db.prepare("SELECT id, email, username FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?");
  const existing = dupCheck.get(cleanEmail, cleanUsername);
  if (existing) {
    if (existing.email.toLowerCase() === cleanEmail) {
      return res.status(400).json({ ok: false, error: "Email tersebut sudah terdaftar." });
    }
    return res.status(400).json({ ok: false, error: "Username tersebut sudah terdaftar." });
  }

  // 3. Hash password with secure random salt
  const { hash, salt } = hashPasswordServer(cleanPassword);
  const newId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO users (
      id, full_name, username, email, password_hash, salt, role, status, phone, company, address, theme, created_at, updated_at
    ) VALUES (
      @id, @full_name, @username, @email, @password_hash, @salt, @role, @status, @phone, @company, @address, @theme, @created_at, @updated_at
    )
  `);

  insertStmt.run({
    id: newId,
    full_name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    password_hash: hash,
    salt,
    role: cleanRole,
    status: cleanStatus,
    phone: String(phone || "").trim(),
    company: String(company || "").trim(),
    address: String(address || "").trim(),
    theme: "system",
    created_at: now,
    updated_at: now,
  });

  const newUser = {
    id: newId,
    uid: newId,
    full_name: cleanName,
    name: cleanName,
    displayName: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    status: cleanStatus,
    phone: String(phone || "").trim(),
    company: String(company || "").trim(),
    address: String(address || "").trim(),
    theme: "system",
    created_at: now,
    updated_at: now,
  };

  res.status(201).json({
    ok: true,
    message: "Akun pengguna baru berhasil dibuat.",
    user: newUser,
  });
});

/**
 * GET /api/users/:id
 * Get user detail
 */
router.get("/:id", (req, res) => {
  const userStmt = db.prepare(`
    SELECT id, full_name, username, email, role, status, phone, company, address, theme, created_at, updated_at, last_login_at, previous_login_at
    FROM users WHERE id = ?
  `);
  const user = userStmt.get(req.params.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "User tidak ditemukan." });
  }

  res.json({
    ok: true,
    user: {
      ...user,
      uid: user.id,
      name: user.full_name,
      displayName: user.full_name,
    },
  });
});

/**
 * PUT /api/users/:id
 * Update user information (role, status, full_name, email, etc.)
 */
router.put("/:id", (req, res) => {
  const targetId = req.params.id;
  const { name, full_name, email, username, role, status, phone, company, address } = req.body;

  const userStmt = db.prepare("SELECT * FROM users WHERE id = ?");
  const target = userStmt.get(targetId);
  if (!target) {
    return res.status(404).json({ ok: false, error: "User tidak ditemukan." });
  }

  const cleanName = full_name !== undefined || name !== undefined ? String(full_name || name || "").trim() : target.full_name;
  const cleanEmail = email !== undefined ? String(email || "").trim().toLowerCase() : target.email;
  const cleanUsername = username !== undefined ? String(username || "").trim().toLowerCase() : target.username;
  const cleanRole = role !== undefined ? String(role).trim() : target.role;
  const cleanStatus = status !== undefined ? String(status).trim().toLowerCase() : target.status;

  if (cleanEmail !== target.email) {
    const dupEmail = db.prepare("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?").get(cleanEmail, targetId);
    if (dupEmail) {
      return res.status(400).json({ ok: false, error: "Email tersebut sudah digunakan oleh user lain." });
    }
  }

  // Safety check: Prevent deactivating / demoting the last active Administrator
  if (target.role === "Administrator" && (cleanRole !== "Administrator" || cleanStatus !== "active")) {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator' AND status = 'active' AND id != ?").get(targetId);
    if (adminCount.count === 0) {
      return res.status(400).json({
        ok: false,
        error: "Tidak dapat mengubah role atau menonaktifkan satu-satunya Administrator yang aktif.",
      });
    }
  }

  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE users
    SET full_name = @full_name,
        username = @username,
        email = @email,
        role = @role,
        status = @status,
        phone = @phone,
        company = @company,
        address = @address,
        updated_at = @updated_at
    WHERE id = @id
  `);

  updateStmt.run({
    id: targetId,
    full_name: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    status: cleanStatus,
    phone: phone !== undefined ? String(phone || "").trim() : target.phone,
    company: company !== undefined ? String(company || "").trim() : target.company,
    address: address !== undefined ? String(address || "").trim() : target.address,
    updated_at: now,
  });

  // If user deactivated, drop all their active sessions
  if (cleanStatus === "inactive") {
    deleteAllUserSessions(targetId);
  }

  const updatedUser = {
    ...target,
    id: targetId,
    uid: targetId,
    full_name: cleanName,
    name: cleanName,
    displayName: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role: cleanRole,
    status: cleanStatus,
    updated_at: now,
  };

  res.json({
    ok: true,
    message: "Data user berhasil diperbarui.",
    user: updatedUser,
  });
});

/**
 * DELETE /api/users/:id
 * Delete user account (Administrator only)
 */
router.delete("/:id", (req, res) => {
  const targetId = req.params.id;

  if (targetId === req.user.id) {
    return res.status(400).json({ ok: false, error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." });
  }

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
  if (!target) {
    return res.status(404).json({ ok: false, error: "User tidak ditemukan." });
  }

  // Safety check: Prevent deleting the last Administrator
  if (target.role === "Administrator") {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator' AND id != ?").get(targetId);
    if (adminCount.count === 0) {
      return res.status(400).json({ ok: false, error: "Tidak dapat menghapus satu-satunya akun Administrator." });
    }
  }

  // Delete sessions & user
  deleteAllUserSessions(targetId);
  db.prepare("DELETE FROM users WHERE id = ?").run(targetId);

  res.json({ ok: true, message: "User berhasil dihapus." });
});

/**
 * POST /api/users/:id/reset-password
 * Reset user password (Administrator only)
 */
router.post("/:id/reset-password", (req, res) => {
  const targetId = req.params.id;
  const { newPassword } = req.body;
  const cleanPassword = String(newPassword || "");

  if (!cleanPassword) {
    return res.status(400).json({ ok: false, error: "Password baru wajib diisi." });
  }
  if (cleanPassword.length < 6) {
    return res.status(400).json({ ok: false, error: "Password baru minimal 6 karakter." });
  }

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
  if (!target) {
    return res.status(404).json({ ok: false, error: "User tidak ditemukan." });
  }

  const { hash, salt } = hashPasswordServer(cleanPassword);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET password_hash = ?, salt = ?, updated_at = ?
    WHERE id = ?
  `).run(hash, salt, now, targetId);

  // Invalidate old sessions for that user
  deleteAllUserSessions(targetId);

  res.json({
    ok: true,
    message: `Password untuk user ${target.full_name || target.email} berhasil direset.`,
  });
});

/**
 * PATCH /api/users/:id/status
 * Toggle user active/inactive status
 */
router.patch("/:id/status", (req, res) => {
  const targetId = req.params.id;
  const { status } = req.body;
  const cleanStatus = String(status || "").trim().toLowerCase();

  if (!["active", "inactive"].includes(cleanStatus)) {
    return res.status(400).json({ ok: false, error: "Status harus 'active' atau 'inactive'." });
  }

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
  if (!target) {
    return res.status(404).json({ ok: false, error: "User tidak ditemukan." });
  }

  // Safety check: Prevent deactivating the last Administrator
  if (target.role === "Administrator" && cleanStatus === "inactive") {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrator' AND status = 'active' AND id != ?").get(targetId);
    if (adminCount.count === 0) {
      return res.status(400).json({ ok: false, error: "Tidak dapat menonaktifkan satu-satunya Administrator yang aktif." });
    }
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").run(cleanStatus, now, targetId);

  if (cleanStatus === "inactive") {
    deleteAllUserSessions(targetId);
  }

  res.json({
    ok: true,
    status: cleanStatus,
    message: cleanStatus === "active" ? "User berhasil diaktifkan." : "User berhasil dinonaktifkan.",
  });
});

export default router;
