// components/AccessKeyForm.js
import React, {useState, useSyncExternalStore} from 'react';
import {TextField, Button, Box, Typography, MenuItem, Collapse, ButtonBase} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
    SHARD_ITERATOR_TYPES,
    DEFAULT_MESSAGE_LIMIT,
    DEFAULT_MINUTES_AGO,
    MAX_MESSAGES_LIMIT
} from '@/lib/constants';
import {safeGetJSON, safeSetJSON} from '@/lib/safeStorage';

const subscribeFn = () => () => {};
const getFormSnapshot = () => safeGetJSON('kinesisFormData');
const getFormServerSnapshot = () => null;

const AccessKeyForm = ({onSubmit, isLoading, streams}) => {
    const cachedForm = useSyncExternalStore(subscribeFn, getFormSnapshot, getFormServerSnapshot);
    const [streamName, setStreamName] = useState(() => cachedForm?.streamName || '');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [messageLimit, setMessageLimit] = useState(() => cachedForm?.messageLimit || DEFAULT_MESSAGE_LIMIT);
    const [minutesAgo, setMinutesAgo] = useState(DEFAULT_MINUTES_AGO);
    const [shardIteratorType, setShardIteratorType] = useState(() => cachedForm?.shardIteratorType || 'TRIM_HORIZON');
    const [partitionKey, setPartitionKey] = useState(() => cachedForm?.partitionKey || '');

    // When streams arrive and no stream is selected, pick the first one
    if (streams?.length > 0 && !streamName) {
        setStreamName(streams[0]);
    }

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
        safeSetJSON('kinesisFormData', formData);

        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography
                variant="subtitle2"
                sx={{fontWeight: 700, mb: 1.5}}
            >
                Configuration
            </Typography>

            {streams?.length > 0 ? (
                <TextField
                    fullWidth
                    margin="dense"
                    select
                    label="Stream"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
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
                    margin="dense"
                    required
                    label="Stream Name"
                    value={streamName}
                    onChange={(e) => setStreamName(e.target.value)}
                />
            )}

            <ButtonBase
                onClick={() => setShowAdvanced(!showAdvanced)}
                disableRipple
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                    mt: 1.5,
                    mb: 0.5,
                    py: 0.25,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    transition: 'color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                    '&:hover': {
                        color: 'text.primary',
                    },
                }}
            >
                <ChevronRightIcon sx={{
                    fontSize: 16,
                    transition: 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
                    transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)',
                }}/>
                Advanced
            </ButtonBase>

            <Collapse in={showAdvanced}>
                <TextField
                    fullWidth
                    margin="dense"
                    type="number"
                    label="Message Limit"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(parseInt(e.target.value))}
                    helperText={`Max: ${MAX_MESSAGES_LIMIT}`}
                    inputProps={{min: 1, max: MAX_MESSAGES_LIMIT}}
                />
                <TextField
                    fullWidth
                    margin="dense"
                    select
                    label="Shard Iterator Type"
                    value={shardIteratorType}
                    onChange={(e) => setShardIteratorType(e.target.value)}
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
                        margin="dense"
                        type="number"
                        label="Minutes Ago"
                        required
                        value={minutesAgo}
                        onChange={(e) => setMinutesAgo(parseInt(e.target.value))}
                    />
                </Collapse>
                <TextField
                    fullWidth
                    margin="dense"
                    label="Partition Key"
                    value={partitionKey}
                    onChange={(e) => setPartitionKey(e.target.value)}
                />
            </Collapse>

            <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                    mt: 2,
                    transition: 'transform 100ms cubic-bezier(0.25, 1, 0.5, 1), background-color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                    '&:active': { transform: 'scale(0.98)' },
                }}
                disabled={isLoading}
            >
                {isLoading ? 'Fetching...' : 'Fetch'}
            </Button>
        </Box>
    );
};

export default AccessKeyForm;
