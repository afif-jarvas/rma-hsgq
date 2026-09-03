/**
 * scripts/backup-firestore.js
 * Tool untuk mengunduh snapshot data lengkap dari Firebase Firestore ke file JSON lokal offline.
 * TIDAK MENGUBAH ATAU MENGHAPUS DATA APAPUN DI FIRESTORE.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BACKUP_DIR = path.resolve(ROOT_DIR, "server/data/backups");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const firebaseConfig = {
  apiKey: "AIzaSyCj35siCrdarl87a7gjujWQjXXRMAOqGks",
  authDomain: "hsgq-rma.firebaseapp.com",
  projectId: "hsgq-rma",
  storageBucket: "hsgq-rma.firebasestorage.app",
  messagingSenderId: "638280186408",
  appId: "1:638280186408:web:9c2d03b3394c7d53f9131d",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const COLLECTION = "hsgq_rma_app";
const KEYS = [
  "rma_entries_v2",
  "wa_entries_v2",
  "pcba_data_v1",
  "hsgq_master_data_v2",
  "users_v1",
  "deleted_users_v1",
];

async function runBackup() {
  console.log("==================================================");
  console.log("🚀 MEMULAI BACKUP FIREBASE FIRESTORE OFFLINE");
  console.log("==================================================");

  const email = process.env.FIREBASE_EMAIL || process.argv[2];
  const password = process.env.FIREBASE_PASSWORD || process.argv[3];

  if (email && password) {
    try {
      console.log(`🔐 Mencoba autentikasi Firebase dengan email '${email}'...`);
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`   ✓ Autentikasi Firebase Berhasil! UID: ${userCred.user.uid}`);
    } catch (authErr) {
      console.warn(`   ⚠ Autentikasi Firebase gagal: ${authErr.message}`);
    }
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    sourceProject: firebaseConfig.projectId,
    collection: COLLECTION,
    datasets: {},
    directUserDocs: [],
  };

  for (const key of KEYS) {
    try {
      console.log(`📥 Mengunduh dokumen '${key}' dari collection '${COLLECTION}'...`);
      const snap = await getDoc(doc(db, COLLECTION, key));
      if (snap.exists()) {
        const val = snap.data().value;
        backupData.datasets[key] = val;
        const count = Array.isArray(val) ? val.length : (typeof val === "object" && val !== null ? Object.keys(val).length : 1);
        console.log(`   ✓ Berhasil diunduh (${count} items)`);
      } else {
        console.log(`   ⚠ Dokumen '${key}' tidak ditemukan di Firestore.`);
        backupData.datasets[key] = null;
      }
    } catch (err) {
      console.error(`   ❌ Gagal mengunduh '${key}':`, err.message);
      backupData.datasets[key] = null;
    }
  }

  // Backup direct users docs if any
  try {
    console.log("📥 Memeriksa collection direct 'users'...");
    const userSnaps = await getDocs(collection(db, "users"));
    userSnaps.forEach((d) => {
      backupData.directUserDocs.push({ id: d.id, ...d.data() });
    });
    console.log(`   ✓ Ditemukan ${backupData.directUserDocs.length} user docs.`);
  } catch (err) {
    console.log("   ⚠ Direct users collection skipped:", err.message);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `firestore-backup-${timestamp}.json`;
  const latestFilename = `firestore-backup-latest.json`;

  const filepath = path.join(BACKUP_DIR, filename);
  const latestFilepath = path.join(BACKUP_DIR, latestFilename);

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2), "utf8");
  fs.writeFileSync(latestFilepath, JSON.stringify(backupData, null, 2), "utf8");

  console.log("==================================================");
  console.log(`✅ BACKUP SELESAI & TERSIMPAN AMAN:`);
  console.log(`   📁 ${filepath}`);
  console.log(`   📁 ${latestFilepath}`);
  console.log("==================================================");

  return { filepath, backupData };
}

runBackup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal backup error:", err);
    process.exit(1);
  });
