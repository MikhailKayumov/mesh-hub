const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-mode="dark"]'],
  theme: {
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
      headings: ['Rubik', 'sans-serif'],
      serif: ['"Roboto Slab"', ...defaultTheme.fontFamily.serif],
      mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
    },
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
