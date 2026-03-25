// lib/pollingService.js
import { loggingService } from './loggingService';
import { dataFetchingService } from './dataFetchingService';
import { performanceMonitor } from './performanceMonitor';

/**
 * Polling service for automatic data refresh with configurable intervals,
 * intelligent error handling, and performance monitoring
 */
class PollingService {
    constructor() {
        this.activePolls = new Map(); // Track active polling sessions
        this.pollConfig = {
            defaultInterval: 30000, // 30 seconds
            minInterval: 5000, // 5 seconds
            maxInterval: 300000, // 5 minutes
            maxConsecutiveErrors: 3,
            errorBackoffFactor: 2,
            maxErrorBackoff: 60000 // 1 minute
        };
    }

    /**
     * Start polling for a specific configuration
     * @param {string} pollId - Unique identifier for this polling session
     * @param {Object} params - Request parameters
     * @param {Function} onData - Callback for successful data retrieval
     * @param {Function} onError - Callback for error handling
     * @param {number} interval - Polling interval in milliseconds
     * @returns {boolean} True if polling started successfully
     */
    startPolling(pollId, params, onData, onError, interval = this.pollConfig.defaultInterval, fetchFn = null) {
        // Validate interval
        if (interval < this.pollConfig.minInterval || interval > this.pollConfig.maxInterval) {
            const error = `Invalid polling interval: ${interval}ms. Must be between ${this.pollConfig.minInterval}ms and ${this.pollConfig.maxInterval}ms`;
            loggingService.log('error', error);
            onError?.(new Error(error));
            return false;
        }

        // Stop existing polling session
        if (this.activePolls.has(pollId)) {
            this.stopPolling(pollId);
        }

        const pollState = {
            id: pollId,
            params,
            onData,
            onError,
            fetchFn,
            interval,
            startTime: Date.now(),
            lastPollTime: 0,
            pollCount: 0,
            successCount: 0,
            errorCount: 0,
            consecutiveErrors: 0,
            isActive: true,
            currentInterval: interval,
            timeoutId: null
        };

        this.activePolls.set(pollId, pollState);
        loggingService.log('info', `Started polling for ${pollId} with ${interval}ms interval`);

        // Record polling start
        performanceMonitor.recordPolling('start', { pollId, interval });

        // Start the polling loop
        this.schedulePoll(pollState);
        return true;
    }

    /**
     * Stop polling for a specific session
     * @param {string} pollId - Polling session ID
     * @returns {boolean} True if polling was stopped
     */
    stopPolling(pollId) {
        const pollState = this.activePolls.get(pollId);
        if (!pollState) {
            return false;
        }

        pollState.isActive = false;
        if (pollState.timeoutId) {
            clearTimeout(pollState.timeoutId);
        }

        const duration = Date.now() - pollState.startTime;
        loggingService.log('info', `Stopped polling for ${pollId}. Duration: ${Math.round(duration/1000)}s, Polls: ${pollState.pollCount}, Success: ${pollState.successCount}, Errors: ${pollState.errorCount}`);

        // Record polling stop
        performanceMonitor.recordPolling('stop', { 
            pollId, 
            duration, 
            totalPolls: pollState.pollCount,
            successCount: pollState.successCount,
            errorCount: pollState.errorCount
        });

        this.activePolls.delete(pollId);
        return true;
    }

    /**
     * Stop all active polling sessions
     */
    stopAllPolling() {
        const pollIds = Array.from(this.activePolls.keys());
        loggingService.log('info', `Stopping ${pollIds.length} active polling sessions`);
        
        pollIds.forEach(pollId => this.stopPolling(pollId));
    }

    /**
     * Update polling interval for an active session
     * @param {string} pollId - Polling session ID
     * @param {number} newInterval - New interval in milliseconds
     * @returns {boolean} True if interval was updated
     */
    updateInterval(pollId, newInterval) {
        const pollState = this.activePolls.get(pollId);
        if (!pollState || !pollState.isActive) {
            return false;
        }

        if (newInterval < this.pollConfig.minInterval || newInterval > this.pollConfig.maxInterval) {
            loggingService.log('error', `Invalid interval: ${newInterval}ms`);
            return false;
        }

        pollState.interval = newInterval;
        pollState.currentInterval = newInterval;
        loggingService.log('info', `Updated polling interval for ${pollId} to ${newInterval}ms`);
        
        return true;
    }

    /**
     * Schedule the next poll execution
     * @param {Object} pollState - Polling state object
     */
    schedulePoll(pollState) {
        if (!pollState.isActive) {
            return;
        }

        pollState.timeoutId = setTimeout(() => {
            this.executePoll(pollState);
        }, pollState.currentInterval);
    }

    /**
     * Execute a single poll operation
     * @param {Object} pollState - Polling state object
     */
    async executePoll(pollState) {
        if (!pollState.isActive) {
            return;
        }

        pollState.pollCount++;
        pollState.lastPollTime = Date.now();

        try {
            loggingService.log('debug', `Executing poll ${pollState.pollCount} for ${pollState.id}`);

            const data = pollState.fetchFn
                ? await pollState.fetchFn(pollState.params)
                : await dataFetchingService.fetchKinesisData(pollState.params);
            
            // Success - reset error tracking
            pollState.successCount++;
            pollState.consecutiveErrors = 0;
            pollState.currentInterval = pollState.interval; // Reset to normal interval
            
            // Record polling success
            performanceMonitor.recordPolling('poll', { 
                pollId: pollState.id, 
                success: true, 
                recordCount: data.records?.length || 0 
            });
            
            // Call success callback
            if (pollState.onData) {
                pollState.onData(data);
            }

            loggingService.log('debug', `Poll ${pollState.pollCount} completed successfully`);

        } catch (error) {
            pollState.errorCount++;
            pollState.consecutiveErrors++;

            // Record polling error
            performanceMonitor.recordPolling('poll', { 
                pollId: pollState.id, 
                success: false, 
                error: error.message,
                consecutiveErrors: pollState.consecutiveErrors
            });

            loggingService.log('warn', `Poll ${pollState.pollCount} failed: ${error.message}`);

            // Implement backoff for consecutive errors
            if (pollState.consecutiveErrors > 1) {
                const backoffMultiplier = Math.min(
                    Math.pow(this.pollConfig.errorBackoffFactor, pollState.consecutiveErrors - 1),
                    this.pollConfig.maxErrorBackoff / pollState.interval
                );
                pollState.currentInterval = Math.min(
                    pollState.interval * backoffMultiplier,
                    this.pollConfig.maxErrorBackoff
                );
                
                loggingService.log('info', `Applied error backoff: ${pollState.currentInterval}ms (consecutive errors: ${pollState.consecutiveErrors})`);
            }

            // Stop polling if too many consecutive errors
            if (pollState.consecutiveErrors >= this.pollConfig.maxConsecutiveErrors) {
                loggingService.log('error', `Stopping polling for ${pollState.id} due to ${pollState.consecutiveErrors} consecutive errors`);
                pollState.isActive = false;
                
                if (pollState.onError) {
                    pollState.onError(new Error(`Polling stopped after ${pollState.consecutiveErrors} consecutive errors`));
                }
                return;
            }

            // Call error callback
            if (pollState.onError) {
                pollState.onError(error);
            }
        }

        // Schedule next poll if still active
        if (pollState.isActive) {
            this.schedulePoll(pollState);
        }
    }

    /**
     * Get status of all polling sessions
     * @returns {Object} Polling status summary
     */
    getStatus() {
        const activeSessions = Array.from(this.activePolls.values()).map(poll => ({
            id: poll.id,
            interval: poll.interval,
            currentInterval: poll.currentInterval,
            pollCount: poll.pollCount,
            successCount: poll.successCount,
            errorCount: poll.errorCount,
            consecutiveErrors: poll.consecutiveErrors,
            uptime: Date.now() - poll.startTime,
            lastPollTime: poll.lastPollTime
        }));

        return {
            activeSessions: activeSessions.length,
            sessions: activeSessions,
            totalPollsExecuted: activeSessions.reduce((sum, s) => sum + s.pollCount, 0),
            isHealthy: activeSessions.every(s => s.consecutiveErrors < this.pollConfig.maxConsecutiveErrors)
        };
    }

    /**
     * Check if a specific polling session is active
     * @param {string} pollId - Polling session ID
     * @returns {boolean} True if polling is active
     */
    isPolling(pollId) {
        const pollState = this.activePolls.get(pollId);
        return pollState && pollState.isActive;
    }

    /**
     * Get polling statistics for a specific session
     * @param {string} pollId - Polling session ID
     * @returns {Object|null} Polling statistics or null if not found
     */
    getSessionStats(pollId) {
        const pollState = this.activePolls.get(pollId);
        if (!pollState) {
            return null;
        }

        return {
            id: pollState.id,
            isActive: pollState.isActive,
            interval: pollState.interval,
            currentInterval: pollState.currentInterval,
            pollCount: pollState.pollCount,
            successCount: pollState.successCount,
            errorCount: pollState.errorCount,
            consecutiveErrors: pollState.consecutiveErrors,
            successRate: pollState.pollCount > 0 ? (pollState.successCount / pollState.pollCount * 100).toFixed(1) : 0,
            uptime: Date.now() - pollState.startTime,
            lastPollTime: pollState.lastPollTime
        };
    }
}

// Export singleton instance
export const pollingService = new PollingService();