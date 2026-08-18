import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, getUserProfile } from "../firebase.js";
import { canUser, assertAuthorized, normalizeRole, ROLES, USER_STATUS } from "./rbac.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactiveError, setInactiveError] = useState("");

  const refreshProfile = useCallback(async () => {
    if (!auth?.currentUser) return null;
    const userProfile = await getUserProfile(auth.currentUser.uid);
    setProfile(userProfile);
    return userProfile;
  }, []);

  useEffect(() => {
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

      try {
        const userProfile = await getUserProfile(firebaseUser.uid);

        // Check if account is inactive
        if (userProfile?.status === USER_STATUS.INACTIVE || userProfile?.status === "Inactive") {
          setInactiveError("Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Administrator untuk mengaktifkan kembali.");
          await signOut(auth);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setInactiveError("");
        setUser(firebaseUser);
        setProfile(userProfile);
      } catch (err) {
        console.error("Auth context user profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  const role = normalizeRole(profile?.role);
  const isAdministrator = role === ROLES.ADMINISTRATOR;
  const isEngineer = role === ROLES.ENGINEER;
  const isViewer = role === ROLES.VIEWER;

  const can = useCallback(
    (permission) => {
      return canUser(profile, permission);
    },
    [profile]
  );

  const assert = useCallback(
    (permission, actionName) => {
      return assertAuthorized(profile, permission, actionName);
    },
    [profile]
  );

  const value = {
    user,
    profile,
    setProfile,
    role,
    isAdministrator,
    isEngineer,
    isViewer,
    can,
    assert,
    refreshProfile,
    loading,
    inactiveError,
    setInactiveError,
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

