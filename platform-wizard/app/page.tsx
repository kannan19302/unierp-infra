"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { Command, LayoutGrid, Search, Sparkles, AlertTriangle } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { createWizardOidcClient, oidcConfig } from "@/lib/oidc-config";
import { PLATFORM_META, platformOrder } from "@/lib/platform-meta";
import {
  EMPTY_PLATFORM_PREFERENCES,
  parsePlatformPreferences,
  preferenceStorageKey,
  recordRecentPlatform,
  setPlatformFavorite,
  type PlatformWizardPreferences,
} from "@/lib/platform-preferences";
import styles from "./page.module.css";

import { OnboardingFlow } from "@/components/OnboardingFlow";
import { ModernPlatformCard } from "@/components/ModernPlatformCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileMenu } from "@/components/UserProfileMenu";
import { CommandPalette } from "@/components/CommandPalette";

interface PlatformSummary {
  code: string;
  name: string;
  port: number;
  baseUrl: string;
  icon: string | null;
  audience: string;
  lifecycle: string;
  surfaceType: string;
  category: string;
  visibility: "VISIBLE_ENABLED" | "VISIBLE_DISABLED";
  launchAllowed: boolean;
  reasonCodes: string[];
  obligations: string[];
}

const REASON_LABELS: Record<string, string> = {
  PLATFORM_MAINTENANCE: "Maintenance",
  PLATFORM_SUSPENDED: "Suspended",
  STEP_UP_REQUIRED: "Verification required",
  EXPLICIT_DENY: "Restricted",
  NO_MATCHING_ENTITLEMENT: "Not entitled",
};

/**
 * The Global Platform Wizard & Workspace Atlas (Port 4000).
 */
export default function WizardPage() {
  return (
    <Suspense fallback={null}>
      <WizardPageInner />
    </Suspense>
  );
}

function WizardPageInner() {
  const { status, claims, accessToken, signIn } = useSession();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const isWelcome = searchParams.get("welcome") === "true";
  const slug = searchParams.get("slug") || "";
  const industry = searchParams.get("industry") || "manufacturing";
  const orgName = searchParams.get("name") || "My Organization";

  const [onboardingActive, setOnboardingActive] = useState(isWelcome);
  const [platforms, setPlatforms] = useState<PlatformSummary[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchAttempt, setFetchAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [platformPreferences, setPlatformPreferences] = useState<PlatformWizardPreferences>(
    EMPTY_PLATFORM_PREFERENCES,
  );
  const [preferenceStatus, setPreferenceStatus] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts: "/" or "Cmd/Ctrl+K"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      if (onboardingActive || commandPaletteOpen) return;
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery("");
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onboardingActive, commandPaletteOpen, query]);

  useEffect(() => {
    if (isWelcome) {
      setOnboardingActive(true);
    }
  }, [isWelcome]);

  // Unauthenticated visitors redirect to sign-in
  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn({ returnTo: next ? `/?next=${encodeURIComponent(next)}` : "/" });
    }
  }, [status, next, signIn]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;
    let cancelled = false;

    (async () => {
      setFetchError(null);
      try {
        const res = await fetch(new URL("/api/v1/auth/platforms", oidcConfig.issuer), {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error(`Platform list request failed (${res.status})`);
        const body = await res.json();
        if (!cancelled) setPlatforms(Array.isArray(body.platforms) ? body.platforms : []);
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : "Could not load platforms");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, accessToken, fetchAttempt]);

  // Load preferences
  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !claims?.sub || !claims.tenantId) return;
    let cancelled = false;
    const storageKey = preferenceStorageKey(claims.sub, claims.tenantId);

    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) setPlatformPreferences(parsePlatformPreferences(JSON.parse(cached)));
    } catch {
      // Storage fallback
    }

    (async () => {
      try {
        const response = await fetch(new URL("/api/v1/auth/me", oidcConfig.issuer), {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const profile = await response.json() as { preferences?: Record<string, unknown> };
        const remote = profile.preferences?.platformWizard;
        if (!remote || cancelled) return;
        const parsed = parsePlatformPreferences(remote);
        setPlatformPreferences(parsed);
        window.localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch {
        // Fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, accessToken, claims?.sub, claims?.tenantId]);

  const persistPlatformPreferences = useCallback((nextPreferences: PlatformWizardPreferences) => {
    const sanitized = parsePlatformPreferences(nextPreferences);
    setPlatformPreferences(sanitized);

    if (claims?.sub && claims.tenantId) {
      try {
        window.localStorage.setItem(
          preferenceStorageKey(claims.sub, claims.tenantId),
          JSON.stringify(sanitized),
        );
      } catch {
        // Fallback
      }
    }

    if (!accessToken) return;
    void fetch(new URL("/api/v1/auth/me", oidcConfig.issuer), {
      method: "PATCH",
      keepalive: true,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ preferences: { platformWizard: sanitized } }),
    }).then((response) => {
      setPreferenceStatus(response.ok
        ? "Preferences synced across devices."
        : "Saved locally on this device.");
    }).catch(() => {
      setPreferenceStatus("Saved locally on this device.");
    });
  }, [accessToken, claims?.sub, claims?.tenantId]);

  // Deep-link auto handoff
  useEffect(() => {
    if (!next || !platforms) return;
    const target = platforms.find((p) => p.code === next);
    if (target?.launchAllowed) window.location.assign(target.baseUrl);
  }, [next, platforms]);

  const categories = useMemo(
    () => [
      "ALL",
      "CONTROL CENTERS",
      "FAVORITES",
      ...Array.from(new Set((platforms ?? []).map((platform) => platform.category))),
    ],
    [platforms],
  );

  const favoriteCodes = useMemo(
    () => new Set(platformPreferences.favoriteCodes),
    [platformPreferences.favoriteCodes],
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const platformList = platforms ?? [];
    counts["ALL"] = platformList.length;
    counts["CONTROL CENTERS"] = platformList.filter((p) => p.code === "P2" || p.code === "P6").length;
    counts["FAVORITES"] = platformList.filter((p) => favoriteCodes.has(p.code)).length;
    for (const p of platformList) {
      if (p.category) {
        counts[p.category] = (counts[p.category] ?? 0) + 1;
      }
    }
    return counts;
  }, [platforms, favoriteCodes]);

  const recentOrder = useMemo(
    () => new Map(platformPreferences.recent.map((item, index) => [item.code, index])),
    [platformPreferences.recent],
  );

  const visiblePlatforms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (platforms ?? []).filter((platform) => {
      const isControlCenter = platform.code === "P2" || platform.code === "P6";
      const matchesCategory =
        category === "ALL" ||
        (category === "CONTROL CENTERS"
          ? isControlCenter
          : category === "FAVORITES"
            ? favoriteCodes.has(platform.code)
            : platform.category === category);
      const meta = PLATFORM_META[platform.code];
      const matchesQuery =
        !normalized ||
        platform.name.toLowerCase().includes(normalized) ||
        platform.code.toLowerCase().includes(normalized) ||
        meta?.description?.toLowerCase().includes(normalized) ||
        meta?.subModules?.some((m) => m.toLowerCase().includes(normalized)) ||
        (platform.code === "P2" &&
          (normalized.includes("pcc") ||
            normalized.includes("provider") ||
            normalized.includes("control center"))) ||
        (platform.code === "P6" &&
          (normalized.includes("occ") ||
            normalized.includes("tenant") ||
            normalized.includes("organization") ||
            normalized.includes("control center")));
      return matchesCategory && matchesQuery;
    });
  }, [platforms, category, query, favoriteCodes]);

  const sortedPlatforms = useMemo(() => {
    return [...visiblePlatforms].sort((a, b) => {
      const favoriteDelta = Number(favoriteCodes.has(b.code)) - Number(favoriteCodes.has(a.code));
      if (favoriteDelta) return favoriteDelta;
      const recentA = recentOrder.get(a.code) ?? Number.MAX_SAFE_INTEGER;
      const recentB = recentOrder.get(b.code) ?? Number.MAX_SAFE_INTEGER;
      if (recentA !== recentB) return recentA - recentB;
      return platformOrder(a.code) - platformOrder(b.code);
    });
  }, [visiblePlatforms, favoriteCodes, recentOrder]);

  const handleSignOut = async () => {
    try {
      await fetch("/api/session", {
        method: "DELETE",
        credentials: "include",
        signal: AbortSignal.timeout(5_000),
      });
    } finally {
      window.location.replace(
        createWizardOidcClient().buildLogoutUrl("http://localhost:4000/"),
      );
    }
  };

  const nextTarget = next && platforms?.find((platform) => platform.code === next);
  const nextMissing = !!next && platforms !== null && !nextTarget;
  const nextBlocked = !!nextTarget && !nextTarget.launchAllowed;
  const launchableCount = platforms?.filter((platform) => platform.launchAllowed).length ?? 0;
  const isLoading = status === "loading" || (status === "authenticated" && platforms === null && !fetchError);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-bg)" }}>
      {/* Top Universal Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
          padding: "0 var(--space-6)",
          background: "var(--color-bg-elevated)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Brand Mark + Platform Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <BrandMark size="sm" />
          <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--color-text)", letterSpacing: "-0.02em" }}>
              Workspace Atlas
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: "999px",
                background: "rgba(72, 197, 206, 0.12)",
                color: "var(--color-primary)",
                border: "1px solid rgba(72, 197, 206, 0.3)",
              }}
            >
              Port 4000
            </span>
          </div>
        </div>

        {/* Header Right Actions: Quick Search, Guided Setup, Theme Toggle, Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Spotlight Shortcut button */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Spotlight Search"
            title="Press Cmd+K or Ctrl+K to search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "var(--radius-md, 8px)",
              background: "var(--color-bg-sunken)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Command size={13} />
            <span>Search</span>
            <kbd style={{ fontSize: "0.7rem", padding: "0 4px", border: "1px solid var(--color-border)", borderRadius: "3px" }}>K</kbd>
          </button>

          {/* Guided Setup Switcher */}
          <button
            type="button"
            onClick={() => setOnboardingActive(!onboardingActive)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "var(--radius-md, 8px)",
              background: onboardingActive ? "var(--color-bg-sunken)" : "linear-gradient(135deg, #0d7377, #48c5ce)",
              border: onboardingActive ? "1px solid var(--color-border)" : "none",
              color: onboardingActive ? "var(--color-text)" : "#14171a",
              fontSize: "0.78rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: onboardingActive ? "none" : "0 2px 10px rgba(72, 197, 206, 0.35)",
              transition: "all 0.2s ease",
            }}
          >
            {onboardingActive ? (
              <>
                <LayoutGrid size={13} /> Platform Grid
              </>
            ) : (
              <>
                <Sparkles size={13} /> Guided Setup
              </>
            )}
          </button>

          {/* Night Mode Toggle */}
          <ThemeToggle />

          {/* User Profile Avatar with Account Center Menu */}
          <UserProfileMenu
            user={
              claims
                ? {
                    name: (claims as unknown as { name?: string }).name ?? claims.sub ?? "Administrator",
                    email: (claims as unknown as { email?: string }).email ?? "admin@unierp.local",
                  }
                : null
            }
            accountCenterUrl={`${oidcConfig.issuer}/oidc/account`}
            realmLabel={(claims as unknown as { realm?: string } | null)?.realm ?? "tenant"}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main id="unierp-main" style={{ flex: 1 }}>
        {onboardingActive ? (
          <OnboardingFlow
            initialSlug={slug}
            initialName={orgName}
            initialIndustry={industry}
            onFinish={() => setOnboardingActive(false)}
          />
        ) : (
          <>
            {/* Compact Header Section */}
            <header className={styles.atlasHeader}>
              <div>
                <span className={styles.eyebrow}>
                  <Sparkles size={13} /> Workspace atlas
                </span>
                <h1 className={styles.title}>Where do you want to work?</h1>
                <p aria-live="polite" className={styles.lede}>
                  {platforms === null
                    ? "Evaluating entitled platforms for your profile…"
                    : `${launchableCount} of ${platforms.length} enterprise platforms ready to launch.`}
                </p>
              </div>

              {/* Status Metric Plate */}
              <div className={styles.statusPlate} aria-label="Platform access summary">
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span className={styles.statusNumber}>{launchableCount}</span>
                  <span className={styles.statusLabel}>Launchable Platforms</span>
                </div>
                <div className={styles.statusRule} />
                <span className={styles.statusMeta}>
                  {(platforms?.length ?? 0) - launchableCount === 0
                    ? "All platforms active & entitled"
                    : `${(platforms?.length ?? 0) - launchableCount} restricted or under maintenance`}
                </span>
              </div>

              {(nextMissing || nextBlocked) && (
                <p role="status" className={styles.notice}>
                  <AlertTriangle size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                  <strong>{next}</strong> {nextBlocked ? "cannot be launched right now" : "is not entitled for your session"}. Select another platform below.
                </p>
              )}
            </header>

            {/* Filter & Search Bar */}
            <section className={styles.controls} aria-label="Filter platforms">
              <label className={styles.search}>
                <span className="sr-only">Search platforms</span>
                <Search size={16} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by platform, module (e.g. Finance, CRM, IAM), or code..."
                  aria-keyshortcuts="/"
                />
                <kbd className={styles.searchKbd} title="Press / to search" aria-hidden="true">/</kbd>
              </label>

              <div className={styles.categories} aria-label="Platform categories">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    <span>{item === "ALL" ? "All Platforms" : item.toLowerCase()}</span>
                    {categoryCounts[item] !== undefined && (
                      <span className={styles.categoryCount}>{categoryCounts[item]}</span>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* Status Message */}
            <p className={styles.preferenceStatus} role="status" aria-live="polite">
              {preferenceStatus}
            </p>

            {/* Modern Platform Cards Grid */}
            {isLoading ? (
              <div className={styles.modernGrid} aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: "230px",
                      borderRadius: "16px",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : fetchError ? (
              <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "30px" }}>
                <div style={{ color: "var(--color-danger, #ef4444)", fontWeight: 700, marginBottom: "8px" }}>
                  Failed to load platforms
                </div>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
                  {fetchError}
                </p>
                <button
                  type="button"
                  onClick={() => setFetchAttempt((n) => n + 1)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "var(--color-primary)",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Retry Connection
                </button>
              </div>
            ) : sortedPlatforms.length === 0 ? (
              <div style={{ maxWidth: "500px", margin: "40px auto", textAlign: "center", padding: "30px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", marginBottom: "6px" }}>
                  No platforms found
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                  No platforms match your active filter "{query || category}".
                </p>
              </div>
            ) : (
              <div className={styles.modernGrid}>
                {sortedPlatforms.map((p) => {
                  const meta = PLATFORM_META[p.code];
                  return (
                    <ModernPlatformCard
                      key={p.code}
                      code={p.code}
                      name={p.name}
                      description={meta?.description}
                      href={p.baseUrl}
                      disabled={!p.launchAllowed}
                      reason={REASON_LABELS[p.reasonCodes?.[0] ?? ""]}
                      favorite={favoriteCodes.has(p.code)}
                      audience={p.audience}
                      surfaceType={p.surfaceType}
                      onFavoriteChange={
                        p.launchAllowed
                          ? (fav) => {
                              setPreferenceStatus("");
                              persistPlatformPreferences(
                                setPlatformFavorite(platformPreferences, p.code, fav),
                              );
                            }
                          : undefined
                      }
                      onLaunch={
                        p.launchAllowed
                          ? () => persistPlatformPreferences(recordRecentPlatform(platformPreferences, p.code))
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Universal Command Palette (Cmd+K) */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        platforms={platforms || []}
      />
    </div>
  );
}
