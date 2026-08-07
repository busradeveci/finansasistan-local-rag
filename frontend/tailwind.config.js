/** @type {import('tailwindcss').Config} */
export default {
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
          DEFAULT: "#ffffff",
        },
        sidebar: {
          DEFAULT: "#f9fafb",
          text: "#64748b",
          active: "#0f172a",
        },
        enterprise: {
          border: "#e5e7eb",
          card: "#ffffff",
        },
        teal: {
          deep: "#106ebe",
          DEFAULT: "#0078d4",
          light: "#2b88d8",
          50: "rgba(0, 120, 212, 0.06)",
          100: "rgba(0, 120, 212, 0.1)",
        },
        warm: {
          DEFAULT: "#f9fafb",
          50: "#ffffff",
          100: "#f3f4f6",
          200: "#e5e7eb",
        },
        midnight: {
          DEFAULT: "#0f172a",
          50: "rgba(0, 120, 212, 0.06)",
          100: "rgba(0, 120, 212, 0.1)",
          300: "#64748b",
          500: "#475569",
          700: "#334155",
          900: "#0f172a",
        },
        stone: {
          DEFAULT: "#78716c",
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
          light: "#94a3b8",
        },
        glass: {
          DEFAULT: "#ffffff",
          border: "#e5e7eb",
          canvas: "#ffffff",
          elevated: "#f9fafb",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["28px", { lineHeight: "1.2", fontWeight: "600" }],
        "page-title": ["26px", { lineHeight: "1.25", fontWeight: "600" }],
        "section-title": ["17px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title": ["16px", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.45", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.45", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.45", fontWeight: "500" }],
        badge: ["11px", { lineHeight: "1.4", fontWeight: "600" }],
        button: ["14px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      boxShadow: {
        glass: "0 1px 2px rgba(15, 23, 42, 0.04)",
        "glass-hover": "0 1px 3px rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04)",
        /* Fluent depth ramp — mirrors the Workstation dashboard elevation tokens */
        "vv-1": "0 1px 2px rgba(16, 32, 64, 0.04), 0 8px 24px rgba(16, 32, 64, 0.05)",
        "vv-2": "0 2px 6px rgba(16, 32, 64, 0.06), 0 18px 44px rgba(16, 32, 64, 0.09)",
      },
      borderRadius: {
        DEFAULT: "4px",
        lg: "6px",
        md: "4px",
        sm: "2px",
        xl: "6px",
      },
      keyframes: {
        "vv-message-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "none" },
        },
        "vv-typing": {
          "0%, 60%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        "vv-message-in": "vv-message-in 460ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "vv-typing": "vv-typing 1.25s ease-in-out infinite",
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
