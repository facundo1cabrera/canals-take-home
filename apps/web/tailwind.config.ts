import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canals: {
          sidebar: '#F5F5F7',
          accent: '#6C5CE7',
          'accent-light': '#E8E5F8',
          'accent-lighter': '#F0F3FF',
          'accent-dark': '#5B4CDB',
        },
      },
    },
  },
  plugins: [],
};
export default config;
