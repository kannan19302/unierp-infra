"use client";

import { useEffect, useState, useRef } from "react";
import { Search, ArrowRight, CornerDownLeft, Sparkles, X } from "lucide-react";
import { PLATFORM_META } from "@/lib/platform-meta";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  platforms: Array<{
    code: string;
    name: string;
    baseUrl: string;
    launchAllowed: boolean;
    category: string;
  }>;
}

export function CommandPalette({ open, onClose, platforms }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const items = (platforms || []).flatMap((p) => {
    const meta = PLATFORM_META[p.code];
    const subModules = meta?.subModules || [];
    return [
      {
        id: p.code,
        title: p.name,
        subtitle: meta?.description || p.category,
        code: p.code,
        href: p.baseUrl,
        allowed: p.launchAllowed,
        icon: meta?.icon,
        accent: meta?.accent || "#48c5ce",
        type: "platform",
      },
      ...subModules.map((sub) => ({
        id: `${p.code}-${sub}`,
        title: `${sub} (${p.name})`,
        subtitle: `Jump to ${sub} inside ${p.name}`,
        code: p.code,
        href: p.baseUrl,
        allowed: p.launchAllowed,
        icon: meta?.icon,
        accent: meta?.accent || "#48c5ce",
        type: "module",
      })),
    ];
  });

  const filtered = items.filter((item) => {
    if (!query) return item.type === "platform";
    const q = query.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
  }).slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target.allowed) {
        window.open(target.href, "_blank", "noopener,noreferrer");
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        zIndex: 1000,
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl, 16px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Search size={20} color="var(--color-primary)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search platforms, modules, settings... (↑↓ to navigate, Enter to launch)"
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--color-text)",
              fontSize: "1rem",
              fontWeight: 500,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-secondary)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
              No platforms or modules match "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const active = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.allowed) {
                      window.open(item.href, "_blank", "noopener,noreferrer");
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md, 8px)",
                    background: active ? "var(--color-bg-sunken)" : "transparent",
                    border: `1px solid ${active ? "var(--color-border)" : "transparent"}`,
                    cursor: item.allowed ? "pointer" : "not-allowed",
                    transition: "all 0.1s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: `color-mix(in srgb, ${item.accent} 15%, transparent)`,
                        color: item.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {Icon ? <Icon size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--color-text)" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {item.code}
                    </span>
                    {active && <CornerDownLeft size={14} color="var(--color-primary)" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "8px 16px",
            background: "var(--color-bg-sunken)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.72rem",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>Tip: Press <kbd style={{ padding: "1px 4px", border: "1px solid var(--color-border)", borderRadius: "3px" }}>Esc</kbd> to exit</span>
          <span>Quick Launcher</span>
        </div>
      </div>
    </div>
  );
}
