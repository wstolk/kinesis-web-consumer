import React, {useState, useEffect} from 'react';
import {Box, AppBar, Toolbar, CircularProgress} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import MessageList from '@/components/MessageList';
import MessageModal from '@/components/MessageModal';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import {useKinesisMode} from '@/contexts/KinesisModeContext';
import ErrorNotification from '@/components/ErrorNotification';
import AuthModal from '@/components/AuthModal';
import LogViewer from "@/components/LogViewer";

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
    const [activeProfile, setActiveProfile] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [streams, setStreams] = useState([]);
    const {useRealKinesis} = useKinesisMode();
    const theme = useTheme();

    // Load saved credentials, active profile, and stream names from localStorage
    useEffect(() => {
        const savedCredentials = JSON.parse(localStorage.getItem('awsCredentials'));
        const lastUsedProfile = localStorage.getItem('lastUsedProfile');
        const savedProfiles = JSON.parse(localStorage.getItem('awsProfiles')) || [];

        setProfiles(savedProfiles);

        if (savedCredentials && lastUsedProfile) {
            setCredentials(savedCredentials);
            setActiveProfile(lastUsedProfile);
            setIsAuthenticated(true);

            // Stream names are retrieved on authentication check in the backend and cached in localStorage
            const savedStreams = JSON.parse(localStorage.getItem('awsStreams'));
            if (savedStreams) {
                setStreams(savedStreams);
            }
        } else {
            // Open auth modal if no credentials are saved
            setIsAuthModalOpen(true);
        }
    }, []);

    // Fetch Kinesis data on form submit
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

    // Handle authentication form submit and store resulting streams in localStorage
    const handleAuthSubmit = (newCredentials, authResponse) => {
        setCredentials(newCredentials);
        setActiveProfile(newCredentials.name);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);

        // Update profiles in state and localStorage
        const savedProfiles = JSON.parse(localStorage.getItem('awsProfiles')) || [];
        setProfiles(savedProfiles);

        localStorage.setItem('awsCredentials', JSON.stringify(newCredentials));
        localStorage.setItem('lastUsedProfile', newCredentials.name);

        if (authResponse.streams) {
            setStreams(authResponse.streams);
            localStorage.setItem('awsStreams', JSON.stringify(authResponse.streams));
        }
    };

    // Handle profile selection
    const handleProfileSelect = async (profile) => {
        try {
            const response = await fetch('/api/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profile),
            });

            const data = await response.json();

            if (response.ok) {
                setCredentials(profile);
                setActiveProfile(profile.name);
                setIsAuthenticated(true);
                localStorage.setItem('awsCredentials', JSON.stringify(profile));
                localStorage.setItem('lastUsedProfile', profile.name);

                if (data.streams) {
                    setStreams(data.streams);
                    localStorage.setItem('awsStreams', JSON.stringify(data.streams));
                }
            } else {
                setError(data.message || 'Failed to authenticate with selected profile');
            }
        } catch (error) {
            console.error('Error selecting profile:', error);
            setError('Failed to authenticate with selected profile');
        }
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            {/* Header */}
            <AppBar position="fixed" sx={{zIndex: theme.zIndex.drawer + 1}}>
                <Toolbar>
                    <Header
                        onOpenAuthModal={handleOpenAuthModal}
                        isAuthenticated={isAuthenticated}
                        onToggleSidebar={handleToggleSidebar}
                        profiles={profiles}
                        activeProfileName={activeProfile}
                        onProfileSelect={handleProfileSelect}
                    />
                </Toolbar>
            </AppBar>

            {/* Main content */}
            <Box sx={{display: 'flex', pt: `${HEADER_HEIGHT}px`, height: '100%'}}>
                {/* Left sidebar */}
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

                {/* Messages content */}
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
                    {/* Message list (or loading spinner) */}
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

                    <LogViewer sidebarWidth={sidebarVisible ? SIDEBAR_WIDTH : 0}/>
                </Box>
            </Box>

            {/* Message Modal */}
            <MessageModal
                message={selectedMessage}
                open={Boolean(selectedMessage)}
                onClose={handleCloseModal}
            />

            {/* Error notification */}
            <ErrorNotification error={error} onClose={handleCloseError}/>

            {/* Authentication modal */}
            <AuthModal
                open={isAuthModalOpen}
                onClose={handleCloseAuthModal}
                onSubmit={handleAuthSubmit}
                onError={setError}
                activeProfileName={activeProfile}
                onProfileSelect={handleProfileSelect}
            />
        </Box>
    );
}