# AGENTS.md - AI Agent Guide

This document is for AI agents working with this codebase. It explains the project structure, purpose, and how to perform common tasks.

## Project Overview

**Rihlah** is a Cloudflare Worker that runs classic DOS games in the browser using [js-dos](https://js-dos.com/). HTML/js-dos are Worker static assets. Game catalogs and `.jsdos` bundles are stored in **R2** (`rihlah-games`), not committed.

### Key Technologies
- **js-dos 8.4.1**: Browser-based DOS emulator (npm package, vendored into `vendor/js-dos`)
- **Bun**: Package manager and TypeScript runtime (v1.3.2+)
- **Cloudflare Workers + R2**: Hosting and game object storage
- **Wrangler**: `bun run deploy` creates the bucket and deploys
- **Static HTML/CSS/JS**: No frontend framework

## File Structure

```
rihlah/
├── index.html                 # Game launcher/arcade homepage
├── play.html                  # Game player page (loads games via ?game=id)
├── wrangler.jsonc            # Worker name, assets, R2 binding
├── src/
│   ├── worker.ts             # R2 for /games/* and /src/games.json; else assets
│   └── games.json             # Catalog (uploaded to R2 on deploy)
├── games/{game-id}/          # Local working copy; *.jsdos gitignored
├── scripts/
│   ├── deploy.ts             # bun run deploy | bun run dev
│   ├── add-game.ts           # bun run add-game <retrogames url or id>
│   ├── build-bundles.ts
│   ├── vendor-jsdos.ts
│   └── smoke-games.ts
└── .github/workflows/deploy.yml
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

The Worker reads games from R2. Add locally, then publish:

```bash
bun run add-game 480
bun run add-game https://www.retrogames.cz/play_480-DOS.php
bun run add-game 480 --id dangerous-dave --exe DAVE.EXE --force
bun run deploy
```

That downloads the RetroGames.cz zip into `downloads/`, writes `games/{id}/`, and updates `src/games.json`. `bun run deploy` uploads those files to R2.

**Manual process** (if the game is not on RetroGames.cz):
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

Same Worker + R2 path as production (Wrangler local R2).

### Smoke-testing games
Loads every game in Chromium and checks that the DOS canvas paints (not a black/error screen):
```bash
bun run smoke -- --label after --compare tmp/smoke/before.json
```

### Deploying
```bash
bun run deploy
```

Creates `rihlah-games` if missing, uploads `src/games.json` + each `games/{id}` bundle, deploys the Worker. No extra `wrangler r2` commands.

Push to `main` also deploys via GitHub Actions (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). CI skips R2 sync when no `.jsdos` files are in the checkout.

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
play.html loads /games/keen1/game.json  (Worker → R2)
         │
         ├─ Gets bundle path: "keen1-bundle.jsdos"
         ├─ Gets controls: { "Arrow Keys": "Move", ... }
         │
         ▼
js-dos 8 player (vendor/js-dos) runs the bundle
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

