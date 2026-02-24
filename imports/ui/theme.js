import { createTheme } from '@mui/material';
import { deepPurple, teal, grey, red, orange, green } from '@mui/material/colors';

export function getTheme(darkMode) {
    const mode = darkMode ? 'dark' : 'light';

    const palette = {
        mode,
        primary: {
            main: darkMode ? deepPurple[300] : deepPurple[500],
            light: darkMode ? deepPurple[200] : deepPurple[300],
            dark: darkMode ? deepPurple[400] : deepPurple[700],
        },
        secondary: {
            main: darkMode ? teal[300] : teal[500],
            light: darkMode ? teal[200] : teal[300],
            dark: darkMode ? teal[400] : teal[700],
        },
        success: {
            main: darkMode ? green[400] : green[600],
            light: darkMode ? green[300] : green[400],
            dark: darkMode ? green[600] : green[800],
        },
        error: {
            main: darkMode ? red[400] : red[600],
            light: darkMode ? red[300] : red[400],
            dark: darkMode ? red[600] : red[800],
        },
        warning: {
            main: darkMode ? orange[400] : orange[700],
            light: darkMode ? orange[300] : orange[400],
            dark: darkMode ? orange[600] : orange[800],
        },
        background: {
            default: darkMode ? grey[900] : grey[50],
            paper: darkMode ? grey[800] : '#ffffff',
        },
        text: {
            primary: darkMode ? grey[100] : grey[900],
            secondary: darkMode ? grey[400] : grey[600],
        },
        gradient: {
            primary: darkMode
                ? `linear-gradient(135deg, ${deepPurple[400]} 0%, ${deepPurple[600]} 100%)`
                : `linear-gradient(135deg, ${deepPurple[500]} 0%, ${deepPurple[700]} 100%)`,
            secondary: darkMode
                ? `linear-gradient(135deg, ${teal[400]} 0%, ${teal[600]} 100%)`
                : `linear-gradient(135deg, ${teal[500]} 0%, ${teal[700]} 100%)`,
            hero: darkMode
                ? `linear-gradient(135deg, ${deepPurple[400]} 0%, ${teal[400]} 100%)`
                : `linear-gradient(135deg, ${deepPurple[500]} 0%, ${teal[600]} 100%)`,
            surface: darkMode
                ? `linear-gradient(135deg, ${grey[800]} 0%, ${grey[900]} 100%)`
                : `linear-gradient(135deg, #ffffff 0%, ${grey[50]} 100%)`,
        },
    };

    const purpleShadow = (alpha) => `rgba(103, 58, 183, ${alpha})`;

    const shadows = [
        'none',
        `0 1px 3px ${purpleShadow(0.08)}`,
        `0 2px 6px ${purpleShadow(0.10)}`,
        `0 3px 8px ${purpleShadow(0.12)}`,
        `0 4px 12px ${purpleShadow(0.12)}`,
        `0 6px 16px ${purpleShadow(0.14)}`,
        `0 8px 20px ${purpleShadow(0.14)}`,
        `0 10px 24px ${purpleShadow(0.16)}`,
        `0 12px 28px ${purpleShadow(0.16)}`,
        ...Array(16).fill(`0 12px 28px ${purpleShadow(0.18)}`),
    ];

    return createTheme({
        palette,
        shadows,
        typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: { fontWeight: 700, letterSpacing: '-0.02em' },
            h5: { fontWeight: 700, letterSpacing: '-0.01em' },
            h6: { fontWeight: 600, letterSpacing: '-0.01em' },
            subtitle1: { fontWeight: 600, letterSpacing: '-0.005em' },
            subtitle2: {
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
            },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    '*, *::before, *::after': {
                        transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    },
                    '::-webkit-scrollbar': { width: 8 },
                    '::-webkit-scrollbar-track': {
                        background: darkMode ? grey[900] : grey[100],
                    },
                    '::-webkit-scrollbar-thumb': {
                        background: darkMode ? grey[700] : grey[300],
                        borderRadius: 4,
                    },
                    '::-webkit-scrollbar-thumb:hover': {
                        background: darkMode ? grey[600] : grey[400],
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundImage: darkMode
                            ? `linear-gradient(145deg, ${grey[800]} 0%, rgba(30,30,40,1) 100%)`
                            : `linear-gradient(145deg, #ffffff 0%, ${grey[50]} 100%)`,
                        border: darkMode
                            ? '1px solid rgba(255,255,255,0.08)'
                            : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: darkMode
                            ? `0 4px 16px ${purpleShadow(0.20)}`
                            : `0 4px 16px ${purpleShadow(0.08)}`,
                        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    containedPrimary: {
                        backgroundImage: palette.gradient.primary,
                        boxShadow: `0 2px 8px ${purpleShadow(0.25)}`,
                        '&:hover': {
                            backgroundImage: palette.gradient.primary,
                            filter: 'brightness(1.1)',
                            boxShadow: `0 4px 12px ${purpleShadow(0.35)}`,
                        },
                    },
                    containedSecondary: {
                        backgroundImage: palette.gradient.secondary,
                        '&:hover': {
                            backgroundImage: palette.gradient.secondary,
                            filter: 'brightness(1.1)',
                        },
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 8,
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                boxShadow: darkMode
                                    ? `0 0 0 3px rgba(179,136,255,0.20)`
                                    : `0 0 0 3px rgba(103,58,183,0.12)`,
                            },
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundImage: darkMode
                            ? `linear-gradient(160deg, ${grey[800]} 0%, rgba(25,25,35,1) 100%)`
                            : `linear-gradient(160deg, #ffffff 0%, ${grey[50]} 100%)`,
                        borderRadius: 16,
                        boxShadow: `0 24px 48px ${purpleShadow(0.30)}`,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        fontWeight: 500,
                    },
                    filled: {
                        backdropFilter: 'blur(4px)',
                    },
                    colorSuccess: {
                        backgroundColor: darkMode ? 'rgba(102,187,106,0.18)' : 'rgba(46,125,50,0.12)',
                    },
                    colorError: {
                        backgroundColor: darkMode ? 'rgba(239,83,80,0.18)' : 'rgba(211,47,47,0.12)',
                    },
                    colorWarning: {
                        backgroundColor: darkMode ? 'rgba(255,167,38,0.18)' : 'rgba(230,81,0,0.12)',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: darkMode
                            ? `linear-gradient(135deg, ${deepPurple[700]} 0%, ${deepPurple[900]} 100%)`
                            : `linear-gradient(135deg, ${deepPurple[500]} 0%, ${deepPurple[700]} 100%)`,
                        borderBottom: darkMode ? `1px solid ${deepPurple[800]}` : 'none',
                        '&.MuiAppBar-colorPrimary': {
                            backgroundImage: darkMode
                                ? `linear-gradient(135deg, ${deepPurple[700]} 0%, ${deepPurple[900]} 100%)`
                                : `linear-gradient(135deg, ${deepPurple[500]} 0%, ${deepPurple[700]} 100%)`,
                        },
                    },
                },
            },
            MuiDataGrid: {
                styleOverrides: {
                    root: {
                        border: 'none',
                    },
                    columnHeaders: {
                        backgroundImage: darkMode
                            ? `linear-gradient(180deg, rgba(103,58,183,0.15) 0%, rgba(103,58,183,0.05) 100%)`
                            : `linear-gradient(180deg, rgba(103,58,183,0.08) 0%, rgba(103,58,183,0.02) 100%)`,
                    },
                    columnHeaderTitle: {
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                    },
                    row: {
                        '&:hover': {
                            backgroundColor: darkMode
                                ? 'rgba(103,58,183,0.10)'
                                : 'rgba(103,58,183,0.04)',
                        },
                        '&:nth-of-type(even)': {
                            backgroundColor: darkMode
                                ? 'rgba(255,255,255,0.015)'
                                : 'rgba(0,0,0,0.015)',
                        },
                        '&.error': {
                            backgroundColor: darkMode
                                ? 'rgba(244,67,54,0.15)'
                                : 'rgba(244,67,54,0.08)',
                            borderLeft: `3px solid ${red[500]}`,
                            '&:hover': {
                                backgroundColor: darkMode
                                    ? 'rgba(244,67,54,0.22)'
                                    : 'rgba(244,67,54,0.14)',
                            },
                        },
                        '&.warning': {
                            backgroundColor: darkMode
                                ? 'rgba(255,193,7,0.12)'
                                : 'rgba(255,193,7,0.08)',
                            borderLeft: `3px solid ${orange[500]}`,
                            '&:hover': {
                                backgroundColor: darkMode
                                    ? 'rgba(255,193,7,0.18)'
                                    : 'rgba(255,193,7,0.14)',
                            },
                        },
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                },
            },
        },
    });
}
