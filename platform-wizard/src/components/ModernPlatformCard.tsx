"use client";

import { useState } from "react";
import { ArrowUpRight, Star, ShieldAlert } from "lucide-react";
import { PLATFORM_META } from "@/lib/platform-meta";

export interface ModernPlatformCardProps {
  code: string;
  name: string;
  description?: string;
  href: string;
  disabled?: boolean;
  reason?: string;
  favorite?: boolean;
  audience?: string;
  surfaceType?: string;
  onFavoriteChange?: (favorite: boolean) => void;
  onLaunch?: () => void;
}

export function ModernPlatformCard({
  code,
  name,
  description,
  href,
  disabled = false,
  reason,
  favorite = false,
  onFavoriteChange,
  onLaunch,
}: ModernPlatformCardProps) {
  const [hovered, setHovered] = useState(false);
  const meta = PLATFORM_META[code];
  const Icon = meta?.icon;
  const accent = meta?.accent || "#48c5ce";
  const subModules = meta?.subModules || [];
  const defaultPort = meta?.defaultPort || "";
  const badgeLabel = meta?.badgeLabel || code;

  // Max tags to show before +N badge
  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = subModules.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = subModules.length - MAX_VISIBLE_TAGS;

  const handleCardClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    // Prevent double triggering if clicked directly on an anchor or button inside
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    onLaunch?.();
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleLaunchClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onLaunch?.();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      role="article"
      aria-label={`${name} Platform Card`}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "16px",
        background: "var(--color-bg-elevated)",
        border: `1px solid ${hovered && !disabled ? "var(--color-text-secondary, #94a3b8)" : "var(--color-border)"}`,
        boxShadow: hovered && !disabled
          ? "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.04)"
          : "0 1px 3px rgba(0, 0, 0, 0.02)",
        padding: "20px",
        minHeight: "245px",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered && !disabled ? "translateY(-3px)" : "translateY(0)",
        opacity: disabled ? 0.65 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        overflow: "hidden",
      }}
    >
      {/* Top Header: Soft Tinted Icon Badge + Port/Status Indicator */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          {/* Pastel Icon Well */}
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              flexShrink: 0,
            }}
          >
            {Icon ? <Icon size={19} strokeWidth={2.2} /> : null}
          </div>

          {/* Port / Client Status Pill */}
          {!disabled ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              <span>{typeof defaultPort === "number" ? `:${defaultPort}` : defaultPort}</span>
            </div>
          ) : (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "999px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--color-danger, #ef4444)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              {reason || "Restricted"}
            </span>
          )}
        </div>

        {/* Code / Category Eyebrow */}
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted, #64748b)",
            marginBottom: "4px",
          }}
        >
          {badgeLabel}
        </div>

        {/* Platform Title */}
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "1.02rem",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.015em",
            lineHeight: 1.25,
          }}
        >
          {name}
        </h3>

        {/* Platform Description */}
        <p
          style={{
            margin: 0,
            fontSize: "0.82rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description || meta?.description}
        </p>

        {/* Feature Sub-Module Pills */}
        {subModules.length > 0 && !disabled && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "5px",
              marginTop: "12px",
            }}
          >
            {visibleTags.map((mod) => (
              <span
                key={mod}
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "var(--color-bg-sunken)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                {mod}
              </span>
            ))}
            {overflowCount > 0 && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "6px",
                  background: "var(--color-bg-sunken)",
                  color: "var(--color-text-muted, #64748b)",
                  border: "1px solid var(--color-border)",
                }}
              >
                +{overflowCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Row: Favorite Bookmark + Launch ↗ Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "16px",
          paddingTop: "12px",
        }}
      >
        {/* Favorite Bookmark Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && onFavoriteChange) {
              onFavoriteChange(!favorite);
            }
          }}
          disabled={disabled}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: favorite ? "rgba(245, 158, 11, 0.12)" : "transparent",
            border: `1px solid ${favorite ? "rgba(245, 158, 11, 0.35)" : "var(--color-border)"}`,
            color: favorite ? "#f59e0b" : "var(--color-text-muted, #94a3b8)",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Star size={14} fill={favorite ? "#f59e0b" : "none"} strokeWidth={1.8} />
        </button>

        {/* High-Contrast Launch Button (Always opens in new tab) */}
        {!disabled ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLaunchClick}
            aria-label={`Launch ${name} in a new tab`}
            title={`Launch ${name} in a new tab`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "var(--color-text, #111827)",
              color: "var(--color-bg, #ffffff)",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
              transition: "opacity 0.15s ease, transform 0.15s ease",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <span>Launch</span>
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </a>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.74rem",
              color: "var(--color-danger, #ef4444)",
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={13} /> {reason || "Restricted"}
          </span>
        )}
      </div>
    </div>
  );
}
