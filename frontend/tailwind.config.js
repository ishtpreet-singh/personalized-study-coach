/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Brand Colors ──────────────────────────────────────
      colors: {
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",   // Main brand color (Indigo)
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          400: "#34d399",   // Emerald accent
          500: "#10b981",
        },
        surface: {
          50:  "#f8fafc",   // slate-50
          100: "#f1f5f9",   // slate-100
          200: "#e2e8f0",   // slate-200
          300: "#cbd5e1",   // slate-300
          400: "#94a3b8",   // slate-400
          500: "#64748b",   // slate-500
          600: "#475569",   // slate-600
          700: "#334155",   // slate-700
          800: "#1e293b",   // slate-800
          900: "#0f172a",   // slate-900
        },
      },
      // ── Typography ────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      // ── Shadows ───────────────────────────────────────────
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        // No glowing blurry shadows
      },
      // ── Animations ────────────────────────────────────────
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
