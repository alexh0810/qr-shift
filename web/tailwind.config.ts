import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
        },
        success: {
          DEFAULT: "var(--success)",
        },
        error: {
          DEFAULT: "var(--error)",
        },
        surface: "var(--surface)",
        surfacestroke: "var(--surfacestroke)"
      },
    },
  },
  plugins: [],
};
export default config;
