import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "var(--studio-bg)",
          surface: "var(--studio-surface)",
          elevated: "var(--studio-elevated)",
          float: "var(--studio-float)",
          border: "var(--studio-border)",
          ring: "var(--studio-ring)",
        },
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
          accent: "var(--ink-accent)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          glow: "var(--accent-glow)",
          muted: "var(--accent-muted)",
        },
        status: {
          draft: "#52526e",
          queued: "#f59e0b",
          generating: "#6366f1",
          ready: "#22c55e",
          failed: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        studio: "10px",
        card: "14px",
        xl2: "20px",
      },
      boxShadow: {
        studio: "0 0 0 1px rgba(124,58,237,0.12), 0 4px 24px rgba(0,0,0,0.5)",
        card: "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
        glow: "0 0 24px rgba(139,92,246,0.35)",
        "glow-sm": "0 0 12px rgba(139,92,246,0.2)",
        input: "0 0 0 2px var(--accent-muted)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        "card-gradient":
          "linear-gradient(145deg, rgba(23,23,40,0.9) 0%, rgba(15,15,26,0.95) 100%)",
        "hero-gradient":
          "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 65%)",
        "surface-gradient":
          "linear-gradient(180deg, rgba(23,23,40,1) 0%, rgba(15,15,26,1) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-glow": "pulseGlow 2.5s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
