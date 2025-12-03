export const radii = {
  lg: "0.5rem",
  md: "calc(0.5rem - 2px)",
  sm: "calc(0.5rem - 4px)",
  full: "9999px",
  none: "0",
  default: "0.25rem", // 4px
} as const;

export type RadiusToken = keyof typeof radii;
