# 🎮 DOS Games Arcade

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8046d532-52e4-4fbc-bdbb-c809fce69e3c.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8046d532-52e4-4fbc-bdbb-c809fce69e3c)

A Cloudflare Worker that lets you play classic DOS games directly in your browser. Built with [js-dos](https://js-dos.com/) (DOSBox compiled to WebAssembly). Game bundles live in **R2**, not in git.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **No installation required** - Play directly in your browser
- **Mobile friendly** - Responsive design works on all devices
- **One-command deploy** - `bun run deploy` creates the R2 bucket, uploads games, and publishes the Worker
- **Easy to extend** - `bun run add-game` then `bun run deploy`

## 🚀 Quick Start

### Running Locally

```bash
git clone https://github.com/ragaeeb/rihlah.git
cd rihlah
bun install
bun run dev
# Open http://localhost:8080
```

`bun run dev` provisions a **local** R2 bucket, uploads your `games/` folder into it, and starts Wrangler (same request path as production).

```bash
bun run smoke -- --label after --compare tmp/smoke/before.json
```

### Deploying to Cloudflare

```bash
bunx wrangler login   # once
bun run deploy
```

That is the whole first-time setup: it creates the `rihlah-games` R2 bucket if needed, uploads catalog + `.jsdos` bundles, and deploys the Worker to **https://retro.al-iyaal.club**.

For GitHub Actions, add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. CI always uploads `src/games.json` and each `games/*/game.json`; it skips only missing `.jsdos` bundle files.

`.jsdos` bundles are gitignored. Keep them locally (or rebuild with `bun run add-game` / `bun run build-bundles`) and publish with `bun run deploy`.

## 📁 Project Structure

```
rihlah/
├── index.html              # Launcher
├── play.html               # Player (?game=id)
├── wrangler.jsonc          # Worker + R2 binding
├── src/
│   ├── worker.ts           # Serves HTML assets; games from R2
│   └── games.json          # Launcher catalog (also uploaded to R2)
├── games/{id}/             # Local working copy (*.jsdos gitignored)
│   ├── game.json
│   └── {id}-bundle.jsdos
├── scripts/
│   ├── deploy.ts           # bun run deploy / bun run dev
│   └── add-game.ts
└── .github/workflows/deploy.yml
```

## 🎯 Adding a New Game

The arcade is a Worker. Add a game locally, then publish it to R2:

```bash
bun run add-game 480
bun run add-game https://www.retrogames.cz/play_480-DOS.php
bun run deploy
```

Optional flags: `--id`, `--exe`, `--size 512,8,2,384`, `--force`.

That downloads the zip, builds the js-dos bundle, and lists the game on the launcher. Check the game's license before publishing.

### Manual setup

If the game is not on RetroGames.cz:

#### Step 1: Get the Game Files

Download DOS game files from legitimate sources like:
- [DOS Games Archive](https://www.dosgamesarchive.com/)
- [RGB Classic Games](https://www.classicdosgames.com/)
- [RetroGames.cz](https://www.retrogames.cz/)

Games typically come as:
- `.zip` containing `.exe` files
- `.zip` containing `.img` disk images

#### Step 2: Create a js-dos Bundle

A js-dos bundle is a ZIP file containing:
1. Game files (or disk image)
2. DOSBox configuration in `.jsdos/dosbox.conf`

**For games with executables:**

```bash
# Create bundle directory
mkdir -p mygame/.jsdos

# Copy game files
cp -r game_files/* mygame/

# Create dosbox.conf
cat > mygame/.jsdos/dosbox.conf << 'EOF'
[autoexec]
mount c .
c:
GAME.EXE
EOF

# Create the bundle
cd mygame
zip -r ../mygame-bundle.jsdos .
```

**For games with disk images (.img):**

```bash
# Create bundle directory
mkdir -p mygame/.jsdos

# Copy image file
cp game.img mygame/

# Create dosbox.conf with imgmount
cat > mygame/.jsdos/dosbox.conf << 'EOF'
[autoexec]
imgmount c game.img -size 512,8,2,384
c:
GAME
EOF

# Create the bundle
cd mygame
zip -r ../mygame-bundle.jsdos .
```

> **Note:** The `-size` parameter depends on the disk image. Common values:
> - Floppy 1.44MB: `-size 512,18,2,80`
> - Floppy 720KB: `-size 512,9,2,80`
> - Custom: Check the original source

#### Step 3: Create Game Folder

```bash
mkdir -p games/mygame
mv mygame-bundle.jsdos games/mygame/
```

#### Step 4: Create game.json

Create `games/mygame/game.json`:

```json
{
  "id": "mygame",
  "title": "My Game",
  "description": "A classic DOS game description",
  "author": "Publisher Name",
  "year": 1993,
  "genre": ["Action", "Platform"],
  "bundle": "mygame-bundle.jsdos",
  "executable": "game",
  "controls": {
    "Arrow Keys": "Move",
    "Space": "Jump",
    "Esc": "Menu"
  },
  "thumbnail": "thumbnail.png",
  "source": "https://example.com/game-source"
}
```

#### Step 5: Update games.json

Add your game to `src/games.json`:

```json
{
  "games": [
    {
      "id": "mygame",
      "title": "My Game",
      "description": "A classic DOS game description",
      "year": 1993,
      "genre": ["Action", "Platform"]
    }
  ]
}
```

#### Step 6: Test & Deploy

```bash
bun run dev
# Open http://localhost:8080 and test your game
bun run deploy
```

## 🔧 DOSBox Configuration

The `.jsdos/dosbox.conf` file uses standard DOSBox configuration. Common options:

```ini
[sdl]
fullscreen=false
output=surface

[dosbox]
machine=svga_s3
memsize=16

[cpu]
cycles=auto

[autoexec]
# Commands to run on startup
mount c .
c:
GAME.EXE
```

See the [DOSBox Wiki](https://www.dosbox.com/wiki/Dosbox.conf) for all options.

## 🎨 Customization

### Adding Thumbnails

Add a `thumbnail.png` (recommended 320x200 or 640x400) to each game folder for display on the launcher.

### Modifying Styles

Edit the `<style>` sections in `index.html` and `play.html`. The design uses CSS custom properties for easy theming:

```css
:root {
    --bg-primary: #0d0d0d;
    --accent: #ff2e63;
    --text-secondary: #08d9d6;
    /* ... */
}
```

## 📜 License

This project is MIT licensed. Note that individual games may have their own licenses - check before distributing.

## 🙏 Credits

- [js-dos](https://js-dos.com/) - DOSBox in the browser
- [DOSBox](https://www.dosbox.com/) - The original DOS emulator
- Game files from [RetroGames.cz](https://www.retrogames.cz/)

## 🐛 Troubleshooting

### Game shows black screen
- Check browser console for errors
- Verify the `.jsdos` bundle contains correct `dosbox.conf`
- Ensure paths in `dosbox.conf` match actual file names

### Game runs too fast/slow
- Adjust `cycles` in `dosbox.conf`:
  ```ini
  [cpu]
  cycles=10000
  ```

### No sound
- Some browsers require user interaction before playing audio
- Click anywhere on the page before starting the game

### Controls not working
- Click on the game canvas to focus it
- Some games use specific key bindings - check original documentation

