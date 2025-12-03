export const darkColors = {
  background: "0 0% 8%", // #151515
  foreground: "0 0% 93%", // #EDEDED

  card: "0 0% 11%", // #1C1C1C
  cardForeground: "0 0% 93%",

  popover: "0 0% 11%",
  popoverForeground: "0 0% 93%",

  primary: "153 60% 53%", // #3ECF8E
  primaryForeground: "0 0% 9%",

  secondary: "0 0% 15%", // #262626
  secondaryForeground: "0 0% 93%",

  muted: "0 0% 15%", // #262626
  mutedForeground: "0 0% 55%", // #8B8B8B

  accent: "0 0% 15%",
  accentForeground: "0 0% 93%",

  destructive: "0 62.8% 30.6%",
  destructiveForeground: "0 0% 98%",

  border: "0 0% 18%", // #2E2E2E
  input: "0 0% 18%",
  ring: "153 60% 53%",
} as const;

// Placeholder for light mode - using standard values that would look decent
// but keeping dark as default to match current app.
export const lightColors = {
  background: "0 0% 100%",
  foreground: "0 0% 3.9%",

  card: "0 0% 100%",
  cardForeground: "0 0% 3.9%",

  popover: "0 0% 100%",
  popoverForeground: "0 0% 3.9%",

  primary: "153 60% 45%", // Slightly darker green for contrast on white
  primaryForeground: "0 0% 98%",

  secondary: "0 0% 96.1%",
  secondaryForeground: "0 0% 9%",

  muted: "0 0% 96.1%",
  mutedForeground: "0 0% 45.1%",

  accent: "0 0% 96.1%",
  accentForeground: "0 0% 9%",

  destructive: "0 84.2% 60.2%",
  destructiveForeground: "0 0% 98%",

  border: "0 0% 89.8%",
  input: "0 0% 89.8%",
  ring: "153 60% 45%",
} as const;

export type ColorToken = keyof typeof darkColors;
