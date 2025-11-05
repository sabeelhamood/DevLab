/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#065f46',
        'primary-purple': '#047857',
        'primary-cyan': '#0f766e',
        'accent-gold': '#d97706',
        'accent-green': '#047857',
        'accent-orange': '#f59e0b',
        'xp-color': '#f59e0b',
        'level-color': '#047857',
        'badge-color': '#10b981',
        'streak-color': '#ef4444',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #065f46, #047857)',
        'gradient-secondary': 'linear-gradient(135deg, #0f766e, #047857)',
        'gradient-accent': 'linear-gradient(135deg, #d97706, #f59e0b)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(6, 95, 70, 0.3)',
        'card': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'hover': '0 20px 60px rgba(6, 95, 70, 0.2)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}




