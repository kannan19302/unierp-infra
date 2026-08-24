import { describe, expect, it } from "vitest";
import {
  parsePlatformPreferences,
  preferenceStorageKey,
  recordRecentPlatform,
  setPlatformFavorite,
} from "../platform-preferences";

describe("platform preferences", () => {
  it("sanitizes, deduplicates and caps untrusted preference input", () => {
    const parsed = parsePlatformPreferences({
      favoriteCodes: ["p3", "P3", "P11", 7, ...Array.from({ length: 20 }, () => "P4")],
      recent: [
        { code: "p7", openedAt: "2026-08-24T10:00:00Z" },
        { code: "P7", openedAt: "2026-08-23T10:00:00Z" },
        { code: "P2", openedAt: "not-a-date" },
        { code: "P99", openedAt: "2026-08-24T10:00:00Z" },
      ],
    });

    expect(parsed.favoriteCodes).toEqual(["P3", "P4"]);
    expect(parsed.recent).toEqual([
      { code: "P7", openedAt: "2026-08-24T10:00:00.000Z" },
    ]);
  });

  it("toggles favorites without duplicates", () => {
    const added = setPlatformFavorite({ favoriteCodes: ["P3"], recent: [] }, "p7", true);
    expect(added.favoriteCodes).toEqual(["P7", "P3"]);
    expect(setPlatformFavorite(added, "P3", false).favoriteCodes).toEqual(["P7"]);
  });

  it("records most-recent-first history and keeps only five unique codes", () => {
    let value = parsePlatformPreferences({});
    for (let index = 1; index <= 6; index += 1) {
      value = recordRecentPlatform(value, `P${index}`, new Date(`2026-08-24T10:00:0${index}Z`));
    }
    expect(value.recent.map((item) => item.code)).toEqual(["P6", "P5", "P4", "P3", "P2"]);

    value = recordRecentPlatform(value, "P3", new Date("2026-08-24T11:00:00Z"));
    expect(value.recent.map((item) => item.code)).toEqual(["P3", "P6", "P5", "P4", "P2"]);
  });

  it("scopes the local fallback by principal and tenant", () => {
    expect(preferenceStorageKey("user/a", "tenant b"))
      .toBe("unierp.platform-wizard.preferences.user%2Fa.tenant%20b");
  });
});
