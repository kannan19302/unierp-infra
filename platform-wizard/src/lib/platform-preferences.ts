export interface RecentPlatform {
  code: string;
  openedAt: string;
}

export interface PlatformWizardPreferences {
  favoriteCodes: string[];
  recent: RecentPlatform[];
}

export const EMPTY_PLATFORM_PREFERENCES: PlatformWizardPreferences = {
  favoriteCodes: [],
  recent: [],
};

const MAX_FAVORITES = 12;
const MAX_RECENT = 5;
const PLATFORM_CODE = /^P(?:[1-9]|10)$/;

function codes(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.toUpperCase())
    .filter((item) => PLATFORM_CODE.test(item))))
    .slice(0, limit);
}

/**
 * Treat saved preferences as untrusted input. They are presentation hints and
 * are never used as an entitlement source; callers must still intersect them
 * with the IdP platform-policy response.
 */
export function parsePlatformPreferences(value: unknown): PlatformWizardPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_PLATFORM_PREFERENCES;
  }

  const record = value as Record<string, unknown>;
  const recent = Array.isArray(record.recent)
    ? record.recent
        .flatMap((item): RecentPlatform[] => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const candidate = item as Record<string, unknown>;
          const code = typeof candidate.code === "string" ? candidate.code.toUpperCase() : "";
          const openedAt = typeof candidate.openedAt === "string" ? candidate.openedAt : "";
          if (!PLATFORM_CODE.test(code) || !Number.isFinite(Date.parse(openedAt))) return [];
          return [{ code, openedAt: new Date(openedAt).toISOString() }];
        })
        .sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt))
        .filter((entry, index, all) => all.findIndex((item) => item.code === entry.code) === index)
        .slice(0, MAX_RECENT)
    : [];

  return {
    favoriteCodes: codes(record.favoriteCodes, MAX_FAVORITES),
    recent,
  };
}

export function setPlatformFavorite(
  current: PlatformWizardPreferences,
  code: string,
  favorite: boolean,
): PlatformWizardPreferences {
  const normalized = code.toUpperCase();
  if (!PLATFORM_CODE.test(normalized)) return parsePlatformPreferences(current);
  const without = current.favoriteCodes.filter((item) => item !== normalized);
  return parsePlatformPreferences({
    ...current,
    favoriteCodes: favorite ? [normalized, ...without] : without,
  });
}

export function recordRecentPlatform(
  current: PlatformWizardPreferences,
  code: string,
  openedAt = new Date(),
): PlatformWizardPreferences {
  const normalized = code.toUpperCase();
  if (!PLATFORM_CODE.test(normalized) || !Number.isFinite(openedAt.getTime())) {
    return parsePlatformPreferences(current);
  }
  return parsePlatformPreferences({
    ...current,
    recent: [
      { code: normalized, openedAt: openedAt.toISOString() },
      ...current.recent.filter((item) => item.code !== normalized),
    ],
  });
}

export function preferenceStorageKey(userId: string, tenantId: string): string {
  return `unierp.platform-wizard.preferences.${encodeURIComponent(userId)}.${encodeURIComponent(tenantId)}`;
}

