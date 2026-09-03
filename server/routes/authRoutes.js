import { Router } from "express";
import db, { hashPasswordServer, verifyPasswordServer } from "../db.js";
import { createSession, deleteSession, requireAuth } from "../auth.js";

const router = Router();

/**
 * POST /api/auth/login
 * User login with email/username and password
 */
router.post("/login", (req, res) => {
  const { email, username, emailOrUsername, password } = req.body;
  const identifier = String(emailOrUsername || email || username || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!identifier || !cleanPassword) {
    return res.status(400).json({ ok: false, error: "Email/Username dan password wajib diisi." });
  }

  const findStmt = db.prepare(`
    SELECT * FROM users
    WHERE LOWER(email) = ? OR LOWER(username) = ?
  `);
  const user = findStmt.get(identifier, identifier);

  if (!user) {
    return res.status(401).json({ ok: false, error: "Email/Username atau password salah." });
  }

  if (user.status === "inactive" || user.status === "Inactive") {
    return res.status(403).json({
      ok: false,
      error: "Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Administrator untuk mengaktifkan kembali.",
    });
  }

  const isValidPassword = verifyPasswordServer(cleanPassword, user.password_hash, user.salt);
  if (!isValidPassword) {
    return res.status(401).json({ ok: false, error: "Email/Username atau password salah." });
  }

  // Generate session token
  const { token, expiresAt } = createSession(user.id);

  // Update last login and previous login
  const previousLogin = user.last_login_at || null;
  const now = new Date().toISOString();
  db.prepare("UPDATE users SET previous_login_at = ?, last_login_at = ? WHERE id = ?").run(previousLogin, now, user.id);

  const profile = {
    id: user.id,
    uid: user.id,
    full_name: user.full_name,
    name: user.full_name,
    displayName: user.full_name,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone || "",
    company: user.company || "",
    address: user.address || "",
    theme: user.theme || "system",
    created_at: user.created_at,
    last_login_at: now,
    previous_login_at: previousLogin,
  };

  res.json({
    ok: true,
    token,
    expiresAt,
    user: profile,
    profile,
  });
});

/**
 * GET /api/auth/me
 * Get currently authenticated user profile
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    profile: req.user,
  });
});

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post("/logout", requireAuth, (req, res) => {
  deleteSession(req.token);
  res.json({ ok: true, message: "Berhasil logout." });
});

/**
 * PATCH /api/auth/preferences
 * Update user preferences such as theme
 */
router.patch("/preferences", requireAuth, (req, res) => {
  const { theme } = req.body;
  const cleanTheme = String(theme || "").trim().toLowerCase();

  const VALID_THEMES = ["light", "dark", "system"];
  if (!VALID_THEMES.includes(cleanTheme)) {
    return res.status(400).json({ ok: false, error: "Theme harus salah satu dari: light, dark, system." });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE users SET theme = ?, updated_at = ? WHERE id = ?").run(cleanTheme, now, req.user.id);

  res.json({
    ok: true,
    theme: cleanTheme,
    message: "Preferensi tema berhasil diperbarui.",
  });
});

/**
 * POST /api/auth/change-password
 * Change password for current logged-in user
 */
router.post("/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const cleanNewPassword = String(newPassword || "");

  if (!cleanNewPassword) {
    return res.status(400).json({ ok: false, error: "Password baru wajib diisi." });
  }
  if (cleanNewPassword.length < 6) {
    return res.status(400).json({ ok: false, error: "Password baru minimal 6 karakter." });
  }

  // If current password provided, verify it first
  if (currentPassword) {
    const userStmt = db.prepare("SELECT password_hash, salt FROM users WHERE id = ?");
    const userRecord = userStmt.get(req.user.id);
    if (userRecord && !verifyPasswordServer(currentPassword, userRecord.password_hash, userRecord.salt)) {
      return res.status(400).json({ ok: false, error: "Password saat ini salah." });
    }
  }

  const { hash, salt } = hashPasswordServer(cleanNewPassword);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET password_hash = ?, salt = ?, updated_at = ?
    WHERE id = ?
  `).run(hash, salt, now, req.user.id);

  res.json({ ok: true, message: "Password akun Anda berhasil diperbarui." });
});

export default router;
