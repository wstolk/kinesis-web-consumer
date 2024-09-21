// components/AuthModal.js
import React, {useState, useEffect} from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    MenuItem
} from '@mui/material';

const AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "af-south-1", "ap-east-1", "ap-south-1", "ap-northeast-1",
    "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-north-1", "eu-south-1", "me-south-1",
    "sa-east-1"
];

const AuthModal = ({open, onClose, onSubmit, onError}) => {
    const [accessKeyId, setAccessKeyId] = useState('');
    const [secretAccessKey, setSecretAccessKey] = useState('');
    const [sessionToken, setSessionToken] = useState('');
    const [region, setRegion] = useState('eu-central-1');

    useEffect(() => {
        // Load saved credentials from localStorage
        const savedCredentials = JSON.parse(localStorage.getItem('awsCredentials'));
        if (savedCredentials) {
            setAccessKeyId(savedCredentials.accessKeyId || '');
            setSecretAccessKey(savedCredentials.secretAccessKey || '');
            setSessionToken(savedCredentials.sessionToken || '');
            setRegion(savedCredentials.region || 'eu-central-1');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({accessKeyId, secretAccessKey, sessionToken, region}),
            });

            const data = await response.json();
            const credentials = {accessKeyId, secretAccessKey, sessionToken, region};

            // If the response is OK, save the credentials and close the modal
            if (response.ok) {
                localStorage.setItem('awsCredentials', JSON.stringify(credentials));
                onSubmit(credentials, data);
                onClose();
            } else {
                onError(data.message);

                if (response.status === 403) {
                    localStorage.setItem('awsCredentials', JSON.stringify(credentials));
                    onSubmit(credentials, null);
                    onClose();
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
            }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    AWS Authentication
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Access Key ID"
                        value={accessKeyId}
                        onChange={(e) => setAccessKeyId(e.target.value)}
                        required
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Secret Access Key"
                        type="password"
                        value={secretAccessKey}
                        onChange={(e) => setSecretAccessKey(e.target.value)}
                        required
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
                        select
                        label="AWS Region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        required
                    >
                        {AWS_REGIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{mt: 2}}
                    >
                        Authenticate
                    </Button>
                </form>
            </Box>
        </Modal>
    );
};

export default AuthModal;