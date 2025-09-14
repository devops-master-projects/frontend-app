import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5E6C5B', 
      contrastText: '#FEFCF6',
    },
    secondary: {
      main: '#D6E0E2', 
      contrastText: '#162A2C',
    },
    background: {
      default: '#F4EFE6',
      paper: '#FEFCF6',
    },
    text: {
      primary: '#162A2C',
      secondary: '#686867',
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: ['"Inter"', '"Roboto"', 'sans-serif'].join(','),
  },
});

export default theme;
