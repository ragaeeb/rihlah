# Rihlah DOS Library

A Next.js 16 application bootstrapped with Bun, Tailwind CSS v4, and Biome that uses [js-dos](https://js-dos.com/overview.html) to
load curated MS-DOS shareware directly in the browser. The default build includes Jetpack, Commander Keen 4, and Wolfenstein 3D
bundled as `.jsdos` archives, mirroring the interactive experience on sites such as My Abandonware.

https://github.com/js-dos/dosbox

## Requirements

- [Bun](https://bun.sh) `1.3.2` (run `bun upgrade` if you are on an older version)
- Node.js is not required because Bun handles the runtime and package management.

## Getting started

```bash
bun install
bun run dev
```

The app follows the js-dos getting-started guide by loading the stylesheet and runtime directly from the official CDN, so there
is no need to check large emulator blobs into `public/`. When wiring the `Dos` player, make sure the `pathPrefix` points to
`https://v8.js-dos.com/latest/emulators/`—that folder hosts the `emulators.js` worker bundle that powers js-dos. 【75bfef†L1-L27】

If the emulator console shows `panic]Broken bundle, .jsdos/dosbox.conf not found`, the archive being streamed is missing the metadata js-dos requires at the root of the ZIP file. Run `bun run check:bundles` to scan every `.jsdos` under `public/games` and report missing `.jsdos/dosbox.conf` or `.jsdos/jsdos.json` files before restarting the dev server. For a manual spot check, `unzip -l public/games/jetpack.jsdos | head` should list `.jsdos/dosbox.conf` near the top. The dev server now emits `Cache-Control: no-store` for `/games/*.jsdos` so reloading the page always streams the on-disk archive instead of a stale browser cache.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start Next.js in development mode. |
| `bun run build` | Create an optimized production build. |
| `bun run start` | Serve the production build. |
| `bun run lint` | Run the Biome linter across the repo. |
| `bun run format` | Format the codebase with Biome. |

## Adding or editing games

1. Drop a `.jsdos` archive inside `public/games`. Each archive is just a zip file that contains your `dosbox.conf` and the game
   files (the samples in this repo mount the bundle root as the `C:` drive). js-dos expects those configs to live under a nested
   `.jsdos/` directory along with a `jsdos.json` metadata file—if you leave `dosbox.conf` at the zip root the emulator boots to
   an idle prompt because it cannot discover the autoexec instructions. A ready-to-use configuration template matching the
   upstream bundles is stored in [`data/jsdos-template`](data/jsdos-template) so you can copy it into new archives.
2. Register the new title inside [`data/games.ts`](data/games.ts) with metadata, control hints, and the bundle filename.
3. Restart the dev server so the updated list is picked up.

The `GamePlayer` component automatically streams bundles through the js-dos runtime, explicitly enables worker-threaded
emulation (the default recommended in the docs) for smooth performance, and displays helpful loading states so players know
when the emulator is ready to capture input.【7b31e3†L1-L38】

### Rebuilding a broken bundle

If `bun run check:bundles` highlights a missing `.jsdos` directory:

1. Unzip the affected archive into a temporary folder.
2. Copy the `.jsdos` directory from [`data/jsdos-template`](data/jsdos-template) into that folder so `dosbox.conf`, `jsdos.json`, and `readme.txt` live under `.jsdos/` alongside the rest of the game files.
3. Re-zip the folder contents (the `.jsdos/` directory must stay at the archive root) and move the refreshed `.jsdos` file back into `public/games`.
4. Restart `bun run dev` so the dev server serves the updated asset.

## Linting & formatting

[Biome](https://biomejs.dev) replaces ESLint/Prettier in this project. Run `bun run lint` before committing to ensure the config
matches the repository style.

## Deployment notes

- Because the game bundles live in `public/games`, they are served as static assets on any platform that supports Next.js 16.
- If you plan to add your own bundles at runtime (for example via uploads), store them in object storage and update
  `GamePlayer` to point to the new URLs.
- The UI intentionally mirrors the classic “load list + emulator” layout from Jetpack on MyAbandonware so players can pick and
  launch games in a single tap.
