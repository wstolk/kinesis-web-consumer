// components/MessageModal.js
import React from 'react';
import {Dialog, DialogTitle, DialogContent, Typography, Box} from '@mui/material';
import {CopyBlock, dracula} from "react-code-blocks";

const MessageModal = ({message, open, onClose}) => {
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
                <Typography variant="subtitle1" gutterBottom>
                    Message Content:
                </Typography>
                <Box sx={{flexGrow: 1, overflow: 'auto'}}>
                    <CopyBlock
                        language={"js"}
                        text={JSON.stringify(displayData, null, 2)}
                        theme={dracula}
                        wrapLines
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default MessageModal;