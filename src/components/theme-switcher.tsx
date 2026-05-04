"use client";

import { useTheme, type ThemeMode } from "@/components/theme-provider";

const OPTIONS: Array<{ label: string; value: ThemeMode }> = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
];

export function ThemeSwitcher() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    return (
        <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
            {OPTIONS.map((option) => {
                const active = theme === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        aria-pressed={active}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${active
                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                        title={option.value === "system" ? `Following system (${resolvedTheme})` : option.label}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
