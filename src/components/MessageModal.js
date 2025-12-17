// components/MessageModal.js
import React, {useState} from 'react';
import {Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Snackbar} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const MessageModal = ({message, open, onClose}) => {
    const [copySuccess, setCopySuccess] = useState(false);

    if (!message) return null;

    // Ensure message data is properly formatted for display
    let displayData = message.data;
    try {
        // If data is a string, try to parse it as JSON
        if (typeof message.data === 'string') {
            displayData = JSON.parse(message.data);
        }
    } catch (e) {
        // Keep original data if JSON parsing fails
        displayData = message.data;
    }

    const jsonText = JSON.stringify(displayData, null, 2);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(jsonText);
            setCopySuccess(true);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Message Details</DialogTitle>
            <DialogContent sx={{display: 'flex', flexDirection: 'column'}}>
                <Box sx={{mb: 2}}>
                    <Typography variant="subtitle1" gutterBottom>
                        Timestamp: {message.timestamp}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Partition Key: {message.partitionKey}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                    <Typography variant="subtitle1">
                        Message Content:
                    </Typography>
                    <IconButton onClick={handleCopy} size="small" title="Copy to clipboard">
                        <ContentCopyIcon />
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        backgroundColor: '#282a36',
                        color: '#f8f8f2',
                        padding: 2,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}
                >
                    {jsonText}
                </Box>
            </DialogContent>
            <Snackbar
                open={copySuccess}
                autoHideDuration={2000}
                onClose={() => setCopySuccess(false)}
                message="Copied to clipboard"
            />
        </Dialog>
    );
};

export default MessageModal;