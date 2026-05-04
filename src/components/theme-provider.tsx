"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
    theme: ThemeMode;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: ThemeMode) => void;
};

const STORAGE_KEY = "ahb26-theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme() {
    if (typeof window === "undefined") {
        return "light" as const;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function useSystemTheme(): "light" | "dark" {
    return useSyncExternalStore(
        (callback) => {
            const media = window.matchMedia("(prefers-color-scheme: dark)");
            media.addEventListener("change", callback);
            return () => media.removeEventListener("change", callback);
        },
        getSystemTheme,
        () => "light",
    ) as "light" | "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemTheme = useSystemTheme();
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        if (typeof window === "undefined") {
            return "system";
        }

        const storedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
        return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "system";
    });

    const resolvedTheme = theme === "system" ? systemTheme : theme;

    useEffect(() => {
        document.documentElement.dataset.theme = resolvedTheme;
        document.documentElement.style.colorScheme = resolvedTheme;
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [resolvedTheme, theme]);

    const value = useMemo(
        () => ({
            theme,
            resolvedTheme,
            setTheme: setThemeState,
        }),
        [theme, resolvedTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }

    return context;
}
