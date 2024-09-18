// components/MessageModal.js
import React from 'react';
import {Dialog, DialogTitle, DialogContent, Typography, Box} from '@mui/material';
import {CopyBlock, dracula} from "react-code-blocks";

const MessageModal = ({message, open, onClose}) => {
    if (!message) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Message Details</DialogTitle>
            <DialogContent sx={{height: '80vh', display: 'flex', flexDirection: 'column'}}>
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
                        text={JSON.stringify(message.data, null, 2)}
                        theme={dracula}
                        wrapLines
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default MessageModal;