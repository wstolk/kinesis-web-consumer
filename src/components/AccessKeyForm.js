// components/AccessKeyForm.js
import React, {useEffect, useState} from 'react';
import {TextField, Button, Box, Typography, MenuItem, Collapse, IconButton, Paper} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { 
    AWS_REGIONS, 
    SHARD_ITERATOR_TYPES, 
    DEFAULT_MESSAGE_LIMIT, 
    DEFAULT_MINUTES_AGO,
    MAX_MESSAGES_LIMIT 
} from '@/lib/constants';

const AccessKeyForm = ({onSubmit, isLoading, streams}) => {
    const [streamName, setStreamName] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [messageLimit, setMessageLimit] = useState(DEFAULT_MESSAGE_LIMIT);
    const [minutesAgo, setMinutesAgo] = useState(DEFAULT_MINUTES_AGO);
    const [shardIteratorType, setShardIteratorType] = useState('TRIM_HORIZON');
    const [partitionKey, setPartitionKey] = useState('');

    useEffect(() => {
        // Load cached values from localStorage
        const cachedForm = JSON.parse(localStorage.getItem('kinesisFormData'));
        if (cachedForm) {
            setStreamName(cachedForm.streamName || '');
            setMessageLimit(cachedForm.messageLimit || DEFAULT_MESSAGE_LIMIT);
            setShardIteratorType(cachedForm.shardIteratorType || 'AT_TIMESTAMP');
            setPartitionKey(cachedForm.partitionKey || '');
        }

        if (streams.length > 0 && (!cachedForm || !cachedForm.streamName)) {
            setStreamName(streams[0]);
        }
    }, [streams]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate message limit for production safety
        const safeMessageLimit = Math.min(Math.max(1, messageLimit), MAX_MESSAGES_LIMIT);
        if (safeMessageLimit !== messageLimit) {
            console.warn(`Message limit capped at ${MAX_MESSAGES_LIMIT} for performance reasons`);
        }
        
        const formData = {
            streamName,
            messageLimit: safeMessageLimit,
            shardIteratorType,
            minutesAgo,
            partitionKey: partitionKey.trim() || undefined,
        };

        // Cache form data in localStorage
        localStorage.setItem('kinesisFormData', JSON.stringify(formData));

        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
                AWS Kinesis Configuration
            </Typography>
            <Typography variant="body2">
                Please provide your Kinesis stream details below.
                This information is required to connect to your AWS Kinesis stream and retrieve messages.
            </Typography>
            {/* Display a dropdown if stream list is available, otherwise show a text field */}
            {streams.length > 0 ? (
                <TextField
                    fullWidth
                    margin="normal"
                    select
                    label="Kinesis Stream Name"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    helperText="Select the Kinesis stream to connect to"
                >
                    {streams.map((stream) => (
                        <MenuItem key={stream} value={stream}>
                            {stream}
                        </MenuItem>
                    ))}
                </TextField>
            ) : (
                <TextField
                    fullWidth
                    margin="normal"
                    required
                    label="Kinesis Stream Name"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                    helperText="The name of your Kinesis stream"
                />
            )}
            <Box sx={{display: 'flex', alignItems: 'center', mt: 2, mb: 1}}>
                <Typography variant="subtitle1">Advanced Settings</Typography>
                <IconButton onClick={() => setShowAdvanced(!showAdvanced)} size="small" aria-label={showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}>
                    {showAdvanced ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </IconButton>
            </Box>
            <Collapse in={showAdvanced}>
                <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Number of Messages to Fetch (optional)"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(parseInt(e.target.value))}
                    helperText={`Maximum number of messages to retrieve (max: ${MAX_MESSAGES_LIMIT})`}
                    inputProps={{ min: 1, max: MAX_MESSAGES_LIMIT }}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    select
                    label="Shard Iterator Type"
                    value={shardIteratorType}
                    onChange={(e) => setShardIteratorType(e.target.value)}
                    helperText="Select the shard iterator type (default: AT_TIMESTAMP)"
                >
                    {SHARD_ITERATOR_TYPES.map((option) => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>
                <Collapse in={shardIteratorType === 'AT_TIMESTAMP'}>
                    <TextField
                        fullWidth
                        margin="normal"
                        type="number"
                        label="Number of minutes ago"
                        required
                        value={minutesAgo}
                        onChange={(e) => setMinutesAgo(parseInt(e.target.value))}
                        helperText="Number of minutes ago to start fetching (default: 30)"
                    />
                </Collapse>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Partition key (optional)"
                    value={partitionKey}
                    onChange={(e) => setPartitionKey(e.target.value)}
                    helperText="Specify a partition key or leave empty to retrieve all data"
                />
            </Collapse>
            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{mt: 2}}
                disabled={isLoading}
            >
                {isLoading ? 'Connecting...' : 'Connect to Kinesis'}
            </Button>
        </Box>
    );
};

export default AccessKeyForm;
