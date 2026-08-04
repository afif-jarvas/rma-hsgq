import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

/*
============================================================
 FIREBASE CONFIG
============================================================

Ambil dari:

Firebase Console
→ Project Settings
→ General
→ Your apps
→ Web App
→ SDK setup and configuration

Jangan upload file .env ke GitHub kalau kamu memilih
menyimpan konfigurasi lewat environment variable.
*/

const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI.appspot.com",
  messagingSenderId: "GANTI",
  appId: "GANTI",
};

/*
============================================================
 FIREBASE INITIALIZATION
============================================================
*/

export const isUsingFirebase = !Object.values(firebaseConfig).some((value) =>
  String(value).includes("GANTI"),
);

let app = null;
let db = null;
let auth = null;

if (isUsingFirebase) {
  app = initializeApp(firebaseConfig);

  db = getFirestore(app);

  auth = getAuth(app);

  /*
  User tetap login walaupun browser ditutup.
  User baru logout kalau menekan Logout.
  */
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence gagal:", error);
  });
} else {
  console.warn(
    "[HSGQ RMA] Firebase belum dikonfigurasi. " +
      "Silakan isi firebaseConfig di src/firebase.js.",
  );
}

/*
============================================================
 EXPORT
============================================================
*/

export { db, auth };

/*
============================================================
 FIRESTORE STORAGE
============================================================
*/

const COLLECTION = "hsgq_rma_app";

export async function storeGet(key, fallback) {
  /*
  Kalau Firebase belum dikonfigurasi,
  gunakan localStorage seperti versi lama.
  */
  if (!db) {
    try {
      const raw = localStorage.getItem(key);

      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error("localStorage get gagal:", key, error);

      return fallback;
    }
  }

  try {
    const snap = await getDoc(doc(db, COLLECTION, key));

    if (snap.exists()) {
      return snap.data().value;
    }

    return fallback;
  } catch (error) {
    console.error("Firestore get gagal:", key, error);

    return fallback;
  }
}

export async function storeSet(key, value) {
  /*
  Kalau Firebase belum dikonfigurasi,
  simpan ke localStorage.
  */
  if (!db) {
    try {
      localStorage.setItem(key, JSON.stringify(value));

      return true;
    } catch (error) {
      console.error("localStorage set gagal:", key, error);

      return null;
    }
  }

  try {
    await setDoc(doc(db, COLLECTION, key), {
      value,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Firestore set gagal:", key, error);

    return null;
  }
}

/*
============================================================
 USER PROFILE
============================================================
*/

export async function getUserProfile(uid) {
  if (!db || !uid) {
    return null;
  }

  try {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) {
      return null;
    }

    return snap.data();
  } catch (error) {
    console.error("Gagal mengambil profile user:", error);

    return null;
  }
}

export async function saveUserProfile(uid, data) {
  if (!db || !uid) {
    return false;
  }

  try {
    await setDoc(
      doc(db, "users", uid),
      {
        ...data,
        uid,
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      },
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan profile user:", error);

    return false;
  }
}
