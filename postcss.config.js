/** Single source for breakpoint values. Keep in sync with src/theme/breakpoints.css @custom-media. */
const breakpointVars = {
  'mantine-breakpoint-xs': '36em',
  'mantine-breakpoint-sm': '48em',
  'mantine-breakpoint-md': '62em',
  'mantine-breakpoint-lg': '75em',
  'mantine-breakpoint-xl': '88em',
}

export default {
  plugins: {
    '@csstools/postcss-global-data': {
      files: ['src/theme/breakpoints.css'],
    },
    'postcss-custom-media': {},
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: breakpointVars,
    },
  },
}
