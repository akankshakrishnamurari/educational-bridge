// Palette is shared with the MUI theme via src/constants/palette.js — do not
// redeclare hex values here.
const { colors, fontFamily } = require('./src/constants/palette');

module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    // IMPORTANT: everything custom goes under `extend`.
    //
    // minWidth / maxWidth / minHeight / maxHeight / zIndex used to be declared at
    // the `theme` root, which REPLACES Tailwind's default scale instead of adding
    // to it. The effect was that standard classes silently generated no CSS at all:
    // max-w-7xl, max-w-4xl, max-w-3xl, max-w-xl, min-w-0, z-50 and max-h-64 were
    // all dead classes (~30 usages across src/). Layout caps therefore did nothing
    // and flex children had no min-w-0 to stop them overflowing.
    extend: {
      colors: {
        primary: colors.primary,
        success: colors.success,
        danger: colors.danger,
        warning: colors.warning,
        // Override Tailwind's default neutral gray with the cooler slate scale so
        // existing `text-gray-*` / `border-gray-*` classes pick it up everywhere
        // without touching each component.
        gray: colors.gray,
      },
      fontFamily: {
        sans: fontFamily.split(',').map((f) => f.trim().replace(/^'|'$/g, '')),
      },
      // Percentage-based width helpers used by the older layouts.
      minWidth: {
        '1/10': '10%',
        '3/20': '15%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%'
      },
      maxWidth: {
        '0/10': '0%',
        '1/10': '10%',
        '3/20': '15%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%'
      },
      minHeight: {
        '9/10': '90%'
      },
      maxHeight: {
        '128': '32rem',
        '144': '36rem',
        '160': '40rem',
        '176': '44rem',
        '192': '48rem',
        '196': '49rem',
        '200': '50rem',
      },
      zIndex: {
        "max": "100000",
      },
    },
  },
  plugins: [],
  important: true,
}
