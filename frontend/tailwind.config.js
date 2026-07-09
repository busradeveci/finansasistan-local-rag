/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        teal: {
          50:  "#EDF5FF",
          100: "#b2d8d8",
          300: "#66b2b2",
          500: "#008080",
          700: "#006666",
          800: "#005555",
          900: "#004c4c",
        },
        darkTeal: {
          500: "#007777",
          600: "#006666",
          700: "#005555",
          800: "#004444",
          900: "#003333",
        },
        peach: {
          100: "#ffe0bd",
          200: "#ffe39f",
          300: "#ffcd94",
          400: "#eac086",
          500: "#ffad60",
        },
        navy: {
          100: "#b3cde0",
          300: "#6497b1",
          500: "#005b96",
          700: "#03396c",
          900: "#011f4b",
        },
        glass: {
          DEFAULT: "rgba(100, 151, 177, 0.35)",
          border: "#E0E6E6",
          canvas: "#b3cde0",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero:          ["36px", { lineHeight: "1.2",  fontWeight: "700" }],
        "page-title":  ["30px", { lineHeight: "1.25", fontWeight: "700" }],
        "section-title": ["22px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title":  ["18px", { lineHeight: "1.35", fontWeight: "600" }],
        body:          ["16px", { lineHeight: "1.5",  fontWeight: "400" }],
        "body-sm":     ["15px", { lineHeight: "1.5",  fontWeight: "400" }],
        caption:       ["13px", { lineHeight: "1.45", fontWeight: "400" }],
        badge:         ["13px", { lineHeight: "1.4",  fontWeight: "500" }],
        button:        ["15px", { lineHeight: "1.4",  fontWeight: "600" }],
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        glass: "0 2px 8px rgba(1, 31, 75, 0.06)",
        "glass-hover": "0 6px 20px rgba(1, 31, 75, 0.1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
