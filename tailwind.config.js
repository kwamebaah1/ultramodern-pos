/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      './src/**/*.{js,jsx}',
      './src/app/**/*.{js,jsx}',
      './src/components/**/*.{js,jsx}'
    ],
    theme: {
      extend: {
        borderColor: {
          DEFAULT: 'var(--border)',
        },
        colors: {
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          border: 'hsl(var(--border))',
          card: 'hsl(var(--card))',
          'card-foreground': 'hsl(var(--card-foreground))',
        },
      },
    },
    plugins: [],
  };