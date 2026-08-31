import type { Config } from "tailwindcss";

/**
 * ACAIABA — Direção C (Fashion Premium).
 *
 * Sistema visual:
 * - `ink`    : escala neutra própria (papel → tinta), com superfícies quase
 *              pretas levemente frias para o dark mode intencional.
 * - `electric`: violeta elétrico usado APENAS como assinatura da marca
 *              (CTAs primários, destaques, estados de favorito), nunca como
 *              base de superfície.
 * - Tipografia: `font-display` (Archivo, grotesca pesada p/ identidade) e
 *              `font-sans` (Inter p/ corpo). Definidas via CSS vars no layout.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        ink: {
          50: "#F7F7F8",
          100: "#EDEDF0",
          200: "#DCDCE2",
          300: "#B9B9C4",
          400: "#8E8E9C",
          500: "#6A6A78",
          600: "#4C4C58",
          700: "#35353F",
          800: "#22222A",
          900: "#14141A",
          925: "#0E0E13",
          950: "#08080C",
        },
        paper: "#FAFAFB",
        noir: {
          950: "#050505",
          900: "#0A0A0A",
          800: "#151515",
          500: "#707070",
          50: "#F5F5F0",
        },
        electric: {
          50: "#F3EFFE",
          100: "#E7DFFE",
          200: "#CFC0FD",
          300: "#B19BFB",
          400: "#9A79F8",
          500: "#8457F2",
          600: "#7439E8",
          700: "#6028C7",
          800: "#4E21A1",
          900: "#3F1D7F",
          950: "#26104E",
        },
      },
      letterSpacing: {
        brand: "0.28em",
        label: "0.18em",
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(8,8,12,0.05), 0 12px 32px -16px rgba(8,8,12,0.16)",
        "card-dark": "0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 40px -20px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(116,57,232,0.35), 0 8px 32px -8px rgba(116,57,232,0.45)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
