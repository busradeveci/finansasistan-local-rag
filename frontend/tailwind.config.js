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
        canvas: {
          DEFAULT: "#fcfcfc",
        },
        sidebar: {
          DEFAULT: "#1b1a1f",
          text:    "rgba(252, 252, 252, 0.62)",
          active:  "#fcfcfc",
        },
        enterprise: {
          border: "#4f4e4d",
          card:   "#ffffff",
        },
        warm: {
          DEFAULT: "#fcfcfc",
          50:  "#fcfcfc",
          100: "#f5f5f5",
          200: "#ebebeb",
        },
        midnight: {
          DEFAULT: "#1b1a1f",
          50:  "#e8e8e9",
          100: "#c5c5c7",
          300: "#6b6a68",
          500: "#4f4e4d",
          700: "#2d2c32",
          900: "#1b1a1f",
        },
        stone: {
          DEFAULT: "#4f4e4d",
          light:   "#6b6a68",
          50:  "#f5f5f4",
          100: "#e8e7e6",
          300: "#6b6a68",
          500: "#4f4e4d",
          700: "#3a3938",
        },
        glass: {
          DEFAULT: "#ffffff",
          border:  "rgba(79, 78, 77, 0.4)",
          canvas:  "#fcfcfc",
          elevated: "#ffffff",
        },
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero:          ["28px", { lineHeight: "1.2",  fontWeight: "700" }],
        "page-title":  ["28px", { lineHeight: "1.25", fontWeight: "700" }],
        "section-title": ["18px", { lineHeight: "1.3", fontWeight: "600" }],
        "card-title":  ["18px", { lineHeight: "1.35", fontWeight: "600" }],
        body:          ["14px", { lineHeight: "1.5",  fontWeight: "400" }],
        "body-sm":     ["13px", { lineHeight: "1.5",  fontWeight: "400" }],
        caption:       ["13px", { lineHeight: "1.45", fontWeight: "500" }],
        badge:         ["13px", { lineHeight: "1.4",  fontWeight: "500" }],
        button:        ["13px", { lineHeight: "1.4",  fontWeight: "600" }],
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        glass: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glass-hover": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      borderRadius: {
        DEFAULT: "2px",
        lg: "2px",
        md: "2px",
        sm: "2px",
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
