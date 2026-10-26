/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF8F4',
        blush: '#F4E8EC',
        lavender: '#E8EAF5',
        sage: '#E6F0E8',
        buttercream: '#F8EFD9',
        ink: '#454641',
        muted: '#777970',
        line: '#E9E5DE',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        card: '0 12px 35px rgba(84, 77, 64, 0.07)',
      },
    },
  },
  plugins: [],
}
