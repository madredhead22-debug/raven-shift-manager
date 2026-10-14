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
        raven: {
          950: "#09090b", // Clean zinc-obsidian black
          900: "#111018", // Dark raven slate
          850: "#171522", // Card dark
          800: "#211e2f", // Hover dark
          700: "#322d47", // Hairline borders
          600: "#4f4570",
          500: "#7c3aed", // Refined Amethyst
          400: "#9061f9",
          300: "#a78bfa",
          200: "#c4b5fd",
          100: "#ede9fe",
          50: "#f5f3ff",
        },
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.6)',
        'purple-accent': '0 0 15px -3px rgba(124, 58, 237, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
