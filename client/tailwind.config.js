/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vscode': {
          'bg': '#1e1e1e',
          'sidebar': '#252526',
          'editor': '#1e1e1e',
          'panel': '#181818',
          'border': '#2d2d30',
          'text': '#cccccc',
          'text-muted': '#969696',
          'accent': '#007acc',
          'selection': '#264f78',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}