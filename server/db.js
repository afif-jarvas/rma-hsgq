import Database from "libsql";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "data");
const UPLOADS_DIR = path.resolve(__dirname, "uploads");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const DB_PATH = path.resolve(DATA_DIR, "app.db");
const db = new Database(DB_PATH);

// Enable WAL mode & foreign keys for high performance & integrity
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// Initialize Full SQLite Schema
db.exec(`
  -- 1. USERS
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
    last_login_at TEXT,
    previous_login_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  -- 2. SESSIONS
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

  -- 3. MASTER DATA
  CREATE TABLE IF NOT EXISTS master_data (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- 4. RMA ENTRIES
  CREATE TABLE IF NOT EXISTS rma_entries (
    id TEXT PRIMARY KEY,
    ticket_no TEXT UNIQUE NOT NULL,
    received_date TEXT NOT NULL,
    engineer TEXT NOT NULL,
    customer_name TEXT,
    company TEXT,
    customer_phone TEXT,
    product TEXT,
    product_type TEXT,
    sn TEXT,
    mac TEXT,
    completeness TEXT,
    initial_problem TEXT,
    symptom TEXT,
    checking_result TEXT,
    root_cause TEXT,
    action_taken TEXT,
    status TEXT NOT NULL,
    final_result TEXT,
    waiting_reason TEXT,
    warranty_status TEXT,
    qc_result TEXT,
    qc_by TEXT,
    qc_date TEXT,
    pengiriman TEXT,
    tracking_no TEXT,
    shipped_date TEXT,
    eta TEXT,
    closed_date TEXT,
    customer_received_date TEXT,
    notes TEXT,
    unit_photos_json TEXT DEFAULT '[]',
    label_photos_json TEXT DEFAULT '[]',
    raw_data_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_rma_ticket_no ON rma_entries(ticket_no);
  CREATE INDEX IF NOT EXISTS idx_rma_sn ON rma_entries(sn);
  CREATE INDEX IF NOT EXISTS idx_rma_mac ON rma_entries(mac);
  CREATE INDEX IF NOT EXISTS idx_rma_date ON rma_entries(received_date);
  CREATE INDEX IF NOT EXISTS idx_rma_status ON rma_entries(status);
  CREATE INDEX IF NOT EXISTS idx_rma_engineer ON rma_entries(engineer);

  -- 5. WHATSAPP ENTRIES
  CREATE TABLE IF NOT EXISTS wa_entries (
    id TEXT PRIMARY KEY,
    case_no TEXT UNIQUE NOT NULL,
    case_date TEXT NOT NULL,
    customer_name TEXT,
    company TEXT,
    customer_phone TEXT,
    engineer_tag TEXT,
    device_type TEXT,
    sn TEXT,
    mac TEXT,
    initial_problem TEXT,
    final_analysis TEXT,
    status TEXT NOT NULL,
    solved_date TEXT,
    notes TEXT,
    raw_data_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_wa_case_no ON wa_entries(case_no);
  CREATE INDEX IF NOT EXISTS idx_wa_sn ON wa_entries(sn);
  CREATE INDEX IF NOT EXISTS idx_wa_mac ON wa_entries(mac);
  CREATE INDEX IF NOT EXISTS idx_wa_date ON wa_entries(case_date);
  CREATE INDEX IF NOT EXISTS idx_wa_status ON wa_entries(status);

  -- 6. PCBA ITEMS
  CREATE TABLE IF NOT EXISTS pcba_items (
    id TEXT PRIMARY KEY,
    serial_no TEXT UNIQUE NOT NULL,
    pcba_type TEXT NOT NULL,
    product TEXT,
    supplier TEXT,
    warehouse_location TEXT,
    status TEXT NOT NULL DEFAULT 'Good',
    received_date TEXT,
    received_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pcba_sn ON pcba_items(serial_no);
  CREATE INDEX IF NOT EXISTS idx_pcba_type ON pcba_items(pcba_type);
  CREATE INDEX IF NOT EXISTS idx_pcba_status ON pcba_items(status);

  -- 7. PCBA TRANSACTIONS
  CREATE TABLE IF NOT EXISTS pcba_transactions (
    id TEXT PRIMARY KEY,
    transaction_no TEXT UNIQUE NOT NULL,
    pcba_item_id TEXT NOT NULL,
    type TEXT NOT NULL,
    rma_id TEXT,
    received_date TEXT,
    received_by TEXT,
    performed_by TEXT,
    reason TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (pcba_item_id) REFERENCES pcba_items (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_pcba_trx_item ON pcba_transactions(pcba_item_id);
  CREATE INDEX IF NOT EXISTS idx_pcba_trx_no ON pcba_transactions(transaction_no);

  -- 8. PCBA REPLACEMENTS
  CREATE TABLE IF NOT EXISTS pcba_replacements (
    id TEXT PRIMARY KEY,
    replacement_no TEXT UNIQUE NOT NULL,
    rma_id TEXT,
    old_pcba_item_id TEXT,
    new_pcba_item_id TEXT,
    pcba_type TEXT,
    replaced_by TEXT,
    replaced_at TEXT NOT NULL,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_pcba_rep_no ON pcba_replacements(replacement_no);
  CREATE INDEX IF NOT EXISTS idx_pcba_rep_rma ON pcba_replacements(rma_id);

  -- 9. PCBA CHINA SHIPMENTS
  CREATE TABLE IF NOT EXISTS pcba_china_shipments (
    id TEXT PRIMARY KEY,
    shipment_no TEXT UNIQUE NOT NULL,
    pcba_item_id TEXT,
    serial_number TEXT,
    mac_address TEXT,
    date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_pcba_china_shp_no ON pcba_china_shipments(shipment_no);

  -- 10. PCBA REPAIRS
  CREATE TABLE IF NOT EXISTS pcba_repairs (
    id TEXT PRIMARY KEY,
    repair_no TEXT UNIQUE NOT NULL,
    pcba_item_id TEXT NOT NULL,
    engineer TEXT NOT NULL,
    diagnosis TEXT,
    action_taken TEXT,
    replaced_components TEXT,
    status_before TEXT NOT NULL DEFAULT 'Bad',
    status_after TEXT NOT NULL DEFAULT 'Repaired',
    repaired_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (pcba_item_id) REFERENCES pcba_items (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_repair_pcba_id ON pcba_repairs(pcba_item_id);
  CREATE INDEX IF NOT EXISTS idx_repair_no ON pcba_repairs(repair_no);

  -- 11. RMA PHOTOS METADATA
  CREATE TABLE IF NOT EXISTS rma_photos (
    id TEXT PRIMARY KEY,
    rma_id TEXT NOT NULL,
    ticket_no TEXT NOT NULL,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (rma_id) REFERENCES rma_entries (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_photos_rma_id ON rma_photos(rma_id);
  CREATE INDEX IF NOT EXISTS idx_photos_ticket ON rma_photos(ticket_no);
`);

// Auto-migration for rma_entries new columns if missing
try {
  const rmaCols = db.pragma("table_info(rma_entries)").map((c) => c.name);
  if (!rmaCols.includes("shipped_date")) {
    db.exec("ALTER TABLE rma_entries ADD COLUMN shipped_date TEXT;");
  }
  if (!rmaCols.includes("eta")) {
    db.exec("ALTER TABLE rma_entries ADD COLUMN eta TEXT;");
  }
} catch (e) {
  console.warn("RMA column migration notice:", e.message);
}

// Auto-migration for users previous_login_at column if missing
try {
  const userCols = db.pragma("table_info(users)").map((c) => c.name);
  if (!userCols.includes("previous_login_at")) {
    db.exec("ALTER TABLE users ADD COLUMN previous_login_at TEXT;");
  }
} catch (e) {
  console.warn("User column migration notice:", e.message);
}

/**
 * PBKDF2-HMAC-SHA256 Server-side password hashing (100,000 iterations)
 */
export function hashPasswordServer(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const keylen = 32;
  const digest = "sha256";
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString("hex");
  return { hash, salt };
}

export function verifyPasswordServer(password, storedHash, salt) {
  // Support both new PBKDF2 and legacy SHA-256 fallback for migration safety
  const { hash: pbkdf2Hash } = hashPasswordServer(password, salt);
  if (crypto.timingSafeEqual(Buffer.from(pbkdf2Hash, "hex"), Buffer.from(storedHash, "hex"))) {
    return true;
  }
  // Legacy fallback check
  const legacyHash = crypto.createHash("sha256").update(`${password}:${salt}`).digest("hex");
  if (legacyHash === storedHash) {
    return true;
  }
  return false;
}

const DEFAULT_MASTER = {
  engineers: ["Yusuf", "Danang", "Aris", "Yusuf(Afif)", "Aris(Abdiel)"],
  statusRMA: [
    "Unit Diterima",
    "Sedang Dicek",
    "Menunggu",
    "Sedang Diperbaiki",
    "QC/Testing",
    "Ready to Ship",
    "Shipped",
    "Customer Received",
    "Selesai",
  ],
  statusWA: ["On Progress", "Selesai", "FU Tim China", "Belum Ditag"],
  finalResults: [
    "Normal",
    "Replace",
    "Repair",
    "Service",
    "Return",
  ],
  waitingReasons: [
    "Customer Information",
    "Spare Part",
    "Firmware",
    "HQ / China",
    "Other",
  ],
  warrantyStatuses: ["In Warranty", "Out of Warranty", "Warranty Unknown"],
  qcResults: ["Pending", "Pass", "Fail"],
  pengiriman: ["EXPEDISI", "CJA JAKARTA", "CJA SURABAYA", "Pending Spare"],
  pcbaTypes: ["G02ID", "G04ID", "G08ID", "E04ID", "XE08ID"],
  suppliers: ["HSGQ HQ (China)", "Supplier Lokal"],
  warehouseLocations: ["Gudang Jakarta", "Gudang Surabaya"],
  pcbaReceivedBy: ["Yusuf", "Danang", "Aris", "Yusuf(Afif)", "Aris(Abdiel)"],
  minStockDefault: 5,
};

function autoSeedMasterAndAdmin() {
  // Seed Master Data if not exists
  const masterStmt = db.prepare("SELECT value_json FROM master_data WHERE key = 'app_master_config'");
  const masterRes = masterStmt.get();
  if (!masterRes) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO master_data (key, value_json, updated_at) VALUES (?, ?, ?)").run(
      "app_master_config",
      JSON.stringify(DEFAULT_MASTER),
      now
    );
  }

  // Seed Admin if no users exist
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
  }
}

autoSeedMasterAndAdmin();

export default db;
