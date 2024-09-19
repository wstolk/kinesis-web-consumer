// components/AccessKeyForm.js
import React, {useEffect, useState} from 'react';
import {TextField, Button, Box, Typography, MenuItem, Collapse, IconButton, Paper} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "af-south-1", "ap-east-1", "ap-south-1", "ap-northeast-1",
    "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-north-1", "eu-south-1", "me-south-1",
    "sa-east-1"
];

const SHARD_ITERATOR_TYPES = [
    "TRIM_HORIZON", "AT_TIMESTAMP"
];

const AccessKeyForm = ({onSubmit, isLoading}) => {
    const [accessKeyId, setAccessKeyId] = useState('');
    const [secretAccessKey, setSecretAccessKey] = useState('');
    const [sessionToken, setSessionToken] = useState('');
    const [region, setRegion] = useState('eu-central-1');
    const [streamName, setStreamName] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [messageLimit, setMessageLimit] = useState(20);
    const [minutesAgo, setMinutesAgo] = useState(5);
    const [shardIteratorType, setShardIteratorType] = useState('TRIM_HORIZON');
    const [partitionKey, setPartitionKey] = useState('');

    useEffect(() => {
        // Load cached values from localStorage
        const cachedForm = JSON.parse(localStorage.getItem('kinesisFormData'));
        if (cachedForm) {
            setAccessKeyId(cachedForm.accessKeyId || '');
            setSecretAccessKey(cachedForm.secretAccessKey || '');
            setSessionToken(cachedForm.sessionToken || '');
            setRegion(cachedForm.region || 'eu-central-1');
            setStreamName(cachedForm.streamName || '');
            setMessageLimit(cachedForm.messageLimit || 20);
            setShardIteratorType(cachedForm.shardIteratorType || 'TRIM_HORIZON');
            setPartitionKey(cachedForm.partitionKey || '');
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = {
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region,
            streamName,
            messageLimit,
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
                Please provide your AWS credentials and Kinesis stream details below.
                This information is required to connect to your AWS Kinesis stream and retrieve messages.
                Ensure that your AWS credentials have the necessary permissions to access the specified Kinesis
                stream.
            </Typography>
            <TextField
                fullWidth
                margin="normal"
                required
                label="Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                helperText="Your AWS access key ID"
            />
            <TextField
                fullWidth
                margin="normal"
                required
                label="Secret Access Key"
                type="password"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                helperText="Your AWS secret access key"
            />
            <TextField
                fullWidth
                margin="normal"
                label="Session Token (optional)"
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                helperText="Your AWS session token (if applicable)"
            />
            <TextField
                fullWidth
                margin="normal"
                required
                select
                label="AWS Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                helperText="Select the AWS region where your Kinesis stream is located"
            >
                {AWS_REGIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                fullWidth
                margin="normal"
                required
                label="Kinesis Stream Name"
                value={streamName}
                onChange={(e) => setStreamName(e.target.value)}
                helperText="The name of your Kinesis stream"
            />
            <Box sx={{display: 'flex', alignItems: 'center', mt: 2, mb: 1}}>
                <Typography variant="subtitle1">Advanced Settings</Typography>
                <IconButton onClick={() => setShowAdvanced(!showAdvanced)} size="small">
                    {showAdvanced ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                </IconButton>
            </Box>
            <Collapse in={showAdvanced}>
                <TextField
                    fullWidth
                    margin="normal"
                    type="number"
                    label="Number of Messages to Fetch"
                    value={messageLimit}
                    onChange={(e) => setMessageLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    helperText="Maximum number of messages to retrieve (default: 20)"
                    InputProps={{inputProps: {min: 1}}}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    select
                    label="Shard Iterator Type"
                    value={shardIteratorType}
                    onChange={(e) => setShardIteratorType(e.target.value)}
                    helperText="Select the shard iterator type (default: TRIM_HORIZON)"
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
                        value={minutesAgo}
                        onChange={(e) => setMinutesAgo(Math.max(1, parseInt(e.target.value) || 1))}
                        helperText="Number of minutes ago to start fetching (default: 5)"
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
