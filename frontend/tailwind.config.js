/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "375px",
      },
      colors: {
        workspace: "var(--bg-workspace)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
        },
        sidebar: "var(--bg-sidebar)",
        card: {
          DEFAULT: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
        },
        header: "var(--bg-header)",
        input: "var(--bg-input)",
        border: {
          DEFAULT: "var(--border-color)",
          subtle: "var(--border-subtle)",
          light: "var(--border-light)",
          dark: "var(--border-dark)",
        },
        ink: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        link: "var(--text-link)",
        navy: {
          DEFAULT: "var(--navy-surface)",
          dark: "var(--navy-dark)",
          light: "var(--navy-light)",
        },
        teal: {
          DEFAULT: "var(--compliance-teal)",
          hover: "var(--teal-hover)",
          light: "var(--teal-light)",
          50: "var(--teal-50)",
          100: "var(--teal-100)",
          600: "var(--teal-600)",
          700: "var(--teal-700)",
          800: "var(--teal-800)",
        },
        warm: {
          yellow: "#FFD84D",
          amber: "#FFAA35",
          orange: "#FF7A36",
          coral: "#FF665C",
          pink: "#F45B91",
          softPink: "#F6A6C4",
        },
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
          info: "var(--status-info)",
        },
        brand: {
          50: "#FFF8EB",
          100: "#FEEBC8",
          200: "#FBD38D",
          300: "#F6AD55",
          400: "#ED8936",
          500: "#FF7A36",
          600: "#FFAA35",
          700: "#FF665C",
          800: "#F45B91",
          900: "#1C1C1C",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Space Grotesk", "Sora", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
        warmGlow: "0 8px 32px -4px rgba(255, 122, 54, 0.25)",
        warmGlowLg: "0 12px 48px -4px rgba(255, 122, 54, 0.4)",
      },
    },
  },
  plugins: [],
};

