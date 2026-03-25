// components/LogViewer.js
import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
    Box,
    Typography,
    IconButton,
    TextField,
    InputAdornment,
    Collapse,
    Tooltip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

const MAX_LOG_ENTRIES = 500;

const LogViewer = ({sidebarWidth}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [filterText, setFilterText] = useState('');
    const logsEndRef = useRef(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        console.log('Setting up EventSource');
        eventSourceRef.current = new EventSource('/api/logs');

        eventSourceRef.current.onopen = () => {
            console.log('SSE connection opened');
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
                    // Cap log entries to prevent unbounded memory growth
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

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                width: `calc(100% - ${sidebarWidth}px)`,
                height: isOpen ? '40%' : '48px',
                backgroundColor: 'background.paper',
                transition: 'height 0.3s ease',
                borderTop: 1,
                borderColor: 'divider',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    height: '48px', // Fixed height for header
                    minHeight: '48px', // Ensure minimum height
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: isOpen ? 1 : 0,
                    borderColor: 'divider',
                    backgroundColor: 'grey.100',
                }}
            >
                <Box
                    onClick={() => setIsOpen(!isOpen)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        flexGrow: 0,
                        mr: 2
                    }}
                >
                    <IconButton size="small" aria-label={isOpen ? 'Collapse log viewer' : 'Expand log viewer'}>
                        {isOpen ? <KeyboardArrowDownIcon/> : <KeyboardArrowUpIcon/>}
                    </IconButton>
                    <Typography variant="subtitle2" sx={{fontWeight: 'bold', ml: 1}}>
                        API Logs ({filteredLogs.length})
                    </Typography>
                </Box>

                <Collapse in={isOpen} orientation="horizontal" sx={{flexGrow: 1}}>
                    <TextField
                        size="small"
                        placeholder="Filter logs..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        inputProps={{ 'aria-label': 'Filter logs' }}
                        sx={{
                            width: '300px',
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'white'
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small"/>
                                </InputAdornment>
                            ),
                            endAdornment: filterText && (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={() => setFilterText('')}
                                        aria-label="Clear filter"
                                    >
                                        <CloseIcon fontSize="small"/>
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Collapse>

                <Tooltip title="Clear logs">
                    <IconButton
                        size="small"
                        onClick={handleClearLogs}
                        sx={{ml: 1}}
                    >
                        <DeleteIcon/>
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Logs Content */}
            {isOpen && (
                <Box
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        backgroundColor: 'grey.900',
                        color: 'grey.100',
                        p: 2,
                    }}
                >
                    {filteredLogs.map((log, index) => (
                        <Box
                            key={index}
                            sx={{
                                mb: 0.5,
                                color: log.level === 'error' ? 'error.light' :
                                    log.level === 'warn' ? 'warning.light' : 'grey.100',
                                fontFamily: 'monospace',
                            }}
                        >
                            <Typography variant="body2" sx={{fontFamily: 'monospace'}}>
                                {`[${formatTimestamp(log.timestamp)}] ${log.level.toUpperCase()}: ${log.message}`}
                            </Typography>
                        </Box>
                    ))}
                    <div ref={logsEndRef}/>
                </Box>
            )}
        </Box>
    );
};

export default React.memo(LogViewer);