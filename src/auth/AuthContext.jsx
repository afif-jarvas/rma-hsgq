import React, { createContext, useContext, useEffect, useState } from "react";

import { onAuthStateChanged, signOut, updatePassword } from "firebase/auth";

import { auth, getUserProfile, saveUserProfile } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /*
    Firebase memanggil callback ini ketika:
    - user login
    - user logout
    - halaman direfresh (session persistence)
    */
    if (!auth) {
      // Offline fallback: check localStorage session
      try {
        const localUid = localStorage.getItem("hsgq_session_uid");
        if (localUid) {
          const cachedProfile = JSON.parse(
            localStorage.getItem(`hsgq_user_profile_${localUid}`) || "null",
          );
          if (cachedProfile) {
            setUser({ uid: localUid, email: cachedProfile.email, displayName: cachedProfile.displayName });
            setProfile(cachedProfile);
          }
        }
      } catch (e) {}
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        try {
          localStorage.removeItem("hsgq_session_uid");
        } catch (e) {}
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      try {
        localStorage.setItem("hsgq_session_uid", firebaseUser.uid);
      } catch (e) {}

      /*
      Ambil data profile tambahan dari Firestore / Local Cache.
      Pastikan flag mustChangePassword divalidasi secara persistent.
      */
      try {
        let userProfile = await getUserProfile(firebaseUser.uid);

        if (!userProfile) {
          // Buat profile default jika belum ada
          userProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
            email: firebaseUser.email,
            role: firebaseUser.email?.toLowerCase().startsWith("admin") ? "Administrator" : "Engineer",
            mustChangePassword: false,
            createdAt: new Date().toISOString(),
          };
          await saveUserProfile(firebaseUser.uid, userProfile);
        }

        setProfile(userProfile);
      } catch (profileErr) {
        console.error("Gagal mengambil profile:", profileErr);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (!user) return null;
    const p = await getUserProfile(user.uid);
    if (p) {
      setProfile(p);
    }
    return p;
  }

  async function changePassword(newPassword) {
    if (!user) throw new Error("Pengguna tidak sedang login.");

    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password baru minimal harus terdiri dari 6 karakter.");
    }

    // 1. Update password di Firebase Auth jika tersedia
    if (auth?.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
      } catch (err) {
        console.warn("Firebase updatePassword warning:", err);
        // If requires re-authentication, we proceed with profile update or propagate
        if (err?.code === "auth/requires-recent-login") {
          throw new Error("Sesi login telah kedaluwarsa. Silakan logout dan login kembali untuk mengganti password.");
        }
      }
    }

    // 2. Update status mustChangePassword = false secara persistent
    // Also clear the _tempToken so it cannot be used for login again
    const updatedData = {
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _tempToken: null,
    };

    await saveUserProfile(user.uid, updatedData);

    // 3. Update React in-memory state
    setProfile((current) => ({
      ...(current || {}),
      ...updatedData,
      mustChangePassword: false,
    }));

    return true;
  }

  async function logout() {
    try {
      localStorage.removeItem("hsgq_session_uid");
    } catch (e) {}

    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error:", err);
      }
    }

    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    setProfile,
    loading,
    logout,
    changePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }

  return context;
}
