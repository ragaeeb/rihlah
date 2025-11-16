"use client";

import { useMemo, useState } from "react";

import { GamePlayer } from "@/components/game-player";
import { games } from "@/data/games";

export default function Home() {
  const [activeGameId, setActiveGameId] = useState(games[0]?.id ?? "");
  const activeGame = useMemo(() => {
    return games.find((game) => game.id === activeGameId) ?? games[0];
  }, [activeGameId]);

  if (!activeGame) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 lg:flex-row lg:items-start">
        <section className="w-full space-y-8 lg:w-2/3">
          <header className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.5em] text-cyan-200">
              JS-DOS CONTROL ROOM
            </p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Load classic MS-DOS shareware without leaving your browser.
            </h1>
            <p className="text-base text-slate-200">
              Rihlah ships with a curated library powered by the latest js-dos
              runtime. Pick a game, stream its
              <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-xs text-cyan-200">
                .jsdos
              </code>
              bundle, and immediately relive the era of chunky sprites and FM
              synth audio.
            </p>
          </header>

          <GamePlayer game={activeGame} />

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Mission briefing
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {activeGame.title}
              </h2>
              <p className="text-base text-slate-200">
                {activeGame.description}
              </p>
              <p className="text-sm text-slate-400">{activeGame.mood}</p>
            </article>
            <article className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Controls
              </p>
              <ul className="grid gap-2 text-sm text-slate-100">
                {activeGame.controls.map((control) => (
                  <li
                    key={control}
                    className="flex items-start gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-2"
                  >
                    <span className="text-xs font-mono uppercase tracking-widest text-cyan-200">
                      input
                    </span>
                    <span className="font-medium text-white">{control}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
              Launch checklist
            </p>
            <ul className="grid gap-3 text-sm text-slate-100 md:grid-cols-2">
              {activeGame.instructions.map((step, index) => (
                <li
                  key={step}
                  className="rounded-2xl border border-white/5 bg-slate-900/60 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">
                    Step {index + 1}
                  </p>
                  <p className="text-base text-white">{step}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <aside className="w-full lg:w-1/3">
          <div className="sticky top-6 space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Playable library
              </p>
              <p className="text-lg text-slate-200">
                Every title is packaged as a{" "}
                <span className="font-semibold text-white">.jsdos</span> archive
                stored locally in
                <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-xs text-cyan-200">
                  public/games
                </code>
                .
              </p>
            </div>
            <ul className="space-y-3">
              {games.map((game) => {
                const isActive = game.id === activeGame.id;
                return (
                  <li
                    key={game.id}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveGameId(game.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition ${
                        isActive
                          ? "bg-slate-900/70"
                          : "bg-transparent hover:bg-slate-900/30"
                      }`}
                    >
                      <div>
                        <p className="text-base font-semibold text-white">
                          {game.title}
                        </p>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                          {game.year}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                          isActive
                            ? "bg-cyan-400/90 text-slate-900"
                            : "bg-slate-800 text-slate-100"
                        }`}
                      >
                        {isActive ? "Loaded" : "Load"}
                      </span>
                    </button>
                    <p className="mt-3 text-sm text-slate-200">
                      {game.tagline}
                    </p>
                  </li>
                );
              })}
            </ul>
            <div className="rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/5 p-4 text-sm text-slate-100">
              <p className="font-semibold text-white">Bring your own bundles</p>
              <p>
                Drop additional{" "}
                <span className="font-semibold text-cyan-300">.jsdos</span>{" "}
                files into
                <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-xs text-cyan-200">
                  public/games
                </code>{" "}
                and register them inside{" "}
                <code className="mx-1 rounded bg-black/40 px-1.5 py-0.5 text-xs text-cyan-200">
                  data/games.ts
                </code>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
