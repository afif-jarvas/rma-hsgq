import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// 🔧 GANTI dengan config project Firebase kamu sendiri kalau sudah siap.
// Cara ambil: Firebase Console → Project Settings → General → "Your apps" → SDK setup and configuration
// Selama masih tulisan "GANTI_...", app otomatis jalan pakai localStorage browser
// (data tersimpan di browser ini saja, TIDAK dibagikan ke tim lain).
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI",
  appId: "GANTI",
};

export const isUsingFirebase = !Object.values(firebaseConfig).some((v) => String(v).includes("GANTI"));

let db = null;
if (isUsingFirebase) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn(
    "[HSGQ RMA] Firebase belum dikonfigurasi (src/firebase.js) — memakai localStorage browser sementara. " +
    "Data TIDAK dibagikan ke tim lain sampai config Firebase diisi."
  );
}

// Kalau pakai Firestore: semua data disimpan di collection "hsgq_rma_app", tiap key jadi 1 document.
const COLLECTION = "hsgq_rma_app";

export async function storeGet(key, fallback) {
  if (!db) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("localStorage get gagal:", key, e);
      return fallback;
    }
  }
  try {
    const snap = await getDoc(doc(db, COLLECTION, key));
    if (snap.exists()) return snap.data().value;
    return fallback;
  } catch (e) {
    console.error("Firestore get gagal:", key, e);
    return fallback;
  }
}

export async function storeSet(key, value) {
  if (!db) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("localStorage set gagal:", key, e);
      return null;
    }
  }
  try {
    await setDoc(doc(db, COLLECTION, key), {
      value,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.error("Firestore set gagal:", key, e);
    return null;
  }
}