import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F6F5F1",
          50: "#F6F5F1",
          100: "#F0F1EA",
          200: "#E8EBDF",
          300: "#DFE4D5",
          400: "#D2DBC5",
        },
        orange: {
          pastel: "#F1CFBD",
          warm: "#D98E66",
          deep: "#B95037",
          hover: "#9F432D",
        },
        pink: {
          soft: "#FFDDE5",
          blush: "#FFC2D1",
          rose: "#FB7185",
        },
        blue: {
          sky: "#DDF2FF",
          mist: "#C5E6FF",
          slate: "#89BBE0",
        },
        brown: {
          dark: "#303A35",
          coffee: "#29352C",
          wood: "#596556",
          soft: "#6D7668",
          muted: "#70796B",
          border: "#E5E7DD",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-quicksand)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "var(--font-quicksand)",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        scrapbook: "0 10px 30px -5px rgba(73, 54, 45, 0.08), 0 4px 12px -2px rgba(73, 54, 45, 0.04)",
        polaroid: "0 12px 32px -4px rgba(73, 54, 45, 0.12), 0 2px 6px rgba(73, 54, 45, 0.05)",
        float: "0 20px 40px -10px rgba(73, 54, 45, 0.15)",
        sticker: "0 4px 0 #E3D1C4",
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      animation: {
        "paw-bounce": "pawBounce 2s ease-in-out infinite",
        "float-gentle": "floatGentle 4s ease-in-out infinite",
        "wiggle": "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        pawBounce: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-6px) rotate(4deg)" },
        },
        floatGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
