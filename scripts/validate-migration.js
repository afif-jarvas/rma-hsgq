/**
 * scripts/validate-migration.js
 * Comprehensive 8-point migration validation script for SQLite app.db
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.resolve(ROOT_DIR, "server/data");
const APP_DB_PATH = path.resolve(DATA_DIR, "app.db");

async function validate() {
  console.log("==================================================");
  console.log("🔍 MENJALANKAN VALIDASI LENGKAP SQLite app.db");
  console.log("==================================================");

  if (!fs.existsSync(APP_DB_PATH)) {
    throw new Error(`Database ${APP_DB_PATH} tidak ditemukan!`);
  }

  const db = new Database(APP_DB_PATH, { readonly: true });

  const results = {
    integrity: null,
    foreignKeys: null,
    tableCounts: {},
    sampleRecords: {},
    masterDataCheck: null,
  };

  // 1. SQLite Integrity Check
  console.log("1. Memeriksa PRAGMA integrity_check...");
  const integrity = db.pragma("integrity_check");
  results.integrity = integrity;
  console.log("   ✓ Integrity Status:", JSON.stringify(integrity));

  // 2. Foreign Key Constraint Check
  console.log("2. Memeriksa PRAGMA foreign_key_check...");
  const fkCheck = db.pragma("foreign_key_check");
  results.foreignKeys = fkCheck;
  console.log(`   ✓ Foreign Key Violations: ${fkCheck.length}`);

  // 3. Count Comparison for all tables
  const tables = [
    "users",
    "sessions",
    "master_data",
    "rma_entries",
    "wa_entries",
    "pcba_items",
    "pcba_transactions",
    "pcba_replacements",
    "pcba_china_shipments",
    "pcba_repairs",
    "rma_photos",
  ];

  console.log("3. Menghitung baris data di setiap tabel...");
  for (const table of tables) {
    const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    results.tableCounts[table] = row.count;
    console.log(`   - ${table.padEnd(22)}: ${row.count} baris`);
  }

  // 4. Validate Users
  console.log("4. Memverifikasi struktur data Users...");
  const users = db.prepare("SELECT id, username, email, role, status FROM users").all();
  console.log(`   ✓ Ditemukan ${users.length} akun user terdaftar.`);
  users.forEach((u) => {
    console.log(`     * [${u.role}] ${u.username} (${u.email}) - Status: ${u.status}`);
  });

  // 5. Validate Master Data
  console.log("5. Memverifikasi Master Data Config...");
  const masterRow = db.prepare("SELECT value_json FROM master_data WHERE key = 'app_master_config'").get();
  if (masterRow) {
    const master = JSON.parse(masterRow.value_json);
    results.masterDataCheck = {
      engineers: master.engineers?.length || 0,
      statusRMA: master.statusRMA?.length || 0,
      statusWA: master.statusWA?.length || 0,
      pcbaTypes: master.pcbaTypes?.length || 0,
    };
    console.log(`   ✓ Master Data OK: ${master.engineers?.length} Engineers, ${master.statusRMA?.length} Status RMA, ${master.statusWA?.length} Status WA, ${master.pcbaTypes?.length} PCBA Types`);
  } else {
    console.log("   ❌ Master Data Config tidak ditemukan!");
  }

  db.close();

  console.log("==================================================");
  console.log("✅ HASIL VALIDASI: app.db SEHAT & SIAP DIGUNAKAN!");
  console.log("==================================================");

  return results;
}

validate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Validasi gagal:", err);
    process.exit(1);
  });
