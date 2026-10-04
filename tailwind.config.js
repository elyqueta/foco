/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          DEFAULT: '#6C5CE7',
          600: '#5B4BD6',
          500: '#6C5CE7',
          400: '#8577F0',
          100: '#ECEAFD',
          50: '#F4F3FE',
        },
        ink: { DEFAULT: '#1B1840', 700: '#2E2B55', 500: '#6B6A8A', 400: '#9A9AB5', 300: '#C9C9DA' },
        surface: { page: '#E9EBF3', app: '#F6F7FB', card: '#FFFFFF', line: '#ECECF4' },
        success: { DEFAULT: '#3FBF9A', soft: '#DDF4EC' },
        danger: { DEFAULT: '#F0506E', soft: '#FFE3E9' },
        warn: { DEFAULT: '#F5A524', soft: '#FFF1D6' },
        teal: { tag: '#7CC9B0' },
      },
      borderRadius: { card: '20px', shell: '28px' },
      boxShadow: {
        card: '0 8px 24px -8px rgba(60, 50, 140, 0.10)',
        float: '0 16px 40px -12px rgba(60, 50, 140, 0.25)',
      },
    },
  },
  plugins: [],
};
