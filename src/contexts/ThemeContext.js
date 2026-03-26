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
    const [mode, setMode] = useState('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('themeMode');
        if (saved === 'light' || saved === 'dark') {
            setMode(saved);
        }
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setMode((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('themeMode', next);
            return next;
        });
    };

    const theme = useMemo(() => createAppTheme(mode), [mode]);

    const contextValue = useMemo(() => ({ mode, toggleTheme, mounted }), [mode, mounted]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
