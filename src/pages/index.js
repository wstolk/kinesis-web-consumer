// pages/index.js
import React, {useState, useEffect} from 'react';
import {Box, AppBar, Toolbar, CircularProgress} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import MessageList from '../components/MessageList';
import MessageModal from '../components/MessageModal';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import {useKinesisMode} from "@/contexts/KinesisModeContext";
import ErrorNotification from "@/components/ErrorNotification";
import AuthModal from "@/components/AuthModal";

const HEADER_HEIGHT = 64;
const SIDEBAR_WIDTH = 300;

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [streams, setStreams] = useState([]);
    const {useRealKinesis} = useKinesisMode();
    const theme = useTheme();

    useEffect(() => {
        const savedCredentials = JSON.parse(localStorage.getItem('awsCredentials'));
        if (savedCredentials) {
            setCredentials(savedCredentials);
            setIsAuthenticated(true);

            const savedStreams = JSON.parse(localStorage.getItem('awsStreams'));
            if (savedStreams) {
                setStreams(savedStreams);
            }
        } else {
            setIsAuthModalOpen(true);
        }
    }, []);

    const handleSubmit = async (form) => {
        if (!form) {
            setError('No form data provided. Please fill in all fields first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/kinesis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...credentials,
                    ...form,
                    useRealKinesis
                }),
            });

            if (!response.ok) {
                // Set data to empty array
                setMessages([]);
                const responseBody = await response.json();
                setError(responseBody['error']);

                throw new Error('Failed to fetch Kinesis data');
            }

            const data = await response.json();
            setMessages(data.records.map(record => ({
                ...record,
                timestamp: new Date(record.ApproximateArrivalTimestamp).toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}),
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

    const handleCloseError = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setError(null);
    };

    const handleOpenAuthModal = () => {
        setIsAuthModalOpen(true);
    };

    const handleCloseAuthModal = () => {
        setIsAuthModalOpen(false);
    };

    const handleAuthSubmit = (newCredentials, authResponse) => {
        setCredentials(newCredentials);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);

        if (authResponse.streams) {
            setStreams(authResponse.streams);

            // Cache streams in localStorage
            localStorage.setItem('awsStreams', JSON.stringify(authResponse.streams));
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <AppBar position="fixed" sx={{zIndex: theme.zIndex.drawer + 1}}>
                <Toolbar>
                    <Header
                        onOpenAuthModal={handleOpenAuthModal}
                        isAuthenticated={isAuthenticated}
                        onToggleSidebar={handleToggleSidebar}/>
                </Toolbar>
            </AppBar>
            {/*<Box sx={{display: 'flex', pt: `${HEADER_HEIGHT}px`, height: `calc(100vh - ${HEADER_HEIGHT}px)`}}>*/}
            <Box sx={{display: 'flex', pt: `${HEADER_HEIGHT}px`, height: '100%'}}>
                <Sidebar
                    isVisible={sidebarVisible}
                    onSubmit={handleSubmit}
                    streams={streams}
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

            <ErrorNotification error={error} onClose={handleCloseError}/>

            <AuthModal
                open={isAuthModalOpen}
                onClose={handleCloseAuthModal}
                onSubmit={handleAuthSubmit}
            />
        </Box>
    );
}
