// components/Sidebar.js
import React from 'react';
import {Drawer, Box} from '@mui/material';
import AccessKeyForm from './AccessKeyForm';
import StreamInfo from './StreamInfo';
import {HEADER_HEIGHT, SIDEBAR_WIDTH} from '@/lib/constants';

const Sidebar = ({isVisible, onSubmit, sx, isLoading, streams, streamInfo}) => {
    return (
        <Drawer
            variant="persistent"
            open={isVisible}
            sx={{
                ...sx,
                '& .MuiDrawer-paper': {
                    ...sx?.['& .MuiDrawer-paper'],
                    width: SIDEBAR_WIDTH,
                    backgroundColor: 'background.paper',
                    borderRight: 1,
                    borderColor: 'surface.border',
                    top: HEADER_HEIGHT,
                    height: `calc(100% - ${HEADER_HEIGHT}px)`,
                },
            }}
        >
            <Box sx={{overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%'}}>
                {/* Form section — compact top padding */}
                <Box sx={{px: 1.5, pt: 1.25, pb: 1}}>
                    <AccessKeyForm
                        streams={streams}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                    />
                </Box>
                {/* Stream info — separated, allowed to grow */}
                {streamInfo && (
                    <Box sx={{px: 1.5, pb: 1.5}}>
                        <StreamInfo streamInfo={streamInfo} />
                    </Box>
                )}
            </Box>
        </Drawer>
    );
};

export default React.memo(Sidebar);
