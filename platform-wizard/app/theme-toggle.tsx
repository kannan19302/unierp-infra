"use client";

import { useTheme, THEMES, type ThemeSetting } from "@kannan19302/ui/theme";

/**
 * Colour-theme picker for the wizard header.
 *
 * A native <select> rather than the design system's DropdownMenu: eight options
 * is exactly what a select is for, it brings full keyboard and touch behaviour
 * with no portal, focus management or ARIA of our own, and it renders the
 * platform's native picker on mobile. The label is visually hidden rather than
 * absent so the control still has an accessible name.
 */
const LABELS: Record<string, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
  enterprise: "Enterprise",
  modern: "Modern",
  minimal: "Minimal",
  classic: "Classic",
  "high-contrast": "High contrast",
};

export function ThemeToggle() {
  const { setting, setTheme } = useTheme();

  return (
    <>
      <label htmlFor="wizard-theme" className="sr-only">
        Colour theme
      </label>
      <select
        id="wizard-theme"
        value={setting}
        onChange={(e) => setTheme(e.target.value as ThemeSetting)}
        style={{
          height: 32,
          padding: "0 var(--space-2)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-elevated)",
          color: "var(--color-text)",
          fontSize: "var(--text-sm)",
          cursor: "pointer",
        }}
      >
        <option value="system">{LABELS.system}</option>
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {LABELS[t] ?? t}
          </option>
        ))}
      </select>
    </>
  );
}
