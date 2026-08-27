import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/*
============================================================
 FIREBASE CONFIG
============================================================
*/

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

/*
============================================================
 FIREBASE INITIALIZATION
============================================================
*/

export const isUsingFirebase = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !Object.values(firebaseConfig).some((value) =>
    String(value).includes("GANTI") || String(value).includes("your_"),
  ),
);

let app = null;
let db = null;
let auth = null;
let storage = null;

if (isUsingFirebase) {
  app = initializeApp(firebaseConfig);

  db = getFirestore(app);

  auth = getAuth(app);
  storage = getStorage(app);

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Firebase persistence gagal:", error);
  });
} else {
  console.warn(
    "[HSGQ RMA] Firebase belum dikonfigurasi. " +
      "Silakan isi firebaseConfig di src/firebase.js.",
  );
}

export { db, auth, storage };

/*
============================================================
 FIREBASE STORAGE — RMA PHOTO UPLOAD
============================================================
*/

/**
 * Upload a single image File to Firebase Storage.
 *
 * Path: rma_photos/{ticketNo}/{category}/{uniqueFileName}
 *
 * Returns metadata object safe to persist in Firestore:
 *   { id, name, url, size, uploadedAt }
 *
 * Throws on failure so the caller can handle the error and
 * keep the ticket in a valid state.
 *
 * NEVER stores Base64, blob, or File objects in Firestore.
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
 USER PROFILE & USER MANAGEMENT
============================================================
*/


export async function getUserProfile(uid) {
  if (!uid) {
    return null;
  }

  // 1. Try from Firestore if available
  if (db) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        try {
          localStorage.setItem(`hsgq_user_profile_${uid}`, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
    } catch (error) {
      console.warn("Firestore getUserProfile error, using fallback:", error);
    }
  }

  // 2. Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(`hsgq_user_profile_${uid}`);
    if (cached) {
      return JSON.parse(cached);
    }
    // 3. Fallback to hsgq_all_users list
    const allUsers = JSON.parse(localStorage.getItem("hsgq_all_users") || "[]");
    const found = allUsers.find((u) => u.uid === uid || u.id === uid);
    if (found) {
      return found;
    }
  } catch (e) {}

  return null;
}

export async function saveUserProfile(uid, data) {
  if (!uid) {
    return false;
  }

  // 1. Always update local cache
  try {
    const existing = JSON.parse(localStorage.getItem(`hsgq_user_profile_${uid}`) || "{}");
    const merged = {
      ...existing,
      ...data,
      uid,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`hsgq_user_profile_${uid}`, JSON.stringify(merged));

    // Update in all_users cache if present
    const allUsers = JSON.parse(localStorage.getItem("hsgq_all_users") || "[]");
    const idx = allUsers.findIndex((u) => u.uid === uid || u.id === uid);
    if (idx >= 0) {
      allUsers[idx] = { ...allUsers[idx], ...merged };
    } else {
      allUsers.push(merged);
    }
    localStorage.setItem("hsgq_all_users", JSON.stringify(allUsers));
  } catch (e) {}

  // 2. Save to Firestore if available
  if (db) {
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
      console.error("Gagal menyimpan profile user ke Firestore:", error);
      return false;
    }
  }

  return true;
}

/**
 * Find user by username or email for flexible login
 */
export async function findUserByUsernameOrEmail(identifier) {
  const clean = String(identifier || "").trim().toLowerCase();
  if (!clean) return null;

  const allUsers = await getAllUsers();
  return allUsers.find(
    (u) =>
      (u.email && u.email.toLowerCase() === clean) ||
      (u.username && u.username.toLowerCase() === clean) ||
      (u.displayName && u.displayName.toLowerCase() === clean),
  );
}

/**
 * Get all users list for Admin Management
 */
export async function getAllUsers() {
  let list = [];

  if (db) {
    try {
      const { getDocs, collection } = await import("firebase/firestore");
      const snap = await getDocs(collection(db, "users"));
      snap.forEach((d) => {
        list.push({ id: d.id, uid: d.id, ...d.data() });
      });
      if (list.length > 0) {
        try {
          localStorage.setItem("hsgq_all_users", JSON.stringify(list));
        } catch (e) {}
        return list;
      }
    } catch (err) {
      console.warn("Gagal load users dari Firestore:", err);
    }
  }

  try {
    const raw = localStorage.getItem("hsgq_all_users");
    if (raw) {
      list = JSON.parse(raw);
    }
  } catch (e) {}

  return list;
}

/**
 * Admin: Create New User with Temporary Password & mustChangePassword flag
 */
export async function adminCreateUser({
  name,
  username,
  email,
  role = "Engineer",
  temporaryPassword,
  mustChangePassword = true,
}) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = (username || cleanEmail.split("@")[0]).trim().toLowerCase();
  const cleanName = name.trim();

  let newUid = "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  // Try creating in Firebase Auth using a secondary app instance without logging out admin
  if (isUsingFirebase) {
    try {
      const { getApps, getApp } = await import("firebase/app");
      const { createUserWithEmailAndPassword, signOut } = await import("firebase/auth");

      let secondaryApp;
      if (!getApps().some((a) => a.name === "AdminSecondaryAuth")) {
        secondaryApp = initializeApp(firebaseConfig, "AdminSecondaryAuth");
      } else {
        secondaryApp = getApp("AdminSecondaryAuth");
      }
      const secondaryAuth = getAuth(secondaryApp);
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        temporaryPassword,
      );
      newUid = cred.user.uid;
      await signOut(secondaryAuth);
    } catch (authErr) {
      console.warn("Secondary auth user creation notice:", authErr);
      if (authErr?.code === "auth/email-already-in-use") {
        throw new Error("Email tersebut sudah terdaftar di sistem.");
      }
    }
  }

  const profileData = {
    uid: newUid,
    id: newUid,
    name: cleanName,
    displayName: cleanName,
    username: cleanUsername,
    email: cleanEmail,
    role,
    mustChangePassword: !!mustChangePassword,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(newUid, profileData);
  return profileData;
}

/**
 * Admin: Reset User Password & set mustChangePassword to true.
/**
 * Admin: Reset User Password via Firebase Auth Password Reset Email
 *
 * Sends an official password reset email to the user's registered email address.
 * Updates profile metadata to record when the reset email was triggered.
 */
export async function adminResetUserPassword(uid, targetEmail = "") {
  if (!uid) throw new Error("User ID tidak valid.");

  let email = targetEmail;
  if (!email) {
    const userProfile = await getUserProfile(uid);
    email = userProfile?.email;
  }

  if (!email || !email.includes("@")) {
    throw new Error("Email user tidak valid atau tidak ditemukan.");
  }

  if (isUsingFirebase && auth) {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      console.error("[HSGQ] sendPasswordResetEmail error:", err);
      throw new Error(
        err?.code === "auth/user-not-found"
          ? "Akun email tersebut tidak ditemukan di Firebase Auth."
          : `Gagal mengirim email reset password: ${err.message}`,
      );
    }
  }

  // Update profile metadata in Firestore/localStorage
  const profileData = {
    passwordResetEmailSentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveUserProfile(uid, profileData);
  return { success: true, email: email.trim() };
}

/**
 * Admin: Update User Role
 */
export async function adminUpdateUserRole(uid, newRole) {
  if (!uid) throw new Error("User ID tidak valid.");
  return await saveUserProfile(uid, {
    role: newRole,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Admin: Delete User
 */
export async function adminDeleteUser(uid) {
  if (!uid) return false;

  if (db) {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "users", uid));
    } catch (e) {
      console.warn("Firestore delete user error:", e);
    }
  }

  try {
    localStorage.removeItem(`hsgq_user_profile_${uid}`);
    const allUsers = JSON.parse(localStorage.getItem("hsgq_all_users") || "[]");
    const filtered = allUsers.filter((u) => u.uid !== uid && u.id !== uid);
    localStorage.setItem("hsgq_all_users", JSON.stringify(filtered));
  } catch (e) {}

  return true;
}
