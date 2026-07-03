import type { UsageSnapshot } from "./types";

export type SnapshotsExportPayload = {
  serviceName: "AI Pacer";
  version: 1;
  exportedAt: string;
  snapshots: UsageSnapshot[];
};

export type SnapshotsExportSummary = {
  snapshotCount: number;
  fileName: string;
  byteSize: number;
  sizeLabel: string;
};

type ObjectUrlApi = Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;

type DownloadEnvironment = {
  documentRef?: Document;
  urlRef?: ObjectUrlApi;
  now?: Date;
};

export function buildSnapshotsExport(
  snapshots: UsageSnapshot[],
  exportedAt = new Date()
): SnapshotsExportPayload {
  return {
    serviceName: "AI Pacer",
    version: 1,
    exportedAt: exportedAt.toISOString(),
    snapshots
  };
}

export function buildSnapshotsExportFileName(exportedAt = new Date()): string {
  const timestamp = exportedAt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "-");

  return `ai-pacer-snapshots-${timestamp}.json`;
}

export function buildSnapshotsExportJson(
  snapshots: UsageSnapshot[],
  exportedAt = new Date()
): string {
  return JSON.stringify(buildSnapshotsExport(snapshots, exportedAt), null, 2);
}

function getUtf8ByteSize(value: string): number {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }

  if (typeof Blob !== "undefined") {
    return new Blob([value]).size;
  }

  return value.length;
}

export function formatExportSize(byteSize: number): string {
  if (byteSize < 1024) {
    return `${byteSize}B`;
  }

  const kilobytes = byteSize / 1024;
  return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)}KB`;
}

export function buildSnapshotsExportSummary(
  snapshots: UsageSnapshot[],
  exportedAt = new Date()
): SnapshotsExportSummary {
  const exportJson = buildSnapshotsExportJson(snapshots, exportedAt);
  const byteSize = getUtf8ByteSize(exportJson);

  return {
    snapshotCount: snapshots.length,
    fileName: buildSnapshotsExportFileName(exportedAt),
    byteSize,
    sizeLabel: formatExportSize(byteSize)
  };
}

export function downloadSnapshotsExport(
  snapshots: UsageSnapshot[],
  environment: DownloadEnvironment = {}
): boolean {
  const documentRef =
    environment.documentRef ?? (typeof document === "undefined" ? undefined : document);
  const urlRef =
    environment.urlRef ?? (typeof URL === "undefined" ? undefined : URL);

  if (
    !documentRef ||
    !urlRef ||
    typeof Blob === "undefined" ||
    typeof urlRef.createObjectURL !== "function" ||
    typeof urlRef.revokeObjectURL !== "function"
  ) {
    return false;
  }

  const exportedAt = environment.now ?? new Date();
  let objectUrl = "";

  try {
    const blob = new Blob([buildSnapshotsExportJson(snapshots, exportedAt)], {
      type: "application/json"
    });
    objectUrl = urlRef.createObjectURL(blob);
    const link = documentRef.createElement("a");
    link.href = objectUrl;
    link.download = buildSnapshotsExportFileName(exportedAt);
    link.click();
    return true;
  } catch {
    return false;
  } finally {
    if (objectUrl) {
      try {
        urlRef.revokeObjectURL(objectUrl);
      } catch {
        // Download feedback should not fail just because cleanup was blocked.
      }
    }
  }
}
