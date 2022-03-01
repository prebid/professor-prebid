import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#87CEEB',
            // contrastText:'#4285F4'
            // dark?: string;
        },
        secondary: { main: '#f99b0c' },
        info: { main: '#ecf3f5' },
    },
    typography: {
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
        //     subtitle1: {
        //         fontSize: 12,
        //     },
        body1: {
            fontSize: 12,
        },
        body2: {
            fontSize: 10,
        },
        //     button: {
        //         fontStyle: 'italic',
        //     },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 425,
            md: 800,
            lg: 1200,
            xl: 2400
        },
    },
});
export default theme;
  // $gray: #ecf3f5;
  // $text: #797f90;



// h1 navigation bar
// h2 component headline
// h3 component table headline
// h4 config modules headline
// h5
// h6
// subtitle1
// subtitle2
// body1
// body2
// button
// caption
// overline

// backgroundColor: 'red',§