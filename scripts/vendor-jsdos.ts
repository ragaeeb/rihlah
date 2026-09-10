#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const SRC = join(ROOT, "node_modules/js-dos/dist");
const DEST = join(ROOT, "vendor/js-dos");

const SKIP = /\.(map|symbols)$/;
const SKIP_NAMES = /^(wdosbox-x|sockdrive|webrtcnet)/;

if (!existsSync(SRC)) {
  console.warn("js-dos is not installed; skipping vendor copy");
  process.exit(0);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });

cpSync(SRC, DEST, {
  recursive: true,
  filter: (from) => {
    const name = from.split("/").pop() ?? "";
    if (SKIP.test(name) || SKIP_NAMES.test(name)) return false;
    if (from.endsWith("/types") || from.includes("/types/")) return false;
    return true;
  },
});

console.log(`vendored js-dos -> ${DEST}`);
