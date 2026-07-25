import { copyFile, cp, mkdir } from "node:fs/promises";

const extensionRoot = new URL("../", import.meta.url);
const distRoot = new URL("../dist/", import.meta.url);

await mkdir(distRoot, { recursive: true });
await copyFile(
  new URL("manifest.json", extensionRoot),
  new URL("manifest.json", distRoot)
);
await cp(new URL("icons/", extensionRoot), new URL("icons/", distRoot), {
  recursive: true
});
