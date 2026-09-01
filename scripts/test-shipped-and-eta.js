/**
 * scripts/test-shipped-and-eta.js
 * Verification of persistent Tgl Dikirim (shipped_date) and deterministic ETA
 */

import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../server/data");
const APP_DB_PATH = path.resolve(DATA_DIR, "app.db");

const API_BASE = "http://localhost:5173";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 TESTING RMA LOG BOOK: SHIPPED DATE & ETA");
  console.log("==================================================");

  // 1. Authenticate
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
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // ---------------------------------------------------------------
  // TEST 1: CREATE RMA with Received: 2026-09-01, Shipped: 2026-09-03
  // ---------------------------------------------------------------
  console.log("\n[TEST 1] Create RMA with Received: 2026-09-01, Shipped: 2026-09-03");
  const ticketNo1 = `RMA-TEST-${Date.now().toString().slice(-4)}`;
  const createRes = await fetch(`${API_BASE}/api/rma`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      ticketNo: ticketNo1,
      receivedDate: "2026-09-01",
      shippedDate: "2026-09-03",
      engineer: "Yusuf",
      customerName: "PT Sentral Solusi",
      product: "OLT GPON 8 PORT",
      sn: "SN-TEST-8888",
      mac: "AA:BB:CC:DD:EE:FF",
      status: "Shipped",
    }),
  });
  const created = await createRes.json();
  if (!created.ok) throw new Error(`Create failed: ${created.error}`);

  console.log(`   Response -> receivedDate: ${created.data.receivedDate}, eta: ${created.data.eta}, shippedDate: ${created.data.shippedDate}`);
  if (created.data.receivedDate !== "2026-09-01") throw new Error(`Expected receivedDate 2026-09-01, got ${created.data.receivedDate}`);
  if (created.data.eta !== "2026-09-04") throw new Error(`Expected eta 2026-09-04, got ${created.data.eta}`);
  if (created.data.shippedDate !== "2026-09-03") throw new Error(`Expected shippedDate 2026-09-03, got ${created.data.shippedDate}`);
  console.log("   ✓ TEST 1 PASSED!");

  // ---------------------------------------------------------------
  // TEST 2: EDIT SHIPPED DATE to 2026-09-05 (ETA must remain 2026-09-04)
  // ---------------------------------------------------------------
  console.log("\n[TEST 2] Edit Shipped Date: 2026-09-03 -> 2026-09-05 (ETA must stay 2026-09-04)");
  const updateRes1 = await fetch(`${API_BASE}/api/rma/${created.data.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...created.data,
      shippedDate: "2026-09-05",
    }),
  });
  const updated1 = await updateRes1.json();
  if (!updated1.ok) throw new Error(`Update failed: ${updated1.error}`);

  console.log(`   Response -> receivedDate: ${updated1.data.receivedDate}, eta: ${updated1.data.eta}, shippedDate: ${updated1.data.shippedDate}`);
  if (updated1.data.shippedDate !== "2026-09-05") throw new Error(`Expected shippedDate 2026-09-05, got ${updated1.data.shippedDate}`);
  if (updated1.data.eta !== "2026-09-04") throw new Error(`Expected eta 2026-09-04, got ${updated1.data.eta}`);
  console.log("   ✓ TEST 2 PASSED!");

  // ---------------------------------------------------------------
  // TEST 3: EDIT RECEIVED DATE: 2026-09-01 -> 2026-09-02 (ETA must automatically change to 2026-09-05)
  // ---------------------------------------------------------------
  console.log("\n[TEST 3] Edit Received Date: 2026-09-01 -> 2026-09-02 (ETA must update to 2026-09-05)");
  const updateRes2 = await fetch(`${API_BASE}/api/rma/${created.data.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...updated1.data,
      receivedDate: "2026-09-02",
    }),
  });
  const updated2 = await updateRes2.json();
  if (!updated2.ok) throw new Error(`Update failed: ${updated2.error}`);

  console.log(`   Response -> receivedDate: ${updated2.data.receivedDate}, eta: ${updated2.data.eta}, shippedDate: ${updated2.data.shippedDate}`);
  if (updated2.data.receivedDate !== "2026-09-02") throw new Error(`Expected receivedDate 2026-09-02, got ${updated2.data.receivedDate}`);
  if (updated2.data.eta !== "2026-09-05") throw new Error(`Expected eta 2026-09-05, got ${updated2.data.eta}`);
  if (updated2.data.shippedDate !== "2026-09-05") throw new Error(`Expected shippedDate 2026-09-05, got ${updated2.data.shippedDate}`);
  console.log("   ✓ TEST 3 PASSED!");

  // ---------------------------------------------------------------
  // TEST 4: CLEAR SHIPPED DATE (empty/null)
  // ---------------------------------------------------------------
  console.log("\n[TEST 4] Clear Shipped Date (empty/null)");
  const updateRes3 = await fetch(`${API_BASE}/api/rma/${created.data.id}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      ...updated2.data,
      shippedDate: "",
    }),
  });
  const updated3 = await updateRes3.json();
  if (!updated3.ok) throw new Error(`Update failed: ${updated3.error}`);

  console.log(`   Response -> receivedDate: ${updated3.data.receivedDate}, eta: ${updated3.data.eta}, shippedDate: "${updated3.data.shippedDate}"`);
  if (updated3.data.shippedDate !== "" && updated3.data.shippedDate !== null) {
    throw new Error(`Expected empty shippedDate, got "${updated3.data.shippedDate}"`);
  }
  console.log("   ✓ TEST 4 PASSED!");

  // ---------------------------------------------------------------
  // TEST 5: DIRECT SQLITE VALIDATION
  // ---------------------------------------------------------------
  console.log("\n[TEST 5] Direct SQLite app.db Inspection");
  const db = new Database(APP_DB_PATH, { readonly: true });
  const rowInDb = db.prepare("SELECT id, ticket_no, received_date, eta, shipped_date FROM rma_entries WHERE ticket_no = ?").get(ticketNo1);
  db.close();

  console.log("   Database Row:", rowInDb);
  if (!rowInDb) throw new Error("Row not found in SQLite!");
  if (rowInDb.received_date !== "2026-09-02") throw new Error("Database received_date mismatch!");
  if (rowInDb.eta !== "2026-09-05") throw new Error("Database eta mismatch!");
  console.log("   ✓ TEST 5 PASSED!");

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS FOR SHIPPED DATE & ETA PASSED 100%!");
  console.log("==================================================");
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
