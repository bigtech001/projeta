import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "dark-blue" | "worship-purple" | "light-modern";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark-blue",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("cl-theme") as Theme) || "dark-blue";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "theme-worship-purple", "theme-light-modern");
    if (theme === "dark-blue") {
      root.classList.add("dark");
    } else if (theme === "worship-purple") {
      root.classList.add("dark", "theme-worship-purple");
    } else if (theme === "light-modern") {
      root.classList.add("theme-light-modern");
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem("cl-theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
