/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0B141F',
        'bg-surface': '#131D2D',
        'bg-card': '#1B2336',
        'bg-elevated': '#212B42',
        'bg-input': '#18202B',
        'brand-blue': '#72A8FF',
        'brand-gold': '#BFA659',
        'status-success': '#99D9AD',
        'status-danger': '#FFA5A5',
        'status-warning': '#FFEAAB',
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Thai', 'sans-serif'],
        thai: ['IBM Plex Sans Thai', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(114, 168, 255, 0.4)',
        'glow-gold': '0 0 15px rgba(191, 166, 89, 0.4)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
