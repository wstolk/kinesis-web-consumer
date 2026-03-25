import { createTheme, alpha } from '@mui/material/styles';

// Custom palette — a muted teal-blue for primary, warm gray neutrals
const palette = {
    primary: {
        main: '#3b82c4',
        light: '#5a9bd5',
        dark: '#2a6399',
        contrastText: '#fff',
    },
    success: {
        main: '#22c55e',
        light: '#4ade80',
        dark: '#16a34a',
    },
    warning: {
        main: '#eab308',
        light: '#facc15',
        dark: '#ca8a04',
    },
    error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
    },
};

const sharedOverrides = (mode) => {
    const isDark = mode === 'dark';
    return {
        shape: {
            borderRadius: 4,
        },
        // Type scale (1.2 minor third ratio, base 0.8125rem / 13px):
        //   xs:      0.6875rem  (11px) — fine print, hash keys
        //   caption: 0.75rem    (12px) — labels, column headers
        //   body2:   0.8125rem  (13px) — secondary text, table data
        //   body1:   0.875rem   (14px) — primary body text
        //   h6:      1rem       (16px) — section headings
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            mono: '"JetBrains Mono Variable", "JetBrains Mono", "Fira Code", "Consolas", monospace',
            fontSize: 13,
            h6: {
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '0.01em',
            },
            subtitle1: {
                fontSize: '0.875rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            subtitle2: {
                fontSize: '0.8125rem',
                fontWeight: 600,
                lineHeight: 1.4,
            },
            body1: {
                fontSize: '0.875rem',
                lineHeight: 1.5,
            },
            body2: {
                fontSize: '0.8125rem',
                lineHeight: 1.5,
            },
            caption: {
                fontSize: '0.75rem',
                lineHeight: 1.4,
            },
            overline: {
                fontSize: '0.6875rem',
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
            },
            button: {
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'none',
                letterSpacing: '0.02em',
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: `
                    @media (prefers-reduced-motion: reduce) {
                        *, *::before, *::after {
                            animation-duration: 0.01ms !important;
                            animation-iteration-count: 1 !important;
                            transition-duration: 0.01ms !important;
                            scroll-behavior: auto !important;
                        }
                    }
                    /* Tabular nums for monospace data alignment */
                    [data-mono], code, pre, .MuiChip-label {
                        font-variant-numeric: tabular-nums;
                    }
                `,
            },
            MuiButton: {
                defaultProps: {
                    disableElevation: true,
                },
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        padding: '4px 12px',
                        minHeight: 32,
                        transition: 'background-color 150ms cubic-bezier(0.25, 1, 0.5, 1), border-color 150ms cubic-bezier(0.25, 1, 0.5, 1), color 150ms cubic-bezier(0.25, 1, 0.5, 1), opacity 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                    },
                    sizeSmall: {
                        padding: '2px 8px',
                        minHeight: 28,
                        fontSize: '0.75rem',
                    },
                },
            },
            MuiButtonGroup: {
                defaultProps: {
                    disableElevation: true,
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        transition: 'background-color 150ms cubic-bezier(0.25, 1, 0.5, 1), color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                    },
                    sizeSmall: {
                        padding: 4,
                    },
                },
            },
            MuiPaper: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    size: 'small',
                    variant: 'outlined',
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                        transition: 'border-color 200ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                    },
                    input: {
                        padding: '6px 10px',
                    },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 4,
                        height: 24,
                        fontSize: '0.75rem',
                        transition: 'background-color 150ms cubic-bezier(0.25, 1, 0.5, 1), border-color 150ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                    },
                    sizeSmall: {
                        height: 20,
                    },
                },
            },
            MuiTooltip: {
                defaultProps: {
                    arrow: true,
                },
                styleOverrides: {
                    tooltip: {
                        fontSize: '0.75rem',
                        borderRadius: 4,
                    },
                },
            },
            MuiMenuItem: {
                styleOverrides: {
                    root: {
                        fontSize: '0.8125rem',
                        minHeight: 36,
                    },
                },
            },
            MuiListItemText: {
                styleOverrides: {
                    primary: {
                        fontSize: '0.8125rem',
                    },
                    secondary: {
                        fontSize: '0.75rem',
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 6,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        borderRight: 'none',
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                    },
                },
            },
        },
    };
};

export const createAppTheme = (mode) => {
    const isDark = mode === 'dark';
    const shared = sharedOverrides(mode);

    const darkPalette = {
        mode: 'dark',
        ...palette,
        background: {
            default: '#0f1117',
            paper: '#161822',
        },
        surface: {
            main: '#1c1f2e',
            light: '#232738',
            border: 'rgba(255,255,255,0.06)',
        },
        text: {
            primary: '#e1e4ed',
            secondary: '#8b90a0',
            disabled: '#555a6e',
        },
        divider: 'rgba(255,255,255,0.06)',
        action: {
            hover: 'rgba(255,255,255,0.04)',
            selected: 'rgba(59,130,196,0.12)',
            focus: 'rgba(59,130,196,0.16)',
        },
    };

    const lightPalette = {
        mode: 'light',
        ...palette,
        primary: {
            ...palette.primary,
            main: '#2563a0',
            light: '#3b82c4',
            dark: '#1a4d80',
        },
        background: {
            default: '#f5f6f8',
            paper: '#ffffff',
        },
        surface: {
            main: '#f0f1f4',
            light: '#f8f8fa',
            border: 'rgba(0,0,0,0.08)',
        },
        text: {
            primary: '#1a1d2b',
            secondary: '#5f6478',
            disabled: '#9ca0ae',
        },
        divider: 'rgba(0,0,0,0.08)',
        action: {
            hover: 'rgba(0,0,0,0.03)',
            selected: 'rgba(37,99,160,0.08)',
            focus: 'rgba(37,99,160,0.12)',
        },
    };

    return createTheme({
        palette: isDark ? darkPalette : lightPalette,
        ...shared,
    });
};

// Keep a default export for backwards compat during migration
const theme = createAppTheme('dark');
export default theme;
