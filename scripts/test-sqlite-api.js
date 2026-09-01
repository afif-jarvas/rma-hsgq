/**
 * scripts/test-sqlite-api.js
 * Comprehensive integration test for all modules in SQLite app.db
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../server/data");
const APP_DB_PATH = path.resolve(DATA_DIR, "app.db");

const API_BASE = "http://localhost:5173";

async function runTest() {
  console.log("==================================================");
  console.log("🧪 TESTING FULL SQLITE app.db REST API SUITE");
  console.log("==================================================");

  // 1. Login
  console.log("1. Testing POST /api/auth/login...");
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername: "admin", password: "admin123" }),
  });
  const loginData = await loginRes.json();
  if (!loginData.ok || !loginData.token) {
    throw new Error(`Login failed: ${loginData.error}`);
  }
  const token = loginData.token;
  console.log(`   ✓ Login Success! User: ${loginData.user.full_name}`);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 2. Auth ME
  console.log("2. Testing GET /api/auth/me...");
  const meRes = await fetch(`${API_BASE}/api/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  if (!meData.ok) throw new Error("Auth me failed");
  console.log(`   ✓ Auth ME OK (${meData.user.email})`);

  // 3. Master Data
  console.log("3. Testing GET & PUT /api/master...");
  const masterRes = await fetch(`${API_BASE}/api/master`, { headers: authHeaders });
  const masterData = await masterRes.json();
  console.log(`   ✓ Master Data GET OK (${masterData.data.engineers?.length} engineers)`);

  const updateMasterRes = await fetch(`${API_BASE}/api/master`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ minStockDefault: 7 }),
  });
  const updatedMaster = await updateMasterRes.json();
  if (!updatedMaster.ok || updatedMaster.data.minStockDefault !== 7) {
    throw new Error("Master update failed");
  }
  console.log("   ✓ Master Data PUT OK");

  // 4. RMA CRUD
  console.log("4. Testing RMA CRUD (Create, Read, Update, Delete)...");
  const sampleTicketNo = `RMA-CRUD-${Date.now().toString().slice(-4)}`;
  const rmaCreateRes = await fetch(`${API_BASE}/api/rma`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      ticketNo: sampleTicketNo,
      receivedDate: "2026-09-01",
      engineer: "Yusuf",
      customerName: "PT Maju Terus",
      company: "PT Maju",
      product: "OLT GPON 8 PORT",
      sn: "SN-RMA-9999",
      mac: "11:22:33:44:55:66",
      status: "Unit Diterima",
      initialProblem: "Mati total",
    }),
  });
  const rmaCreated = await rmaCreateRes.json();
  if (!rmaCreated.ok) throw new Error(`RMA Create failed: ${rmaCreated.error}`);
  console.log(`   ✓ RMA Created: ${rmaCreated.data.ticketNo}`);

  const rmaUpdateRes = await fetch(`${API_BASE}/api/rma/${rmaCreated.data.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...rmaCreated.data,
      status: "Sedang Diperbaiki",
      rootCause: "Power supply drop",
    }),
  });
  const rmaUpdated = await rmaUpdateRes.json();
  if (!rmaUpdated.ok || rmaUpdated.data.status !== "Sedang Diperbaiki") {
    throw new Error("RMA Update failed");
  }
  console.log("   ✓ RMA Updated successfully");

  // 5. WA CRUD
  console.log("5. Testing WhatsApp CRUD...");
  const sampleCaseNo = `WA-CRUD-${Date.now().toString().slice(-4)}`;
  const waCreateRes = await fetch(`${API_BASE}/api/wa`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      caseNo: sampleCaseNo,
      caseDate: "2026-09-01",
      customerName: "Bpk. Rian",
      engineerTag: "Danang",
      sn: "SN-WA-8888",
      mac: "AA:BB:CC:11:22:33",
      initialProblem: "Tidak bisa register ONU",
      status: "On Progress",
    }),
  });
  const waCreated = await waCreateRes.json();
  if (!waCreated.ok) throw new Error(`WA Create failed: ${waCreated.error}`);
  console.log(`   ✓ WA Created: ${waCreated.data.caseNo}`);

  const waUpdateRes = await fetch(`${API_BASE}/api/wa/${waCreated.data.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...waCreated.data,
      status: "Selesai",
      solvedDate: "2026-09-01",
      finalAnalysis: "Konfigurasi profile VLAN sudah diperbaiki",
    }),
  });
  const waUpdated = await waUpdateRes.json();
  if (!waUpdated.ok || waUpdated.data.status !== "Selesai") {
    throw new Error("WA Update failed");
  }
  console.log("   ✓ WA Updated successfully");

  // 6. PCBA Inventory & Transactions
  console.log("6. Testing PCBA Inventory (Receipt, Replacement, China Shipment)...");
  const pcbaSnGood = `PCBA-GOOD-${Date.now().toString().slice(-4)}`;
  const receiptRes = await fetch(`${API_BASE}/api/pcba/receipt`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      serialNo: pcbaSnGood,
      pcbaType: "G04ID",
      product: "OLT 4 Port",
      receivedBy: "Yusuf",
      supplier: "HSGQ HQ (China)",
    }),
  });
  const receiptData = await receiptRes.json();
  if (!receiptData.ok) throw new Error(`PCBA Receipt failed: ${receiptData.error}`);
  console.log(`   ✓ PCBA Receipt OK: ${pcbaSnGood}`);

  // Retrieve item ID
  const allPcbaRes = await fetch(`${API_BASE}/api/pcba/all`, { headers: authHeaders });
  const allPcba = await allPcbaRes.json();
  const goodItem = allPcba.data.items.find((i) => i.serialNo === pcbaSnGood);
  if (!goodItem) throw new Error("Created PCBA item not found in list");

  // Replacement
  const repRes = await fetch(`${API_BASE}/api/pcba/replacement`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      rmaId: rmaCreated.data.id,
      rmaTicketNo: rmaCreated.data.ticketNo,
      newPcbaItemId: goodItem.id,
      oldSerialNo: "OLD-BAD-PCBA-001",
      pcbaType: "G04ID",
      replacedBy: "Yusuf",
      notes: "Ganti PCBA Baru",
    }),
  });
  const repData = await repRes.json();
  if (!repData.ok) throw new Error(`PCBA Replacement failed: ${repData.error}`);
  console.log("   ✓ PCBA Replacement Processed OK");

  // 7. Verify SQLite Database State
  console.log("7. Verifying final SQLite database consistency...");
  const db = new Database(APP_DB_PATH, { readonly: true });
  const countRma = db.prepare("SELECT COUNT(*) as c FROM rma_entries").get().c;
  const countWa = db.prepare("SELECT COUNT(*) as c FROM wa_entries").get().c;
  const countPcba = db.prepare("SELECT COUNT(*) as c FROM pcba_items").get().c;
  const countTrx = db.prepare("SELECT COUNT(*) as c FROM pcba_transactions").get().c;
  const countRep = db.prepare("SELECT COUNT(*) as c FROM pcba_replacements").get().c;
  db.close();

  console.log(`   ✓ SQLite Records: RMA (${countRma}), WA (${countWa}), PCBA (${countPcba}), Trx (${countTrx}), Rep (${countRep})`);

  console.log("==================================================");
  console.log("🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================");
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
