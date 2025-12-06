/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vivaponto': {
          'primary': '#0A1A2F',
          'header': '#1E3A36',
          'card': '#253A4A',
          'accent': '#0A6777',
          'text': '#E0E0E0',
          'neutral': '#2E2E2E',
        },
      },
    },
  },
  plugins: [],
};
