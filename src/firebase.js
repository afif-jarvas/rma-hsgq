import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as authSignOut,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { hashPassword } from "./auth/rbac.js";

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
let storage = null;
let secondaryAuth = null;

if (isUsingFirebase) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  db = getFirestore(app);

  auth = getAuth(app);
  storage = getStorage(app);

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence gagal:", error);
  });

  // Secondary app instance for Admin to create users without losing Admin session
  try {
    const secondaryApp =
      getApps().find((a) => a.name === "SecondaryAdminApp") ||
      initializeApp(firebaseConfig, "SecondaryAdminApp");
    secondaryAuth = getAuth(secondaryApp);
  } catch (err) {
    console.warn("Secondary app init warning:", err);
  }
} else {
  console.warn(
    "[HSGQ RMA] Firebase belum dikonfigurasi. " +
      "Silakan isi firebaseConfig di src/firebase.js.",
  );
}

export { db, auth, storage, secondaryAuth };

/*
============================================================
 FIREBASE STORAGE — RMA PHOTO UPLOAD
============================================================
*/

export async function uploadRmaPhoto(file, ticketNo, category, id) {
  if (!storage) {
    throw new Error(
      "Firebase Storage belum dikonfigurasi. Aktifkan Storage di Firebase Console.",
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const uniqueName = `${id}.${ext}`;
  const storagePath = `rma_photos/${ticketNo}/${category}/${uniqueName}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
    customMetadata: { originalName: file.name, ticketNo },
  });

  const url = await getDownloadURL(storageRef);

  return {
    id,
    name: file.name,
    url,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

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
 USER PROFILE & RBAC MANAGEMENT
============================================================
*/

const USERS_KEY = "users_v1";

export async function getUsersList() {
  const users = await storeGet(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export async function saveUsersList(users) {
  return storeSet(USERS_KEY, users);
}

export async function getUserProfile(uid) {
  if (!uid) return null;

  // 1. Try Firestore direct doc
  let profile = null;
  if (db) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        profile = snap.data();
      }
    } catch (error) {
      console.error("Gagal mengambil profile user:", error);
    }
  }

  // 2. Also check in users_v1 dataset
  const usersList = await getUsersList();
  const foundInList = usersList.find((u) => u.uid === uid || u.id === uid);

  if (foundInList) {
    profile = { ...profile, ...foundInList };
  }

  // If no profile found at all or no role set, check if this is the first user
  if (!profile || !profile.role) {
    const isFirstUser = usersList.length === 0 || (usersList.length === 1 && usersList[0].uid === uid);
    const defaultRole = isFirstUser ? "Administrator" : "Viewer";
    profile = {
      uid,
      displayName: profile?.displayName || "User",
      email: profile?.email || "",
      role: profile?.role || defaultRole,
      status: profile?.status || "active",
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save default profile so it's persisted
    await saveUserProfile(uid, profile);
  }

  return profile;
}

export async function saveUserProfile(uid, data) {
  if (!uid) return false;

  const cleanData = {
    ...data,
    uid,
    role: data.role || "Viewer",
    status: data.status || "active",
    updatedAt: new Date().toISOString(),
  };

  // 1. Save in Firestore doc
  if (db) {
    try {
      await setDoc(doc(db, "users", uid), cleanData, { merge: true });
    } catch (error) {
      console.error("Gagal menyimpan profile user doc:", error);
    }
  }

  // 2. Sync into users_v1 list
  try {
    const list = await getUsersList();
    const exists = list.some((u) => u.uid === uid || u.id === uid);
    const updatedList = exists
      ? list.map((u) => (u.uid === uid || u.id === uid ? { ...u, ...cleanData } : u))
      : [{ ...cleanData, id: uid }, ...list];
    await saveUsersList(updatedList);
  } catch (error) {
    console.error("Gagal sync user ke users_v1:", error);
  }

  return true;
}

/**
 * Admin: Create a new user account
 * Uses secondary Firebase Auth instance so current Admin is not logged out!
 */
export async function adminCreateAccount({
  name,
  email,
  username,
  password,
  role = "Viewer",
  status = "active",
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  // Check unique email in existing users_v1
  const existingUsers = await getUsersList();
  if (existingUsers.some((u) => (u.email || "").toLowerCase() === cleanEmail)) {
    return { ok: false, error: "Email sudah terdaftar untuk pengguna lain." };
  }

  let newUid = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (secondaryAuth && isUsingFirebase) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        password
      );
      newUid = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: cleanName,
      });

      // Sign out from secondary auth immediately
      await authSignOut(secondaryAuth);
    } catch (err) {
      console.error("Firebase secondaryAuth create user error:", err);
      return {
        ok: false,
        error:
          err.code === "auth/email-already-in-use"
            ? "Email sudah digunakan."
            : err.message || "Gagal membuat akun di Firebase Authentication.",
      };
    }
  }

  // Hash password securely with salt for integrity/audit
  const { hash, salt } = await hashPassword(password);

  const newUser = {
    id: newUid,
    uid: newUid,
    displayName: cleanName,
    name: cleanName,
    email: cleanEmail,
    username: (username || cleanEmail.split("@")[0]).trim(),
    role,
    status,
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null,
  };

  // Persist user record
  await saveUserProfile(newUid, newUser);

  return { ok: true, user: newUser };
}

/**
 * Admin: Update user information (role, status, name, etc.)
 */
export async function adminUpdateAccount(uid, updates) {
  const users = await getUsersList();
  const target = users.find((u) => u.uid === uid || u.id === uid);
  if (!target) return { ok: false, error: "User tidak ditemukan." };

  const updatedUser = {
    ...target,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(uid, updatedUser);
  return { ok: true, user: updatedUser };
}

/**
 * Admin: Reset user password
 */
export async function adminResetAccountPassword(email, newPassword) {
  const cleanEmail = email.trim().toLowerCase();

  // Send password reset email via Firebase if available
  if (auth && isUsingFirebase) {
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err) {
      console.warn("sendPasswordResetEmail warning:", err);
    }
  }

  // Also hash and update stored password hash for data integrity
  if (newPassword) {
    const { hash, salt } = await hashPassword(newPassword);
    const users = await getUsersList();
    const target = users.find((u) => (u.email || "").toLowerCase() === cleanEmail);
    if (target) {
      await adminUpdateAccount(target.uid || target.id, {
        passwordHash: hash,
        salt,
      });
    }
  }

  return { ok: true };
}

/**
 * Admin: Delete user account
 */
export async function adminDeleteAccount(uid) {
  if (db) {
    try {
      await deleteDoc(doc(db, "users", uid));
    } catch (err) {
      console.error("Gagal menghapus doc user di Firestore:", err);
    }
  }

  const users = await getUsersList();
  const updated = users.filter((u) => u.uid !== uid && u.id !== uid);
  await saveUsersList(updated);
  return { ok: true };
}

