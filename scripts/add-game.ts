#!/usr/bin/env bun

/**
 * Helper script to add a new DOS game to the arcade
 *
 * Usage: bun run scripts/add-game.ts
 *
 * This script will guide you through the process of adding a new game.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface GameConfig {
  id: string;
  title: string;
  description: string;
  author: string;
  year: number;
  genre: string[];
  bundle: string;
  executable: string;
  controls: Record<string, string>;
  thumbnail: string;
  source: string;
}

interface GameSummary {
  id: string;
  title: string;
  description: string;
  year: number;
  genre: string[];
}

interface GamesData {
  games: GameSummary[];
}

async function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  for await (const line of console) {
    return line.trim();
  }
  return "";
}

async function main(): Promise<void> {
  console.log("\n🎮 DOS Games Arcade - Add New Game\n");
  console.log("This script will help you add a new DOS game.\n");
  console.log("Before running this script, make sure you have:");
  console.log("  1. The game files (ZIP with .img file or game executables)");
  console.log("  2. Created a js-dos bundle (.jsdos file)");
  console.log("\nSee README.md for detailed instructions.\n");

  const id = await prompt('Game ID (lowercase, no spaces, e.g., "doom"): ');
  const title = await prompt('Game Title (e.g., "DOOM"): ');
  const description = await prompt("Short Description: ");
  const author = await prompt("Author/Publisher: ");
  const yearStr = await prompt("Release Year: ");
  const genres = await prompt('Genres (comma-separated, e.g., "Action, Shooter"): ');
  const bundleFile = await prompt('Bundle filename (e.g., "doom-bundle.jsdos"): ');
  const executable = await prompt('Executable command (e.g., "doom"): ');

  console.log("\nEnter controls (press Enter with empty key to finish):");
  const controls: Record<string, string> = {};

  while (true) {
    const key = await prompt('  Key (e.g., "Arrow Keys"): ');
    if (!key) break;
    const action = await prompt('  Action (e.g., "Move"): ');
    controls[key] = action;
  }

  const scriptDir = import.meta.dir;
  const projectRoot = join(scriptDir, "..");
  const gameDir = join(projectRoot, "games", id);
  const gamesJsonPath = join(projectRoot, "src", "games.json");

  // Create game directory
  if (!existsSync(gameDir)) {
    mkdirSync(gameDir, { recursive: true });
    console.log(`\n✓ Created directory: games/${id}/`);
  }

  // Create game.json
  const gameConfig: GameConfig = {
    id,
    title,
    description,
    author,
    year: parseInt(yearStr, 10),
    genre: genres.split(",").map((g) => g.trim()),
    bundle: bundleFile,
    executable,
    controls,
    thumbnail: "thumbnail.png",
    source: "",
  };

  writeFileSync(join(gameDir, "game.json"), JSON.stringify(gameConfig, null, 2));
  console.log(`✓ Created games/${id}/game.json`);

  // Update src/games.json
  let gamesData: GamesData = { games: [] };

  if (existsSync(gamesJsonPath)) {
    const content = readFileSync(gamesJsonPath, "utf8");
    gamesData = JSON.parse(content) as GamesData;
  }

  // Check if game already exists
  const existingIndex = gamesData.games.findIndex((g) => g.id === id);
  const gameSummary: GameSummary = {
    id,
    title,
    description,
    year: parseInt(yearStr, 10),
    genre: genres.split(",").map((g) => g.trim()),
  };

  if (existingIndex >= 0) {
    gamesData.games[existingIndex] = gameSummary;
    console.log("✓ Updated game in src/games.json");
  } else {
    gamesData.games.push(gameSummary);
    console.log("✓ Added game to src/games.json");
  }

  writeFileSync(gamesJsonPath, JSON.stringify(gamesData, null, 2));

  console.log("\n📦 Next steps:");
  console.log(`  1. Copy your ${bundleFile} file to games/${id}/`);
  console.log(`  2. Optionally add a thumbnail.png to games/${id}/`);
  console.log("  3. Test locally with: bun run dev");
  console.log("  4. Commit and push to deploy\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});

