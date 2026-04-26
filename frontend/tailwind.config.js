/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
      },
      spacing: {
        xs: "8px",
        sm: "16px",
        md: "24px",
        lg: "32px",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      fontSize: {
        h1: ["24px", { lineHeight: "1.2", fontWeight: "500" }],
        h2: ["18px", { lineHeight: "1.2", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
        caption: ["13px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      fontWeight: {
        h1: "500",
        h2: "500",
        body: "400",
        label: "500",
        caption: "400",
      },
    },
  },
  corePlugins: {
    backgroundImage: false,
  },
  plugins: [],
};
