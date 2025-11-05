import { createTheme } from '@mui/material/styles';

// Flowise 配色方案
const flowiseColors = {
  primary: {
    light: '#e3f2fd',
    main: '#2196f3',
    dark: '#1e88e5',
    200: '#90caf9',
    800: '#1565c0',
  },
  secondary: {
    light: '#ede7f6',
    main: '#673ab7',
    dark: '#5e35b1',
    200: '#b39ddb',
    800: '#4527a0',
  },
  success: {
    light: '#cdf5d8',
    main: '#00e676',
    dark: '#00c853',
    200: '#69f0ae',
  },
  error: {
    light: '#f3d2d2',
    main: '#f44336',
    dark: '#c62828',
  },
  warning: {
    light: '#fff8e1',
    main: '#ffe57f',
    dark: '#ffc107',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#c4c4c4',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    900: '#212121',
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      ...flowiseColors.primary,
    },
    secondary: {
      ...flowiseColors.secondary,
    },
    success: {
      ...flowiseColors.success,
    },
    error: {
      ...flowiseColors.error,
    },
    warning: {
      ...flowiseColors.warning,
    },
    grey: {
      ...flowiseColors.grey,
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
          '&:hover': {
            boxShadow:
              'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
          },
        },
      },
    },
  },
});

export default theme;

