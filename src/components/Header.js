import React, {useState} from 'react';
import {
    Typography,
    IconButton,
    Box,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';

const Header = ({
                    onToggleSidebar,
                    onOpenAuthModal,
                    isAuthenticated,
                    profiles,
                    activeProfileName,
                    onProfileSelect
                }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleProfileSelect = (profile) => {
        onProfileSelect(profile);
        handleClose();
    };

    const handleManageProfiles = () => {
        onOpenAuthModal();
        handleClose();
    };

    return (
        <Box sx={{display: 'flex', alignItems: 'center', width: '100%'}}>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={onToggleSidebar}
                sx={{mr: 2}}
            >
                <MenuIcon/>
            </IconButton>

            <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                Kinesis Stream Consumer
            </Typography>

            {isAuthenticated ? (
                <>
                    <Button
                        color="inherit"
                        onClick={handleClick}
                        startIcon={<PersonIcon/>}
                    >
                        {activeProfileName || 'Select Profile'}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        PaperProps={{
                            sx: {
                                minWidth: 200,
                                mt: 1,
                            }
                        }}
                    >
                        {profiles.map((profile) => (
                            <MenuItem
                                key={profile.name}
                                onClick={() => handleProfileSelect(profile)}
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <ListItemIcon>
                                        <PersonIcon fontSize="small"/>
                                    </ListItemIcon>
                                    {profile.name}
                                </Box>
                                {profile.name === activeProfileName && (
                                    <CheckIcon fontSize="small" color="primary" sx={{ml: 1}}/>
                                )}
                            </MenuItem>
                        ))}

                        <Divider/>

                        <MenuItem onClick={handleManageProfiles}>
                            <ListItemIcon>
                                <SettingsIcon fontSize="small"/>
                            </ListItemIcon>
                            Manage Profiles
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <Button color="inherit" onClick={onOpenAuthModal}>
                    Authenticate
                </Button>
            )}
        </Box>
    );
};

export default React.memo(Header);