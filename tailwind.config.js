/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sophi: {
          pink: {
            50: '#fff0f5',
            100: '#ffe0ec',
            200: '#ffc2d8',
            300: '#ff94b8',
            400: '#ff5a8e',
            500: '#ff2d6f',
            600: '#e8005a',
            700: '#c4004d',
            800: '#a30043',
            900: '#87003c',
          },
          purple: {
            50: '#f5f0ff',
            100: '#ede0ff',
            200: '#d8c2ff',
            300: '#bc94ff',
            400: '#9d5aff',
            500: '#8b2dff',
            600: '#7700e8',
            700: '#6200c4',
            800: '#5200a3',
            900: '#440087',
          },
          rose: '#ff6b9d',
          lavender: '#c084fc',
        },
      },
      backgroundImage: {
        'sophi-gradient': 'linear-gradient(135deg, #fff0f5 0%, #f5f0ff 100%)',
        'sophi-hero': 'linear-gradient(135deg, #ff6b9d22 0%, #c084fc22 100%)',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
