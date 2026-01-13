/** @type {import('tailwindcss').Config} */
const monoPalette = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
};

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: monoPalette,
        emerald: monoPalette,
        indigo: monoPalette,
        violet: monoPalette,
        orange: monoPalette,
        green: monoPalette,
        red: monoPalette,
        amber: monoPalette,
        teal: monoPalette,
        rose: monoPalette,
        yellow: monoPalette,
        sky: monoPalette,
        lime: monoPalette,
        cyan: monoPalette,
        pink: monoPalette,
        purple: monoPalette,
      },
    },
  },
  plugins: [],
}

