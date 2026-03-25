import React, { useState } from 'react';
import {
    Typography,
    IconButton,
    Box,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Avatar,
    Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { useThemeMode } from '@/contexts/ThemeContext';
import { HEADER_HEIGHT } from '@/lib/constants';

const Header = ({
    onToggleSidebar,
    onOpenAuthModal,
    isAuthenticated,
    profiles,
    activeProfileName,
    onProfileSelect,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const { mode, toggleTheme } = useThemeMode();

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

    const profileInitial = activeProfileName
        ? activeProfileName.charAt(0).toUpperCase()
        : '?';

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: HEADER_HEIGHT,
                minHeight: HEADER_HEIGHT,
                maxHeight: HEADER_HEIGHT,
                px: 1.5,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'surface.border',
                boxSizing: 'border-box',
            }}
        >
            <IconButton
                size="small"
                aria-label="toggle sidebar"
                onClick={onToggleSidebar}
                sx={{ mr: 1, color: 'text.secondary' }}
            >
                <MenuIcon fontSize="small" />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'baseline', flexGrow: 1 }}>
                <Typography
                    sx={(theme) => ({
                        fontFamily: theme.typography.mono,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'primary.main',
                        lineHeight: 1,
                    })}
                >
                    kinesis
                </Typography>
                <Typography
                    sx={{
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        color: 'text.secondary',
                        ml: 0.5,
                        lineHeight: 1,
                    }}
                >
                    stream consumer
                </Typography>
            </Box>

            <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                    size="small"
                    onClick={toggleTheme}
                    sx={{
                        color: 'text.secondary',
                        mr: 0.5,
                        transition: 'transform 300ms cubic-bezier(0.25, 1, 0.5, 1), color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                        '&:active': { transform: 'rotate(45deg)' },
                    }}
                >
                    {mode === 'dark' ? (
                        <LightModeOutlined fontSize="small" />
                    ) : (
                        <DarkModeOutlined fontSize="small" />
                    )}
                </IconButton>
            </Tooltip>

            {isAuthenticated ? (
                <>
                    <Tooltip title={activeProfileName || 'Select profile'}>
                        <IconButton
                            size="small"
                            onClick={handleClick}
                            sx={{
                                ml: 0.5,
                                transition: 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                                '&:hover': { transform: 'scale(1.08)' },
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 24,
                                    height: 24,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                }}
                            >
                                {profileInitial}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                            paper: {
                                sx: {
                                    minWidth: 180,
                                    mt: 0.5,
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'surface.border',
                                },
                            },
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {(profiles || []).map((profile) => (
                            <MenuItem
                                key={profile.name}
                                onClick={() => handleProfileSelect(profile)}
                                dense
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8125rem',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            fontSize: '0.6875rem',
                                            fontWeight: 600,
                                            bgcolor: profile.name === activeProfileName
                                                ? 'primary.main'
                                                : 'action.selected',
                                            color: profile.name === activeProfileName
                                                ? 'primary.contrastText'
                                                : 'text.secondary',
                                            mr: 1,
                                        }}
                                    >
                                        {profile.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    {profile.name}
                                </Box>
                                {profile.name === activeProfileName && (
                                    <CheckIcon sx={{ fontSize: 16, ml: 1, color: 'primary.main' }} />
                                )}
                            </MenuItem>
                        ))}

                        <Divider />

                        <MenuItem onClick={handleManageProfiles} dense sx={{ fontSize: '0.8125rem' }}>
                            <ListItemIcon>
                                <SettingsIcon sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                            Manage Profiles
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={onOpenAuthModal}
                    sx={{
                        ml: 0.5,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        py: 0.25,
                        px: 1.5,
                        borderRadius: 1,
                        borderColor: 'surface.border',
                        color: 'text.secondary',
                        transition: 'border-color 150ms cubic-bezier(0.25, 1, 0.5, 1), color 150ms cubic-bezier(0.25, 1, 0.5, 1)',
                        '&:hover': {
                            borderColor: 'primary.main',
                            color: 'primary.main',
                        },
                    }}
                >
                    Connect
                </Button>
            )}
        </Box>
    );
};

export default React.memo(Header);
