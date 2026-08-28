"use client";

import { useState } from "react";
import { ArrowUpRight, Star, AlertCircle, ShieldAlert } from "lucide-react";
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
  surfaceType,
  onFavoriteChange,
  onLaunch,
}: ModernPlatformCardProps) {
  const [hovered, setHovered] = useState(false);
  const meta = PLATFORM_META[code];
  const Icon = meta?.icon;
  const accent = meta?.accent || "var(--color-primary, #48c5ce)";
  const accentDark = meta?.accentDark || accent;
  const subModules = meta?.subModules || [];
  const defaultPort = meta?.defaultPort || "";
  const badgeLabel = meta?.badgeLabel || code;

  const handleCardClick = (e: React.MouseEvent) => {
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
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "var(--radius-xl, 16px)",
        background: "var(--color-bg-elevated)",
        border: `1px solid ${hovered && !disabled ? accent : "var(--color-border)"}`,
        boxShadow: hovered && !disabled
          ? `0 16px 32px -8px color-mix(in srgb, ${accent} 25%, transparent), 0 4px 12px rgba(0, 0, 0, 0.05)`
          : "0 2px 8px rgba(0, 0, 0, 0.04)",
        padding: "var(--space-5, 20px)",
        minHeight: "230px",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: hovered && !disabled ? "translateY(-4px)" : "translateY(0)",
        opacity: disabled ? 0.72 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        overflow: "hidden",
      }}
      onClick={handleCardClick}
    >
      {/* Top Accent Gradient Line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: disabled
            ? "var(--color-border)"
            : hovered
              ? `linear-gradient(90deg, ${accent}, var(--color-primary, #48c5ce))`
              : "transparent",
          transition: "all 0.25s ease",
        }}
      />

      {/* Card Header: Icon Well + Badges */}
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
          {/* Glowing Icon Well */}
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "var(--radius-lg, 12px)",
              background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 20%, transparent), color-mix(in srgb, ${accent} 6%, transparent))`,
              border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              boxShadow: hovered && !disabled ? `0 4px 14px color-mix(in srgb, ${accent} 30%, transparent)` : "none",
              transition: "all 0.25s ease",
              flexShrink: 0,
            }}
          >
            {Icon ? <Icon size={23} strokeWidth={2} /> : null}
          </div>

          {/* Platform Tag & Status */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "5px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
                padding: "3px 9px",
                borderRadius: "999px",
                background: disabled
                  ? "rgba(239, 68, 68, 0.12)"
                  : "var(--color-bg-sunken)",
                color: disabled ? "var(--color-danger, #ef4444)" : "var(--color-text-secondary)",
                border: `1px solid ${disabled ? "rgba(239, 68, 68, 0.3)" : "var(--color-border)"}`,
                whiteSpace: "nowrap",
              }}
            >
              {disabled ? (reason || "Restricted") : badgeLabel}
            </span>

            {/* Live Port / Status Indicator */}
            {!disabled && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  color: "#10b981",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                  }}
                />
                {typeof defaultPort === "number" ? `:${defaultPort}` : defaultPort}
              </span>
            )}
          </div>
        </div>

        {/* Platform Title & Description */}
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "1.08rem",
            fontWeight: 700,
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          {name}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: "0.82rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description || meta?.description}
        </p>

        {/* Feature Pills (Sub-Modules) */}
        {subModules.length > 0 && !disabled && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              marginTop: "12px",
            }}
          >
            {subModules.slice(0, 4).map((mod) => (
              <span
                key={mod}
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: "6px",
                  background: "var(--color-bg-sunken)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {mod}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        {/* Favorite Button */}
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
            borderRadius: "var(--radius-md, 8px)",
            background: favorite ? "rgba(245, 158, 11, 0.15)" : "transparent",
            border: `1px solid ${favorite ? "rgba(245, 158, 11, 0.4)" : "var(--color-border)"}`,
            color: favorite ? "#f59e0b" : "var(--color-text-secondary)",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Star size={14} fill={favorite ? "#f59e0b" : "none"} strokeWidth={2} />
        </button>

        {/* Launch Link / Action Trigger */}
        {!disabled ? (
          <a
            href={href}
            onClick={handleCardClick}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 12px",
              borderRadius: "var(--radius-md, 8px)",
              background: hovered ? accent : "var(--color-bg-sunken)",
              color: hovered ? "#ffffff" : "var(--color-text)",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              border: `1px solid ${hovered ? accent : "var(--color-border)"}`,
            }}
          >
            <span>Launch</span>
            <ArrowUpRight
              size={14}
              style={{
                transform: hovered ? "translate(2px, -2px)" : "translate(0, 0)",
                transition: "transform 0.2s ease",
              }}
            />
          </a>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "0.75rem",
              color: "var(--color-danger, #ef4444)",
              fontWeight: 600,
            }}
          >
            <ShieldAlert size={13} /> {reason || "Access Restricted"}
          </span>
        )}
      </div>
    </div>
  );
}
