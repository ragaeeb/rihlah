#!/usr/bin/env bun

/**
 * Provision R2, sync local games into it, and deploy (or run wrangler dev).
 *
 *   bun run deploy
 *   bun run dev
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const ROOT = join(import.meta.dir, "..");
const BUCKET = "rihlah-games";
const PUBLIC = join(ROOT, "public");
const DEV = process.argv.includes("--dev");
function wrangler(args: string[], opts: { nothrow?: boolean } = {}) {
  const cmd = $`bunx wrangler ${args}`.cwd(ROOT);
  return opts.nothrow ? cmd.nothrow() : cmd;
}

async function stagePublic(): Promise<void> {
  await $`bun run vendor`.cwd(ROOT);
  rmSync(PUBLIC, { recursive: true, force: true });
  mkdirSync(join(PUBLIC, "vendor"), { recursive: true });
  cpSync(join(ROOT, "index.html"), join(PUBLIC, "index.html"));
  cpSync(join(ROOT, "play.html"), join(PUBLIC, "play.html"));
  if (!existsSync(join(ROOT, "vendor/js-dos/js-dos.js"))) {
    throw new Error("vendor/js-dos is missing; bun install / bun run vendor first");
  }
  cpSync(join(ROOT, "vendor/js-dos"), join(PUBLIC, "vendor/js-dos"), { recursive: true });
}

async function ensureBucket(): Promise<void> {
  const result = await wrangler(["r2", "bucket", "create", BUCKET], { nothrow: true }).quiet();
  const text = `${result.stdout.toString()} ${result.stderr.toString()}`;
  if (result.exitCode === 0) {
    console.log(`Created R2 bucket ${BUCKET}`);
    return;
  }
  if (/already exists|DuplicateObject/i.test(text)) {
    console.log(`R2 bucket ${BUCKET} already exists`);
    return;
  }
  throw new Error(`wrangler r2 bucket create ${BUCKET} failed:\n${text}`);
}

function contentType(file: string): string {
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".jsdos")) return "application/zip";
  return "application/octet-stream";
}

function uploads(): { key: string; file: string }[] {
  const out: { key: string; file: string }[] = [];
  const catalog = join(ROOT, "src/games.json");
  if (existsSync(catalog)) out.push({ key: "src/games.json", file: catalog });

  const gamesDir = join(ROOT, "games");
  if (!existsSync(gamesDir)) return out;

  for (const id of readdirSync(gamesDir)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) continue;
    const dir = join(gamesDir, id);
    const meta = join(dir, "game.json");
    const bundle = join(dir, `${id}-bundle.jsdos`);
    if (existsSync(meta)) out.push({ key: `games/${id}/game.json`, file: meta });
    if (existsSync(bundle)) out.push({ key: `games/${id}/${id}-bundle.jsdos`, file: bundle });
  }
  return out;
}

async function syncR2(): Promise<void> {
  const files = uploads();
  if (files.length === 0) {
    console.log("Nothing to upload to R2");
    return;
  }

  const bundles = files.filter((f) => f.file.endsWith(".jsdos"));
  if (bundles.length === 0) {
    console.log("No local .jsdos bundles; uploading catalog/metadata only");
  }

  const where = DEV ? "--local" : "--remote";
  console.log(`Uploading ${files.length} objects to R2 (${DEV ? "local" : "remote"})`);
  for (const { key, file } of files) {
    const result = await wrangler(
      [
        "r2",
        "object",
        "put",
        `${BUCKET}/${key}`,
        "--file",
        file,
        "--content-type",
        contentType(file),
        where,
        "-y",
      ],
      { nothrow: true },
    ).quiet();
    if (result.exitCode !== 0) {
      throw new Error(`put ${key} failed:\n${result.stderr.toString() || result.stdout.toString()}`);
    }
    process.stdout.write(`  ${key}\n`);
  }
}

async function main(): Promise<void> {
  await $`bunx wrangler types`.cwd(ROOT).quiet();
  await stagePublic();
  if (!DEV) await ensureBucket();
  await syncR2();
  if (DEV) {
    console.log("Starting wrangler dev on http://localhost:8080");
    await wrangler(["dev", "--port", "8080"]);
    return;
  }
  await wrangler(["deploy"]);
}

await main();
