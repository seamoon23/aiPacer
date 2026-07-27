import { describe, expect, it } from "vitest";

import { getAiPacerStructuredData } from "./seo";
import { SITE_URL } from "./siteMetadata";

describe("getAiPacerStructuredData", () => {
  it("returns website, web application, and faq schemas for the calculator", () => {
    const structuredData = getAiPacerStructuredData(
      `${SITE_URL}/ai-pacer/`
    );

    expect(structuredData).toHaveLength(3);
    expect(structuredData[0]?.["@type"]).toBe("WebSite");
    expect(structuredData[0]?.url).toBe(`${SITE_URL}/`);
    expect(structuredData[1]?.url).toBe(`${SITE_URL}/ai-pacer/`);
    expect(structuredData[1]?.["@type"]).toBe("WebApplication");
    expect(structuredData[2]?.["@type"]).toBe("FAQPage");
    expect(JSON.stringify(structuredData[1])).toContain("작업 횟수");
    expect(JSON.stringify(structuredData[2])).toContain("Chrome 확장 프로그램");
    expect(JSON.stringify(structuredData)).not.toContain("localStorage");
  });
});