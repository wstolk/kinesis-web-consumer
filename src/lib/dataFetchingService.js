// lib/dataFetchingService.js
import { loggingService } from './loggingService';
import { performanceMonitor } from './performanceMonitor';

/**
 * Production-ready data fetching service with connection pooling, 
 * request throttling, error recovery, and performance monitoring for Kinesis data
 */
class DataFetchingService {
    constructor() {
        this.activeRequests = new Map(); // Track active request promises to prevent duplicates
        this.activeAbortControllers = new Map(); // Track AbortControllers for cancellation
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // Minimum 1 second between requests
        this.maxConcurrentRequests = 3;
        this.requestTimeout = 30000; // 30 second timeout
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffFactor: 2
        };
    }

    /**
     * Fetch Kinesis data with production optimizations
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} Kinesis data response
     */
    async fetchKinesisData(params) {
        const requestKey = this.generateRequestKey(params);
        
        // Check if identical request is already in progress
        if (this.activeRequests.has(requestKey)) {
            loggingService.log('info', `Request already in progress for ${requestKey}, returning existing promise`);
            return this.activeRequests.get(requestKey);
        }

        // Create abortable request
        const abortController = new AbortController();
        const requestPromise = this.executeRequest(params, abortController);

        // Track active request and its abort controller
        this.activeRequests.set(requestKey, requestPromise);
        this.activeAbortControllers.set(requestKey, abortController);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            // Clean up tracking
            this.activeRequests.delete(requestKey);
            this.activeAbortControllers.delete(requestKey);
        }
    }

    /**
     * Execute the actual request with retries and error handling
     * @param {Object} params - Request parameters
     * @param {AbortController} abortController - Request abort controller
     * @returns {Promise<Object>} Response data
     */
    async executeRequest(params, abortController) {
        const { retryConfig } = this;
        const startTime = Date.now();
        let lastError;

        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            // Per-attempt abort controller linked to parent, declared outside try for cleanup
            let attemptController;
            let onParentAbort;
            let timeoutId;

            try {
                // Throttle requests
                await this.throttleRequest();

                // Check if the request was cancelled before starting
                if (abortController.signal.aborted) {
                    throw new DOMException('Request was cancelled', 'AbortError');
                }

                // Create a per-attempt AbortController that is linked to the parent
                attemptController = new AbortController();
                onParentAbort = () => attemptController.abort();
                abortController.signal.addEventListener('abort', onParentAbort, { once: true });

                // Execute request with timeout
                timeoutId = setTimeout(() => {
                    attemptController.abort();
                }, this.requestTimeout);

                loggingService.log('info', `Executing Kinesis request (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`);

                const response = await fetch('/api/kinesis', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(params),
                    signal: attemptController.signal
                });

                clearTimeout(timeoutId);
                abortController.signal.removeEventListener('abort', onParentAbort);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP ${response.status}: ${errorData.error || 'Unknown error'}`);
                }

                const data = await response.json();
                const duration = Date.now() - startTime;

                // Record successful request metrics
                performanceMonitor.recordRequest('kinesis', duration, true, {
                    recordCount: data.records?.length || 0,
                    streamName: params.streamName,
                    attempt: attempt + 1
                });

                loggingService.log('info', `Successfully fetched ${data.records?.length || 0} records in ${duration}ms`);
                return data;

            } catch (error) {
                lastError = error;
                if (timeoutId) clearTimeout(timeoutId);
                if (onParentAbort) abortController.signal.removeEventListener('abort', onParentAbort);

                // Don't retry on abort or certain errors
                if (error.name === 'AbortError') {
                    const duration = Date.now() - startTime;
                    performanceMonitor.recordRequest('kinesis', duration, false, {
                        error: 'Request cancelled',
                        attempt: attempt + 1
                    });
                    throw new Error('Request was cancelled');
                }

                if (this.isPermanentError(error)) {
                    const duration = Date.now() - startTime;
                    performanceMonitor.recordRequest('kinesis', duration, false, {
                        error: error.message,
                        permanent: true,
                        attempt: attempt + 1
                    });
                    throw error;
                }

                // Calculate delay for next retry
                if (attempt < retryConfig.maxRetries) {
                    const delay = Math.min(
                        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
                        retryConfig.maxDelay
                    );
                    
                    // Add jitter to prevent thundering herd
                    const jitteredDelay = delay + (Math.random() * 1000);
                    
                    loggingService.log('warn', `Request failed, retrying in ${Math.round(jitteredDelay)}ms: ${error.message}`);
                    await this.delay(jitteredDelay);
                } else {
                    const duration = Date.now() - startTime;
                    performanceMonitor.recordRequest('kinesis', duration, false, {
                        error: error.message,
                        finalAttempt: true,
                        totalAttempts: attempt + 1
                    });
                    loggingService.log('error', `All retry attempts exhausted: ${error.message}`);
                }
            }
        }

        throw lastError;
    }

    /**
     * Throttle requests to prevent overwhelming the API
     */
    async throttleRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            loggingService.log('debug', `Throttling request, waiting ${waitTime}ms`);
            await this.delay(waitTime);
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Check if error is permanent and shouldn't be retried
     * @param {Error} error - Error to check
     * @returns {boolean} True if error is permanent
     */
    isPermanentError(error) {
        const permanentErrors = [
            'InvalidClientTokenId',
            'SignatureDoesNotMatch',
            'AccessDeniedException',
            'UnauthorizedOperation',
            'InvalidParameter',
            'ValidationException'
        ];

        return permanentErrors.some(errorType => 
            error.message.includes(errorType) || error.code === errorType
        );
    }

    /**
     * Generate unique key for request tracking
     * @param {Object} params - Request parameters
     * @returns {string} Unique request key
     */
    generateRequestKey(params) {
        const { streamName, messageLimit, shardIteratorType, partitionKey } = params;
        return `${streamName}-${messageLimit}-${shardIteratorType}-${partitionKey || 'all'}`;
    }

    /**
     * Promise-based delay utility
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Cancel all active requests
     */
    cancelAllRequests() {
        loggingService.log('info', `Cancelling ${this.activeRequests.size} active requests`);
        this.activeAbortControllers.forEach((controller, key) => {
            try {
                controller.abort();
            } catch (error) {
                loggingService.log('warn', `Error aborting request ${key}: ${error.message}`);
            }
        });
        this.activeAbortControllers.clear();
        this.activeRequests.clear();
    }

    /**
     * Start a server-side polling session
     * @param {string} sessionId - Unique session identifier
     * @param {Object} params - Connection parameters (credentials, region, stream, endpoint)
     * @returns {Promise<Object>} Start confirmation
     */
    async startPollingSession(sessionId, params) {
        const response = await fetch('/api/kinesis-poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'start', sessionId, ...params }),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to start polling session');
        }
        return response.json();
    }

    /**
     * Poll for new records from a server-side polling session
     * @param {string} sessionId - Polling session ID
     * @param {number} messageLimit - Max records per poll
     * @param {string} partitionKey - Optional partition key filter
     * @returns {Promise<Object>} Records from poll
     */
    async pollRecords(sessionId, messageLimit, partitionKey) {
        const response = await fetch('/api/kinesis-poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll', sessionId, messageLimit, partitionKey }),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Poll failed');
        }
        return response.json();
    }

    /**
     * Stop a server-side polling session
     * @param {string} sessionId - Polling session ID
     */
    async stopPollingSession(sessionId) {
        try {
            await fetch('/api/kinesis-poll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop', sessionId }),
            });
        } catch (e) {
            // Best effort cleanup
            loggingService.log('warn', `Failed to stop polling session: ${e.message}`);
        }
    }

    /**
     * Get service status for monitoring
     * @returns {Object} Service status
     */
    getStatus() {
        return {
            activeRequests: this.activeRequests.size,
            lastRequestTime: this.lastRequestTime,
            isHealthy: this.activeRequests.size < this.maxConcurrentRequests
        };
    }
}

// Export singleton instance
export const dataFetchingService = new DataFetchingService();