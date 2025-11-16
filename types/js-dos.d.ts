export type DosOptions = {
  url?: string;
  pathPrefix?: string;
  workerThread?: boolean;
  background?: string;
  lang?: "en" | "ru";
  theme?: string;
};

export type DosPlayer = {
  stop: () => Promise<void> | void;
};

declare global {
  interface Window {
    Dos?: (
      host: HTMLDivElement,
      options?: DosOptions,
    ) => DosPlayer | Promise<DosPlayer>;
  }
}
