import { useState, useCallback } from "react";
import type { Theme } from "@/contexts/theme-context";

export interface AppSettings {
  churchName: string;
  congregationName: string;
  logoUrl: string | null;
  projectionFontSize: "small" | "medium" | "large" | "xl";
  projectionBackground: "black" | "dark-blue" | "gradient";
  projectionTransition: "fade" | "slide" | "scale";
  audioEnabled: boolean;
  audioDefaultVolume: number;
  theme: Theme;
  musicasFolder: string;
}

const SETTINGS_KEY = "cl-settings";

const defaultSettings: AppSettings = {
  churchName: "Minha Igreja",
  congregationName: "Congregação Central",
  logoUrl: null,
  projectionFontSize: "large",
  projectionBackground: "black",
  projectionTransition: "fade",
  audioEnabled: true,
  audioDefaultVolume: 75,
  theme: "dark-blue",
  musicasFolder: "config/musicas",
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...partial };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    setSettingsState(defaultSettings);
  }, []);

  return { settings, updateSettings, resetSettings };
}
