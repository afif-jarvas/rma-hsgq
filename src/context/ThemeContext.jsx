import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import authApi from "../api/authClient.js";

const ThemeContext = createContext(null);

const VALID_THEMES = ["light", "dark", "system"];

function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "system";
  }
  const saved = localStorage.getItem("hsgq_theme");
  return VALID_THEMES.includes(saved) ? saved : "system";
}

function applyThemeToDocument(themeMode, resolvedMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", resolvedMode);
  document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  document.documentElement.style.colorScheme = resolvedMode;
  try {
    localStorage.setItem("hsgq_theme", themeMode);
  } catch (_) {}
}

export function ThemeProvider({ children }) {
  const { user, profile, setProfile } = useAuth();

  const initialTheme = user?.theme || profile?.theme || getStoredTheme();
  const [theme, setThemeState] = useState(initialTheme);

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    return initialTheme === "system" ? getSystemTheme() : initialTheme;
  });

  /*
   * Saat user login / profile dimuat dari backend SQLite,
   * sinkronkan theme preference user aktif.
   */
  useEffect(() => {
    const userTheme = profile?.theme || user?.theme;
    if (userTheme && VALID_THEMES.includes(userTheme)) {
      setThemeState(userTheme);
    }
  }, [profile?.theme, user?.theme, user?.id, user?.uid]);

  /*
   * Pantau perubahan theme OS jika mode "system" aktif.
   */
  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }

    const currentSys = getSystemTheme();
    setResolvedTheme(currentSys);

    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = (e) => {
      setResolvedTheme(e.matches ? "dark" : "light");
    };

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    } else if (media.addListener) {
      media.addListener(update);
      return () => media.removeListener(update);
    }
  }, [theme]);

  /*
   * Terapkan theme ke root HTML / document secara realtime.
   */
  useEffect(() => {
    applyThemeToDocument(theme, resolvedTheme);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback(
    async (nextTheme) => {
      if (!VALID_THEMES.includes(nextTheme)) {
        return;
      }

      const nextResolved = nextTheme === "system" ? getSystemTheme() : nextTheme;
      setThemeState(nextTheme);
      setResolvedTheme(nextResolved);
      applyThemeToDocument(nextTheme, nextResolved);

      // Simpan ke database SQLite pengguna via backend API
      if (user?.id || user?.uid) {
        try {
          await authApi.updatePreferences({ theme: nextTheme });
          setProfile?.((current) => ({
            ...(current || {}),
            theme: nextTheme,
          }));
        } catch (error) {
          console.error("Gagal menyimpan preferensi theme ke server:", error);
        }
      }
    },
    [user?.id, user?.uid, setProfile]
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme harus digunakan di dalam ThemeProvider");
  }
  return context;
}
