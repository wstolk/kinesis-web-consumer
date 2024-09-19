// components/ErrorNotification.js
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const ErrorNotification = ({ error, onClose }) => {
    return (
        <Snackbar
            open={Boolean(error)}
            autoHideDuration={6000}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert onClose={onClose} severity="error" sx={{ width: '100%' }}>
                {error}
            </Alert>
        </Snackbar>
    );
};

export default ErrorNotification;
