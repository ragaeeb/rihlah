import type { Game } from "@/types/game";

export const games: Game[] = [
  {
    id: "jetpack",
    title: "Jetpack",
    year: 1993,
    developer: "Adam Pedersen / Software Creations",
    genre: "Arcade platformer",
    runtime: "Shareware episode",
    description:
      "Build ladders, dodge guardians, and collect every emerald before racing to your ship. Jetpack's editor and frantic pacing made it a staple of DOS shareware disks.",
    tagline: "Fast-paced jet-powered puzzle platforming in neon caves.",
    controls: [
      "Arrow keys to move",
      "Alt to fire",
      "Ctrl to jet (hold for thrust)",
      "Enter to start",
    ],
    instructions: [
      "Press Enter once the DOS prompt appears to skip shareware screens.",
      "Choose a level or build your own with the in-game editor.",
      "Collect all emeralds to open the exit teleporter and escape.",
      "Upgrade your jetpack fuel at stations to stay airborne longer.",
    ],
    bundle: "jetpack.jsdos",
    accent: "from-emerald-400 via-lime-300 to-amber-200",
    mood: "Collect the emeralds, assemble your jet, and blast out before the guards catch you.",
  },
  {
    id: "keen4",
    title: "Commander Keen 4: Secret of the Oracle",
    year: 1991,
    developer: "id Software",
    genre: "Adventure platformer",
    runtime: "Episode 4 shareware",
    description:
      "Billy Blaze returns to battle the Shikadi in a lush alien jungle packed with secrets, pogo tricks, and wacky lore.",
    tagline: "Saturday-morning sci-fi with pogo sticks and neural stunners.",
    controls: [
      "Arrow keys to walk",
      "Ctrl to jump",
      "Alt to fire",
      "Ctrl + Alt for pogo",
    ],
    instructions: [
      "After the intro scroll, press F1 for the manual or Enter to begin.",
      "Use F5 in-game to quick save before risky pogo jumps.",
      "Collect keycards to unlock Council Members hidden in pyramids.",
      "Talk to the oracle elders in the overworld to progress the story.",
    ],
    bundle: "keen4.jsdos",
    accent: "from-cyan-300 via-sky-400 to-indigo-500",
    mood: "Bounce through the Shadowlands and rescue the missing Council.",
  },
  {
    id: "wolf3d",
    title: "Wolfenstein 3D",
    year: 1992,
    developer: "id Software",
    genre: "First-person action",
    runtime: "Shareware episode 1",
    description:
      "The grandparent of FPS games: escape Castle Wolfenstein with quick strafes, secret walls, and chunky pixels.",
    tagline:
      "Maze-like corridors, hidden treasure, and a barky guard dog soundtrack.",
    controls: [
      "Arrow keys to move",
      "Ctrl to fire",
      "Alt to open doors",
      "Space to push for secrets",
    ],
    instructions: [
      "Select 'New Game' then Episode 1 to play the free shareware campaign.",
      "Hold Alt while tapping Left/Right to strafe around corners.",
      "Watch for different wall textures—they often hide treasure rooms.",
      "Remember to save often (F2) before big fights like Hans Grosse.",
    ],
    bundle: "wolf3d.jsdos",
    accent: "from-rose-400 via-orange-400 to-yellow-300",
    mood: "Blitz through Castle Wolfenstein and topple the Third Reich's experiments.",
  },
];
