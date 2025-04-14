import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        fresh: {
          yellow: '#FFDE3D',
          mint: '#C4F5E1',
          teal: '#A1E9D0',
          lightblue: '#B3F0F4',
          emerald: '#34D399',
          turquoiseDeep: '#0D9488',
          gradient: {
            start: '#C4F5E1',
            middle: '#B3F0F4',
            end: '#FFF8C9'
          }
        }
      },
      backgroundImage: {
        'fresh-gradient': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
      gradientColorStops: {
        // Define custom gradient color stops if needed
      },
    },
  },
} satisfies Config;
