// components/MessageList.js
import React, {useState, useMemo} from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    useTheme,
    ToggleButton,
    ToggleButtonGroup,
    Grid2
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const MessageList = ({messages, onMessageClick}) => {
    const [partitionKeyFilter, setPartitionKeyFilter] = useState('');
    const [shardIdFilter, setShardIdFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const theme = useTheme();

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

    const handleSortChange = (event, newSortOrder) => {
        if (newSortOrder !== null) {
            setSortOrder(newSortOrder);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Kinesis Stream Messages
            </Typography>
            <Typography variant="body2">
                Use the filters below to narrow down the messages by Partition Key or Shard ID.
                You can also change the sorting order of messages based on their timestamps.
                Click on any message to view its full details.
            </Typography>
            <Grid2 container spacing={2} alignItems="center" sx={{mb: 2}}>
                <Grid2 item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Filter by Partition Key"
                        value={partitionKeyFilter}
                        onChange={(e) => setPartitionKeyFilter(e.target.value)}
                    />
                </Grid2>
                <Grid2 item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Filter by Shard ID"
                        value={shardIdFilter}
                        onChange={(e) => setShardIdFilter(e.target.value)}
                    />
                </Grid2>
                <Grid2 item xs={12} sm={4}>
                    <ToggleButtonGroup
                        value={sortOrder}
                        exclusive
                        onChange={handleSortChange}
                        aria-label="sort order"
                    >
                        <ToggleButton value="asc" aria-label="sort ascending">
                            <ArrowUpwardIcon/> Oldest First
                        </ToggleButton>
                        <ToggleButton value="desc" aria-label="sort descending">
                            <ArrowDownwardIcon/> Newest First
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Grid2>
            </Grid2>
            {sortedAndFilteredMessages.map((message, index) => (
                <Paper
                    key={index}
                    elevation={2}
                    sx={{
                        mb: 2,
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: theme.palette.background.default,
                        '&:hover': {
                            bgcolor: theme.palette.action.hover,
                        },
                    }}
                    onClick={() => onMessageClick(message)}
                >
                    <Typography variant="subtitle2">
                        Timestamp: {message.timestamp}
                    </Typography>
                    <Typography variant="subtitle2">
                        Partition Key: {message.partitionKey}
                    </Typography>
                    <Typography variant="subtitle2">
                        Shard ID: {message.ShardId || 'N/A'}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
};

export default MessageList;
