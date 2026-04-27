// Tailwind CSS v4 moved its PostCSS plugin out of the main package into a
// separate `@tailwindcss/postcss` package. The old `tailwindcss: {}` entry
// silently no-ops in v4 and `next build` errors with a "Cannot find module"
// or rendering with zero utility classes. See:
// https://tailwindcss.com/docs/v4-beta#postcss-plugin
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
