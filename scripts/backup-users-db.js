/**
 * scripts/backup-users-db.js
 * Safely backs up server/data/users.db to server/data/backups/users-backup-<timestamp>.db
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.resolve(ROOT_DIR, "server/data");
const BACKUP_DIR = path.resolve(DATA_DIR, "backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const USERS_DB_PATH = path.resolve(DATA_DIR, "users.db");

if (fs.existsSync(USERS_DB_PATH)) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.resolve(BACKUP_DIR, `users-backup-${timestamp}.db`);
  const latestBackupFile = path.resolve(BACKUP_DIR, `users-backup-latest.db`);

  try {
    const db = new Database(USERS_DB_PATH);
    // VACUUM INTO creates a clean, checkpointed backup without wal locks
    db.prepare("VACUUM INTO ?").run(backupFile);
    db.close();

    if (fs.existsSync(latestBackupFile)) {
      fs.unlinkSync(latestBackupFile);
    }
    fs.copyFileSync(backupFile, latestBackupFile);

    console.log("✅ Backup users.db berhasil:");
    console.log(`   📁 ${backupFile}`);
    console.log(`   📁 ${latestBackupFile}`);
  } catch (err) {
    console.error("❌ Gagal backup users.db:", err.message);
  }
} else {
  console.log("⚠ users.db tidak ditemukan.");
}
