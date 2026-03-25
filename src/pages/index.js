import React, {useState, useEffect, useCallback, lazy, Suspense} from 'react';
import {Box, CircularProgress} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import MessageList from '@/components/MessageList';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import {useKinesisMode} from '@/contexts/KinesisModeContext';
import ErrorNotification from '@/components/ErrorNotification';
import LogViewer from '@/components/LogViewer';

// Lazy load dialogs — not needed at first paint
const MessageModal = lazy(() => import('@/components/MessageModal'));
const AuthModal = lazy(() => import('@/components/AuthModal'));
import {usePolling} from '@/hooks/usePolling';
import {dataFetchingService} from '@/lib/dataFetchingService';
import {HEADER_HEIGHT, SIDEBAR_WIDTH, MAX_STORED_MESSAGES} from '@/lib/constants';
import {loggingService} from '@/lib/loggingService';
import {performanceMonitor} from '@/lib/performanceMonitor';
import {safeGetJSON, safeSetJSON} from '@/lib/safeStorage';

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
    const [pollSessionId, setPollSessionId] = useState(null);
    const [streamInfo, setStreamInfo] = useState(null);
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
        const savedCredentials = safeGetJSON('awsCredentials');
        const lastUsedProfile = localStorage.getItem('lastUsedProfile');
        const savedProfiles = safeGetJSON('awsProfiles', []);

        setProfiles(savedProfiles);

        if (savedCredentials && lastUsedProfile) {
            setCredentials(savedCredentials);
            setActiveProfile(lastUsedProfile);
            setIsAuthenticated(true);

            const savedStreams = safeGetJSON('awsStreams');
            if (savedStreams) {
                setStreams(savedStreams);
            }
        } else {
            setIsAuthModalOpen(true);
        }
    }, []);

    // Handle polling errors
    useEffect(() => {
        if (pollError) {
            setError(pollError.message);
        }
    }, [pollError]);

    // Track pollSessionId in a ref so cleanup doesn't re-trigger on changes
    const pollSessionIdRef = React.useRef(null);
    pollSessionIdRef.current = pollSessionId;

    // Auto-cleanup on unmount only
    useEffect(() => {
        return () => {
            dataFetchingService.cancelAllRequests();
            stopPolling();
            if (pollSessionIdRef.current) {
                dataFetchingService.stopPollingSession(pollSessionIdRef.current);
            }
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
            if (data.streamInfo) {
                setStreamInfo(data.streamInfo);
            }
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
            // Use a Set for O(n) deduplication instead of O(n^2) findIndex + JSON.stringify
            const seen = new Set();
            const makeKey = (m) => `${m.timestamp}|${m.partitionKey}|${m.SequenceNumber || ''}`;
            prevMessages.forEach(m => seen.add(makeKey(m)));

            const unique = [...prevMessages];
            for (const m of newMessages) {
                const key = makeKey(m);
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.unshift(m);
                }
            }

            const limitedMessages = unique.slice(0, MAX_STORED_MESSAGES);

            const wasCleanedUp = limitedMessages.length < unique.length;
            if (wasCleanedUp) {
                loggingService.log('info', `Trimmed messages to ${MAX_STORED_MESSAGES} for memory management`);
            }

            performanceMonitor.recordMemoryUsage(limitedMessages.length, wasCleanedUp);

            return limitedMessages;
        });
    };

    const handlePollingError = (error) => {
        loggingService.log('warn', `Polling error: ${error.message}`);
        setError(`Polling error: ${error.message}`);
    };

    const handleTogglePolling = async () => {
        if (!lastFetchParams) {
            setError('Please fetch data first before enabling polling');
            return;
        }

        if (isPolling) {
            // Stop polling — clean up server session
            togglePolling(null, null, null);
            if (pollSessionId) {
                dataFetchingService.stopPollingSession(pollSessionId);
                setPollSessionId(null);
            }
            return;
        }

        // Start a server-side polling session
        const sessionId = `poll-${Date.now()}`;
        try {
            await dataFetchingService.startPollingSession(sessionId, lastFetchParams);
            setPollSessionId(sessionId);

            // Custom fetch function that polls the server-side session
            const pollFetchFn = async () => {
                return dataFetchingService.pollRecords(
                    sessionId,
                    lastFetchParams.messageLimit || 100,
                    lastFetchParams.partitionKey
                );
            };

            const success = togglePolling(lastFetchParams, handlePollingData, handlePollingError, pollFetchFn);
            if (!success) {
                dataFetchingService.stopPollingSession(sessionId);
                setPollSessionId(null);
                setError('Failed to start polling');
            }
        } catch (err) {
            loggingService.log('error', `Failed to start polling session: ${err.message}`);
            setError(`Failed to start polling: ${err.message}`);
        }
    };

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
        if (reason === 'clickaway') return;
        setError(null);
    }, []);

    const handleOpenAuthModal = useCallback(() => {
        setIsAuthModalOpen(true);
    }, []);

    const handleCloseAuthModal = useCallback(() => {
        setIsAuthModalOpen(false);
    }, []);

    const handleAuthSubmit = (newCredentials, authResponse) => {
        setCredentials(newCredentials);
        setActiveProfile(newCredentials.name);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);

        const savedProfiles = safeGetJSON('awsProfiles', []);
        setProfiles(savedProfiles);

        safeSetJSON('awsCredentials', newCredentials);
        localStorage.setItem('lastUsedProfile', newCredentials.name);

        if (authResponse.streams) {
            setStreams(authResponse.streams);
            safeSetJSON('awsStreams', authResponse.streams);
        }
    };

    const handleProfileSelect = async (profile) => {
        try {
            const response = await fetch('/api/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile),
            });

            const data = await response.json();

            if (response.ok) {
                setCredentials(profile);
                setActiveProfile(profile.name);
                setIsAuthenticated(true);
                safeSetJSON('awsCredentials', profile);
                localStorage.setItem('lastUsedProfile', profile.name);

                if (data.streams) {
                    setStreams(data.streams);
                    safeSetJSON('awsStreams', data.streams);
                }
            } else {
                setError(data.message || 'Failed to authenticate with selected profile');
            }
        } catch (error) {
            console.error('Error selecting profile:', error);
            setError('Failed to authenticate with selected profile');
        }
    };

    const sidebarWidth = sidebarVisible ? SIDEBAR_WIDTH : 0;

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default'}}>
            {/* Header */}
            <Box sx={{position: 'fixed', top: 0, left: 0, right: 0, zIndex: theme.zIndex.drawer + 1}}>
                <Header
                    onOpenAuthModal={handleOpenAuthModal}
                    isAuthenticated={isAuthenticated}
                    onToggleSidebar={handleToggleSidebar}
                    profiles={profiles}
                    activeProfileName={activeProfile}
                    onProfileSelect={handleProfileSelect}
                />
            </Box>

            {/* Main content */}
            <Box sx={{display: 'flex', pt: `${HEADER_HEIGHT}px`, height: '100%'}}>
                {/* Left sidebar */}
                <Sidebar
                    isVisible={sidebarVisible}
                    onSubmit={handleSubmit}
                    streams={streams}
                    isLoading={isLoading}
                    streamInfo={streamInfo}
                    sx={{
                        width: SIDEBAR_WIDTH,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: {
                            width: SIDEBAR_WIDTH,
                            boxSizing: 'border-box',
                            height: `calc(100% - ${HEADER_HEIGHT}px)`,
                            top: `${HEADER_HEIGHT}px`,
                        },
                    }}
                />

                {/* Messages content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        pt: 0.75,
                        px: 1,
                        pb: 0,
                        width: {sm: `calc(100% - ${sidebarWidth}px)`},
                        bgcolor: 'background.default',
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
                                top: 0, left: 0, right: 0, bottom: 0,
                            }}>
                                <CircularProgress size={28} />
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

                    <LogViewer sidebarWidth={sidebarWidth} />
                </Box>
            </Box>

            <Suspense fallback={null}>
                {selectedMessage && (
                    <MessageModal
                        message={selectedMessage}
                        open={Boolean(selectedMessage)}
                        onClose={handleCloseModal}
                    />
                )}
                {isAuthModalOpen && (
                    <AuthModal
                        open={isAuthModalOpen}
                        onClose={handleCloseAuthModal}
                        onSubmit={handleAuthSubmit}
                        onError={setError}
                        activeProfileName={activeProfile}
                        onProfileSelect={handleProfileSelect}
                    />
                )}
            </Suspense>

            <ErrorNotification error={error} onClose={handleCloseError} />
        </Box>
    );
}
