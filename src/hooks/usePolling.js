// hooks/usePolling.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { pollingService } from '@/lib/pollingService';
import { DEFAULT_POLLING_INTERVAL } from '@/lib/constants';
import { loggingService } from '@/lib/loggingService';

/**
 * Custom hook for managing polling with React state integration
 * @param {string} pollId - Unique identifier for this polling session
 * @returns {Object} Polling state and control functions
 */
export const usePolling = (pollId = 'default') => {
    const [isPolling, setIsPolling] = useState(false);
    const [pollInterval, _setPollInterval] = useState(DEFAULT_POLLING_INTERVAL);
    const pollIntervalRef = useRef(pollInterval);
    const [pollStats, setPollStats] = useState(null);
    const [lastError, setLastError] = useState(null);
    const statsIntervalRef = useRef(null);

    const setPollInterval = useCallback((val) => {
        pollIntervalRef.current = val;
        _setPollInterval(val);
    }, []);

    // Update polling stats periodically
    useEffect(() => {
        if (!isPolling) return;

        statsIntervalRef.current = setInterval(() => {
            const stats = pollingService.getSessionStats(pollId);
            setPollStats(stats);
        }, 5000);

        return () => {
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
                statsIntervalRef.current = null;
            }
            setPollStats(null);
        };
    }, [isPolling, pollId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            pollingService.stopPolling(pollId);
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
        };
    }, [pollId]);

    /**
     * Start polling with given parameters
     * @param {Object} params - Request parameters
     * @param {Function} onData - Success callback
     * @param {Function} onError - Error callback
     * @param {number} interval - Polling interval (optional)
     */
    const startPolling = useCallback((params, onData, onError, interval, fetchFn = null) => {
        const effectiveInterval = interval ?? pollIntervalRef.current;
        const wrappedOnError = (error) => {
            setLastError(error);
            if (onError) {
                onError(error);
            }
        };

        const success = pollingService.startPolling(
            pollId,
            params,
            onData,
            wrappedOnError,
            effectiveInterval,
            fetchFn
        );

        if (success) {
            setIsPolling(true);
            setLastError(null);
            loggingService.log('info', `Started polling with ${effectiveInterval}ms interval`);
        }

        return success;
    }, [pollId]);

    /**
     * Stop polling
     */
    const stopPolling = useCallback(() => {
        const stopped = pollingService.stopPolling(pollId);
        if (stopped) {
            setIsPolling(false);
            setLastError(null);
            loggingService.log('info', 'Stopped polling');
        }
        return stopped;
    }, [pollId]);

    /**
     * Update polling interval
     * @param {number} newInterval - New interval in milliseconds
     */
    const updateInterval = useCallback((newInterval) => {
        // Always update local state so the next startPolling uses the new interval
        setPollInterval(newInterval);
        // If actively polling, also update the service's scheduled timer
        pollingService.updateInterval(pollId, newInterval);
        loggingService.log('info', `Updated polling interval to ${newInterval}ms`);
    }, [pollId]);

    /**
     * Toggle polling on/off
     * @param {Object} params - Request parameters (required when starting)
     * @param {Function} onData - Success callback (required when starting)
     * @param {Function} onError - Error callback (optional)
     */
    const togglePolling = useCallback((params, onData, onError, fetchFn = null) => {
        if (isPolling) {
            return stopPolling();
        } else {
            if (!params || !onData) {
                loggingService.log('error', 'Cannot start polling: missing required parameters');
                return false;
            }
            return startPolling(params, onData, onError, undefined, fetchFn);
        }
    }, [isPolling, startPolling, stopPolling]);

    /**
     * Check if polling is currently active
     */
    const checkPollingStatus = useCallback(() => {
        const actuallyPolling = pollingService.isPolling(pollId);
        if (actuallyPolling !== isPolling) {
            setIsPolling(actuallyPolling);
        }
        return actuallyPolling;
    }, [pollId, isPolling]);

    return {
        // State
        isPolling,
        pollInterval,
        pollStats,
        lastError,
        
        // Actions
        startPolling,
        stopPolling,
        togglePolling,
        updateInterval,
        checkPollingStatus,
        
        // Setters for manual control
        setPollInterval
    };
};