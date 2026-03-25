/** @type {import('tailwindcss').Config} */
// Force refresh for custom colors
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0D0D0D',
        'ink-soft': '#3A3A3A',
        'ink-muted': '#7A7A7A',
        paper: '#F7F4EF',
        'paper-warm': '#EDE9E1',
        primary: '#1A3FE0', // shipscribe blue
        'accent-light': '#E8EDFF',
        success: '#0F6E56',
        'success-light': '#E1F5EE',
        border: 'rgba(13,13,13,0.1)',
        'border-strong': 'rgba(13,13,13,0.2)',
      },
      borderRadius: {
        'xl': '12px',
        'lg': '10px',
        'md': '8px',
        'sm': '4px',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
        mono: ['DM Mono', 'monospace'],
        inter: ['Inter', 'sans-serif'],
        headline: ['Instrument Serif', 'serif'],
        body: ['"Instrument Sans"', 'sans-serif'],
        label: ['DM Mono', 'monospace'],
      },
      boxShadow: {
        'premium': '0 2px 16px rgba(13,13,13,0.08), 0 1px 3px rgba(13,13,13,0.06)',
        'premium-lg': '0 8px 40px rgba(13,13,13,0.12), 0 2px 8px rgba(13,13,13,0.06)',
      },
      keyframes: {
        progress: {
          '0%': { width: '0%', opacity: '0.5' },
          '100%': { width: '100%', opacity: '1' },
        }
      },
      animation: {
        progress: 'progress 3s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-slow': 'bounce 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
