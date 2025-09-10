import { createTheme } from '@mui/material/styles';

const palette = {
  primary: {
    // main: '#1976d2',
    main: '#438ED9',
    // light: '#87CEEB',
    light: '#ABDDF1',
  },
  secondary: { main: '#f99b0c' },
  info: { main: '#ecf3f5' },
};

const typography = {
  h1: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  h4: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  subtitle1: {
    fontSize: 12,
  },
  body1: {
    fontSize: 12,
  },
  body2: {
    fontSize: 10,
  },
};

export const theme = createTheme({
  palette,
  typography,
  breakpoints: {
    values: {
      xs: 220,
      sm: 536,
      md: 801,
      lg: 1200,
      xl: 2400,
    },
  },
  components: {
    MuiGrid: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.container && {
            padding: '4px', // p:0.5
          }),
        }),
      },
      defaultProps: {
        spacing: 0.5,
      },
    },
  },
});

// h1 navigation bar
// h2 component headline
// h3 component table headline / config modules headline
// h4 ad overlay headline
// h5
// h6
// subtitle1
// subtitle2
// body1
// body2
// button
// caption
// overline

