import React, { createContext, useContext, useEffect, useState } from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, getUserProfile } from "../firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /*
    Firebase akan memanggil callback ini ketika:
    - user login
    - user logout
    - halaman direfresh
    */

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);

        return;
      }

      setUser(firebaseUser);

      /*
        Ambil data profile tambahan dari Firestore.
        */

      const userProfile = await getUserProfile(firebaseUser.uid);

      setProfile(userProfile);

      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function logout() {
    if (!auth) return;

    await signOut(auth);
  }

  const value = {
    user,
    profile,
    setProfile,
    loading,
    logout,
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
