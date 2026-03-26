import React, {useState, useMemo, useCallback, useRef, useEffect} from 'react';
import {
    Box,
    Typography,
    InputBase,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { List as VirtualList } from 'react-window';
import { POLLING_INTERVALS } from '@/lib/constants';

const CHART_HEIGHT = 48;

const BatchChart = React.memo(({ batches, theme }) => {
    if (!batches || batches.length === 0) return null;

    const maxCount = Math.max(...batches.map(b => b.count), 1);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                height: CHART_HEIGHT,
                gap: '1px',
                mb: 0.75,
                px: 0.5,
                bgcolor: 'surface.main',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: 'surface.border',
                overflow: 'hidden',
            }}
        >
            {batches.map((batch, i) => {
                const height = Math.max(2, (batch.count / maxCount) * (CHART_HEIGHT - 8));
                const isLatest = i === batches.length - 1;
                return (
                    <Tooltip
                        key={batch.time}
                        title={`${batch.count} records`}
                        placement="top"
                        arrow
                    >
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 3,
                                maxWidth: 12,
                                height,
                                bgcolor: isLatest ? 'primary.main' : alpha(theme.palette.primary.main, 0.4),
                                borderRadius: '2px 2px 0 0',
                                transition: 'height 200ms ease-out',
                            }}
                        />
                    </Tooltip>
                );
            })}
        </Box>
    );
});

BatchChart.displayName = 'BatchChart';

const TABLE_ROW_HEIGHT = 44;
const CARD_ROW_HEIGHT = 80;
const TABLE_HEADER_HEIGHT = 36;

const TableHeader = React.memo(({ theme }) => (
    <Box
        sx={{
            display: 'flex',
            alignItems: 'center',
            height: TABLE_HEADER_HEIGHT,
            px: 1.5,
            bgcolor: 'surface.main',
            borderBottom: '1px solid',
            borderColor: 'surface.border',
        }}
    >
        <Typography
            variant="caption"
            sx={{
                flex: '0 0 200px',
                fontFamily: theme.typography.mono,
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 600,
                letterSpacing: '0.05em',
                fontSize: '0.6875rem',
            }}
        >
            Timestamp
        </Typography>
        <Typography
            variant="caption"
            sx={{
                flex: 1,
                fontFamily: theme.typography.mono,
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 600,
                letterSpacing: '0.05em',
                fontSize: '0.6875rem',
            }}
        >
            Partition Key
        </Typography>
        <Typography
            variant="caption"
            sx={{
                flex: '0 0 200px',
                fontFamily: theme.typography.mono,
                textTransform: 'uppercase',
                color: 'text.secondary',
                fontWeight: 600,
                letterSpacing: '0.05em',
                fontSize: '0.6875rem',
            }}
        >
            Shard ID
        </Typography>
    </Box>
));

TableHeader.displayName = 'TableHeader';

const TableRow = React.memo(({ index, style, messages, onMessageClick, theme }) => {
    const message = messages[index];
    const isEven = index % 2 === 0;

    return (
        <Box
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                cursor: 'pointer',
                bgcolor: isEven ? 'transparent' : alpha(theme.palette.surface.main, 0.4),
                borderBottom: '1px solid',
                borderColor: 'surface.border',
                transition: 'background-color 120ms cubic-bezier(0.25, 1, 0.5, 1)',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
            }}
            onClick={() => onMessageClick(message)}
            role="button"
            tabIndex={0}
            aria-label={`Message from ${message.timestamp}, partition key ${message.partitionKey}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onMessageClick(message);
                }
            }}
        >
            <Typography
                variant="body2"
                noWrap
                sx={{
                    flex: '0 0 200px',
                    fontFamily: theme.typography.mono,
                    fontSize: '0.8125rem',
                    color: 'text.primary',
                }}
            >
                {message.timestamp}
            </Typography>
            <Typography
                variant="body2"
                noWrap
                sx={{
                    flex: 1,
                    fontFamily: theme.typography.mono,
                    fontSize: '0.8125rem',
                    color: 'text.primary',
                    pr: 1,
                }}
            >
                {message.partitionKey}
            </Typography>
            <Typography
                variant="body2"
                noWrap
                sx={{
                    flex: '0 0 200px',
                    fontFamily: theme.typography.mono,
                    fontSize: '0.8125rem',
                    color: 'text.secondary',
                }}
            >
                {message.ShardId || 'N/A'}
            </Typography>
        </Box>
    );
});

TableRow.displayName = 'TableRow';

const CardRow = React.memo(({ index, style, messages, onMessageClick, theme }) => {
    const message = messages[index];

    return (
        <div style={{ ...style, paddingBottom: 4 }}>
            <Box
                sx={{
                    px: 1.5,
                    py: 1,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'surface.border',
                    borderRadius: '4px',
                    height: CARD_ROW_HEIGHT - 12,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 0.25,
                    transition: 'background-color 120ms cubic-bezier(0.25, 1, 0.5, 1), border-color 120ms cubic-bezier(0.25, 1, 0.5, 1)',
                    '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                    },
                }}
                onClick={() => onMessageClick(message)}
                role="button"
                tabIndex={0}
                aria-label={`Message from ${message.timestamp}, partition key ${message.partitionKey}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onMessageClick(message);
                    }
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 90 }}>
                        Timestamp
                    </Typography>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontFamily: theme.typography.mono, fontSize: '0.8125rem' }}
                    >
                        {message.timestamp}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 90 }}>
                        Partition Key
                    </Typography>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontFamily: theme.typography.mono, fontSize: '0.8125rem' }}
                    >
                        {message.partitionKey}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 90 }}>
                        Shard ID
                    </Typography>
                    <Typography
                        variant="body2"
                        noWrap
                        sx={{ fontFamily: theme.typography.mono, fontSize: '0.8125rem' }}
                    >
                        {message.ShardId || 'N/A'}
                    </Typography>
                </Box>
            </Box>
        </div>
    );
});

CardRow.displayName = 'CardRow';

const MessageList = ({
    messages,
    onMessageClick,
    isPolling,
    onTogglePolling,
    pollInterval,
    onUpdatePollingInterval,
    pollStats,
    isAuthenticated,
    batchHistory,
}) => {
    const [partitionKeyFilter, setPartitionKeyFilter] = useState('');
    const [shardIdFilter, setShardIdFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('table');
    const [pollingMenuAnchor, setPollingMenuAnchor] = useState(null);
    const [listHeight, setListHeight] = useState(400);
    const listContainerRef = useRef(null);
    const theme = useTheme();

    // Measure available height for the virtual list
    useEffect(() => {
        const measure = () => {
            if (listContainerRef.current) {
                const rect = listContainerRef.current.getBoundingClientRect();
                // Leave 36px for the log bar at the bottom
                const available = window.innerHeight - rect.top - 36;
                setListHeight(Math.max(200, available));
            }
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const pollingMenuOpen = Boolean(pollingMenuAnchor);

    const sortedAndFilteredMessages = useMemo(() => {
        return messages
            .filter(message =>
                (partitionKeyFilter === '' || message.partitionKey.includes(partitionKeyFilter)) &&
                (shardIdFilter === '' || message.ShardId.includes(shardIdFilter))
            )
            .sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
    }, [messages, partitionKeyFilter, shardIdFilter, sortOrder]);

    const handleDownload = useCallback(() => {
        const jsonData = {
            messages: sortedAndFilteredMessages.map(message => ({
                timestamp: message.timestamp,
                partitionKey: message.partitionKey,
                shardId: message.ShardId,
                data: message.data
            }))
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kinesis-messages-${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [sortedAndFilteredMessages]);

    const handlePollingMenuClick = useCallback((event) => {
        setPollingMenuAnchor(event.currentTarget);
    }, []);

    const handlePollingMenuClose = useCallback(() => {
        setPollingMenuAnchor(null);
    }, []);

    const handleIntervalChange = useCallback((newInterval) => {
        onUpdatePollingInterval(newInterval);
        setPollingMenuAnchor(null);
        if (!isPolling) {
            // Start polling after choosing an interval
            onTogglePolling();
        }
    }, [onUpdatePollingInterval, isPolling, onTogglePolling]);

    const rowHeight = viewMode === 'table' ? TABLE_ROW_HEIGHT : CARD_ROW_HEIGHT;
    const RowComponent = viewMode === 'table' ? TableRow : CardRow;

    const rowProps = useMemo(() => ({
        messages: sortedAndFilteredMessages,
        onMessageClick,
        theme,
    }), [sortedAndFilteredMessages, onMessageClick, theme]);

    const filterInputSx = {
        height: 28,
        px: 1,
        display: 'flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'surface.border',
        bgcolor: 'background.paper',
        borderRadius: '4px',
        transition: 'border-color 200ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 200ms cubic-bezier(0.25, 1, 0.5, 1)',
        '&:focus-within': {
            borderColor: 'primary.main',
        },
    };

    const inputBaseSx = {
        flex: 1,
        fontFamily: theme.typography.mono,
        fontSize: '0.8125rem',
        '& input::placeholder': {
            fontFamily: theme.typography.mono,
            fontSize: '0.8125rem',
            opacity: 0.6,
        },
    };

    const iconBtnSx = {
        border: '1px solid',
        borderColor: 'surface.border',
        borderRadius: '4px',
        width: 28,
        height: 28,
        transition: 'background-color 150ms cubic-bezier(0.25, 1, 0.5, 1), color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    };

    return (
        <Box>
            {/* Toolbar */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 0.75,
                    py: 0.75,
                    px: 0.5,
                    bgcolor: 'surface.main',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'surface.border',
                    flexWrap: 'wrap',
                }}
            >
                {/* Left: Filters */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ ...filterInputSx, width: 180 }}>
                        <InputBase
                            sx={inputBaseSx}
                            placeholder="Partition Key"
                            value={partitionKeyFilter}
                            onChange={(e) => setPartitionKeyFilter(e.target.value)}
                            inputProps={{ 'aria-label': 'Filter by Partition Key' }}
                        />
                    </Box>
                    <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ ...filterInputSx, width: 150 }}>
                        <InputBase
                            sx={inputBaseSx}
                            placeholder="Shard ID"
                            value={shardIdFilter}
                            onChange={(e) => setShardIdFilter(e.target.value)}
                            inputProps={{ 'aria-label': 'Filter by Shard ID' }}
                        />
                    </Box>
                    {sortedAndFilteredMessages.length > 0 && (
                        <Chip
                            label={`${sortedAndFilteredMessages.length.toLocaleString()} messages`}
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontFamily: theme.typography.mono,
                                borderColor: 'surface.border',
                                color: 'text.secondary',
                            }}
                        />
                    )}
                </Box>

                {/* Spacer */}
                <Box sx={{ flex: 1 }} />

                {/* View toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <Tooltip title="Table view">
                        <IconButton
                            size="small"
                            onClick={() => setViewMode('table')}
                            aria-label="Table view"
                            sx={{
                                ...iconBtnSx,
                                ...(viewMode === 'table' && {
                                    bgcolor: 'action.selected',
                                    color: 'primary.main',
                                }),
                            }}
                        >
                            <TableRowsOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cards view">
                        <IconButton
                            size="small"
                            onClick={() => setViewMode('cards')}
                            aria-label="Cards view"
                            sx={{
                                ...iconBtnSx,
                                ...(viewMode === 'cards' && {
                                    bgcolor: 'action.selected',
                                    color: 'primary.main',
                                }),
                            }}
                        >
                            <ViewAgendaOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Divider */}
                <Box sx={{ width: '1px', height: 20, bgcolor: 'surface.border', mx: 0.25 }} />

                {/* Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title={sortOrder === 'desc' ? 'Showing newest first' : 'Showing oldest first'}>
                        <IconButton
                            size="small"
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            aria-label={sortOrder === 'desc' ? 'Sort oldest first' : 'Sort newest first'}
                            sx={iconBtnSx}
                        >
                            {sortOrder === 'desc' ? (
                                <ArrowDownwardIcon fontSize="small" />
                            ) : (
                                <ArrowUpwardIcon fontSize="small" />
                            )}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Download as JSON">
                        <span>
                            <IconButton
                                size="small"
                                onClick={handleDownload}
                                disabled={sortedAndFilteredMessages.length === 0}
                                aria-label="Download filtered messages as JSON"
                                sx={iconBtnSx}
                            >
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>

                    {isAuthenticated && (
                        <>
                            <Tooltip title={isPolling ? `Polling every ${pollInterval / 1000}s — click to stop` : 'Start auto-refresh'}>
                                <IconButton
                                    size="small"
                                    onClick={isPolling ? onTogglePolling : handlePollingMenuClick}
                                    aria-label={isPolling ? 'Stop auto-refresh' : 'Start auto-refresh'}
                                    sx={{
                                        ...iconBtnSx,
                                        ...(isPolling && {
                                            borderColor: 'primary.main',
                                            color: 'primary.main',
                                            animation: 'pulse-border 2s cubic-bezier(0.25, 1, 0.5, 1) infinite',
                                        }),
                                        '@keyframes pulse-border': {
                                            '0%, 100%': { borderColor: 'primary.main' },
                                            '50%': { borderColor: 'transparent' },
                                        },
                                    }}
                                >
                                    {isPolling ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>

                            <Menu
                                anchorEl={pollingMenuAnchor}
                                open={pollingMenuOpen}
                                onClose={handlePollingMenuClose}
                                slotProps={{
                                    paper: { sx: { minWidth: 150 } },
                                }}
                            >
                                {POLLING_INTERVALS.map((interval) => (
                                    <MenuItem
                                        key={interval.value}
                                        onClick={() => handleIntervalChange(interval.value)}
                                        selected={interval.value === pollInterval}
                                    >
                                        {interval.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    )}
                </Box>
            </Box>

            {/* Batch volume chart */}
            {batchHistory && batchHistory.length > 0 && (
                <BatchChart batches={batchHistory} theme={theme} />
            )}

            {/* Message List */}
            {sortedAndFilteredMessages.length > 0 ? (
                <Box ref={listContainerRef}>
                    {viewMode === 'table' && <TableHeader theme={theme} />}
                    <VirtualList
                        rowComponent={RowComponent}
                        rowCount={sortedAndFilteredMessages.length}
                        rowHeight={rowHeight}
                        rowProps={rowProps}
                        overscanCount={5}
                        style={{
                            height: Math.min(
                                sortedAndFilteredMessages.length * rowHeight,
                                listHeight - (viewMode === 'table' ? TABLE_HEADER_HEIGHT : 0)
                            ),
                            width: '100%',
                        }}
                    />
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                        No messages yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, opacity: 0.7 }}>
                        Connect to a stream to start viewing data
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default React.memo(MessageList);
