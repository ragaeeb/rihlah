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
   files (the samples in this repo mount the bundle root as the `C:` drive). Any shareware pulled from archive.org or personal
   backups works as long as it is repackaged this way.
2. Register the new title inside [`data/games.ts`](data/games.ts) with metadata, control hints, and the bundle filename.
3. Restart the dev server so the updated list is picked up.

The `GamePlayer` component automatically streams bundles through the js-dos runtime, explicitly enables worker-threaded
emulation (the default recommended in the docs) for smooth performance, and displays helpful loading states so players know
when the emulator is ready to capture input.【7b31e3†L1-L38】

## Linting & formatting

[Biome](https://biomejs.dev) replaces ESLint/Prettier in this project. Run `bun run lint` before committing to ensure the config
matches the repository style.

## Deployment notes

- Because the game bundles live in `public/games`, they are served as static assets on any platform that supports Next.js 16.
- If you plan to add your own bundles at runtime (for example via uploads), store them in object storage and update
  `GamePlayer` to point to the new URLs.
- The UI intentionally mirrors the classic “load list + emulator” layout from Jetpack on MyAbandonware so players can pick and
  launch games in a single tap.
