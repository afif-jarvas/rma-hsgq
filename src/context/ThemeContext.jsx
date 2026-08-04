import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../auth/AuthContext.jsx";
import { saveUserProfile } from "../firebase.js";

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

export function ThemeProvider({ children }) {
  const { user, profile, setProfile } = useAuth();

  const [theme, setThemeState] = useState(profile?.theme || getStoredTheme());

  const [resolvedTheme, setResolvedTheme] = useState(
    theme === "system" ? getSystemTheme() : theme,
  );

  /*
  Saat profile Firebase selesai dimuat,
  gunakan theme yang tersimpan di profile.
  */
  useEffect(() => {
    if (profile?.theme && VALID_THEMES.includes(profile.theme)) {
      setThemeState(profile.theme);
    }
  }, [profile?.theme]);

  /*
  Pantau perubahan theme OS kalau user memilih System.
  */
  useEffect(() => {
    if (theme !== "system") {
      setResolvedTheme(theme);
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const update = () => {
      setResolvedTheme(media.matches ? "dark" : "light");
    };

    update();

    media.addEventListener?.("change", update);

    return () => {
      media.removeEventListener?.("change", update);
    };
  }, [theme]);

  /*
  Terapkan theme ke document.
  */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);

    document.documentElement.style.colorScheme = resolvedTheme;

    localStorage.setItem("hsgq_theme", theme);
  }, [theme, resolvedTheme]);

  async function setTheme(nextTheme) {
    if (!VALID_THEMES.includes(nextTheme)) {
      return;
    }

    setThemeState(nextTheme);

    /*
    Simpan ke profile user kalau Firebase login.
    */
    if (user) {
      try {
        await saveUserProfile(user.uid, {
          theme: nextTheme,
        });

        setProfile?.((current) => ({
          ...(current || {}),
          theme: nextTheme,
        }));
      } catch (error) {
        console.error("Gagal menyimpan theme:", error);
      }
    }
  }

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme harus digunakan di dalam ThemeProvider");
  }

  return context;
}
