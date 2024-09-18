// pages/index.js
import React, {useState} from 'react';
import {Box, AppBar, Toolbar, CircularProgress} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import MessageList from '../components/MessageList';
import MessageModal from '../components/MessageModal';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {useKinesisMode} from "@/contexts/KinesisModeContext";

const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 300;

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const {useRealKinesis} = useKinesisMode();
    const theme = useTheme();

    const handleSubmit = async (credentials) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/kinesis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...credentials,
                    useRealKinesis
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch Kinesis data');
            }

            const data = await response.json();
            setMessages(data.records.map(record => ({
                ...record,
                timestamp: new Date(record.ApproximateArrivalTimestamp).toLocaleString(),
                partitionKey: record.PartitionKey,
                data: record.Data,
                ShardId: record.ShardId || 'N/A'
            })));
        } catch (error) {
            console.error('Error:', error);
            // Handle error (e.g., show an error message to the user)
        } finally {
            setIsLoading(false);
        }
    };

    const handleMessageClick = (message) => {
        setSelectedMessage(message);
    };

    const handleCloseModal = () => {
        setSelectedMessage(null);
    };

    const handleToggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <AppBar position="fixed" sx={{zIndex: theme.zIndex.drawer + 1}}>
                <Toolbar>
                    <Header onToggleSidebar={handleToggleSidebar}/>
                </Toolbar>
            </AppBar>
            <Box sx={{display: 'flex', pt: `${HEADER_HEIGHT}px`, height: `calc(100vh - ${HEADER_HEIGHT}px)`}}>
                <Sidebar
                    isVisible={sidebarVisible}
                    onSubmit={handleSubmit}
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            width: SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                            height: `calc(100% - ${HEADER_HEIGHT}px)`,
                            top: `${HEADER_HEIGHT}px`
                        },
                    }}
                />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 2,
                        width: {sm: `calc(100% - ${sidebarVisible ? SIDEBAR_WIDTH : 0}px)`},
                        bgcolor: theme.palette.background.paper,
                        ml: {sm: sidebarVisible ? 0 : `-${SIDEBAR_WIDTH}px`},
                        transition: theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Box sx={{height: '100%', overflow: 'auto', position: 'relative'}}>
                        {isLoading ? (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            }}>
                                <CircularProgress/>
                            </Box>
                        ) : (
                            <MessageList messages={messages} onMessageClick={handleMessageClick}/>
                        )}
                    </Box>
                </Box>
            </Box>
            <MessageModal
                message={selectedMessage}
                open={Boolean(selectedMessage)}
                onClose={handleCloseModal}
            />
        </Box>
    );
}