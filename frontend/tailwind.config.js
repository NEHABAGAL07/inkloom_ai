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
      colors: {
        workspace: "var(--bg-workspace)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
        },
        header: "var(--bg-header)",
        sidebar: "var(--bg-sidebar)",
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
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
          info: "var(--status-info)",
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
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        dropdown: "var(--shadow-dropdown)",
      },
    },
  },
  plugins: [],
};
