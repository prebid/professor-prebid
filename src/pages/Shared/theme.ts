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

export const overlayTheme = createTheme({
  palette,
  typography,
  breakpoints: {
    values: {
      xs: 0,
      sm: 152,
      md: 292,
      lg: 720,
      xl: 975,
    },
  },
});

export const popupTheme = createTheme({
  palette,
  typography,
  breakpoints: {
    values: {
      xs: 0,
      sm: 536,
      md: 800,
      lg: 1200,
      xl: 2400,
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

// <Box> PopUpComponent
//      <Appbar>  PopUpComponent
//      <Box sx={{ flexGrow: 1, p: 1 }}> FeatureComponent
//          <Grid container direction="row" justifyContent="space-between" spacing={1}>
//              <Grid item><Paper><Typo> FeatureComponent Headline
//              <Grid item xs={12}><Grid spacing={0.25} container direction="row"><Grid item> FeatureComponent Content
//          <Grid container direction="row" justifyContent="space-evenly"> FeatureComponent Error Message
//                <Grid item>
//                      <Paper elevation={1} sx={{ p: 1 }}>
//                              <Typography variant="h1">
