import React, {useState, useEffect, useCallback} from 'react';
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
import { usePolling } from '@/hooks/usePolling';
import { dataFetchingService } from '@/lib/dataFetchingService';
import { HEADER_HEIGHT, SIDEBAR_WIDTH, MAX_STORED_MESSAGES } from '@/lib/constants';
import { loggingService } from '@/lib/loggingService';
import { performanceMonitor } from '@/lib/performanceMonitor';

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
    const [lastFetchParams, setLastFetchParams] = useState(null);
    const {useRealKinesis} = useKinesisMode();
    const theme = useTheme();

    // Initialize polling hook
    const {
        isPolling,
        pollInterval,
        pollStats,
        lastError: pollError,
        startPolling,
        stopPolling,
        togglePolling,
        updateInterval
    } = usePolling('kinesis-main');

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

    // Handle polling errors
    useEffect(() => {
        if (pollError) {
            setError(pollError.message);
        }
    }, [pollError]);

    // Auto-cleanup on unmount
    useEffect(() => {
        return () => {
            dataFetchingService.cancelAllRequests();
            stopPolling();
        };
    }, [stopPolling]);

    // Fetch Kinesis data on form submit
    const handleSubmit = async (form) => {
        if (!form) {
            setError('No form data provided. Please fill in all fields first.');
            return;
        }

        setIsLoading(true);
        setError(null);

        const requestParams = {
            ...credentials,
            ...form,
            useRealKinesis
        };

        // Store params for potential polling
        setLastFetchParams(requestParams);

        try {
            loggingService.log('info', 'Fetching Kinesis data with production service');
            const data = await dataFetchingService.fetchKinesisData(requestParams);

            const formattedMessages = data.records.map(record => ({
                ...record,
                timestamp: new Date(record.ApproximateArrivalTimestamp).toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}),
                partitionKey: record.PartitionKey,
                data: record.Data,
                ShardId: record.ShardId || 'N/A'
            }));

            setMessages(formattedMessages);
            performanceMonitor.recordMemoryUsage(formattedMessages.length);
            loggingService.log('info', `Successfully loaded ${formattedMessages.length} messages`);

        } catch (error) {
            loggingService.log('error', `Data fetch failed: ${error.message}`);
            setMessages([]);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle polling data updates with memory management
    const handlePollingData = (data) => {
        const newMessages = data.records.map(record => ({
            ...record,
            timestamp: new Date(record.ApproximateArrivalTimestamp).toLocaleString('en-US', {timeZone: 'Europe/Amsterdam'}),
            partitionKey: record.PartitionKey,
            data: record.Data,
            ShardId: record.ShardId || 'N/A'
        }));

        setMessages(prevMessages => {
            // Combine new and existing messages
            const combined = [...newMessages, ...prevMessages];
            
            // Remove duplicates based on a unique combination of timestamp and partition key
            const uniqueMessages = combined.filter((message, index, self) => 
                index === self.findIndex(m => 
                    m.timestamp === message.timestamp && 
                    m.partitionKey === message.partitionKey &&
                    JSON.stringify(m.data) === JSON.stringify(message.data)
                )
            );

            // Limit total messages for memory management
            const limitedMessages = uniqueMessages.slice(0, MAX_STORED_MESSAGES);
            
            const wasCleanedUp = limitedMessages.length < uniqueMessages.length;
            if (wasCleanedUp) {
                loggingService.log('info', `Trimmed messages to ${MAX_STORED_MESSAGES} for memory management`);
            }

            // Record memory usage
            performanceMonitor.recordMemoryUsage(limitedMessages.length, wasCleanedUp);

            return limitedMessages;
        });
    };

    // Handle polling errors
    const handlePollingError = (error) => {
        loggingService.log('warn', `Polling error: ${error.message}`);
        setError(`Polling error: ${error.message}`);
    };

    // Start/stop polling
    const handleTogglePolling = () => {
        if (!lastFetchParams) {
            setError('Please fetch data first before enabling polling');
            return;
        }

        const success = togglePolling(lastFetchParams, handlePollingData, handlePollingError);
        if (!success && !isPolling) {
            setError('Failed to start polling');
        }
    };

    // Update polling interval
    const handleUpdatePollingInterval = (newInterval) => {
        updateInterval(newInterval);
    };

    const handleMessageClick = useCallback((message) => {
        setSelectedMessage(message);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedMessage(null);
    }, []);

    const handleToggleSidebar = useCallback(() => {
        setSidebarVisible(prev => !prev);
    }, []);

    const handleCloseError = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setError(null);
    }, []);

    const handleOpenAuthModal = useCallback(() => {
        setIsAuthModalOpen(true);
    }, []);

    const handleCloseAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
    }, []);

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
                            <MessageList 
                                messages={messages} 
                                onMessageClick={handleMessageClick}
                                isPolling={isPolling}
                                onTogglePolling={handleTogglePolling}
                                pollInterval={pollInterval}
                                onUpdatePollingInterval={handleUpdatePollingInterval}
                                pollStats={pollStats}
                                isAuthenticated={isAuthenticated}
                            />
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