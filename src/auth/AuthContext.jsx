import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, getUserProfile } from "../firebase.js";
import { canUser, assertAuthorized, normalizeRole, ROLES, USER_STATUS } from "./rbac.js";

const AuthContext = createContext(null);
const SESSION_KEY = "hsgq_auth_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactiveError, setInactiveError] = useState("");

  const refreshProfile = useCallback(async () => {
    const currentUid = user?.uid || auth?.currentUser?.uid;
    if (!currentUid) return null;
    const userProfile = await getUserProfile(currentUid);
    setProfile(userProfile);
    return userProfile;
  }, [user]);

  const loginWithUser = useCallback((userObj, profileObj) => {
    setUser(userObj);
    setProfile(profileObj);
    setInactiveError("");
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          uid: userObj.uid,
          email: userObj.email,
          displayName: userObj.displayName || profileObj?.displayName || "User",
        })
      );
    } catch (_) {}
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    if (auth) {
      try {
        await signOut(auth);
      } catch (_) {}
    }
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Check local session first
      let sessionUser = null;
      let sessionProfile = null;
      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.uid) {
            const userProf = await getUserProfile(parsed.uid);
            if (userProf) {
              if (userProf.status === USER_STATUS.INACTIVE || userProf.status === "Inactive") {
                localStorage.removeItem(SESSION_KEY);
                if (isMounted) {
                  setInactiveError("Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Administrator untuk mengaktifkan kembali.");
                }
              } else {
                sessionUser = {
                  uid: userProf.uid,
                  email: userProf.email || parsed.email,
                  displayName: userProf.displayName || parsed.displayName || "User",
                };
                sessionProfile = userProf;
              }
            } else {
              // Profile deleted
              localStorage.removeItem(SESSION_KEY);
              if (isMounted) {
                setInactiveError("Akun sudah tidak tersedia atau telah dinonaktifkan.");
              }
            }
          }
        }
      } catch (err) {
        console.error("Session init error:", err);
      }

      if (!auth) {
        if (isMounted) {
          if (sessionUser && sessionProfile) {
            setUser(sessionUser);
            setProfile(sessionProfile);
          }
          setLoading(false);
        }
        return;
      }

      // 2. Firebase Auth listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        if (firebaseUser) {
          try {
            const userProfile = await getUserProfile(firebaseUser.uid);
            // If profile does not exist in Firestore, account has been deleted by Administrator
            if (!userProfile) {
              setInactiveError("Akun sudah tidak tersedia atau telah dinonaktifkan.");
              try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }

            if (userProfile.status === USER_STATUS.INACTIVE || userProfile.status === "Inactive") {
              setInactiveError("Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Administrator untuk mengaktifkan kembali.");
              try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
              await signOut(auth);
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }

            setInactiveError("");
            setUser(firebaseUser);
            setProfile(userProfile);
            try {
              localStorage.setItem(
                SESSION_KEY,
                JSON.stringify({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: userProfile?.displayName || firebaseUser.displayName || "User",
                })
              );
            } catch (_) {}
          } catch (err) {
            console.error("Auth context user profile fetch error:", err);
          } finally {
            setLoading(false);
          }
        } else {
          // If no firebaseUser, fallback to valid sessionUser if available
          if (sessionUser && sessionProfile) {
            setUser(sessionUser);
            setProfile(sessionProfile);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        }
      });

      return () => {
        unsubscribe();
      };
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Active session watchdog: Invalidate session immediately if user is deleted or deactivated
  useEffect(() => {
    if (!user?.uid) return;

    let cancelled = false;
    async function verifyActiveUser() {
      const prof = await getUserProfile(user.uid);
      if (cancelled) return;

      if (!prof || prof.status === USER_STATUS.INACTIVE || prof.status === "Inactive") {
        try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
        if (auth) {
          try { await signOut(auth); } catch (_) {}
        }
        setUser(null);
        setProfile(null);
        setInactiveError("Akun sudah tidak tersedia atau telah dinonaktifkan.");
      }
    }

    const interval = setInterval(verifyActiveUser, 5000);
    window.addEventListener("focus", verifyActiveUser);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", verifyActiveUser);
    };
  }, [user?.uid]);

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
    loginWithUser,
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

