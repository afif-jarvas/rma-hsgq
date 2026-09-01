import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve(process.cwd(), "server/data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "users.db");
const db = new Database(DB_PATH);

// Enable WAL mode for high performance concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Viewer',
    status TEXT NOT NULL DEFAULT 'active',
    phone TEXT DEFAULT '',
    company TEXT DEFAULT '',
    address TEXT DEFAULT '',
    theme TEXT DEFAULT 'system',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`);

/**
 * Server-side secure password hash
 */
export function hashPasswordServer(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(`${password}:${salt}`).digest("hex");
  return { hash, salt };
}

export function verifyPasswordServer(password, storedHash, salt) {
  const { hash } = hashPasswordServer(password, salt);
  return hash === storedHash;
}

/**
 * Auto-seed initial default Administrator if no users exist
 */
function autoSeedAdmin() {
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM users");
  const result = countStmt.get();
  if (result.count === 0) {
    const adminId = `usr_admin_${Date.now()}`;
    const { hash, salt } = hashPasswordServer("admin123");
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (
        id, full_name, username, email, password_hash, salt, role, status, phone, company, address, theme, created_at, updated_at
      ) VALUES (
        @id, @full_name, @username, @email, @password_hash, @salt, @role, @status, @phone, @company, @address, @theme, @created_at, @updated_at
      )
    `);

    insertStmt.run({
      id: adminId,
      full_name: "Administrator HSGQ",
      username: "admin",
      email: "admin@hsgq.local",
      password_hash: hash,
      salt,
      role: "Administrator",
      status: "active",
      phone: "08123456789",
      company: "HSGQ Indonesia",
      address: "Jakarta",
      theme: "system",
      created_at: now,
      updated_at: now,
    });

    console.log("==> Initial default Administrator created: admin@hsgq.local / admin (Password: admin123)");
  }
}

autoSeedAdmin();

export default db;
