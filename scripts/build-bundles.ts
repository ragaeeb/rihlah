#!/usr/bin/env bun

/**
 * Script to build js-dos bundles from downloaded game files
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { $ } from "bun";

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  author: string;
  year: number;
  genre: string[];
  zipFile: string;
  imgFile?: string; // If using disk image
  executable: string;
  imgSize?: string; // For imgmount
  source: string;
  controls: Record<string, string>;
}

const GAMES: GameDefinition[] = [
  {
    id: "mario-teaches-typing",
    title: "Mario Teaches Typing",
    description: "Learn to type with Mario! An educational typing game featuring Nintendo's famous plumber.",
    author: "Interplay",
    year: 1992,
    genre: ["Educational"],
    zipFile: "MarioTT.zip",
    imgFile: "MarioTT.img",
    executable: "MARIO.EXE",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_1254-DOS.php",
    controls: {
      "Keyboard": "Type the letters shown",
      "Esc": "Menu"
    }
  },
  {
    id: "charlie-the-duck",
    title: "Charlie the Duck",
    description: "A colorful platformer where you play as Charlie, a duck on an adventure to save his girlfriend.",
    author: "Wiering Software",
    year: 1996,
    genre: ["Platform", "Action"],
    zipFile: "Charlie.zip",
    imgFile: "Charlie.img",
    executable: "START.bat",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_1304-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Space/Ctrl": "Jump",
      "Esc": "Menu"
    }
  },
  {
    id: "keen1",
    title: "Commander Keen 1: Marooned on Mars",
    description: "The original Commander Keen! Help 8-year-old genius Billy Blaze escape from Mars.",
    author: "id Software",
    year: 1990,
    genre: ["Platform", "Action"],
    zipFile: "keen1.zip",
    imgFile: "keen1.img",
    executable: "keen1",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_471-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen2",
    title: "Commander Keen 2: The Earth Explodes",
    description: "Keen must stop the Vorticons from destroying Earth! Episode 2 of the original trilogy.",
    author: "id Software",
    year: 1990,
    genre: ["Platform", "Action"],
    zipFile: "keen2.zip",
    executable: "KEEN2.EXE",
    source: "https://www.retrogames.cz/play_503-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen3",
    title: "Commander Keen 3: Keen Must Die!",
    description: "The epic conclusion to the Vorticon trilogy. Defeat the Grand Intellect!",
    author: "id Software",
    year: 1990,
    genre: ["Platform", "Action"],
    zipFile: "Keen3.zip",
    executable: "KEEN3.EXE",
    source: "https://www.retrogames.cz/play_513-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen-dreams",
    title: "Keen Dreams",
    description: "Commander Keen in the land of vegetables! A unique side-story in the Keen saga.",
    author: "id Software",
    year: 1991,
    genre: ["Platform", "Action"],
    zipFile: "keen35.zip",
    imgFile: "keen7.img",
    executable: "kdreams",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_488-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Throw",
      "Esc": "Menu"
    }
  },
  {
    id: "keen4",
    title: "Commander Keen 4: Secret of the Oracle",
    description: "The Goodbye Galaxy saga begins! Keen explores the Shadowlands to find the Oracle.",
    author: "id Software",
    year: 1991,
    genre: ["Platform", "Action"],
    zipFile: "keen4.zip",
    imgFile: "keen4.img",
    executable: "keen4e",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_411-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen5",
    title: "Commander Keen 5: The Armageddon Machine",
    description: "Keen infiltrates the Omegamatic to stop the Shikadi from destroying the galaxy!",
    author: "id Software",
    year: 1991,
    genre: ["Platform", "Action"],
    zipFile: "keen5.zip",
    imgFile: "keen5.img",
    executable: "keen5e",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_481-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen6",
    title: "Commander Keen 6: Aliens Ate My Baby Sitter!",
    description: "Keen's babysitter has been kidnapped by the Bloogs! Time for another rescue mission.",
    author: "id Software",
    year: 1991,
    genre: ["Platform", "Action"],
    zipFile: "keen6.zip",
    imgFile: "keen6.img",
    executable: "keen6",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_443-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen7",
    title: "Commander Keen 7: The Keys of Krodacia",
    description: "A fan-made Keen adventure! Find the keys to save Krodacia.",
    author: "Ceilick (Fan Game)",
    year: 2005,
    genre: ["Platform", "Action"],
    zipFile: "keen7.zip",
    imgFile: "keen7.img",
    executable: "keen7",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_736-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen8",
    title: "Commander Keen 8: Dead in the Desert",
    description: "Another fan-made Keen adventure set in a desert world.",
    author: "Ceilick (Fan Game)",
    year: 2006,
    genre: ["Platform", "Action"],
    zipFile: "keen8.zip",
    imgFile: "keen8.img",
    executable: "keen8",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_737-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "keen9",
    title: "Commander Keen 9: Battle of the Brains",
    description: "Fan-made finale! Keen faces his greatest challenge yet.",
    author: "Szemigi (Fan Game)",
    year: 2015,
    genre: ["Platform", "Action"],
    zipFile: "Keen9.zip",
    imgFile: "Keen9.img",
    executable: "Keen9.bat",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_1706-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Pogo / Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "dangerous-dave",
    title: "Dangerous Dave",
    description: "John Romero's early platformer. Climb, jump, and grab the cup to finish each level.",
    author: "Softdisk",
    year: 1988,
    genre: ["Platform", "Action"],
    zipFile: "DangerousDave.zip",
    executable: "DAVE.EXE",
    source: "https://www.retrogames.cz/play_480-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Alt": "Jump",
      "Esc": "Menu"
    }
  },
  {
    id: "dyna-blaster",
    title: "Dyna Blaster",
    description: "The DOS Bomberman: plant bombs, blast walls, and outlast every opponent.",
    author: "Hudson Soft",
    year: 1990,
    genre: ["Action", "Puzzle"],
    zipFile: "dyna.zip",
    imgFile: "dyna.img",
    executable: "dyna",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_455-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Space": "Bomb",
      "Esc": "Menu"
    }
  },
  {
    id: "achtung-die-kurve",
    title: "Achtung, die Kurve!",
    description: "Fast freeware snake-line game. Don't hit a wall or another player's trail.",
    author: "Fender",
    year: 1995,
    genre: ["Arcade", "Multiplayer"],
    zipFile: "Achtung.zip",
    imgFile: "Achtung.img",
    executable: "ACHTUNG.EXE",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_1285-DOS.php",
    controls: {
      "Left/Right": "Steer",
      "Esc": "Quit"
    }
  },
  {
    id: "j-bird",
    title: "J-Bird",
    description: "A Q*bert-style arcade climber: hop pyramids and avoid the chasing creatures.",
    author: "Orion Software",
    year: 1983,
    genre: ["Arcade"],
    zipFile: "j-bird.zip",
    executable: "START.bat",
    source: "https://www.retrogames.cz/play_1028-DOS.php",
    controls: {
      "Arrow Keys": "Hop",
      "Esc": "Quit"
    }
  },
  {
    id: "pac-gal",
    title: "Pac-Gal",
    description: "A Pac-Man clone. Eat dots, dodge ghosts, grab fruit.",
    author: "Hangsoft",
    year: 1983,
    genre: ["Arcade"],
    zipFile: "Pac-Gal.zip",
    imgFile: "Pac-Gal.img",
    executable: "pac-gal.exe",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_1572-DOS.php",
    controls: {
      "0-30000 then Enter": "Speed (try 1000)",
      "Arrow Keys": "Move",
      "Esc": "Quit"
    }
  },
  {
    id: "saboteur",
    title: "Saboteur",
    description: "Infiltrate an enemy complex as a ninja: punch, sneak, and plant the bomb.",
    author: "Durell Software",
    year: 1986,
    genre: ["Action", "Adventure"],
    zipFile: "saboteur.zip",
    imgFile: "saboteur.img",
    executable: "SABOTEUR.EXE",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_490-DOS.php",
    controls: {
      "A": "Yes, VGA",
      "Arrow Keys": "Move",
      "Space": "Punch / Use",
      "Esc": "Quit"
    }
  },
  {
    id: "acid-tetris",
    title: "Acid Tetris",
    description: "A psychedelic Tetris variant with warped visuals and classic stacking.",
    author: "Irec Software",
    year: 1996,
    genre: ["Puzzle"],
    zipFile: "AcidTetris.zip",
    executable: "atet.exe",
    source: "https://www.retrogames.cz/play_1836-DOS.php",
    controls: {
      "Arrow Keys": "Move / Rotate",
      "Esc": "Quit"
    }
  },
  {
    id: "prince-of-persia",
    title: "Prince of Persia",
    description: "Rotoscoped platforming classic. Survive the dungeon, dodge traps, beat the clock.",
    author: "Broderbund",
    year: 1989,
    genre: ["Platform", "Action"],
    zipFile: "prince.zip",
    imgFile: "prince.img",
    executable: "prince megahit",
    imgSize: "512,8,2,384",
    source: "https://www.retrogames.cz/play_102-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Shift": "Careful step",
      "Space": "Sword",
      "Esc": "Menu"
    }
  },
  {
    id: "super-worms",
    title: "Super Worms",
    description: "Arcade snake from the Charlie the Duck team. Eat, grow, and don't bite yourself.",
    author: "Wiering Software",
    year: 1995,
    genre: ["Arcade"],
    zipFile: "Super_Worms.zip",
    executable: "SW",
    source: "https://www.retrogames.cz/play_1846-DOS.php",
    controls: {
      "Arrow Keys": "Steer",
      "Esc": "Quit"
    }
  },
  {
    id: "dark-ages",
    title: "Dark Ages",
    description: "Apogee shareware platformer. Three episodes of jumping, shooting, and exploring.",
    author: "Apogee Software",
    year: 1991,
    genre: ["Platform", "Action"],
    zipFile: "DarkAges.zip",
    executable: "DA1",
    source: "https://www.retrogames.cz/play_1402-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Jump",
      "Alt": "Fire",
      "Esc": "Menu"
    }
  },
  {
    id: "wolfenstein-3d",
    title: "Wolfenstein 3D",
    description: "The original first-person shooter. Fight through Castle Wolfenstein as B.J. Blazkowicz.",
    author: "id Software",
    year: 1992,
    genre: ["Shooter", "Action"],
    zipFile: "Wolf3D.zip",
    executable: "WOLF3D",
    source: "https://www.retrogames.cz/play_408-DOS.php",
    controls: {
      "Arrow Keys": "Move",
      "Ctrl": "Fire",
      "Space": "Open door",
      "Esc": "Menu"
    }
  }
];

function generateDosboxConf(game: GameDefinition, disableMusic = true): string {
  const soundConfig = disableMusic ? `
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=none
oplrate=44100

[gus]
gus=false

[speaker]
pcspeaker=true
pcrate=44100
tandy=off
disney=false` : `
[sblaster]
sbtype=sb16
sbbase=220
irq=7
dma=1
hdma=5
sbmixer=true
oplmode=auto
oplrate=44100

[gus]
gus=false

[speaker]
pcspeaker=true
pcrate=44100
tandy=auto
disney=true`;

  let autoexec: string;
  if (game.imgFile) {
    autoexec = `imgmount c ${game.imgFile} -size ${game.imgSize}
c:
${game.executable}`;
  } else {
    autoexec = `mount c .
c:
${game.executable}`;
  }

  return `[sdl]
fullscreen=false
output=surface
autolock=true

[dosbox]
machine=svga_s3
memsize=16

[render]
frameskip=0
aspect=false
scaler=normal2x

[cpu]
core=auto
cputype=auto
cycles=auto

[mixer]
nosound=false
rate=44100
blocksize=1024
prebuffer=20
${soundConfig}

[joystick]
joysticktype=auto

[dos]
xms=true
ems=true
umb=true

[autoexec]
${autoexec}
`;
}

export async function buildBundle(game: GameDefinition): Promise<void> {
  const projectRoot = join(import.meta.dir, "..");
  const downloadsDir = join(projectRoot, "downloads");
  const gamesDir = join(projectRoot, "games");
  const gameDir = join(gamesDir, game.id);
  const tempDir = join(projectRoot, "temp", game.id);

  console.log(`\n📦 Building bundle for: ${game.title}`);

  // Check if zip exists
  const zipPath = join(downloadsDir, game.zipFile);
  if (!existsSync(zipPath)) {
    console.log(`  ⚠️  Zip file not found: ${game.zipFile}`);
    return;
  }

  // Create temp directory
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
  }
  mkdirSync(tempDir, { recursive: true });

  // Create .jsdos directory
  const jsdosDir = join(tempDir, ".jsdos");
  mkdirSync(jsdosDir);

  // Extract zip to temp
  await $`unzip -o ${zipPath} -d ${tempDir}`.quiet();

  // Write dosbox.conf (with music disabled by default)
  writeFileSync(join(jsdosDir, "dosbox.conf"), generateDosboxConf(game, true));

  // Create game directory
  if (!existsSync(gameDir)) {
    mkdirSync(gameDir, { recursive: true });
  }

  // Create the bundle
  const bundlePath = join(gameDir, `${game.id}-bundle.jsdos`);
  await $`cd ${tempDir} && zip -r ${bundlePath} .`.quiet();

  // Write game.json
  const gameConfig = {
    id: game.id,
    title: game.title,
    description: game.description,
    author: game.author,
    year: game.year,
    genre: game.genre,
    bundle: `${game.id}-bundle.jsdos`,
    executable: game.executable,
    controls: game.controls,
    thumbnail: "thumbnail.png",
    source: game.source
  };
  writeFileSync(join(gameDir, "game.json"), JSON.stringify(gameConfig, null, 2));

  // Cleanup temp
  rmSync(tempDir, { recursive: true });

  console.log(`  ✅ Created: games/${game.id}/${game.id}-bundle.jsdos`);
}

function catalogEntry(game: GameDefinition) {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    year: game.year,
    genre: game.genre,
  };
}

export async function upsertGameJson(game: GameDefinition): Promise<void> {
  const projectRoot = join(import.meta.dir, "..");
  const gamesJsonPath = join(projectRoot, "src", "games.json");
  const existingData = await Bun.file(gamesJsonPath).json();
  const index = existingData.games.findIndex((g: { id: string }) => g.id === game.id);
  const entry = catalogEntry(game);

  if (index >= 0) {
    existingData.games[index] = entry;
    console.log(`  ♻️  Updated ${game.title} in games.json`);
  } else {
    existingData.games.push(entry);
    console.log(`  ➕ Added ${game.title} to games.json`);
  }

  existingData.games.sort((a: { title: string }, b: { title: string }) =>
    a.title.localeCompare(b.title),
  );
  writeFileSync(gamesJsonPath, `${JSON.stringify(existingData, null, 2)}\n`);
}

async function updateGamesJson(): Promise<void> {
  const projectRoot = join(import.meta.dir, "..");
  const existingData = await Bun.file(join(projectRoot, "src", "games.json")).json();
  const existingIds = new Set(existingData.games.map((g: { id: string }) => g.id));
  for (const game of GAMES) {
    if (!existingIds.has(game.id)) await upsertGameJson(game);
  }
}

async function main(): Promise<void> {
  console.log("🎮 Building DOS Game Bundles\n");
  console.log("Note: Music is DISABLED by setting oplmode=none");
  console.log("This keeps sound effects but removes OPL/AdLib music.\n");

  const projectRoot = join(import.meta.dir, "..");
  const tempDir = join(projectRoot, "temp");
  
  // Create temp directory
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir);
  }

  // Build each game
  for (const game of GAMES) {
    await buildBundle(game);
  }

  // Update games.json
  console.log("\n📝 Updating src/games.json...");
  await updateGamesJson();

  // Cleanup temp directory
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
  }

  console.log("\n✨ Done! All bundles created successfully.");
  console.log("\nTo enable music for a specific game, edit its .jsdos/dosbox.conf");
  console.log("and change 'oplmode=none' to 'oplmode=auto'");
}

if (import.meta.main) {
  main().catch(console.error);
}

