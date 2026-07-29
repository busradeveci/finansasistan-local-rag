/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Inter Variable"', "system-ui", "sans-serif"],
      },
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
          DEFAULT: "#F7F9FC",
        },
        sidebar: {
          DEFAULT: "rgba(255,255,255,0.5)",
          text: "#64748B",
          active: "#111827",
        },
        enterprise: {
          border: "rgba(255,255,255,0.55)",
          card: "rgba(255,255,255,0.72)",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#3B82F6",
          selection: "#60A5FA",
        },
        text: {
          primary: "#111827",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.72)",
          border: "rgba(255,255,255,0.55)",
          elevated: "rgba(255,255,255,0.85)",
        },
      },
      fontSize: {
        hero: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "page-title": ["26px", { lineHeight: "1.25", fontWeight: "600", letterSpacing: "-0.025em" }],
        "section-title": ["17px", { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.015em" }],
        "card-title": ["16px", { lineHeight: "1.35", fontWeight: "600", letterSpacing: "-0.01em" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.5", fontWeight: "500" }],
        badge: ["11px", { lineHeight: "1.4", fontWeight: "600" }],
        button: ["14px", { lineHeight: "1.4", fontWeight: "600" }],
      },
      boxShadow: {
        glass: "0 10px 40px rgba(15,23,42,0.08)",
        "glass-sm": "0 4px 16px rgba(15,23,42,0.06)",
        "glass-lg": "0 20px 60px rgba(15,23,42,0.10)",
        card: "0 10px 40px rgba(15,23,42,0.08)",
        elevated: "0 10px 40px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)",
      },
      borderRadius: {
        DEFAULT: "14px",
        lg: "20px",
        md: "14px",
        sm: "10px",
        xl: "20px",
        "2xl": "20px",
        "3xl": "20px",
      },
      backdropBlur: {
        glass: "20px",
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