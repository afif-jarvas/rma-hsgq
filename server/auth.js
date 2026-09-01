import crypto from "crypto";
import db from "./db.js";

/**
 * Generate a cryptographically secure random session token
 */
export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a session for a user (valid for 7 days)
 */
export function createSession(userId) {
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  insertStmt.run(token, userId, now.toISOString(), expiresAt);

  return { token, expiresAt };
}

/**
 * Delete a session
 */
export function deleteSession(token) {
  if (!token) return;
  const deleteStmt = db.prepare("DELETE FROM sessions WHERE token = ?");
  deleteStmt.run(token);
}

/**
 * Delete all sessions for a user (used upon password reset / deactivation)
 */
export function deleteAllUserSessions(userId) {
  if (!userId) return;
  const deleteStmt = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  deleteStmt.run(userId);
}

/**
 * Express Middleware: Require Authentication
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: "401 Unauthorized: Sesi tidak ditemukan. Silakan login." });
  }

  const sessionStmt = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.full_name, u.username, u.email, u.role, u.status, u.phone, u.company, u.address, u.theme
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `);
  const session = sessionStmt.get(token);

  if (!session) {
    return res.status(401).json({ ok: false, error: "401 Unauthorized: Sesi tidak valid atau telah berakhir." });
  }

  if (new Date(session.expires_at) < new Date()) {
    deleteSession(token);
    return res.status(401).json({ ok: false, error: "401 Unauthorized: Sesi telah kedaluwarsa. Silakan login kembali." });
  }

  if (session.status === "inactive" || session.status === "Inactive") {
    deleteSession(token);
    return res.status(403).json({ ok: false, error: "403 Forbidden: Akun Anda dinonaktifkan oleh Administrator." });
  }

  req.user = {
    id: session.id,
    uid: session.id,
    full_name: session.full_name,
    name: session.full_name,
    displayName: session.full_name,
    username: session.username,
    email: session.email,
    role: session.role,
    status: session.status,
    phone: session.phone || "",
    company: session.company || "",
    address: session.address || "",
    theme: session.theme || "system",
  };
  req.token = token;

  next();
}

/**
 * Express Middleware: Require Administrator Role
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "Administrator") {
    return res.status(403).json({
      ok: false,
      error: `403 Forbidden: Anda (${req.user?.role || "Viewer"}) tidak memiliki izin Administrator.`,
    });
  }
  next();
}
