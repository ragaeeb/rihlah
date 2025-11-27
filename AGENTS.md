# AGENTS.md - AI Agent Guide

This document is for AI agents working with this codebase. It explains the project structure, purpose, and how to perform common tasks.

## Project Overview

**Rihlah** is a static web application that runs classic DOS games in the browser using [js-dos](https://js-dos.com/) (DOSBox compiled to WebAssembly). It's designed to be deployed on GitHub Pages with zero backend requirements.

### Key Technologies
- **js-dos 6.22**: Browser-based DOS emulator
- **Bun**: Package manager and TypeScript runtime (v1.3.2+)
- **TypeScript**: ESNext target for scripts
- **Static HTML/CSS/JS**: No framework, vanilla frontend

## File Structure

```
rihlah/
├── index.html                 # Game launcher/arcade homepage
├── play.html                  # Game player page (loads games via ?game=id)
├── package.json               # Bun config, scripts
├── tsconfig.json              # TypeScript config (ESNext)
├── bun.lockb                  # Bun lockfile
├── README.md                  # User documentation
├── AGENTS.md                  # This file (AI agent guide)
├── LICENSE                    # MIT License
├── .gitignore                 # Git ignore rules
│
├── src/
│   └── games.json             # Master list of all games (for launcher UI)
│
├── games/
│   └── {game-id}/             # One folder per game
│       ├── game.json          # Game metadata (title, controls, etc.)
│       └── {game-id}-bundle.jsdos  # js-dos bundle (ZIP with game + config)
│
├── scripts/
│   ├── add-game.ts            # Interactive CLI to add a new game
│   └── build-bundles.ts       # Batch rebuild all bundles from downloads/
│
├── downloads/                 # (gitignored) Raw game ZIPs from sources
│
└── .github/
    └── workflows/
        └── deploy.yml         # GitHub Pages deployment (on push to main)
```

## Core Concepts

### 1. js-dos Bundle (.jsdos)
A `.jsdos` file is a ZIP archive containing:
- Game files (either raw executables OR a disk image `.img`)
- `.jsdos/dosbox.conf` - DOSBox configuration with autoexec commands

### 2. Game Types
Games come in two formats from [RetroGames.cz](https://www.retrogames.cz/):

**Disk Images (.img)** - Most common:
```ini
[autoexec]
imgmount c game.img -size 512,8,2,384
c:
GAME.EXE
```

**Direct Executables** - Some older games:
```ini
[autoexec]
mount c .
c:
GAME.EXE
```

### 3. Sound Configuration
By default, music is disabled but sound effects are kept:
```ini
[sblaster]
oplmode=none    # Disables OPL/AdLib music
sbtype=sb16     # Keeps Sound Blaster effects
```

To enable music, change `oplmode=none` to `oplmode=auto`.

## Common Tasks

### Adding a New DOS Game

**Method 1: Use the interactive script**
```bash
bun run add-game
```

**Method 2: Manual process**
1. Download the game ZIP from a source like RetroGames.cz
2. Determine if it's a disk image or direct files:
   ```bash
   unzip -l game.zip  # Check contents
   ```
3. Create the game directory:
   ```bash
   mkdir -p games/{game-id}
   ```
4. Create the bundle:
   ```bash
   mkdir -p temp/.jsdos
   unzip game.zip -d temp/
   # Create temp/.jsdos/dosbox.conf with appropriate config
   cd temp && zip -r ../games/{game-id}/{game-id}-bundle.jsdos .
   ```
5. Create `games/{game-id}/game.json`:
   ```json
   {
     "id": "game-id",
     "title": "Game Title",
     "description": "Short description",
     "author": "Publisher",
     "year": 1993,
     "genre": ["Action", "Platform"],
     "bundle": "game-id-bundle.jsdos",
     "executable": "GAME.EXE",
     "controls": {
       "Arrow Keys": "Move",
       "Space": "Jump"
     },
     "source": "https://source-url"
   }
   ```
6. Add to `src/games.json`:
   ```json
   {
     "id": "game-id",
     "title": "Game Title",
     "description": "Short description",
     "year": 1993,
     "genre": ["Action", "Platform"]
   }
   ```

### Rebuilding All Bundles
If you need to change DOSBox settings globally:
```bash
bun run build-bundles
```
This reads from `downloads/` and regenerates all bundles in `games/`.

### Testing Locally
```bash
bun run dev
# Open http://localhost:8080
```

### Deploying
Push to `main` branch. GitHub Actions will deploy to Pages automatically.

## Important Patterns

### Game ID Convention
- Lowercase, hyphenated: `mario-teaches-typing`, `keen1`, `charlie-the-duck`
- Used as: folder name, bundle name, URL parameter

### URL Structure
- Launcher: `/index.html` or `/`
- Game player: `/play.html?game={game-id}`

### DOSBox Config Template
```ini
[sdl]
fullscreen=false
output=surface
autolock=true

[dosbox]
machine=svga_s3
memsize=16

[cpu]
core=auto
cputype=auto
cycles=auto

[mixer]
nosound=false
rate=44100

[sblaster]
sbtype=sb16
oplmode=none

[autoexec]
# For disk images:
imgmount c game.img -size 512,8,2,384
c:
GAME.EXE

# For direct files:
mount c .
c:
GAME.EXE
```

### Image Size Parameter
The `-size` parameter for `imgmount` is typically `512,8,2,384` for RetroGames.cz images. This corresponds to:
- 512 bytes per sector
- 8 sectors per track
- 2 heads
- 384 cylinders

## Platform Limitations

**js-dos ONLY supports DOS games.** If a user requests:
- **SNES games** → Needs [bsnes.js](https://nicholascc.github.io/nicholascc.github.io/bsnes-jg/) or similar
- **NES games** → Needs [JSNES](https://github.com/bfirsh/jsnes)
- **Game Boy** → Needs [GameBoy.js](https://github.com/nicholascc/nicholascc.github.io)

These would require significant architecture changes to support.

## File Relationships

```
User visits /play.html?game=keen1
         │
         ▼
play.html loads games/keen1/game.json
         │
         ├─ Gets bundle path: "keen1-bundle.jsdos"
         ├─ Gets controls: { "Arrow Keys": "Move", ... }
         │
         ▼
js-dos extracts games/keen1/keen1-bundle.jsdos
         │
         ├─ Reads .jsdos/dosbox.conf
         ├─ Mounts keen1.img as C:
         └─ Runs "keen1" command
```

## Debugging Tips

1. **Black screen after loading**: Check `dosbox.conf` paths match actual filenames
2. **Game runs too fast/slow**: Adjust `cycles=auto` to `cycles=10000` or similar
3. **No sound**: Browser may require user interaction first; click canvas
4. **Wrong executable**: Check the original source for correct command (e.g., `MARIO.EXE` vs `mario`)

## Sources for DOS Games

- [RetroGames.cz](https://www.retrogames.cz/) - Primary source, provides `.img` files
- [DOS Games Archive](https://www.dosgamesarchive.com/) - Direct executables
- [RGB Classic Games](https://www.classicdosgames.com/) - Various formats

Always check licensing before distributing games.

