"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Settings, Shield, User, ExternalLink } from "lucide-react";

interface UserProfileMenuProps {
  user: {
    name?: string;
    email?: string;
  } | null;
  accountCenterUrl: string;
  realmLabel?: string;
  onSignOut: () => void;
}

export function UserProfileMenu({
  user,
  accountCenterUrl,
  realmLabel = "tenant",
  onSignOut,
}: UserProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const displayName = user?.name || "Administrator";
  const displayEmail = user?.email || "admin@unierp.local";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User Account Menu"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "var(--radius-full, 9999px)",
          background: "linear-gradient(135deg, var(--color-primary), #3b82f6)",
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "0.82rem",
          border: "2px solid var(--color-border)",
          cursor: "pointer",
          boxShadow: open ? "0 0 0 2px var(--color-primary)" : "none",
          transition: "all 0.2s ease",
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "280px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg, 12px)",
            boxShadow: "var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1))",
            padding: "var(--space-2, 8px)",
            zIndex: 100,
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {/* User Profile Header */}
          <div
            style={{
              padding: "var(--space-3) var(--space-3)",
              background: "var(--color-bg-sunken)",
              borderRadius: "var(--radius-md, 8px)",
              marginBottom: "var(--space-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), #3b82f6)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "var(--text-sm, 0.88rem)",
                    color: "var(--color-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayEmail}
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(72, 197, 206, 0.15)",
                color: "var(--color-primary)",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <Shield size={11} /> {realmLabel} Realm
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <a
              role="menuitem"
              href={accountCenterUrl}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: "var(--radius-md, 6px)",
                color: "var(--color-text)",
                textDecoration: "none",
                fontSize: "var(--text-sm, 0.85rem)",
                fontWeight: 500,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-sunken)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={15} color="var(--color-primary)" /> Account Center
              </span>
              <ExternalLink size={12} color="var(--color-text-secondary)" />
            </a>

            <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "9px 12px",
                borderRadius: "var(--radius-md, 6px)",
                border: "none",
                background: "transparent",
                color: "var(--color-danger, #ef4444)",
                fontSize: "var(--text-sm, 0.85rem)",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
