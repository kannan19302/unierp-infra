"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("unierp.theme", next);
      document.cookie = `unierp_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      // Storage unavailable
    }
  };

  if (!mounted) {
    return (
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-full, 9999px)",
          background: "var(--color-bg-sunken)",
          border: "1px solid var(--color-border)",
        }}
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "var(--radius-full, 9999px)",
        background: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
        border: "1px solid var(--color-border)",
        color: isDark ? "#fbbf24" : "var(--color-text)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.06)";
        e.currentTarget.style.borderColor = "var(--color-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {isDark ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
    </button>
  );
}
