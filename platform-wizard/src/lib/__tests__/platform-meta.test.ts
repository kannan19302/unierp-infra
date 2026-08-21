import { describe, it, expect } from "vitest";
import { getContrastRatio } from "@kannan19302/ui/theme";
import { PLATFORM_META, platformOrder } from "../platform-meta";

/**
 * Surfaces the tile accent renders against, taken from the token themes:
 *   light.css --color-bg-elevated: #ffffff
 *   dark.css  --color-bg-elevated: #1a1b2e
 *
 * 4.5:1 (the text threshold) rather than 3:1 (non-text) because the accent is
 * also the icon glyph colour and, on hover, the card border — holding the
 * stricter bar leaves one number to reason about. The other five themes inherit
 * the light ramp, and high-contrast overrides the accent to --color-text in
 * wizard-grid.module.css, so neither needs its own assertion here.
 */
const LIGHT_SURFACE = "#ffffff";
const DARK_SURFACE = "#1a1b2e";
const AA_TEXT = 4.5;

describe("PLATFORM_META", () => {
  it("covers exactly P1–P10", () => {
    const codes = Object.keys(PLATFORM_META).sort((a, b) => platformOrder(a) - platformOrder(b));
    expect(codes).toEqual(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10"]);
  });

  it.each(Object.entries(PLATFORM_META))(
    "%s light accent clears WCAG AA on a light card",
    (_code, meta) => {
      expect(getContrastRatio(meta.accent, LIGHT_SURFACE)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it.each(Object.entries(PLATFORM_META))(
    "%s dark accent clears WCAG AA on a dark card",
    (_code, meta) => {
      expect(getContrastRatio(meta.accentDark, DARK_SURFACE)).toBeGreaterThanOrEqual(AA_TEXT);
    },
  );

  it("gives every platform a one-line description and an icon", () => {
    for (const [code, meta] of Object.entries(PLATFORM_META)) {
      // Not `toBeTypeOf("function")`: lucide ships its icons as forwardRef
      // exotic components, which are objects, not functions.
      expect(meta.icon, code).toBeTruthy();
      expect(meta.description.length, code).toBeGreaterThan(0);
      expect(meta.description.endsWith("."), `${code} description should not end in a period`).toBe(
        false,
      );
    }
  });
});

describe("platformOrder", () => {
  it("sorts P10 after P2, unlike the API's lexical ORDER BY", () => {
    // The bug this exists to prevent: "P10" < "P2" as strings.
    expect(["P10", "P2", "P1"].sort()).toEqual(["P1", "P10", "P2"]);
    expect(["P10", "P2", "P1"].sort((a, b) => platformOrder(a) - platformOrder(b))).toEqual([
      "P1",
      "P2",
      "P10",
    ]);
  });

  it("sends an unrecognised code to the end rather than to the front", () => {
    expect(platformOrder("nonsense")).toBeGreaterThan(platformOrder("P10"));
  });
});
