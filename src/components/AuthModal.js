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
    useTheme,
    FormControlLabel,
    Switch,
    Chip,
    Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudIcon from '@mui/icons-material/Cloud';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import {AWS_REGIONS, DEFAULT_PROFILE} from '@/lib/constants';
import {safeGetJSON, safeSetJSON} from '@/lib/safeStorage';

const AuthModal = ({open, onClose, onSubmit, onError, activeProfileName, onProfileSelect}) => {
    const theme = useTheme();
    const [profiles, setProfiles] = useState([]);
    const [editingProfile, setEditingProfile] = useState(null);
    const [formData, setFormData] = useState(DEFAULT_PROFILE);
    const [awsProfiles, setAwsProfiles] = useState([]);
    const [loadingAwsProfiles, setLoadingAwsProfiles] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const savedProfiles = safeGetJSON('awsProfiles', []);
        setProfiles(savedProfiles);

        if (open) {
            setEditingProfile(null);
            setFormData(DEFAULT_PROFILE);
            loadAwsProfiles();
        }
    }, [open]);

    const loadAwsProfiles = async () => {
        setLoadingAwsProfiles(true);
        try {
            const response = await fetch('/api/aws-profiles');
            const data = await response.json();

            if (response.ok) {
                const profiles = data.profiles || [];
                setAwsProfiles(profiles);
                // Auto-select the default profile, or the first available one
                const defaultProfile = profiles.find(p => p.profileName === 'default');
                const selectedProfile = defaultProfile || profiles[0];
                if (selectedProfile) {
                    setFormData(prev => ({
                        ...prev,
                        awsProfile: selectedProfile.profileName,
                        ...(selectedProfile.region && {region: selectedProfile.region}),
                    }));
                }
            } else {
                setAwsProfiles([]);
            }
        } catch (error) {
            setAwsProfiles([]);
        } finally {
            setLoadingAwsProfiles(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/authenticate', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                const updatedProfiles = editingProfile
                    ? profiles.map(p => p.name === formData.name ? formData : p)
                    : [...profiles, formData];

                safeSetJSON('awsProfiles', updatedProfiles);
                localStorage.setItem('lastUsedProfile', formData.name);
                setProfiles(updatedProfiles);
                setEditingProfile(null);
                setFormData(DEFAULT_PROFILE);
                onSubmit(formData, data);
            } else {
                onError(data.message);
            }
        } catch (error) {
            onError('Failed to authenticate');
        } finally {
            setIsSubmitting(false);
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
        safeSetJSON('awsProfiles', updatedProfiles);

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
                width: 780,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'surface.border',
                display: 'flex',
                height: '80vh',
                maxHeight: 580,
                borderRadius: '6px',
                overflow: 'hidden',
            }}>
                {/* Close Button */}
                <IconButton
                    onClick={onClose}
                    size="small"
                    aria-label="Close authentication modal"
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        zIndex: 1,
                        color: 'text.secondary',
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>

                {/* Left panel — Profile list */}
                <Box sx={{
                    width: 280,
                    borderRight: '1px solid',
                    borderColor: 'surface.border',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'surface.main',
                }}>
                    <Box sx={{px: 2, py: 1.5}}>
                        <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                            Profiles
                        </Typography>
                    </Box>
                    <Divider />
                    <List sx={{flexGrow: 1, overflow: 'auto', py: 0}}>
                        {profiles.map((profile) => (
                            <ListItem
                                key={profile.name}
                                onClick={() => handleProfileClick(profile)}
                                sx={{
                                    cursor: 'pointer',
                                    py: 0.75,
                                    px: 2,
                                    '&:hover': {bgcolor: 'action.hover'},
                                    ...(profile.name === activeProfileName && {
                                        borderLeft: 3,
                                        borderLeftColor: 'primary.main',
                                        pl: 1.625,
                                    }),
                                    ...(profile.name === editingProfile && {
                                        bgcolor: 'action.selected',
                                    })
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: profile.name === activeProfileName ? 'primary.main' : 'surface.light',
                                        color: profile.name === activeProfileName ? 'primary.contrastText' : 'text.secondary',
                                        mr: 1,
                                    }}
                                >
                                    {profile.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <ListItemText
                                    primary={
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                            <Typography variant="body2" sx={{fontWeight: 500}}>
                                                {profile.name}
                                            </Typography>
                                            {profile.name === activeProfileName && (
                                                <CheckCircleIcon sx={{fontSize: 14, color: 'primary.main'}} />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                            {profile.useDefaultCredentials
                                                ? `${profile.awsProfile || 'default'} \u00b7 ${profile.region}`
                                                : (profile.endpoint ? 'Custom endpoint' : profile.region)
                                            }
                                        </Typography>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleEditProfile(e, profile)}
                                        aria-label={`Edit profile ${profile.name}`}
                                        sx={{mr: 0.25, p: 0.5}}
                                    >
                                        <EditIcon sx={{fontSize: 15}} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleDeleteProfile(e, profile.name)}
                                        aria-label={`Delete profile ${profile.name}`}
                                        sx={{p: 0.5}}
                                    >
                                        <DeleteIcon sx={{fontSize: 15}} />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{
                        p: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'surface.border',
                    }}>
                        <Button
                            startIcon={<AddIcon sx={{fontSize: '16px !important'}} />}
                            variant={!editingProfile ? 'contained' : 'outlined'}
                            fullWidth
                            size="small"
                            onClick={() => {
                                setEditingProfile(null);
                                setFormData(DEFAULT_PROFILE);
                            }}
                        >
                            New Profile
                        </Button>
                    </Box>
                </Box>

                {/* Right panel — Form */}
                <Box sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}>
                    <Box sx={{
                        px: 2.5,
                        py: 1.5,
                        flexGrow: 1,
                        overflow: 'auto',
                    }}>
                        <Typography variant="subtitle1" sx={{fontWeight: 600, mb: 1.5}}>
                            {editingProfile ? 'Edit Profile' : 'New Profile'}
                        </Typography>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                        >
                            <TextField
                                fullWidth
                                margin="dense"
                                label="Profile Name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />

                            <Box sx={{mt: 1.5, mb: 1}}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            size="small"
                                            checked={formData.useDefaultCredentials}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                useDefaultCredentials: e.target.checked,
                                                ...(e.target.checked && {
                                                    accessKeyId: '',
                                                    secretAccessKey: '',
                                                    sessionToken: '',
                                                })
                                            })}
                                        />
                                    }
                                    label={
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                            {formData.useDefaultCredentials ? <CloudIcon sx={{fontSize: 16}} /> : <VpnKeyIcon sx={{fontSize: 16}} />}
                                            <Typography variant="body2">
                                                {formData.useDefaultCredentials ? 'AWS Profile' : 'Manual Credentials'}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Box>

                            {formData.useDefaultCredentials && (
                                <TextField
                                    fullWidth
                                    margin="dense"
                                    select
                                    label="AWS Profile"
                                    value={formData.awsProfile}
                                    onChange={(e) => {
                                        const selectedProfile = awsProfiles.find(p => p.profileName === e.target.value);
                                        setFormData({
                                            ...formData,
                                            awsProfile: e.target.value,
                                            ...(selectedProfile?.region && {region: selectedProfile.region})
                                        });
                                    }}
                                    disabled={loadingAwsProfiles}
                                    helperText={loadingAwsProfiles ? 'Loading...' : `${awsProfiles.length} profiles found`}
                                >
                                    {awsProfiles.map((profile) => (
                                        <MenuItem key={profile.profileName} value={profile.profileName}>
                                            {profile.profileName} {profile.region && `(${profile.region})`}
                                        </MenuItem>
                                    ))}
                                    {awsProfiles.length === 0 && (
                                        <MenuItem value="default">
                                            default (fallback)
                                        </MenuItem>
                                    )}
                                </TextField>
                            )}

                            {!formData.useDefaultCredentials && (
                                <>
                                    <TextField
                                        fullWidth
                                        margin="dense"
                                        label="Access Key ID"
                                        value={formData.accessKeyId}
                                        onChange={(e) => setFormData({...formData, accessKeyId: e.target.value})}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        margin="dense"
                                        label="Secret Access Key"
                                        type="password"
                                        value={formData.secretAccessKey}
                                        onChange={(e) => setFormData({...formData, secretAccessKey: e.target.value})}
                                        required
                                    />
                                    <TextField
                                        fullWidth
                                        margin="dense"
                                        label="Session Token"
                                        value={formData.sessionToken}
                                        onChange={(e) => setFormData({...formData, sessionToken: e.target.value})}
                                    />
                                </>
                            )}
                            <TextField
                                fullWidth
                                margin="dense"
                                select
                                label="Region"
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
                                margin="dense"
                                label="Custom Endpoint"
                                value={formData.endpoint}
                                onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                                placeholder="e.g., http://localhost:4566"
                            />
                        </form>
                    </Box>
                    {/* Fixed button area */}
                    <Box sx={{
                        px: 2.5,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'surface.border',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                    }}>
                        <Button onClick={onClose} size="small">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} variant="contained" size="small" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (editingProfile ? 'Update' : 'Create')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default AuthModal;
