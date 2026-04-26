export const colors = {
  global: {
    canvas: "#0d1117",
    overlay: "#161b22",
    border: "#30363d",
    success: "#238636",
    danger: "#da3633",
    accent: "#58a6ff",
    text: {
      primary: "#c9d1d9",
      secondary: "#8b949e",
      tertiary: "#6e7681",
    },
  },
  platforms: {
    github: { primary: "#4A90E2", light: "#B8E1FF", bg: "#E0F4FF" },
    leetcode: { primary: "#4CAF50", light: "#A5D6A7", bg: "#E8F5E9" },
    hackerrank: { primary: "#9C27B0", light: "#CE93D8", bg: "#F3E5F5" },
    custom: { primary: "#FF9800", light: "#FFCC80", bg: "#FFF3E0" },
  },
} as const;

export const spacing = { xs: 8, sm: 16, md: 24, lg: 32 } as const;

export const radius = 6;

export const typography = {
  h1: { size: 24, weight: 500 },
  h2: { size: 18, weight: 500 },
  body: { size: 16, weight: 400 },
  label: { size: 14, weight: 500 },
  caption: { size: 13, weight: 400 },
} as const;
