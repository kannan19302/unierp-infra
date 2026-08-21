import {
  Code2,
  Globe,
  LayoutGrid,
  Megaphone,
  Monitor,
  PenTool,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";

/**
 * Per-platform presentation for the wizard grid.
 *
 * Deliberately NOT in @kannan19302/ui/shell/manifest.ts: that module defines
 * only the SHAPE of a platform manifest and is dependency-free on purpose — its
 * own comment keeps icons as bare strings "so this schema has no dependency on
 * lucide-react or any icon set". The concrete registry therefore belongs to the
 * consuming app, which is this one.
 *
 * Deliberately NOT in the database either. The `platforms.icon` column exists
 * and is NULL for all ten rows; an icon choice and an accent are presentation,
 * and routing them through GET /auth/platforms would turn a visual tweak into a
 * migration plus an API change.
 *
 * Accents come in a light/dark PAIR rather than a single hex, because a
 * 600-level hue that clears 4.5:1 on a white card drops to roughly 2:1 on the
 * dark theme's #1a1b2e surface. Both directions are asserted in
 * __tests__/platform-meta.test.ts — adjust a hex the test rejects, never the
 * threshold.
 */
export interface PlatformMeta {
  icon: LucideIcon;
  /** Accent for the light-family themes; must clear 4.5:1 on #ffffff. */
  accent: string;
  /** Accent under [data-theme="dark"]; must clear 4.5:1 on #1a1b2e. */
  accentDark: string;
  /** One line, sentence case, no trailing period — rendered under the name. */
  description: string;
}

/**
 * Codes and names are authoritative in data/prisma/seed-platform-entitlement.ts.
 *
 * Hues are picked for separation across ten tiles while harmonising with the
 * accent each sibling platform already uses on its own landing page: P5 violet
 * ≈ web-studio, P7 sky ≈ marketplace, P8 blue ≈ developer-platform, P6 amber ≈
 * tenant-admin, P10 emerald ≈ tenant-sites. P2 is deliberately neutral slate —
 * it is internal tooling, not a product.
 */
export const PLATFORM_META: Record<string, PlatformMeta> = {
  P1: {
    icon: Megaphone,
    accent: "#c2410c",
    accentDark: "#fb923c",
    description: "Public marketing and product pages",
  },
  P2: {
    icon: ShieldCheck,
    accent: "#475569",
    accentDark: "#94a3b8",
    description: "Control-plane operations for UniERP staff",
  },
  P3: {
    icon: LayoutGrid,
    accent: "#4f46e5",
    accentDark: "#818cf8",
    description: "Your installed business modules",
  },
  P4: {
    icon: Globe,
    accent: "#0f766e",
    accentDark: "#2dd4bf",
    description: "Live customer-facing websites",
  },
  P5: {
    icon: PenTool,
    accent: "#7c3aed",
    accentDark: "#a78bfa",
    description: "Visual page and site builder",
  },
  P6: {
    icon: SlidersHorizontal,
    accent: "#b45309",
    accentDark: "#fbbf24",
    description: "Users, roles, billing and settings",
  },
  P7: {
    icon: Store,
    accent: "#0369a1",
    accentDark: "#38bdf8",
    description: "Discover and install modules",
  },
  P8: {
    icon: Code2,
    accent: "#1d4ed8",
    accentDark: "#60a5fa",
    description: "APIs, keys, webhooks and docs",
  },
  P9: {
    icon: Smartphone,
    accent: "#be185d",
    accentDark: "#f472b6",
    description: "The UniERP mobile experience",
  },
  P10: {
    icon: Monitor,
    accent: "#047857",
    accentDark: "#34d399",
    description: "The installable desktop client",
  },
};

/**
 * Sort key for a platform code.
 *
 * Platform codes are stored and returned as strings, so the IdP's
 * `orderBy: { code: "asc" }` sorts them lexically — which puts P10 ahead of P2
 * and made "Desktop" the first tile in the wizard. Sorting on the numeric
 * suffix restores P1…P10.
 */
export function platformOrder(code: string): number {
  const n = Number.parseInt(code.replace(/^P/i, ""), 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}
