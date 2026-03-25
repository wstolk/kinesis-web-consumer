// components/LogViewer.js
import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
    Box,
    Typography,
    IconButton,
    InputBase,
    Collapse,
    Tooltip,
    useTheme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

const MAX_LOG_ENTRIES = 500;
const LOG_BAR_HEIGHT = 36;

const LogViewer = ({sidebarWidth}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filterText, setFilterText] = useState('');
    const logsEndRef = useRef(null);
    const eventSourceRef = useRef(null);
    const theme = useTheme();

    useEffect(() => {
        eventSourceRef.current = new EventSource('/api/logs');

        eventSourceRef.current.onopen = () => {
            setLogs(prev => [...prev, {
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Log connection established'
            }]);
        };

        eventSourceRef.current.onmessage = (event) => {
            try {
                const newLog = JSON.parse(event.data);
                setLogs(prevLogs => {
                    const updated = [...prevLogs, newLog];
                    if (updated.length > MAX_LOG_ENTRIES) {
                        return updated.slice(-MAX_LOG_ENTRIES);
                    }
                    return updated;
                });
            } catch (error) {
                console.error('Error parsing log data:', error);
            }
        };

        eventSourceRef.current.onerror = (error) => {
            console.error('EventSource failed:', error);
        };

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (isOpen && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [logs, isOpen]);

    const formatTimestamp = useCallback((timestamp) => {
        try {
            return new Date(timestamp).toLocaleTimeString();
        } catch (error) {
            return timestamp;
        }
    }, []);

    const handleClearLogs = useCallback(() => {
        setLogs([{
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Logs cleared'
        }]);
    }, []);

    const filteredLogs = useMemo(() => {
        const searchText = filterText.toLowerCase();
        return logs.filter(log =>
            log.message.toLowerCase().includes(searchText) ||
            log.level.toLowerCase().includes(searchText) ||
            formatTimestamp(log.timestamp).toLowerCase().includes(searchText)
        );
    }, [logs, filterText, formatTimestamp]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'error': return theme.palette.error.main;
            case 'warn': return theme.palette.warning.main;
            case 'info': return theme.palette.primary.light;
            default: return theme.palette.text.secondary;
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                width: `calc(100% - ${sidebarWidth}px)`,
                height: isOpen ? '35%' : `${LOG_BAR_HEIGHT}px`,
                bgcolor: 'background.paper',
                transition: 'height 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
                borderTop: '1px solid',
                borderColor: 'surface.border',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    height: LOG_BAR_HEIGHT,
                    minHeight: LOG_BAR_HEIGHT,
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: isOpen ? '1px solid' : 'none',
                    borderColor: 'surface.border',
                    bgcolor: 'surface.main',
                    gap: 0.5,
                }}
            >
                <Box
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        mr: 1,
                        '&:hover': {color: 'text.primary'},
                        color: 'text.secondary',
                    }}
                >
                    <IconButton size="small" sx={{p: 0.25}} aria-label={isOpen ? 'Collapse log viewer' : 'Expand log viewer'}>
                        {isOpen ? <KeyboardArrowDownIcon sx={{fontSize: 18}} /> : <KeyboardArrowUpIcon sx={{fontSize: 18}} />}
                    </IconButton>
                    <Typography variant="caption" sx={{fontWeight: 600, ml: 0.5, fontSize: '0.75rem'}}>
                        Logs
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            ml: 0.5,
                            fontSize: '0.6875rem',
                            fontFamily: theme.typography.mono,
                            color: 'text.secondary',
                            opacity: 0.7,
                        }}
                    >
                        {filteredLogs.length}
                    </Typography>
                </Box>

                <Collapse in={isOpen} orientation="horizontal" sx={{flexGrow: 1}}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        height: 26,
                        border: '1px solid',
                        borderColor: 'surface.border',
                        borderRadius: '4px',
                        bgcolor: 'background.paper',
                        px: 1,
                        width: 240,
                    }}>
                        <InputBase
                            placeholder="Filter..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            inputProps={{'aria-label': 'Filter logs'}}
                            sx={{
                                flex: 1,
                                fontFamily: theme.typography.mono,
                                fontSize: '0.75rem',
                                '& input::placeholder': {
                                    fontFamily: theme.typography.mono,
                                    fontSize: '0.75rem',
                                    opacity: 0.5,
                                },
                            }}
                        />
                        {filterText && (
                            <IconButton
                                size="small"
                                onClick={() => setFilterText('')}
                                aria-label="Clear filter"
                                sx={{p: 0.25}}
                            >
                                <CloseIcon sx={{fontSize: 14}} />
                            </IconButton>
                        )}
                    </Box>
                </Collapse>

                <Tooltip title="Clear logs">
                    <IconButton
                        size="small"
                        onClick={handleClearLogs}
                        sx={{ml: 'auto', color: 'text.secondary', p: 0.5}}
                    >
                        <DeleteIcon sx={{fontSize: 16}} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Logs Content */}
            {isOpen && (
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'grey.50',
                        px: 1.5,
                        py: 0.5,
                    }}
                >
                    {filteredLogs.map((log, index) => (
                        <Box
                            key={index}
                            sx={{
                                py: 0.15,
                                fontFamily: theme.typography.mono,
                                display: 'flex',
                                gap: 1,
                                alignItems: 'baseline',
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: theme.typography.mono,
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    opacity: 0.6,
                                    flexShrink: 0,
                                }}
                            >
                                {formatTimestamp(log.timestamp)}
                            </Typography>
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: theme.typography.mono,
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    color: getLevelColor(log.level),
                                    flexShrink: 0,
                                    minWidth: 36,
                                }}
                            >
                                {log.level}
                            </Typography>
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: theme.typography.mono,
                                    fontSize: '0.75rem',
                                    color: 'text.primary',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {log.message}
                            </Typography>
                        </Box>
                    ))}
                    <div ref={logsEndRef} />
                </Box>
            )}
        </Box>
    );
};

export default React.memo(LogViewer);
