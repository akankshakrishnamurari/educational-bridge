import { createTheme } from '@mui/material/styles';
import { colors, fontFamily } from './constants/designTokens';

// Single MUI theme so @mui/material components (Table, TextField, Dialog, etc.)
// visually match the Tailwind-styled custom components instead of falling back
// to MUI's default blue/purple palette.
const theme = createTheme({
    palette: {
        primary: {
            light: colors.primary[400],
            main: colors.primary[600],
            dark: colors.primary[800],
            contrastText: '#FFFFFF',
        },
        success: {
            main: colors.success[600],
        },
        error: {
            main: colors.danger[600],
        },
        warning: {
            main: colors.warning[600],
        },
        text: {
            primary: colors.gray[900],
            secondary: colors.gray[500],
        },
        background: {
            default: colors.gray[50],
            paper: '#FFFFFF',
        },
    },
    typography: {
        fontFamily,
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
                    fontWeight: 600,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderColor: colors.gray[100],
                },
            },
        },
    },
});

export default theme;
