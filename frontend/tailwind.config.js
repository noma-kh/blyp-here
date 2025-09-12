/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        neutral: {
          950: '#0A0A0A'
        }
      },
      borderRadius: {
        xl: '14px'
      },
      boxShadow: {
        card: '0 2px 12px rgba(16,24,40,0.06)'
      }
    }
  },
  plugins: []
};

