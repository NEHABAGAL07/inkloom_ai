/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#14263D",
          dark: "#0B1728",
          light: "#1E3A5F",
        },
        teal: {
          DEFAULT: "#0F766E",
          hover: "#115E59",
          light: "#CCFBF1",
          50: "#F0FDFA",
          100: "#CCFBF1",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
        },
        workspace: "#F4F7FA",
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#D7E0EA",
          light: "#E2E8F0",
          dark: "#CBD5E1",
        },
        ink: {
          primary: "#14263D",
          secondary: "#475569",
          muted: "#64748B",
        },
        status: {
          success: "#15803D",
          warning: "#B45309",
          error: "#B91C1C",
          info: "#1D4ED8",
        },
        brand: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#0F766E",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(20, 38, 61, 0.05), 0 1px 2px 0 rgba(20, 38, 61, 0.03)",
        card: "0 1px 3px 0 rgba(20, 38, 61, 0.08), 0 1px 2px -1px rgba(20, 38, 61, 0.08)",
        dropdown: "0 10px 15px -3px rgba(20, 38, 61, 0.1), 0 4px 6px -4px rgba(20, 38, 61, 0.05)",
      },
    },
  },
  plugins: [],
};
