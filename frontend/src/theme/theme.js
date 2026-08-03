import { createTheme } from '@mui/material/styles'
import { colors } from './colors'

const RADIUS = '6px'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.primaryLight,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.accent,
      dark: colors.accentDark,
      light: '#FFE066',
      contrastText: '#1a1a1a',
    },
    success: { main: colors.libre },
    warning: { main: colors.reservada },
    error: { main: colors.ocupada },
    divider: colors.border,
    text: {
      primary: '#1F1F1F',
      secondary: colors.cementDark,
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    h5: { fontWeight: 600, fontSize: '1.15rem', letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, fontSize: '0.95rem' },
    subtitle1: { fontWeight: 600, fontSize: '0.875rem' },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.75rem',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem' },
  },
  shadows: Array(25).fill('none'),
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: {
          backgroundColor: colors.primary,
          color: '#fff',
          borderBottom: `1px solid ${colors.primaryDark}`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${colors.border}`,
          borderRadius: RADIUS,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: RADIUS,
          minHeight: 36,
          paddingInline: 14,
        },
        containedSecondary: {
          color: '#1a1a1a',
          fontWeight: 700,
        },
        outlined: {
          borderColor: colors.border,
          '&:hover': {
            borderColor: colors.cement,
            backgroundColor: colors.surfaceAlt,
          },
        },
        sizeSmall: {
          minHeight: 30,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS,
          backgroundColor: colors.surface,
        },
        input: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS,
          height: 26,
          fontWeight: 600,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 3, backgroundColor: colors.accent },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
          fontSize: '0.8125rem',
          padding: '8px 12px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.surfaceAlt,
          color: colors.cementDark,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS,
          border: `1px solid ${colors.border}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS,
          border: `1px solid ${colors.border}`,
        },
      },
    },
  },
})
