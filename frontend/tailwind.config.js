/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        canvas: {
          DEFAULT: "#060913",
        },
        sidebar: {
          DEFAULT: "#060913",
          text: "#64748b",
          active: "#ffffff",
        },
        enterprise: {
          border: "#1e293b",
          card: "#0d1527",
        },
        teal: {
          deep: "#059669",
          DEFAULT: "#10b981",
          light: "#06b6d4",
          50: "rgba(16, 185, 129, 0.08)",
          100: "rgba(16, 185, 129, 0.12)",
        },
        warm: {
          DEFAULT: "#0d1527",
          50: "#111a30",
          100: "#152038",
          200: "#1e293b",
        },
        midnight: {
          DEFAULT: "#ffffff",
          50: "rgba(16, 185, 129, 0.08)",
          100: "rgba(16, 185, 129, 0.12)",
          300: "#64748b",
          500: "#94a3b8",
          700: "#cbd5e1",
          900: "#ffffff",
        },
        stone: {
          DEFAULT: "#64748b",
          light: "#94a3b8",
          50: "#111a30",
          100: "#152038",
          300: "#64748b",
          500: "#94a3b8",
          700: "#cbd5e1",
        },
        glass: {
          DEFAULT: "#0d1527",
          border: "#1e293b",
          canvas: "#060913",
          elevated: "#111a30",
        },
      },
      fontFamily: {
        sans: ['"Manrope Variable"', "Manrope", '"Segoe UI Variable"', "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["calc(28px * var(--ws-density))", { lineHeight: "1.2", fontWeight: "700" }],
        "page-title": ["calc(26px * var(--ws-density))", { lineHeight: "1.25", fontWeight: "700" }],
        "section-title": ["calc(17px * var(--ws-density))", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title": ["calc(16px * var(--ws-density))", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["calc(14px * var(--ws-density))", { lineHeight: "1.45", fontWeight: "400" }],
        "body-sm": ["calc(13px * var(--ws-density))", { lineHeight: "1.45", fontWeight: "400" }],
        caption: ["calc(12px * var(--ws-density))", { lineHeight: "1.45", fontWeight: "500" }],
        badge: ["calc(11px * var(--ws-density))", { lineHeight: "1.4", fontWeight: "600" }],
        button: ["calc(14px * var(--ws-density))", { lineHeight: "1.4", fontWeight: "600" }],
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        glass: "0 10px 35px rgba(15, 23, 42, 0.05)",
        "glass-hover": "0 14px 40px rgba(15, 23, 42, 0.08)",
        card: "0 10px 35px rgba(15, 23, 42, 0.05)",
      },
      borderRadius: {
        DEFAULT: "calc(18px * var(--ws-density))",
        lg: "calc(18px * var(--ws-density))",
        md: "calc(14px * var(--ws-density))",
        sm: "calc(10px * var(--ws-density))",
        xl: "calc(18px * var(--ws-density))",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-none": {
          "scrollbar-width": "none",
          "-ms-overflow-style": "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      })
    },
  ],
}
