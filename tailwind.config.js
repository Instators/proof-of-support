/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './providers/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        mono:    ['Share Tech Mono', 'monospace'],
        body:    ['Exo 2', 'sans-serif'],
      },
      colors: {
        neon: {
          cyan:   '#00f5d4',
          purple: '#a855f7',
          pink:   '#ff2d78',
          gold:   '#fbbf24',
          green:  '#4ade80',
        },
        void: {
          DEFAULT: '#050508',
          2: '#0a0a12',
          3: '#0f0f1a',
          4: '#14141f',
        },
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}
