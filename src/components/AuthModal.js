import React, {useState, useEffect} from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Divider,
    useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "af-south-1", "ap-east-1", "ap-south-1", "ap-northeast-1",
    "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-north-1", "eu-south-1", "me-south-1",
    "sa-east-1"
];

const DEFAULT_PROFILE = {
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: 'eu-central-1',
    endpoint: '',
};

const AuthModal = ({open, onClose, onSubmit, onError, activeProfileName, onProfileSelect}) => {
    const theme = useTheme();
    const [profiles, setProfiles] = useState([]);
    const [editingProfile, setEditingProfile] = useState(null);
    const [formData, setFormData] = useState(DEFAULT_PROFILE);

    useEffect(() => {
        // Load profiles from localStorage
        const savedProfiles = JSON.parse(localStorage.getItem('awsProfiles')) || [];
        setProfiles(savedProfiles);

        // Always start in "new profile" mode when opened
        if (open) {
            setEditingProfile(null);
            setFormData(DEFAULT_PROFILE);
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Save or update profile
                const updatedProfiles = editingProfile
                    ? profiles.map(p => p.name === formData.name ? formData : p)
                    : [...profiles, formData];

                localStorage.setItem('awsProfiles', JSON.stringify(updatedProfiles));
                localStorage.setItem('lastUsedProfile', formData.name);
                setProfiles(updatedProfiles);
                setEditingProfile(null);
                setFormData(DEFAULT_PROFILE);
                onSubmit(formData, data);
            } else {
                onError(data.message);
            }
        } catch (error) {
            console.error(error);
            onError('Failed to authenticate');
        }
    };

    const handleProfileClick = (profile) => {
        onProfileSelect(profile);
        onClose();
    };

    const handleEditProfile = (e, profile) => {
        e.stopPropagation();
        setEditingProfile(profile.name);
        setFormData(profile);
    };

    const handleDeleteProfile = (e, profileName) => {
        e.stopPropagation();
        const updatedProfiles = profiles.filter(p => p.name !== profileName);
        setProfiles(updatedProfiles);
        localStorage.setItem('awsProfiles', JSON.stringify(updatedProfiles));

        if (editingProfile === profileName) {
            setEditingProfile(null);
            setFormData(DEFAULT_PROFILE);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 1000,
                bgcolor: 'background.paper',
                boxShadow: 24,
                display: 'flex',
                height: '90vh',
                maxHeight: 700,
                borderRadius: 1
            }}>
                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        zIndex: 1,
                    }}
                >
                    <CloseIcon/>
                </IconButton>

                {/* Sidebar */}
                <Box sx={{
                    width: 500,
                    borderRight: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: theme.palette.sidebar.main,
                    borderTopLeftRadius: 1,
                    borderBottomLeftRadius: 1,
                }}>
                    <Box sx={{p: 3}}>
                        <Typography variant="h6" gutterBottom>
                            AWS Profiles
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Click a profile to activate it, or use the edit button to modify
                        </Typography>
                    </Box>
                    <Divider/>
                    <List sx={{flexGrow: 1, overflow: 'auto'}}>
                        {profiles.map((profile) => (
                            <ListItem
                                key={profile.name}
                                onClick={() => handleProfileClick(profile)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                    ...(profile.name === activeProfileName && {
                                        borderLeft: 4,
                                        borderLeftColor: 'primary.main',
                                        pl: 1.75,
                                    }),
                                    ...(profile.name === editingProfile && {
                                        bgcolor: 'action.selected',
                                    })
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            {profile.name}
                                            {profile.name === activeProfileName && (
                                                <CheckCircleIcon
                                                    color="primary"
                                                    sx={{fontSize: 16}}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={profile.endpoint ? 'Custom endpoint' : profile.region}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => handleEditProfile(e, profile)}
                                        sx={{mr: 1}}
                                    >
                                        <EditIcon/>
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => handleDeleteProfile(e, profile.name)}
                                    >
                                        <DeleteIcon/>
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{
                        p: 3,
                        borderTop: 1,
                        borderColor: 'divider',
                        bgcolor: theme.palette.sidebar.main,
                    }}>
                        <Button
                            startIcon={<AddIcon/>}
                            variant="contained"
                            fullWidth
                            onClick={() => {
                                setEditingProfile(null);
                                setFormData(DEFAULT_PROFILE);
                            }}
                            color={!editingProfile ? "primary" : "inherit"}
                        >
                            New Profile
                        </Button>
                    </Box>
                </Box>

                {/* Form */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}>
                    <Box sx={{
                        p: 3,
                        flexGrow: 1,
                        overflow: 'auto'
                    }}>
                        <Typography variant="h6" gutterBottom>
                            {editingProfile ? 'Edit Profile' : 'New Profile'}
                        </Typography>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                            style={{
                                height: '100%'
                            }}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Profile Name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Access Key ID"
                                value={formData.accessKeyId}
                                onChange={(e) => setFormData({...formData, accessKeyId: e.target.value})}
                                required
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Secret Access Key"
                                type="password"
                                value={formData.secretAccessKey}
                                onChange={(e) => setFormData({...formData, secretAccessKey: e.target.value})}
                                required
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Session Token (optional)"
                                value={formData.sessionToken}
                                onChange={(e) => setFormData({...formData, sessionToken: e.target.value})}
                                helperText="Your AWS session token (if applicable)"
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                select
                                label="AWS Region"
                                value={formData.region}
                                onChange={(e) => setFormData({...formData, region: e.target.value})}
                                required
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
                                label="Custom Endpoint URL (optional)"
                                value={formData.endpoint}
                                onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                                helperText="e.g., http://localhost:4566 for LocalStack"
                            />
                        </form>
                    </Box>
                    {/* Fixed button container */}
                    <Box sx={{
                        p: 3,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        bgcolor: 'background.paper',
                    }}>
                        <Button
                            onClick={onClose}
                            sx={{mr: 2}}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                        >
                            {editingProfile ? 'Update Profile' : 'Create Profile'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default AuthModal;