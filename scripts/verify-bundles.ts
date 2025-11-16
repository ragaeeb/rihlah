import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

import JSZip from "jszip";

async function verify() {
  const publicDir = new URL("../public/games", import.meta.url);
  const dirPath = publicDir.pathname;
  const entries = await readdir(dirPath);
  const bundles = entries.filter((entry) => extname(entry) === ".jsdos");

  if (bundles.length === 0) {
    console.log("No .jsdos bundles found under public/games.");
    return;
  }

  let hasErrors = false;
  for (const bundle of bundles) {
    const fullPath = join(dirPath, bundle);
    const zip = await JSZip.loadAsync(await readFile(fullPath));
    const requiredFiles = [".jsdos/dosbox.conf", ".jsdos/jsdos.json"];
    const missing = requiredFiles.filter((file) => !zip.file(file));

    if (missing.length > 0) {
      hasErrors = true;
      console.error(`✗ ${bundle} is missing: ${missing.join(", ")}`);
    } else {
      console.log(`✓ ${bundle} contains required metadata.`);
    }
  }

  if (hasErrors) {
    throw new Error("One or more bundles are missing the .jsdos metadata files.");
  }
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
