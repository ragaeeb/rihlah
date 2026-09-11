#!/usr/bin/env bun

/**
 * Pull a RetroGames.cz DOS game into the arcade.
 *
 *   bun run add-game 480
 *   bun run add-game https://www.retrogames.cz/play_480-DOS.php
 *   bun run add-game 480 --id dangerous-dave --exe DAVE.EXE --force
 */

import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { $ } from "bun";
import { buildBundle, upsertGameJson, type GameDefinition } from "./build-bundles";

const ROOT = join(import.meta.dir, "..");
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DEFAULT_IMG_SIZE = "512,8,2,384";

interface ParsedPage {
  title: string;
  description: string;
  author: string;
  year: number;
  genre: string[];
  zipPath: string;
  executable: string;
}

function usage(): never {
  console.log(`Pull a RetroGames.cz DOS game into the arcade.

  bun run add-game <url-or-id>
  bun run add-game 480
  bun run add-game https://www.retrogames.cz/play_480-DOS.php
  bun run add-game 480 --id dave --exe DAVE.EXE --size 512,8,2,384 --force

The hosted arcade is a Cloudflare Worker. Visitors cannot install games
there. This command is the whole add-game flow: download, bundle, catalog.

Check the game's license before publishing (bun run deploy).`);
  process.exit(1);
}

function decode(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function clip(text: string, max = 280): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).trim()}…`;
}

export function parsePlayPage(html: string): ParsedPage {
  const run = html.match(/dosbox\.run\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/i);
  if (!run) throw new Error("no dosbox.run() on that page (is it a DOS game?)");

  const h1 = html.match(/<h1[^>]*>\s*([\s\S]*?)\s*-\s*DOS\s*<\/h1>/i);
  const title = decode(h1?.[1] ?? "");
  if (!title) throw new Error("no <h1> title on that page");

  const authorCell = html.match(
    /Author \(released\):[\s\S]{0,500}?<font[^>]*>\s*([^<]+?)\s*<\/font>/i,
  );
  const authorYear = (authorCell?.[1] ?? "").match(/^(.*?)(?:\s*\((\d{4})\))?\s*$/);
  const author = (authorYear?.[1] ?? "Unknown").trim() || "Unknown";
  const year = authorYear?.[2] ? Number(authorYear[2]) : 1990;

  const genreHit = html.match(/Genre:[\s\S]{0,400}?<b>\s*([^<]+?)\s*<\/b>/i);
  const genre = (genreHit?.[1] ?? "Action")
    .split(/[,/]/)
    .map((g) => g.trim())
    .filter(Boolean);

  const meta = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const description = clip(decode(meta?.[1] ?? title));

  return {
    title,
    description,
    author,
    year,
    genre: genre.length ? genre : ["Action"],
    zipPath: run[1],
    executable: run[2].replace(/^\.\//, ""),
  };
}

function isRetroGamesHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "retrogames.cz" || host.endsWith(".retrogames.cz");
}

function requireHttpsRetroGames(url: URL, kind: string): void {
  if (url.protocol !== "https:") throw new Error(`${kind} must be https`);
  if (!isRetroGamesHost(url.hostname)) {
    throw new Error("only RetroGames.cz play pages are supported");
  }
}

function playUrl(input: string): string {
  if (/^\d+$/.test(input)) return `https://www.retrogames.cz/play_${input}-DOS.php`;
  try {
    const url = new URL(input);
    requireHttpsRetroGames(url, "play page");
    return url.href;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("only ")) throw err;
    if (err instanceof Error && err.message.includes("must be https")) throw err;
    throw new Error(`expected a RetroGames.cz URL or numeric play id, got ${input}`);
  }
}

function imgSizeFromBytes(bytes: number): string | undefined {
  if (bytes === 1_474_560) return "512,18,2,80";
  if (bytes === 737_280) return "512,9,2,80";
  if (bytes === 3_145_728) return DEFAULT_IMG_SIZE;
  return undefined;
}

function gameId(value: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 48) {
    throw new Error(`invalid game id ${JSON.stringify(value)}; use lowercase letters, digits, and hyphens`);
  }
  return value;
}

async function inspectZip(zipPath: string): Promise<{ imgFile?: string; imgSize?: string }> {
  const listing = await $`unzip -l ${zipPath}`.text();
  const img = listing.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+\.img)\s*$/im);
  if (!img) return {};
  return { imgFile: img[2].trim(), imgSize: imgSizeFromBytes(Number(img[1])) };
}

function selfCheck(): void {
  const html = `
    <h1 align="center">Dangerous Dave - DOS</h1>
    <script>dosbox.run("dos/zip/DangerousDave.zip", "./DAVE.EXE");</script>
    Author (released):</font></td><td><b><font>John Romero (1988)</font></b></td>
    Genre:</font></td><td><b>Action</b></td>
    <meta name="description" content="Dangerous Dave is a 1988 computer game by John Romero." />
  `;
  const parsed = parsePlayPage(html);
  if (parsed.title !== "Dangerous Dave") throw new Error(`self-check title: ${parsed.title}`);
  if (parsed.executable !== "DAVE.EXE") throw new Error(`self-check exe: ${parsed.executable}`);
  if (parsed.zipPath !== "dos/zip/DangerousDave.zip") throw new Error("self-check zip");
  if (parsed.year !== 1988 || parsed.author !== "John Romero") throw new Error("self-check author");
  if (parsed.genre[0] !== "Action") throw new Error("self-check genre");
  if (imgSizeFromBytes(3_145_728) !== DEFAULT_IMG_SIZE) throw new Error("self-check img size");
  if (imgSizeFromBytes(1) !== undefined) throw new Error("self-check unknown img size");
  if (isRetroGamesHost("attackerretrogames.cz")) throw new Error("self-check host suffix");
  if (!isRetroGamesHost("www.retrogames.cz")) throw new Error("self-check host subdomain");
  if (isRetroGamesHost("retrogames.cz.evil.com")) throw new Error("self-check host suffix 2");
  try {
    playUrl("http://www.retrogames.cz/play_480-DOS.php");
    throw new Error("self-check http play");
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("https")) throw err;
  }
  try {
    gameId("..");
    throw new Error("self-check id traversal");
  } catch (err) {
    if (!(err instanceof Error) || !err.message.startsWith("invalid game id")) throw err;
  }
}

function parseFlags(argv: string[]): { rest: string[]; id?: string; exe?: string; size?: string; force: boolean } {
  const rest: string[] = [];
  let id: string | undefined;
  let exe: string | undefined;
  let size: string | undefined;
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") force = true;
    else if (a === "--id" || a === "--exe" || a === "--size") {
      const value = argv[++i];
      if (!value) throw new Error(`${a} needs a value`);
      if (a === "--id") id = value;
      else if (a === "--exe") exe = value;
      else size = value;
    } else if (a.startsWith("-")) throw new Error(`unknown flag ${a}`);
    else rest.push(a);
  }
  return { rest, id, exe, size, force };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

async function download(url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  await Bun.write(dest, res);
}

async function main(): Promise<void> {
  selfCheck();

  const { rest, id: idFlag, exe, size, force } = parseFlags(process.argv.slice(2));
  if (rest.length !== 1) usage();

  const source = playUrl(rest[0]);
  console.log(`Fetching ${source}`);
  const parsed = parsePlayPage(await fetchText(source));
  const id = gameId(idFlag ?? slugify(parsed.title));
  const gameDir = join(ROOT, "games", id);
  if (existsSync(join(gameDir, "game.json")) && !force) {
    throw new Error(`${id} already exists. Re-run with --force to replace it.`);
  }

  const zipFile = basename(parsed.zipPath);
  const downloadsDir = join(ROOT, "downloads");
  mkdirSync(downloadsDir, { recursive: true });
  const zipDest = join(downloadsDir, zipFile);
  const zipUrl = new URL(parsed.zipPath, "https://www.retrogames.cz/");
  requireHttpsRetroGames(zipUrl, "archive");

  if (!existsSync(zipDest) || force) {
    console.log(`Downloading ${zipUrl.href}`);
    await download(zipUrl.href, zipDest);
  } else {
    console.log(`Using existing downloads/${zipFile}`);
  }

  const disk = await inspectZip(zipDest);
  const imgSize = size ?? disk.imgSize;
  if (disk.imgFile && !imgSize) {
    throw new Error(`unknown disk image size; pass --size (e.g. ${DEFAULT_IMG_SIZE})`);
  }
  const game: GameDefinition = {
    id,
    title: parsed.title,
    description: parsed.description,
    author: parsed.author,
    year: parsed.year,
    genre: parsed.genre,
    zipFile,
    imgFile: disk.imgFile,
    executable: exe ?? parsed.executable,
    imgSize,
    source,
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump / Fire",
      Esc: "Menu",
    },
  };

  console.log(
    disk.imgFile
      ? `Disk image ${game.imgFile} (-size ${game.imgSize}) → ${game.executable}`
      : `Loose files → ${game.executable}`,
  );

  await buildBundle(game);
  await upsertGameJson(game);
  console.log(`\nLocal:   bun run dev   →  http://localhost:8080/play.html?game=${id}`);
  console.log(`Publish: bun run deploy →  https://retro.al-iyaal.club/play.html?game=${id}`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
