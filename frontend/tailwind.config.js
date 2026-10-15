/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F4F6F8",
        ink: { DEFAULT: "#1B1F4B", soft: "#4B5073", faint: "#8A8FB0", deep: "#12153A" },
        violet: { DEFAULT: "#5B3DF5", dark: "#4528D6", wash: "#EEEAFF" },
        spot: { DEFAULT: "#FFC93C", dark: "#E6AE12" },
        mint: { DEFAULT: "#1FB57A", wash: "#E3F7EE" },
        rose: { DEFAULT: "#E5484D", wash: "#FDECEC" },
        line: "#E1E4EE",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        lift: "0 10px 30px -12px rgba(27,31,75,0.25)",
        glow: "0 0 80px 10px rgba(255,201,60,0.35)",
      },
      keyframes: {
        breathe: { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.06)" } },
        ring: { "0%": { transform: "scale(0.9)", opacity: "0.5" }, "100%": { transform: "scale(1.6)", opacity: "0" } },
        rise: { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        breathe: "breathe 4s ease-in-out infinite",
        ring: "ring 3s ease-out infinite",
        rise: "rise 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
