// components/MessageModal.js
import React, {useState} from 'react';
import {Dialog, DialogTitle, DialogContent, Typography, Box, IconButton, Snackbar, useTheme} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const MessageModal = ({message, open, onClose}) => {
    const [copySuccess, setCopySuccess] = useState(false);
    const theme = useTheme();

    if (!message) return null;

    let displayData = message.data;
    try {
        if (typeof message.data === 'string') {
            displayData = JSON.parse(message.data);
        }
    } catch (e) {
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
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            TransitionProps={{
                timeout: { enter: 200, exit: 150 },
            }}
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'surface.border',
                        transform: 'translateY(0)',
                    },
                },
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1.5,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'surface.border',
            }}>
                <Typography variant="subtitle1" component="span" sx={{fontWeight: 600}}>
                    Message Details
                </Typography>
                <IconButton size="small" onClick={onClose} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', p: 2, gap: 1.5}}>
                <Box sx={{
                    display: 'flex',
                    gap: 3,
                    pt: 1,
                }}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem'}}>
                            Timestamp
                        </Typography>
                        <Typography variant="body2" noWrap sx={{fontFamily: theme.typography.mono, mt: 0.25}}>
                            {message.timestamp}
                        </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem'}}>
                            Partition Key
                        </Typography>
                        <Typography variant="body2" noWrap sx={{fontFamily: theme.typography.mono, mt: 0.25}}>
                            {message.partitionKey}
                        </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem'}}>
                            Shard ID
                        </Typography>
                        <Typography variant="body2" noWrap sx={{fontFamily: theme.typography.mono, mt: 0.25}}>
                            {message.ShardId || 'N/A'}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="caption" sx={{color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem'}}>
                        Content
                    </Typography>
                    <IconButton
                        onClick={handleCopy}
                        size="small"
                        aria-label="Copy to clipboard"
                        sx={{
                            color: 'text.secondary',
                            '&:hover': {color: 'primary.main'},
                            transition: 'color 200ms cubic-bezier(0.25, 1, 0.5, 1), transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                            '&:active': { transform: 'scale(0.9)' },
                        }}
                    >
                        {copySuccess
                            ? <CheckIcon sx={{fontSize: 14, color: 'success.main'}} />
                            : <ContentCopyIcon sx={{fontSize: 14}} />
                        }
                    </IconButton>
                </Box>
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'grey.50',
                        border: '1px solid',
                        borderColor: 'surface.border',
                        borderRadius: '4px',
                        p: 2,
                        fontFamily: theme.typography.mono,
                        fontSize: '0.8rem',
                        color: theme.palette.mode === 'dark' ? '#e1e4ed' : '#1a1d2b',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        lineHeight: 1.6,
                        maxHeight: 400,
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

export default React.memo(MessageModal);
