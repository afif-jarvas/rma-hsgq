/**
 * scripts/migrate-firestore-to-sqlite.js
 * Script migrasi total data dari Firestore Backup / Local SQLite ke server/data/app.db
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

const APP_DB_PATH = path.resolve(DATA_DIR, "app.db");
const USERS_DB_PATH = path.resolve(DATA_DIR, "users.db");
const FIRESTORE_BACKUP_PATH = path.resolve(BACKUP_DIR, "firestore-backup-latest.json");

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

export function initAppDatabase(db) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

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
      last_login_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    -- 2. SESSIONS (Invalidated / Clean on cutover)
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
}

async function runMigration() {
  console.log("==================================================");
  console.log("🚀 MEMULAI MIGRASI DATA KE SQLite app.db");
  console.log("==================================================");

  const db = new Database(APP_DB_PATH);
  initAppDatabase(db);

  const stats = {
    users: { source: 0, inserted: 0, failed: 0 },
    rma: { source: 0, inserted: 0, failed: 0 },
    wa: { source: 0, inserted: 0, failed: 0 },
    pcba_items: { source: 0, inserted: 0, failed: 0 },
    pcba_transactions: { source: 0, inserted: 0, failed: 0 },
    pcba_replacements: { source: 0, inserted: 0, failed: 0 },
    pcba_china_shipments: { source: 0, inserted: 0, failed: 0 },
    pcba_repairs: { source: 0, inserted: 0, failed: 0 },
    photos: { source: 0, inserted: 0, failed: 0 },
    master_data: { source: 0, inserted: 0, failed: 0 },
  };

  const migrationTx = db.transaction(() => {
    // 1. Migrate Users from users.db
    if (fs.existsSync(USERS_DB_PATH)) {
      console.log("📦 Memigrasikan data Users dari users.db...");
      const usersDb = new Database(USERS_DB_PATH);
      try {
        const existingUsers = usersDb.prepare("SELECT * FROM users").all();
        stats.users.source = existingUsers.length;

        const insertUser = db.prepare(`
          INSERT OR REPLACE INTO users (
            id, full_name, username, email, password_hash, salt, role, status, phone, company, address, theme, created_at, updated_at, last_login_at
          ) VALUES (
            @id, @full_name, @username, @email, @password_hash, @salt, @role, @status, @phone, @company, @address, @theme, @created_at, @updated_at, @last_login_at
          )
        `);

        for (const u of existingUsers) {
          try {
            insertUser.run(u);
            stats.users.inserted++;
          } catch (e) {
            console.error(`   ❌ Gagal insert user ${u.username}:`, e.message);
            stats.users.failed++;
          }
        }
      } finally {
        usersDb.close();
      }
    }

    // 2. Migrate Firestore Backup Datasets if exists
    let firestoreData = { datasets: {} };
    if (fs.existsSync(FIRESTORE_BACKUP_PATH)) {
      try {
        const raw = fs.readFileSync(FIRESTORE_BACKUP_PATH, "utf8");
        firestoreData = JSON.parse(raw);
      } catch (err) {
        console.warn("⚠ Gagal parse firestore backup JSON:", err.message);
      }
    }

    const datasets = firestoreData.datasets || {};

    // A. RMA Entries
    const rmaList = Array.isArray(datasets.rma_entries_v2) ? datasets.rma_entries_v2 : [];
    stats.rma.source = rmaList.length;
    console.log(`📦 Memigrasikan ${rmaList.length} tiket RMA...`);

    const insertRma = db.prepare(`
      INSERT OR REPLACE INTO rma_entries (
        id, ticket_no, received_date, engineer, customer_name, company, customer_phone,
        product, product_type, sn, mac, completeness, initial_problem, symptom,
        checking_result, root_cause, action_taken, status, final_result, waiting_reason,
        warranty_status, qc_result, qc_by, qc_date, pengiriman, tracking_no,
        closed_date, customer_received_date, notes, unit_photos_json, label_photos_json,
        raw_data_json, created_at, updated_at
      ) VALUES (
        @id, @ticket_no, @received_date, @engineer, @customer_name, @company, @customer_phone,
        @product, @product_type, @sn, @mac, @completeness, @initial_problem, @symptom,
        @checking_result, @root_cause, @action_taken, @status, @final_result, @waiting_reason,
        @warranty_status, @qc_result, @qc_by, @qc_date, @pengiriman, @tracking_no,
        @closed_date, @customer_received_date, @notes, @unit_photos_json, @label_photos_json,
        @raw_data_json, @created_at, @updated_at
      )
    `);

    const insertPhoto = db.prepare(`
      INSERT OR REPLACE INTO rma_photos (
        id, rma_id, ticket_no, category, file_name, file_url, file_size, uploaded_at
      ) VALUES (
        @id, @rma_id, @ticket_no, @category, @file_name, @file_url, @file_size, @uploaded_at
      )
    `);

    for (const r of rmaList) {
      try {
        const unitPhotos = Array.isArray(r.unitPhotos) ? r.unitPhotos : [];
        const labelPhotos = Array.isArray(r.labelPhotos) ? r.labelPhotos : [];

        insertRma.run({
          id: r.id,
          ticket_no: r.ticketNo || `RMA-${r.id}`,
          received_date: r.receivedDate || new Date().toISOString().slice(0, 10),
          engineer: r.engineer || "-",
          customer_name: r.customerName || "",
          company: r.company || "",
          customer_phone: r.customerPhone || "",
          product: r.product || "",
          product_type: r.productType || "",
          sn: r.sn || "",
          mac: r.mac || "",
          completeness: typeof r.completeness === "string" ? r.completeness : JSON.stringify(r.completeness || ""),
          initial_problem: r.initialProblem || "",
          symptom: r.symptom || "",
          checking_result: r.checkingResult || "",
          root_cause: r.rootCause || "",
          action_taken: r.actionTaken || "",
          status: r.status || "Unit Diterima",
          final_result: r.finalResult || "",
          waiting_reason: r.waitingReason || "",
          warranty_status: r.warrantyStatus || "In Warranty",
          qc_result: r.qcResult || "Pending",
          qc_by: r.qcBy || "",
          qc_date: r.qcDate || "",
          pengiriman: r.pengiriman || "",
          tracking_no: r.trackingNo || "",
          closed_date: r.closedDate || "",
          customer_received_date: r.customerReceivedDate || "",
          notes: r.notes || "",
          unit_photos_json: JSON.stringify(unitPhotos),
          label_photos_json: JSON.stringify(labelPhotos),
          raw_data_json: JSON.stringify(r),
          created_at: r.createdAt || new Date().toISOString(),
          updated_at: r.updatedAt || new Date().toISOString(),
        });
        stats.rma.inserted++;

        // Insert indexed photos
        for (const p of unitPhotos) {
          stats.photos.source++;
          if (p.url) {
            insertPhoto.run({
              id: p.id || `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              rma_id: r.id,
              ticket_no: r.ticketNo,
              category: "unit",
              file_name: p.name || "unit_photo.jpg",
              file_url: p.url,
              file_size: p.size || 0,
              uploaded_at: p.uploadedAt || new Date().toISOString(),
            });
            stats.photos.inserted++;
          }
        }
        for (const p of labelPhotos) {
          stats.photos.source++;
          if (p.url) {
            insertPhoto.run({
              id: p.id || `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              rma_id: r.id,
              ticket_no: r.ticketNo,
              category: "label",
              file_name: p.name || "label_photo.jpg",
              file_url: p.url,
              file_size: p.size || 0,
              uploaded_at: p.uploadedAt || new Date().toISOString(),
            });
            stats.photos.inserted++;
          }
        }
      } catch (err) {
        console.error(`   ❌ Gagal insert RMA ${r.ticketNo}:`, err.message);
        stats.rma.failed++;
      }
    }

    // B. WhatsApp Entries
    const waList = Array.isArray(datasets.wa_entries_v2) ? datasets.wa_entries_v2 : [];
    stats.wa.source = waList.length;
    console.log(`📦 Memigrasikan ${waList.length} kasus WhatsApp...`);

    const insertWa = db.prepare(`
      INSERT OR REPLACE INTO wa_entries (
        id, case_no, case_date, customer_name, company, customer_phone,
        engineer_tag, device_type, sn, mac, initial_problem, final_analysis,
        status, solved_date, notes, raw_data_json, created_at, updated_at
      ) VALUES (
        @id, @case_no, @case_date, @customer_name, @company, @customer_phone,
        @engineer_tag, @device_type, @sn, @mac, @initial_problem, @final_analysis,
        @status, @solved_date, @notes, @raw_data_json, @created_at, @updated_at
      )
    `);

    for (const w of waList) {
      try {
        insertWa.run({
          id: w.id,
          case_no: w.caseNo || `WA-${w.id}`,
          case_date: w.caseDate || new Date().toISOString().slice(0, 10),
          customer_name: w.customerName || "",
          company: w.company || "",
          customer_phone: w.customerPhone || "",
          engineer_tag: w.engineerTag || w.engineer || "-",
          device_type: w.deviceType || "",
          sn: w.sn || "",
          mac: w.mac || "",
          initial_problem: w.initialProblem || "",
          final_analysis: w.finalAnalysis || "",
          status: w.status || "On Progress",
          solved_date: w.solvedDate || "",
          notes: w.notes || "",
          raw_data_json: JSON.stringify(w),
          created_at: w.createdAt || new Date().toISOString(),
          updated_at: w.updatedAt || new Date().toISOString(),
        });
        stats.wa.inserted++;
      } catch (err) {
        console.error(`   ❌ Gagal insert WA ${w.caseNo}:`, err.message);
        stats.wa.failed++;
      }
    }

    // C. PCBA Inventory Datasets
    const pcba = datasets.pcba_data_v1 || {};
    const pcbaItems = Array.isArray(pcba.items) ? pcba.items : [];
    const pcbaTrx = Array.isArray(pcba.transactions) ? pcba.transactions : [];
    const pcbaReps = Array.isArray(pcba.replacements) ? pcba.replacements : [];
    const pcbaShp = Array.isArray(pcba.chinaShipments) ? pcba.chinaShipments : [];
    const pcbaRepairs = Array.isArray(pcba.repairs) ? pcba.repairs : [];

    stats.pcba_items.source = pcbaItems.length;
    stats.pcba_transactions.source = pcbaTrx.length;
    stats.pcba_replacements.source = pcbaReps.length;
    stats.pcba_china_shipments.source = pcbaShp.length;
    stats.pcba_repairs.source = pcbaRepairs.length;

    console.log(`📦 Memigrasikan PCBA: ${pcbaItems.length} items, ${pcbaTrx.length} trx, ${pcbaReps.length} replacements, ${pcbaShp.length} shipments...`);

    const insertPcbaItem = db.prepare(`
      INSERT OR REPLACE INTO pcba_items (
        id, serial_no, pcba_type, product, supplier, warehouse_location, status, received_date, received_by, notes, created_at, updated_at
      ) VALUES (
        @id, @serial_no, @pcba_type, @product, @supplier, @warehouse_location, @status, @received_date, @received_by, @notes, @created_at, @updated_at
      )
    `);

    for (const item of pcbaItems) {
      try {
        insertPcbaItem.run({
          id: item.id,
          serial_no: item.serialNo || `SN-${item.id}`,
          pcba_type: item.pcbaType || "G04ID",
          product: item.product || "",
          supplier: item.supplier || "HSGQ HQ (China)",
          warehouse_location: item.warehouseLocation || "Gudang Jakarta",
          status: item.status || "Good",
          received_date: item.receivedDate || new Date().toISOString().slice(0, 10),
          received_by: item.receivedBy || "-",
          notes: item.notes || "",
          created_at: item.createdAt || new Date().toISOString(),
          updated_at: item.updatedAt || new Date().toISOString(),
        });
        stats.pcba_items.inserted++;
      } catch (err) {
        console.error(`   ❌ Gagal insert PCBA item ${item.serialNo}:`, err.message);
        stats.pcba_items.failed++;
      }
    }

    const insertPcbaTrx = db.prepare(`
      INSERT OR REPLACE INTO pcba_transactions (
        id, transaction_no, pcba_item_id, type, rma_id, received_date, received_by, performed_by, reason, created_at
      ) VALUES (
        @id, @transaction_no, @pcba_item_id, @type, @rma_id, @received_date, @received_by, @performed_by, @reason, @created_at
      )
    `);

    for (const tx of pcbaTrx) {
      try {
        insertPcbaTrx.run({
          id: tx.id,
          transaction_no: tx.transactionNo || `TRX-${tx.id}`,
          pcba_item_id: tx.pcbaItemId,
          type: tx.type || "Goods Receipt",
          rma_id: tx.rmaId || null,
          received_date: tx.receivedDate || new Date().toISOString().slice(0, 10),
          received_by: tx.receivedBy || "-",
          performed_by: tx.performedBy || tx.receivedBy || "-",
          reason: tx.reason || "",
          created_at: tx.createdAt || new Date().toISOString(),
        });
        stats.pcba_transactions.inserted++;
      } catch (err) {
        console.error(`   ❌ Gagal insert PCBA trx ${tx.transactionNo}:`, err.message);
        stats.pcba_transactions.failed++;
      }
    }

    const insertPcbaRep = db.prepare(`
      INSERT OR REPLACE INTO pcba_replacements (
        id, replacement_no, rma_id, old_pcba_item_id, new_pcba_item_id, pcba_type, replaced_by, replaced_at, notes
      ) VALUES (
        @id, @replacement_no, @rma_id, @old_pcba_item_id, @new_pcba_item_id, @pcba_type, @replaced_by, @replaced_at, @notes
      )
    `);

    for (const rep of pcbaReps) {
      try {
        insertPcbaRep.run({
          id: rep.id,
          replacement_no: rep.replacementNo || `REP-${rep.id}`,
          rma_id: rep.rmaId || null,
          old_pcba_item_id: rep.oldPcbaItemId || null,
          new_pcba_item_id: rep.newPcbaItemId || null,
          pcba_type: rep.pcbaType || "",
          replaced_by: rep.replacedBy || "-",
          replaced_at: rep.replacedAt || new Date().toISOString(),
          notes: rep.notes || "",
        });
        stats.pcba_replacements.inserted++;
      } catch (err) {
        console.error(`   ❌ Gagal insert PCBA replacement ${rep.replacementNo}:`, err.message);
        stats.pcba_replacements.failed++;
      }
    }

    const insertPcbaShp = db.prepare(`
      INSERT OR REPLACE INTO pcba_china_shipments (
        id, shipment_no, pcba_item_id, serial_number, mac_address, date, notes, created_at
      ) VALUES (
        @id, @shipment_no, @pcba_item_id, @serial_number, @mac_address, @date, @notes, @created_at
      )
    `);

    for (const shp of pcbaShp) {
      try {
        insertPcbaShp.run({
          id: shp.id,
          shipment_no: shp.shipmentNo || `SHP-${shp.id}`,
          pcba_item_id: shp.pcbaItemId || null,
          serial_number: shp.serialNumber || shp.serialNo || "",
          mac_address: shp.macAddress || shp.mac || "",
          date: shp.date || new Date().toISOString().slice(0, 10),
          notes: shp.notes || "",
          created_at: shp.createdAt || new Date().toISOString(),
        });
        stats.pcba_china_shipments.inserted++;
      } catch (err) {
        console.error(`   ❌ Gagal insert China shipment ${shp.shipmentNo}:`, err.message);
        stats.pcba_china_shipments.failed++;
      }
    }

    // D. Master Data
    const masterObj = { ...DEFAULT_MASTER, ...(datasets.hsgq_master_data_v2 || {}) };
    const insertMaster = db.prepare(`
      INSERT OR REPLACE INTO master_data (key, value_json, updated_at)
      VALUES (?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertMaster.run("app_master_config", JSON.stringify(masterObj), now);
    stats.master_data.inserted = 1;
    stats.master_data.source = 1;
  });

  migrationTx();
  db.close();

  console.log("==================================================");
  console.log("📊 RINGKASAN HASIL MIGRASI KE app.db:");
  console.log("==================================================");
  Object.entries(stats).forEach(([mod, s]) => {
    console.log(`- ${mod.padEnd(22)}: Sumber: ${s.source.toString().padStart(4)} | Berhasil: ${s.inserted.toString().padStart(4)} | Gagal: ${s.failed}`);
  });
  console.log("==================================================");
  console.log(`✅ MIGRASI SELESAI: ${APP_DB_PATH}`);
  console.log("==================================================");

  return stats;
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal migration error:", err);
    process.exit(1);
  });
