export type DosOptions = {
  url?: string;
  bundleUrl?: string;
  pathPrefix?: string;
  workerThread?: boolean;
  background?: string;
  lang?: "en" | "ru";
  theme?: string;
};

export type DosPlayer = {
  stop: () => Promise<void> | void;
  setAutoStart?: (enabled: boolean) => void;
  setCountDownStart?: (seconds: number) => void;
};

declare global {
  interface Window {
    Dos?: (
      host: HTMLDivElement,
      options?: DosOptions,
    ) => DosPlayer | Promise<DosPlayer>;
  }
}
