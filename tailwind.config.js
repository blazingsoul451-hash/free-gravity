/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#090a0f',
          subtle: '#121317',
          panel: '#18191d',
          card: '#212226',
          border: 'rgba(230, 234, 240, 0.06)',
          borderSubtle: 'rgba(255, 255, 255, 0.04)',
          borderActive: 'rgba(124, 58, 237, 0.4)',
        },
        brand: {
          violet: '#7c3aed',
          cyan: '#06b6d4',
          accent: '#8b5cf6',
          teal: '#14b8a6',
        }
      },
      fontFamily: {
        sans: ['Google Sans Flex', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Google Sans Code', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(124, 58, 237, 0.25)' },
          '50%': { boxShadow: '0 0 25px rgba(6, 182, 212, 0.35)' },
        }
      }
    },
  },
  plugins: [],
}
