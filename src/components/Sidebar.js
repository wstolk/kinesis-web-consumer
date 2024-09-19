// components/Sidebar.js
import React from 'react';
import {Drawer, Box} from '@mui/material';
import AccessKeyForm from './AccessKeyForm';
import {useTheme} from "@mui/material/styles";

const Sidebar = ({isVisible, onSubmit, sx, isLoading, streams}) => {
    const theme = useTheme();

    return (
        <Drawer
            variant="persistent"
            open={isVisible}
            sx={{
                ...sx,
                '& .MuiDrawer-paper': {
                    ...sx['& .MuiDrawer-paper'],
                    backgroundColor: theme.palette.sidebar.main,
                },
            }}
        >
            <Box sx={{overflow: 'auto'}} padding={2}>
                <AccessKeyForm
                    streams={streams}
                    onSubmit={onSubmit}
                    isLoading={isLoading}/>
            </Box>
        </Drawer>
    );
};

export default Sidebar;