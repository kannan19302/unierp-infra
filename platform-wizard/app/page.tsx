"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { LayoutGrid, Search, Sparkles } from "lucide-react";
import {
  PlatformShell,
  PlatformWizardGrid,
  type WizardTile,
} from "@kannan19302/ui/shell";
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
 * The Global Platform Wizard & Onboarding Launchpad.
 *
 * Supports both:
 * 1. First-time registration & guided onboarding flow (?welcome=true)
 * 2. High-speed platform switcher grid (P1–P10)
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
  const [platformPreferences, setPlatformPreferences] = useState<PlatformWizardPreferences>(
    EMPTY_PLATFORM_PREFERENCES,
  );
  const [preferenceStatus, setPreferenceStatus] = useState("");

  useEffect(() => {
    if (isWelcome) {
      setOnboardingActive(true);
    }
  }, [isWelcome]);

  // Unauthenticated visitors are sent straight to sign-in, preserving
  // wherever they were headed (?next=) as the post-login destination —
  // the wizard itself has nothing meaningful to show someone with no session.
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

  // Preferences improve ordering only. They are deliberately loaded through a
  // separate request so a profile-service failure can never suppress the
  // policy-authoritative platform list.
  useEffect(() => {
    if (status !== "authenticated" || !accessToken || !claims?.sub || !claims.tenantId) return;
    let cancelled = false;
    const storageKey = preferenceStorageKey(claims.sub, claims.tenantId);

    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) setPlatformPreferences(parsePlatformPreferences(JSON.parse(cached)));
    } catch {
      // A corrupt or unavailable device cache is disposable; server state is
      // still loaded below and authorization never depends on this document.
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
        // Local fallback is intentionally retained when cross-device sync is
        // temporarily unavailable.
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
        // Cross-device persistence below remains available when storage is
        // disabled, full, or denied by the browser.
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
        ? "Platform preferences synced."
        : "Saved on this device; cross-device sync is temporarily unavailable.");
    }).catch(() => {
      setPreferenceStatus("Saved on this device; cross-device sync is temporarily unavailable.");
    });
  }, [accessToken, claims?.sub, claims?.tenantId]);

  // Deep-link handoff: once the entitled platform list has actually loaded
  // and includes the requested one, go straight there rather than making the
  // user click a tile they were already headed for.
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

  const tiles = useMemo<WizardTile[]>(
    () =>
      [...visiblePlatforms]
        // Favorites and recents are presentation hints only and are applied
        // after the policy response has already constrained this array.
        .sort((a, b) => {
          const favoriteDelta = Number(favoriteCodes.has(b.code)) - Number(favoriteCodes.has(a.code));
          if (favoriteDelta) return favoriteDelta;
          const recentA = recentOrder.get(a.code) ?? Number.MAX_SAFE_INTEGER;
          const recentB = recentOrder.get(b.code) ?? Number.MAX_SAFE_INTEGER;
          if (recentA !== recentB) return recentA - recentB;
          return platformOrder(a.code) - platformOrder(b.code);
        })
        .map((p) => {
          const meta = PLATFORM_META[p.code];
          const Icon = meta?.icon;
          return {
            key: p.code,
            name: p.name,
            description: meta?.description,
            href: p.baseUrl,
            disabled: !p.launchAllowed,
            // The tile type has always supported an icon; nothing ever passed
            // one, so every tile rendered an empty grey well.
            icon: Icon ? <Icon size={22} strokeWidth={1.75} aria-hidden="true" /> : undefined,
            accent: meta?.accent,
            accentDark: meta?.accentDark,
            favorite: favoriteCodes.has(p.code),
            onFavoriteChange: p.launchAllowed
              ? (favorite) => {
                  setPreferenceStatus("");
                  persistPlatformPreferences(setPlatformFavorite(platformPreferences, p.code, favorite));
                }
              : undefined,
            onLaunch: p.launchAllowed
              ? () => persistPlatformPreferences(recordRecentPlatform(platformPreferences, p.code))
              : undefined,
            // An audience is a property of the platform, not a description of
            // it — it used to occupy the description slot and crowd out the
            // real one.
            badge: (
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-semibold)",
                    padding: "2px var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    background:
                      p.code === "P2"
                        ? "rgba(71,85,105,0.15)"
                        : p.code === "P6"
                          ? "rgba(245,158,11,0.15)"
                          : "var(--color-bg-sunken)",
                    color:
                      p.code === "P2"
                        ? "#94a3b8"
                        : p.code === "P6"
                          ? "#fbbf24"
                          : "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.launchAllowed
                    ? p.code === "P2"
                      ? "PCC · 22 Apps"
                      : p.code === "P6"
                        ? "OCC · 22 Apps"
                        : p.audience === "INTERNAL"
                          ? "Internal"
                          : p.surfaceType === "NATIVE_CLIENT"
                            ? "Native app"
                            : p.code
                    : REASON_LABELS[p.reasonCodes[0] ?? ""] ?? "Unavailable"}
                </span>
              ),
          };
        }),
    [visiblePlatforms, favoriteCodes, recentOrder, persistPlatformPreferences, platformPreferences],
  );

  // `?next=` names a platform this account cannot reach (or that does not
  // exist). Previously the effect above simply found nothing and the user was
  // dropped on the grid with no explanation of why the deep link did nothing.
  const nextTarget = next && platforms?.find((platform) => platform.code === next);
  const nextMissing = !!next && platforms !== null && !nextTarget;
  const nextBlocked = !!nextTarget && !nextTarget.launchAllowed;
  const launchableCount = platforms?.filter((platform) => platform.launchAllowed).length ?? 0;

  return (
    <PlatformShell
      platformName="UniERP"
      accountCenterUrl={`${oidcConfig.issuer}/oidc/account`}
      environmentLabel={oidcConfig.issuer.includes("localhost") ? "Local" : "Production"}
      realmLabel={(claims as unknown as { realm?: string } | null)?.realm ?? "tenant"}
      user={
        claims
          ? {
              name:
                (claims as unknown as { name?: string }).name ?? claims.sub ?? "Signed in",
              email: (claims as unknown as { email?: string }).email ?? "",
            }
          : null
      }
      onSignOut={async () => {
        try {
          await fetch("/api/session", {
            method: "DELETE",
            credentials: "include",
            signal: AbortSignal.timeout(5_000),
          });
        } finally {
          // A slow or unavailable local session endpoint must never trap the
          // user in an authenticated UI. Central logout revokes every grant
          // from this SSO session and clears the IdP cookies.
          window.location.replace(
            createWizardOidcClient().buildLogoutUrl("http://localhost:4000/"),
          );
        }
      }}
      platformIcon={<LayoutGrid size={18} aria-hidden="true" />}
      accentColor="var(--color-primary)"
      headerActions={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setOnboardingActive(!onboardingActive)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "var(--radius-md, 8px)",
              background: onboardingActive ? "var(--color-bg-sunken)" : "rgba(72, 197, 206, 0.12)",
              border: `1px solid ${onboardingActive ? "var(--color-border)" : "rgba(72, 197, 206, 0.3)"}`,
              color: onboardingActive ? "var(--color-text)" : "var(--color-primary)",
              fontSize: "var(--text-xs, 0.78rem)",
              fontWeight: "var(--weight-semibold, 700)",
              cursor: "pointer",
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
        </div>
      }
    >
      {onboardingActive ? (
        <OnboardingFlow
          initialSlug={slug}
          initialName={orgName}
          initialIndustry={industry}
          onFinish={() => setOnboardingActive(false)}
        />
      ) : (
        <>
          <header className={styles.atlasHeader}>
            <div>
              <span className={styles.eyebrow}>Workspace atlas</span>
              <h1 className={styles.title}>Where do you want to work?</h1>
              <p aria-live="polite" className={styles.lede}>
              {platforms === null
                ? "Loading the platforms available to you…"
                : `${launchableCount} of ${platforms.length} visible platforms are ready to launch.`}
              </p>
            </div>
            <div className={styles.statusPlate} aria-label="Platform access summary">
              <span className={styles.statusNumber}>{launchableCount}</span>
              <span className={styles.statusLabel}>Launchable now</span>
              <span className={styles.statusRule} />
              <span className={styles.statusMeta}>{(platforms?.length ?? 0) - launchableCount} restricted or paused</span>
            </div>
            {(nextMissing || nextBlocked) && (
              <p
                role="status"
                className={styles.notice}
              >
                <strong>{next}</strong> {nextBlocked ? "cannot be launched right now" : "is not available for your account"}. Choose a platform below.
              </p>
            )}
          </header>

          <section className={styles.controls} aria-label="Filter platforms">
            <label className={styles.search}>
              <span className="sr-only">Search platforms</span>
              <Search size={17} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by platform, purpose, or code"
              />
            </label>
            <div className={styles.categories} aria-label="Platform categories">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item === "ALL" ? "All" : item.toLowerCase()}
                </button>
              ))}
            </div>
          </section>

          <p className={styles.preferenceStatus} role="status" aria-live="polite">
            {preferenceStatus}
          </p>

          <PlatformWizardGrid
            tiles={tiles}
            loading={status === "loading" || (status === "authenticated" && platforms === null && !fetchError)}
            error={fetchError}
            onRetry={() => setFetchAttempt((n) => n + 1)}
            forbidden={status === "authenticated" && platforms !== null && platforms.length === 0}
            emptyTitle="No platforms available"
            emptyDescription={platforms?.length
              ? "No platforms match this search and category."
              : "Your account is not currently entitled to any UniERP platform. Contact your administrator."}
          />
        </>
      )}
    </PlatformShell>
  );
}
