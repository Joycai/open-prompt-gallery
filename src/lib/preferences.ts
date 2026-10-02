export const themes = ["ocean", "forest", "violet"] as const;
export const modes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];
export type Mode = (typeof modes)[number];
export function normalizeTheme(value?: string): Theme {
  return themes.includes(value as Theme) ? (value as Theme) : "ocean";
}
export function normalizeMode(value?: string): Mode {
  return modes.includes(value as Mode) ? (value as Mode) : "system";
}
