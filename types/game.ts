export type Game = {
  id: string;
  title: string;
  year: number;
  developer: string;
  publisher?: string;
  genre: string;
  runtime: string;
  description: string;
  tagline: string;
  controls: string[];
  instructions: string[];
  bundle: string;
  accent: string;
  mood: string;
};
