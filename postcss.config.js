import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: {
    '@tailwindcss/postcss': {},  // ✅ 바뀐 부분
    autoprefixer: {},
  },
};