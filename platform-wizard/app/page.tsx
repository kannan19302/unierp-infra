"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { Search, Sparkles, AlertTriangle } from "lucide-react";
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

// Static Atlas Index mapping for clean reference summary
const ATLAS_INDEX_ITEMS = [
  { code: "P1 Corporate", label: "Marketing" },
  { code: "P3 Core Suite", label: "Tenant Apps" },
  { code: "P4 Hosted Web", label: "Tenant Sites" },
  { code: "P7 Ecosystem", label: "Marketplace" },
  { code: "P8 Developer", label: "APIs & SDKs" },
  { code: "OCC Org Control", label: "22 apps" },
  { code: "PCC Provider Control", label: "22 apps" },
];

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

  // Deep-link auto handoff opens in new tab if next param is provided
  useEffect(() => {
    if (!next || !platforms) return;
    const target = platforms.find((p) => p.code === next);
    if (target?.launchAllowed) window.open(target.baseUrl, "_blank", "noopener,noreferrer");
  }, [next, platforms]);

  const categories = useMemo(
    () => [
      "ALL",
      "CONTROL CENTERS",
      "FAVORITES",
      ...Array.from(new Set((platforms ?? []).map((platform) => platform.category))).filter(Boolean),
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
  const totalPlatformsCount = platforms?.length ?? 9;
  const isLoading = status === "loading" || (status === "authenticated" && platforms === null && !fetchError);

  return (
    <div className={styles.pageContainer}>
      {/* Top Universal Minimal Navbar */}
      <header className={styles.topNavbar}>
        {/* Brand Group */}
        <div className={styles.brandGroup}>
          <div className={styles.brandBadge}>U</div>
          <span className={styles.brandName}>UniERP</span>
          <div className={styles.navDivider} />
          <span className={styles.navTitle}>Workspace Atlas</span>
          <span className={styles.portBadge}>:4000</span>
        </div>

        {/* Header Right Actions */}
        <div className={styles.navActions}>
          {/* Quick Spotlight Shortcut */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className={styles.searchNavBtn}
            aria-label="Spotlight Search (Cmd+K)"
          >
            <span>Search</span>
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>⌘K</span>
          </button>

          {/* Guided Setup Switcher Button */}
          <button
            type="button"
            onClick={() => setOnboardingActive(!onboardingActive)}
            className={styles.guidedSetupBtn}
          >
            <Sparkles size={13} fill="currentColor" />
            <span>{onboardingActive ? "Platform Grid" : "Guided Setup"}</span>
          </button>

          {/* Night/Day Mode Toggle */}
          <ThemeToggle />

          {/* User Profile Avatar */}
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
            {/* Hero & Atlas Section Layout */}
            <section className={styles.atlasHeroLayout}>
              {/* Left Column: Eyebrow, Title, Subtitle, and Embedded Search */}
              <div className={styles.heroLeft}>
                <span className={styles.eyebrow}>
                  — WORKSPACE ATLAS
                </span>
                <h1 className={styles.title}>Where do you want to work?</h1>
                <p aria-live="polite" className={styles.lede}>
                  {platforms === null
                    ? "Evaluating entitled platforms for your profile…"
                    : `${launchableCount} of ${totalPlatformsCount} enterprise platforms ready to launch.`}
                </p>

                {/* Embedded Search Input */}
                <div className={styles.searchBarEmbedded}>
                  <Search size={15} aria-hidden="true" style={{ color: "var(--color-text-muted, #94a3b8)", flexShrink: 0 }} />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by platform or module — Finance, IAM, SDK..."
                    aria-label="Search platforms or modules"
                  />
                  <kbd className={styles.searchKbd} title="Press / to search" aria-hidden="true">/</kbd>
                </div>

                {(nextMissing || nextBlocked) && (
                  <p role="status" style={{ margin: "16px 0 0", padding: "10px 14px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger, #ef4444)", fontSize: "0.82rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                    <strong>{next}</strong> {nextBlocked ? "cannot be launched right now" : "is not entitled for your session"}. Select another platform below.
                  </p>
                )}
              </div>

              {/* Right Column: Atlas Index Card */}
              <div className={styles.atlasIndexCard} aria-label="Atlas Index Summary">
                <div className={styles.atlasIndexHeader}>
                  <span className={styles.atlasIndexTitle}>ATLAS INDEX</span>
                  <span className={styles.atlasIndexStatus}>
                    {launchableCount}/{totalPlatformsCount} active
                  </span>
                </div>
                <div className={styles.atlasIndexList}>
                  {ATLAS_INDEX_ITEMS.map((item) => (
                    <div key={item.code} className={styles.atlasIndexRow}>
                      <span className={styles.atlasIndexCode}>{item.code}</span>
                      <span className={styles.atlasIndexAudience}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Underline Tab Navigation */}
            <nav className={styles.tabNavSection} aria-label="Platform Categories">
              <div className={styles.underlineTabBar}>
                {categories.map((item) => {
                  const isActive = category === item;
                  const label =
                    item === "ALL"
                      ? "All Platforms"
                      : item === "CONTROL CENTERS"
                        ? "Control Centers"
                        : item === "FAVORITES"
                          ? "Favorites"
                          : item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();

                  return (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
                      onClick={() => setCategory(item)}
                      aria-pressed={isActive}
                    >
                      <span>{label}</span>
                      {categoryCounts[item] !== undefined && (
                        <span className={styles.tabCount}>{categoryCounts[item]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Status Message */}
            {preferenceStatus && (
              <p className={styles.preferenceStatus} role="status" aria-live="polite">
                {preferenceStatus}
              </p>
            )}

            {/* Modern Platform Cards Grid */}
            {isLoading ? (
              <div className={styles.modernGrid} aria-busy="true">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: "245px",
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
                    background: "var(--color-text, #111827)",
                    color: "var(--color-bg, #ffffff)",
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
