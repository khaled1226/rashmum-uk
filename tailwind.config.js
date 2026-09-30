/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff0f6",
          100: "#ffd0e8",
          200: "#ffb3d9",
          400: "#f05aa8",
          500: "#e91e8c",
          600: "#d11a7f",
          700: "#a8155f",
        },
        cream: "#fdf8f3",
        peach: "#fcf7f1",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
