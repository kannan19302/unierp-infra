"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@kannan19302/shared/auth-client/react";
import { LayoutGrid } from "lucide-react";
import {
  PlatformShell,
  PlatformWizardGrid,
  type WizardTile,
} from "@kannan19302/ui/shell";
import { oidcConfig } from "@/lib/oidc-config";
import { PLATFORM_META, platformOrder } from "@/lib/platform-meta";
import { ThemeToggle } from "./theme-toggle";

import { OnboardingFlow } from "@/components/OnboardingFlow";
import { Sparkles, Compass } from "lucide-react";

interface PlatformSummary {
  code: string;
  name: string;
  port: number;
  baseUrl: string;
  icon: string | null;
  audience: string;
}

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
  const { status, claims, accessToken, signIn, signOut } = useSession();
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
        if (!cancelled) setPlatforms(body.platforms);
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

  // Deep-link handoff: once the entitled platform list has actually loaded
  // and includes the requested one, go straight there rather than making the
  // user click a tile they were already headed for.
  useEffect(() => {
    if (!next || !platforms) return;
    const target = platforms.find((p) => p.code === next);
    if (target) window.location.assign(target.baseUrl);
  }, [next, platforms]);

  const tiles = useMemo<WizardTile[]>(
    () =>
      [...(platforms ?? [])]
        // The IdP orders by `code` as a STRING, so "P10" sorts before "P2" and
        // Desktop led the grid. Sort on the numeric suffix instead.
        .sort((a, b) => platformOrder(a.code) - platformOrder(b.code))
        .map((p) => {
          const meta = PLATFORM_META[p.code];
          const Icon = meta?.icon;
          return {
            key: p.code,
            name: p.name,
            description: meta?.description,
            href: p.baseUrl,
            // The tile type has always supported an icon; nothing ever passed
            // one, so every tile rendered an empty grey well.
            icon: Icon ? <Icon size={22} strokeWidth={1.75} aria-hidden="true" /> : undefined,
            accent: meta?.accent,
            accentDark: meta?.accentDark,
            // An audience is a property of the platform, not a description of
            // it — it used to occupy the description slot and crowd out the
            // real one.
            badge:
              p.audience === "INTERNAL" ? (
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-semibold)",
                    padding: "2px var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-bg-sunken)",
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Internal
                </span>
              ) : undefined,
          };
        }),
    [platforms],
  );

  // `?next=` names a platform this account cannot reach (or that does not
  // exist). Previously the effect above simply found nothing and the user was
  // dropped on the grid with no explanation of why the deep link did nothing.
  const nextMissing =
    !!next && platforms !== null && !platforms.some((p) => p.code === next);

  return (
    <PlatformShell
      platformName="UniERP"
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
        await fetch("/api/session", { method: "DELETE", credentials: "include" });
        signOut();
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
          <ThemeToggle />
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
          <header
            style={{
              maxWidth: "var(--content-max-width)",
              margin: "0 auto",
              padding: "var(--space-8) var(--space-6) 0",
            }}
          >
            <h1
              style={{
                fontSize: "var(--text-3xl)",
                fontWeight: "var(--weight-semibold)",
                color: "var(--color-text)",
                margin: 0,
              }}
            >
              Choose a platform
            </h1>
            <p
              aria-live="polite"
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-base)",
                marginTop: "var(--space-2)",
                marginBottom: 0,
              }}
            >
              {platforms === null
                ? "Loading the platforms available to you…"
                : tiles.length === 1
                  ? "1 platform is available to you."
                  : `${tiles.length} platforms are available to you.`}
            </p>
            {nextMissing && (
              <p
                role="status"
                style={{
                  marginTop: "var(--space-4)",
                  marginBottom: 0,
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-warning-light, var(--color-bg-sunken))",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "var(--text-sm)",
                }}
              >
                <strong>{next}</strong> is not available for your account. Choose a platform below.
              </p>
            )}
          </header>

          <PlatformWizardGrid
            tiles={tiles}
            loading={status === "loading" || (status === "authenticated" && platforms === null && !fetchError)}
            error={fetchError}
            onRetry={() => setFetchAttempt((n) => n + 1)}
            forbidden={status === "authenticated" && platforms !== null && platforms.length === 0}
            emptyTitle="No platforms available"
            emptyDescription="Your account is not currently entitled to any UniERP platform. Contact your administrator."
          />
        </>
      )}
    </PlatformShell>
  );
}
