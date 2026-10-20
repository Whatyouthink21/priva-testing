/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        priva: {
          bg: "#09090b",
          card: "#141414",
          cardHover: "#1c1c1f",
          surface: "#1f1f23",
          border: "rgba(255,255,255,0.08)",
          muted: "#9ca3af",
          accent: "#dcff00",
          accent2: "#a3ff12",
        }
      },
      fontFamily: {
        sans: ["Inter","system-ui","sans-serif"],
        display: ["Inter","system-ui","sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        '2xl': "20px",
      }
    },
  },
  plugins: [],
}
