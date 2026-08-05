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
*/

const firebaseConfig = {
  apiKey: "AIzaSyCj35siCrdarl87a7gjujWQjXXRMAOqGks",
  authDomain: "hsgq-rma.firebaseapp.com",
  projectId: "hsgq-rma",
  storageBucket: "hsgq-rma.firebasestorage.app",
  messagingSenderId: "638280186408",
  appId: "1:638280186408:web:9c2d03b3394c7d53f9131d",
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

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence gagal:", error);
  });
} else {
  console.warn(
    "[HSGQ RMA] Firebase belum dikonfigurasi. " +
      "Silakan isi firebaseConfig di src/firebase.js.",
  );
}

export { db, auth };

/*
============================================================
 FIRESTORE STORAGE
============================================================
*/

const COLLECTION = "hsgq_rma_app";

export async function storeGet(key, fallback) {
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
      { merge: true },
    );
    return true;
  } catch (error) {
    console.error("Gagal menyimpan profile user:", error);
    return false;
  }
}
