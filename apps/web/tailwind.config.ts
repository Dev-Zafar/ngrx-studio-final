import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#080810',
        surface: '#0F0F1A',
        border: '#1A1A2E',
        accent: {
          1: '#7C3AED',
          2: '#06B6D4',
          3: '#A855F7',
        },
        text: {
          1: '#F8F8FF',
          2: '#A0A0B8',
          3: '#60607A',
        },
      },
      fontFamily: {
        sora: ['var(--font-sora)', 'sans-serif'],
        space: ['var(--font-space-grotesk)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
        'gradient-dark': 'linear-gradient(180deg, #080810 0%, #0F0F1A 100%)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marquee-reverse 30s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}

export default config
