// components/Header.js
import React from 'react';
import {Typography, IconButton, Box, Button} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import KinesisModeToggle from './KinesisModeToggle';

const Header = ({onToggleSidebar, onOpenAuthModal, isAuthenticated}) => {
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
            {process.env.NODE_ENV === 'development' && <KinesisModeToggle/>}
            <Button color="inherit" onClick={onOpenAuthModal}>
                {isAuthenticated ? 'Change Credentials' : 'Authenticate'}
            </Button>
        </Box>
    );
};

export default Header;