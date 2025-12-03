import React, { createContext, useContext, useEffect, useState } from "react";
import { theme } from "./theme";
import type { ThemeMode } from "./theme";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: ThemeMode;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
};

const initialState: ThemeProviderState = {
    theme: "dark",
    setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = "dark",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [mode, setMode] = useState<ThemeMode>(
        () => (localStorage.getItem(storageKey) as ThemeMode) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(mode);

        const colors = theme.colors[mode];

        // Inject CSS variables
        Object.entries(colors).forEach(([key, value]) => {
            // Convert camelCase to kebab-case for CSS variables
            const cssVarName = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
            root.style.setProperty(cssVarName, value);
        });

        // Also inject radii
        Object.entries(theme.radii).forEach(([key, value]) => {
            // Handle special cases if needed, but for now just --radius-key
            // Actually tailwind config expects --radius for the default one
            if (key === 'default') {
                root.style.setProperty('--radius', value);
            } else {
                root.style.setProperty(`--radius-${key}`, value);
            }
        });

    }, [mode]);

    const value = {
        theme: mode,
        setTheme: (theme: ThemeMode) => {
            localStorage.setItem(storageKey, theme);
            setMode(theme);
        },
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};
