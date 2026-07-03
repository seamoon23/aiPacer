import { describe, expect, it } from "vitest";

import {
  getProviderUsageDirection,
  normalizeDisplayedUsageValue,
  toProviderDisplayValue
} from "./providerDisplay";

describe("provider display conversion", () => {
  it("converts Claude's 0-to-100 display value into remaining percentage", () => {
    expect(getProviderUsageDirection("claude")).toBe("used-up");
    expect(normalizeDisplayedUsageValue("claude", 43)).toBe(57);
    expect(toProviderDisplayValue("claude", 57)).toBe(43);
  });

  it("keeps Codex's 100-to-0 display value as remaining percentage", () => {
    expect(getProviderUsageDirection("codex")).toBe("remaining-down");
    expect(normalizeDisplayedUsageValue("codex", 43)).toBe(43);
    expect(toProviderDisplayValue("codex", 43)).toBe(43);
  });
});
