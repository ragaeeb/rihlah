# 🎮 DOS Games Arcade

A static web application that lets you play classic DOS games directly in your browser. Built with [js-dos](https://js-dos.com/) - a DOSBox emulator compiled to JavaScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **No installation required** - Play directly in your browser
- **Mobile friendly** - Responsive design works on all devices
- **Easy to deploy** - Static files, works with GitHub Pages
- **Easy to extend** - Simple process to add new games

## 🚀 Quick Start

### Running Locally

```bash
# Clone the repository
git clone https://github.com/ragaeeb/rihlah.git
cd rihlah

# Install dependencies (requires Bun >= 1.3.2)
bun install

# Start local server
bun run dev

# Open http://localhost:8080 in your browser
```

Or simply open `index.html` in a browser (some features may require a server due to CORS).

### Deploying to GitHub Pages

1. Fork or push this repository to GitHub
2. Go to **Settings** → **Pages**
3. Under "Build and deployment", select **GitHub Actions**
4. Push to `main` branch - the site will deploy automatically

Your arcade will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

## 📁 Project Structure

```
dos-games-arcade/
├── index.html              # Main game launcher page
├── play.html               # Game player page
├── package.json            # Node.js configuration
├── src/
│   └── games.json          # List of all games (for launcher)
├── games/
│   └── jetpack/            # Game folder
│       ├── game.json       # Game metadata
│       └── jetpack-bundle.jsdos  # js-dos bundle
├── scripts/
│   └── add-game.ts         # Helper script to add games (TypeScript)
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages deployment
```

## 🎯 Adding a New Game

### Method 1: Using the Helper Script

```bash
bun run add-game
```

Follow the prompts to enter game details.

### Method 2: Manual Setup

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

# When ready, commit and push
git add .
git commit -m "Add My Game"
git push
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

