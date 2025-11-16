"use client";

import { useEffect, useRef, useState } from "react";

import type { Game } from "@/types/game";
import type { DosPlayer } from "@/types/js-dos";

type Status = "idle" | "loading" | "ready" | "error";

const STATUS_COPY: Record<Status, string> = {
  idle: "Select a bundle to boot the emulator.",
  loading: "Spinning up DOSBox and streaming the bundle…",
  ready: "Game ready. Press the DOS window to capture your keyboard.",
  error: "We couldn't boot the emulator. Try again or pick another game.",
};

export function GamePlayer({ game }: { game: Game }) {
  const playerHost = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<DosPlayer | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function start() {
      if (!playerHost.current) return;
      setStatus("loading");
      setErrorMessage(null);

      if (playerRef.current) {
        void playerRef.current.stop();
        playerRef.current = null;
      }

      playerHost.current.innerHTML = "";

      try {
        const player = await startPlayer(
          playerHost.current,
          `/games/${game.bundle}`,
        );
        if (canceled) return;
        playerRef.current = player;
        if (canceled) return;
        setStatus("ready");
      } catch (error) {
        console.error(error);
        if (canceled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Unknown emulator error",
        );
        setStatus("error");
      }
    }

    start();

    return () => {
      canceled = true;
      void playerRef.current?.stop();
      playerRef.current = null;
    };
  }, [game.bundle]);

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl">
        <div
          ref={playerHost}
          className="aspect-[4/3] w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black"
        />
        {status !== "ready" && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70 px-6 text-center text-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              {status === "loading"
                ? "Initializing"
                : status === "error"
                  ? "Error"
                  : "Idle"}
            </p>
            <p className="max-w-lg text-base font-medium">
              {status === "error" && errorMessage
                ? `${STATUS_COPY[status]} (${errorMessage})`
                : STATUS_COPY[status]}
            </p>
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
          {game.genre}
        </div>
      </div>
      <div className="grid gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-100 sm:grid-cols-3">
        <p>
          <span className="text-xs uppercase tracking-widest text-slate-400">
            Released
          </span>
          <br />
          <span className="text-lg font-semibold text-white">{game.year}</span>
        </p>
        <p>
          <span className="text-xs uppercase tracking-widest text-slate-400">
            Developer
          </span>
          <br />
          <span className="text-base font-semibold text-white">
            {game.developer}
          </span>
        </p>
        <p>
          <span className="text-xs uppercase tracking-widest text-slate-400">
            Play time
          </span>
          <br />
          <span className="text-base font-semibold text-white">
            {game.runtime}
          </span>
        </p>
      </div>
    </div>
  );
}

const JS_DOS_PATH_PREFIX = "https://v8.js-dos.com/latest/emulators/" as const;

async function startPlayer(
  host: HTMLDivElement,
  bundleUrl: string,
): Promise<DosPlayer> {
  if (typeof window === "undefined") {
    throw new Error("The DOS runtime is only available in the browser.");
  }

  if (!window.Dos) {
    await waitForDosGlobal();
  }

  if (!window.Dos) {
    throw new Error("js-dos script failed to load");
  }

  const player = await window.Dos(host, {
    workerThread: true,
    pathPrefix: JS_DOS_PATH_PREFIX,
    url: bundleUrl,
  });
  if (!player) {
    throw new Error("Unable to bootstrap js-dos");
  }

  return player;
}

function waitForDosGlobal() {
  return new Promise<void>((resolve) => {
    const interval = window.setInterval(() => {
      if (window.Dos) {
        window.clearInterval(interval);
        resolve();
      }
    }, 30);
  });
}
