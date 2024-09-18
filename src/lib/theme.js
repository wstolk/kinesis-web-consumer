// lib/theme.js
import {createTheme} from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // A nice blue color for the header
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#fff',
            paper: '#f5f5f5', // Light grey for the message viewer
        },
        sidebar: {
            main: '#e3f2fd', // Light blue for the sidebar, complements the header
        },
    },
});

export default theme;
