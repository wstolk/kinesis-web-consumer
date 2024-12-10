import React, {useState, useMemo} from 'react';
import {
    Box,
    Typography,
    Paper,
    ButtonGroup,
    Button,
    useTheme,
    InputBase
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';

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

    const handleDownload = () => {
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
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Kinesis Stream Messages
            </Typography>

            <Typography variant="body2" sx={{mb: 3}}>
                Use the filters below to narrow down the messages by Partition Key or Shard ID.
                You can also change the sorting order of messages based on their timestamps.
                Click on any message to view its full details.
            </Typography>

            <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3,
                alignItems: 'center'
            }}>
                {/* Search fields styled as buttons */}
                <Paper
                    component="form"
                    sx={{
                        p: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        width: 200,
                        height: 40
                    }}
                >
                    <SearchIcon sx={{p: '4px', color: 'action.active'}}/>
                    <InputBase
                        sx={{ml: 1, flex: 1}}
                        placeholder="Filter by Partition Key"
                        value={partitionKeyFilter}
                        onChange={(e) => setPartitionKeyFilter(e.target.value)}
                    />
                </Paper>

                <Paper
                    component="form"
                    sx={{
                        p: '2px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        width: 200,
                        height: 40
                    }}
                >
                    <SearchIcon sx={{p: '4px', color: 'action.active'}}/>
                    <InputBase
                        sx={{ml: 1, flex: 1}}
                        placeholder="Filter by Shard ID"
                        value={shardIdFilter}
                        onChange={(e) => setShardIdFilter(e.target.value)}
                    />
                </Paper>

                {/* Sort and Download buttons grouped together */}
                <ButtonGroup variant="outlined">
                    <Button
                        onClick={() => setSortOrder('asc')}
                        variant={sortOrder === 'asc' ? 'contained' : 'outlined'}
                        startIcon={<ArrowUpwardIcon/>}
                    >
                        Oldest First
                    </Button>
                    <Button
                        onClick={() => setSortOrder('desc')}
                        variant={sortOrder === 'desc' ? 'contained' : 'outlined'}
                        startIcon={<ArrowDownwardIcon/>}
                    >
                        Newest First
                    </Button>
                </ButtonGroup>
                <ButtonGroup variant="outlined">
                    <Button
                        onClick={handleDownload}
                        disabled={sortedAndFilteredMessages.length === 0}
                        startIcon={<DownloadIcon/>}
                    >
                        Download JSON
                    </Button>
                </ButtonGroup>
            </Box>

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