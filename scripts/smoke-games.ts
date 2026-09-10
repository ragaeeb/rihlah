#!/usr/bin/env bun

/**
 * Loads every game in a real browser, waits for the DOS canvas to paint,
 * and writes screenshots + metrics so js-dos upgrades can be compared.
 *
 *   bun run smoke -- --label before
 *   bun run smoke -- --label after --compare tmp/smoke/before.json
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

const ROOT = join(import.meta.dir, "..");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:8080";
const SAMPLE_STEP = 2;
const WAIT_MS = 25_000;
const SETTLE_MS = 8_000;
const BLACK_LUMA = 18;

interface GameSummary {
  id: string;
  title: string;
}

interface PixelStats {
  width: number;
  height: number;
  uniqueColors: number;
  nonBlackRatio: number;
  meanLuma: number;
}

interface GameResult {
  id: string;
  title: string;
  ok: boolean;
  reason?: string;
  msToCanvas?: number;
  msToPaint?: number;
  stats?: PixelStats;
  diag?: unknown;
  consoleErrors: string[];
  pageErrors: string[];
  screenshot: string;
}

interface Report {
  label: string;
  baseUrl: string;
  startedAt: string;
  results: GameResult[];
}

function argValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}

function statsFromRgba(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  step = Math.max(1, Math.min(SAMPLE_STEP, width, height)),
): PixelStats {
  const colors = new Set<number>();
  let nonBlack = 0;
  let lumaSum = 0;
  let samples = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      lumaSum += luma;
      samples++;
      if (luma > BLACK_LUMA) nonBlack++;
      colors.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
    }
  }

  return {
    width,
    height,
    uniqueColors: colors.size,
    nonBlackRatio: samples === 0 ? 0 : nonBlack / samples,
    meanLuma: samples === 0 ? 0 : lumaSum / samples,
  };
}

function painted(stats: PixelStats): boolean {
  return stats.uniqueColors >= 4 && stats.nonBlackRatio >= 0.002;
}

function selfCheck(): void {
  const black = new Uint8ClampedArray(8);
  const blackStats = statsFromRgba(black, 2, 1, 1);
  if (blackStats.uniqueColors !== 1 || blackStats.nonBlackRatio !== 0) {
    throw new Error("pixel stats self-check failed on black");
  }

  const color = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255]);
  const colorStats = statsFromRgba(color, 2, 2, 1);
  if (colorStats.uniqueColors < 3 || colorStats.nonBlackRatio !== 1) {
    throw new Error("pixel stats self-check failed on color");
  }
}

async function ensureServer(): Promise<ReturnType<typeof Bun.spawn> | null> {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(1500) });
    if (res.ok) return null;
  } catch {
    // start one
  }

  const proc = Bun.spawn(["bun", "x", "serve", "-l", "8080"], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });

  for (let i = 0; i < 40; i++) {
    await Bun.sleep(150);
    try {
      const res = await fetch(BASE, { signal: AbortSignal.timeout(500) });
      if (res.ok) return proc;
    } catch {
      // keep waiting
    }
  }

  proc.kill();
  throw new Error(`Could not start static server on ${BASE}`);
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

async function sampleCanvas(page: Page): Promise<PixelStats | null> {
  const canvas = page.locator("canvas").first();
  if ((await canvas.count()) === 0) return null;
  if (!(await canvas.isVisible())) return null;

  const png = await canvas.screenshot({ type: "png" });
  return await page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("png decode failed"));
      img.src = `data:image/png;base64,${b64}`;
    });
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    return { data: Array.from(data), width, height };
  }, png.toString("base64")).then(({ data, width, height }) =>
    statsFromRgba(Uint8ClampedArray.from(data), width, height),
  );
}

async function smokeGame(page: Page, game: GameSummary, shotDir: string): Promise<GameResult> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  };
  const onPageError = (err: Error) => {
    pageErrors.push(err.message);
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  const started = Date.now();
  const url = `${BASE}/play.html?game=${encodeURIComponent(game.id)}`;
  const screenshot = join(shotDir, `${game.id}.png`);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });

    const error = page.locator("#error");
    const canvas = page.locator("canvas").first();
    await Promise.race([
      canvas.waitFor({ state: "visible", timeout: WAIT_MS }),
      error.waitFor({ state: "visible", timeout: WAIT_MS }),
    ]);

    if (await error.isVisible()) {
      await page.screenshot({ path: screenshot, fullPage: true });
      return {
        id: game.id,
        title: game.title,
        ok: false,
        reason: "error overlay",
        consoleErrors,
        pageErrors,
        screenshot,
      };
    }

    const msToCanvas = Date.now() - started;
    let stats: PixelStats | null = null;
    let msToPaint: number | undefined;

    while (Date.now() - started < WAIT_MS) {
      stats = await sampleCanvas(page);
      if (stats && painted(stats)) {
        msToPaint = Date.now() - started;
        break;
      }
      await page.waitForTimeout(400);
    }

    if (msToPaint !== undefined) {
      await page.waitForTimeout(SETTLE_MS);
      stats = (await sampleCanvas(page)) ?? stats;
    }

    await canvas.screenshot({ path: screenshot }).catch(async () => {
      await page.screenshot({ path: screenshot, fullPage: true });
    });

    const diag = await page.evaluate(() => (window as { __rihlah?: unknown }).__rihlah ?? null);
    const fatalConsole = consoleErrors.filter(
      (line) =>
        !/favicon|autoplay|Deprecated|CORS policy: No 'Access-Control/i.test(line),
    );

    const ok = Boolean(stats && painted(stats));
    return {
      id: game.id,
      title: game.title,
      ok,
      reason: ok ? undefined : "canvas stayed blank",
      msToCanvas,
      msToPaint,
      stats: stats ?? undefined,
      diag,
      consoleErrors: fatalConsole,
      pageErrors,
      screenshot,
    };
  } catch (err) {
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => undefined);
    return {
      id: game.id,
      title: game.title,
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
      consoleErrors,
      pageErrors,
      screenshot,
    };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

function compareReports(before: Report, after: Report): string[] {
  const regressions: string[] = [];
  const afterById = new Map(after.results.map((r) => [r.id, r]));

  for (const prev of before.results) {
    const next = afterById.get(prev.id);
    if (!next) {
      regressions.push(`${prev.id}: missing from after report`);
      continue;
    }
    if (prev.ok && !next.ok) {
      regressions.push(`${prev.id}: was painted, now ${next.reason ?? "failed"}`);
    }
  }

  return regressions;
}

async function main(): Promise<void> {
  selfCheck();

  const label = argValue("label") ?? "run";
  const only = argValue("game");
  const comparePath = argValue("compare");
  const shotDir = join(ROOT, "tmp", "smoke", label);
  mkdirSync(shotDir, { recursive: true });

  const catalog = (await Bun.file(join(ROOT, "src/games.json")).json()) as { games: GameSummary[] };
  const games = only ? catalog.games.filter((g) => g.id === only) : catalog.games;
  if (games.length === 0) throw new Error(only ? `No game named ${only}` : "No games in src/games.json");

  const server = await ensureServer();
  const browser = await launchBrowser();
  const results: GameResult[] = [];

  try {
    for (const game of games) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
      process.stdout.write(`${game.id}... `);
      const result = await smokeGame(page, game, shotDir);
      results.push(result);
      console.log(result.ok ? `ok ${result.msToPaint}ms colors=${result.stats?.uniqueColors}` : `FAIL ${result.reason}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server?.kill();
  }

  const report: Report = {
    label,
    baseUrl: BASE,
    startedAt: new Date().toISOString(),
    results,
  };
  const reportPath = join(ROOT, "tmp", "smoke", `${label}.json`);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} painted. report: ${reportPath}`);

  if (comparePath) {
    const before = (await Bun.file(comparePath).json()) as Report;
    const regressions = compareReports(before, report);
    if (regressions.length > 0) {
      console.error("\nRegressions:");
      for (const line of regressions) console.error(`  ${line}`);
      process.exitCode = 1;
      return;
    }
    console.log(`No regressions vs ${comparePath}`);
  }

  if (failed.length > 0) process.exitCode = 1;
}

await main();
