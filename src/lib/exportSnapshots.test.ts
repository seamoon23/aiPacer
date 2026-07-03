import { describe, expect, it, vi } from "vitest";

import {
  buildSnapshotsExport,
  buildSnapshotsExportFileName,
  buildSnapshotsExportSummary,
  downloadSnapshotsExport
} from "./exportSnapshots";
import type { UsageSnapshot } from "./types";

const SNAPSHOTS: UsageSnapshot[] = [
  {
    id: "snapshot-1",
    weekId: "codex-week",
    providerType: "codex",
    providerName: "Codex",
    createdAt: "2026-06-30T10:00:00+09:00",
    sessionRemainingPct: 84,
    weeklyRemainingPct: 60,
    weeklyResetAt: "2026-07-06T07:00",
    dailySessionTarget: 3,
    workdayStart: "09:00",
    workdayEnd: "18:00",
    taskRiskType: "normal",
    memo: "내보낼 기록"
  }
];

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsText(blob);
  });
}

describe("exportSnapshots", () => {
  it("builds a browser-only JSON export payload without changing saved records", () => {
    const exportedAt = new Date("2026-06-30T01:23:45.000Z");

    expect(buildSnapshotsExport(SNAPSHOTS, exportedAt)).toEqual({
      serviceName: "AI Pacer",
      version: 1,
      exportedAt: "2026-06-30T01:23:45.000Z",
      snapshots: SNAPSHOTS
    });
  });

  it("builds a stable AI Pacer export file name from the export time", () => {
    const exportedAt = new Date("2026-06-30T01:23:45.000Z");

    expect(buildSnapshotsExportFileName(exportedAt)).toBe(
      "ai-pacer-snapshots-20260630-012345.json"
    );
  });

  it("summarizes the export count, file name, and approximate size", () => {
    const exportedAt = new Date("2026-06-30T01:23:45.000Z");

    const summary = buildSnapshotsExportSummary(SNAPSHOTS, exportedAt);

    expect(summary.snapshotCount).toBe(1);
    expect(summary.fileName).toBe("ai-pacer-snapshots-20260630-012345.json");
    expect(summary.byteSize).toBeGreaterThan(0);
    expect(summary.sizeLabel).toMatch(/B|KB/);
  });

  it("downloads the export as a JSON blob and revokes the object URL", async () => {
    const link = {
      click: vi.fn(),
      download: "",
      href: ""
    } as unknown as HTMLAnchorElement;
    const documentRef = {
      createElement: vi.fn(() => link)
    } as unknown as Document;
    const createObjectURL = vi.fn<(blob: Blob) => string>(
      () => "blob:ai-pacer-export"
    );
    const revokeObjectURL = vi.fn<(objectUrl: string) => void>();
    const urlRef = {
      createObjectURL,
      revokeObjectURL
    };

    const didDownload = downloadSnapshotsExport(SNAPSHOTS, {
      documentRef,
      urlRef,
      now: new Date("2026-06-30T01:23:45.000Z")
    });

    expect(didDownload).toBe(true);
    expect(documentRef.createElement).toHaveBeenCalledWith("a");
    expect(link.download).toBe("ai-pacer-snapshots-20260630-012345.json");
    expect(link.href).toBe("blob:ai-pacer-export");
    expect(link.click).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:ai-pacer-export");

    const blob = createObjectURL.mock.calls[0][0];
    const blobText = await readBlobText(blob);
    expect(blobText).toContain("\"serviceName\": \"AI Pacer\"");
    expect(blobText).toContain("\"memo\": \"내보낼 기록\"");
  });

  it("returns false instead of throwing when the browser cannot create a download URL", () => {
    const documentRef = {
      createElement: vi.fn()
    } as unknown as Document;
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => {
      throw new Error("blocked");
    });
    const revokeObjectURL = vi.fn<(objectUrl: string) => void>();

    const didDownload = downloadSnapshotsExport(SNAPSHOTS, {
      documentRef,
      urlRef: {
        createObjectURL,
        revokeObjectURL
      },
      now: new Date("2026-06-30T01:23:45.000Z")
    });

    expect(didDownload).toBe(false);
    expect(documentRef.createElement).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});
