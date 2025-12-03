import { darkColors, lightColors } from "./tokens/colors";
import { radii } from "./tokens/radii";
import { spacing } from "./tokens/spacing";
import { typography } from "./tokens/typography";

export const theme = {
  colors: {
    light: lightColors,
    dark: darkColors,
  },
  radii,
  spacing,
  typography,
} as const;

export type Theme = typeof theme;
export type ThemeMode = "light" | "dark";
