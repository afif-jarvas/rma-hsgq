import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import authApi, { getStoredToken, clearStoredAuth } from "../api/authClient.js";
import { canUser, assertAuthorized, normalizeRole, ROLES, USER_STATUS } from "./rbac.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactiveError, setInactiveError] = useState("");

  const refreshProfile = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res && res.user) {
        setUser(res.user);
        setProfile(res.user);
        return res.user;
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearStoredAuth();
        setUser(null);
        setProfile(null);
        if (err.status === 403) {
          setInactiveError(err.message || "Akun Anda telah dinonaktifkan.");
        }
      }
    }
    return null;
  }, []);

  const loginWithUser = useCallback((userObj, profileObj, token) => {
    const finalProfile = profileObj || userObj;
    setUser(userObj);
    setProfile(finalProfile);
    setInactiveError("");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_) {}
    clearStoredAuth();
    setUser(null);
    setProfile(null);
  }, []);

  // Initialize Auth on App Load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const token = getStoredToken();
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (isMounted && res.user) {
          if (res.user.status === "inactive" || res.user.status === "Inactive") {
            clearStoredAuth();
            setUser(null);
            setProfile(null);
            setInactiveError("Akun Anda telah dinonaktifkan oleh Administrator. Hubungi Administrator untuk mengaktifkan kembali.");
          } else {
            setUser(res.user);
            setProfile(res.user);
            setInactiveError("");
          }
        }
      } catch (err) {
        if (isMounted) {
          clearStoredAuth();
          setUser(null);
          setProfile(null);
          if (err.status === 403) {
            setInactiveError(err.message || "Akun Anda telah dinonaktifkan.");
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Active session watchdog: Invalidate session immediately if user is deactivated/deleted
  useEffect(() => {
    if (!user?.id && !user?.uid) return;

    let cancelled = false;
    async function verifySession() {
      const token = getStoredToken();
      if (!token) return;

      try {
        const res = await authApi.getMe();
        if (cancelled) return;
        if (!res || !res.user || res.user.status === "inactive" || res.user.status === "Inactive") {
          clearStoredAuth();
          setUser(null);
          setProfile(null);
          setInactiveError("Akun Anda telah dinonaktifkan oleh Administrator.");
        }
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401 || err.status === 403) {
          clearStoredAuth();
          setUser(null);
          setProfile(null);
          setInactiveError(err.message || "Sesi Anda telah berakhir.");
        }
      }
    }

    const interval = setInterval(verifySession, 10000);
    window.addEventListener("focus", verifySession);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", verifySession);
    };
  }, [user?.id, user?.uid]);

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
