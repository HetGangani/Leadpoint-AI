import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // LeadPoint AI Design System Core Tokens
        lp: {
          bg: "#F2F0FF",
          surface: "#E6F0FA",
          magenta: "#5C1D3A",
          black: "#0F0F12",
          gold: "#E5C158",
          "gold-light": "#F6E27A",
          mint: "#34D399",
          amber: "#FBBF24",
          crimson: "#F87171",
          text: "#0F0F12",
          secondary: "#475569",
          muted: "#64748B",
        },
      },
      boxShadow: {
        "gold-glow": "0 4px 18px rgba(229, 193, 88, 0.28)",
        "gold-glow-lg": "0 6px 24px rgba(229, 193, 88, 0.38)",
        "glass-sm": "0 2px 8px rgba(15, 15, 18, 0.04), 0 1px 2px rgba(92, 29, 58, 0.04)",
        "glass-md": "0 8px 24px rgba(15, 15, 18, 0.06), 0 2px 6px rgba(92, 29, 58, 0.05)",
        "glass-lg": "0 16px 36px rgba(15, 15, 18, 0.08), 0 4px 12px rgba(92, 29, 58, 0.06)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
