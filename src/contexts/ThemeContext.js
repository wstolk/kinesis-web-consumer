import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '@/lib/theme';

const ThemeContext = createContext({
    mode: 'dark',
    toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem('themeMode');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    });

    const toggleTheme = () => {
        setMode((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('themeMode', next);
            return next;
        });
    };

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
