// lib/performanceMonitor.js
import { loggingService } from './loggingService';

/**
 * Performance monitoring service for tracking application metrics
 * Provides optional telemetry hooks for production monitoring
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                totalDuration: 0,
                averageDuration: 0
            },
            polling: {
                activeSessions: 0,
                totalPolls: 0,
                successfulPolls: 0,
                failedPolls: 0
            },
            memory: {
                messagesInMemory: 0,
                peakMessagesInMemory: 0,
                lastCleanup: null
            },
            performance: {
                pageLoadTime: 0,
                lastRequestDuration: 0,
                slowestRequestDuration: 0
            }
        };
        
        this.telemetryHooks = [];
        this.isEnabled = true;
        this.reportingInterval = 60000; // 1 minute
        this.reportingTimer = null;
        
        // Start performance monitoring
        this.initializeMonitoring();
    }

    /**
     * Initialize performance monitoring
     */
    initializeMonitoring() {
        // Measure page load time
        if (typeof window !== 'undefined' && window.performance) {
            window.addEventListener('load', () => {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                this.metrics.performance.pageLoadTime = loadTime;
                this.log('info', `Page loaded in ${loadTime}ms`);
            });
        }

        // Start periodic reporting
        this.startPeriodicReporting();
    }

    /**
     * Record request metrics
     * @param {string} type - Request type (kinesis, auth, etc.)
     * @param {number} duration - Request duration in milliseconds
     * @param {boolean} success - Whether the request was successful
     * @param {Object} metadata - Additional metadata about the request
     */
    recordRequest(type, duration, success, metadata = {}) {
        if (!this.isEnabled) return;

        this.metrics.requests.total++;
        this.metrics.requests.totalDuration += duration;
        this.metrics.requests.averageDuration = this.metrics.requests.totalDuration / this.metrics.requests.total;
        this.metrics.performance.lastRequestDuration = duration;

        if (success) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }

        // Track slowest request
        if (duration > this.metrics.performance.slowestRequestDuration) {
            this.metrics.performance.slowestRequestDuration = duration;
        }

        // Log slow requests
        if (duration > 5000) { // 5 seconds
            this.log('warn', `Slow ${type} request: ${duration}ms`);
        }

        // Send to telemetry hooks
        this.sendToTelemetry('request', {
            type,
            duration,
            success,
            timestamp: Date.now(),
            ...metadata
        });
    }

    /**
     * Record polling metrics
     * @param {string} action - polling action (start, stop, poll, error)
     * @param {Object} data - polling data
     */
    recordPolling(action, data = {}) {
        if (!this.isEnabled) return;

        switch (action) {
            case 'start':
                this.metrics.polling.activeSessions++;
                break;
            case 'stop':
                this.metrics.polling.activeSessions = Math.max(0, this.metrics.polling.activeSessions - 1);
                break;
            case 'poll':
                this.metrics.polling.totalPolls++;
                if (data.success) {
                    this.metrics.polling.successfulPolls++;
                } else {
                    this.metrics.polling.failedPolls++;
                }
                break;
        }

        this.sendToTelemetry('polling', {
            action,
            activeSessions: this.metrics.polling.activeSessions,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Record memory usage metrics
     * @param {number} messageCount - Current number of messages in memory
     * @param {boolean} wasCleanedUp - Whether cleanup occurred
     */
    recordMemoryUsage(messageCount, wasCleanedUp = false) {
        if (!this.isEnabled) return;

        this.metrics.memory.messagesInMemory = messageCount;

        // Track peak usage
        if (messageCount > this.metrics.memory.peakMessagesInMemory) {
            this.metrics.memory.peakMessagesInMemory = messageCount;
        }

        // Record cleanup events
        if (wasCleanedUp) {
            this.metrics.memory.lastCleanup = Date.now();
            this.log('info', `Memory cleanup: reduced to ${messageCount} messages`);
        }

        // Warn on high memory usage
        if (messageCount > 3000) {
            this.log('warn', `High memory usage: ${messageCount} messages in memory`);
        }

        this.sendToTelemetry('memory', {
            messageCount,
            wasCleanedUp,
            peakUsage: this.metrics.memory.peakMessagesInMemory,
            timestamp: Date.now()
        });
    }

    /**
     * Add a telemetry hook for external monitoring systems
     * @param {Function} hook - Function to call with telemetry data
     */
    addTelemetryHook(hook) {
        if (typeof hook === 'function') {
            if (this.telemetryHooks.length >= 20) {
                this.log('warn', 'Maximum telemetry hooks (20) reached, rejecting new hook');
                return;
            }
            this.telemetryHooks.push(hook);
            this.log('info', 'Added telemetry hook for external monitoring');
        }
    }

    /**
     * Remove a telemetry hook
     * @param {Function} hook - Hook function to remove
     */
    removeTelemetryHook(hook) {
        const index = this.telemetryHooks.indexOf(hook);
        if (index > -1) {
            this.telemetryHooks.splice(index, 1);
            this.log('info', 'Removed telemetry hook');
        }
    }

    /**
     * Send data to all registered telemetry hooks
     * @param {string} type - Event type
     * @param {Object} data - Event data
     */
    sendToTelemetry(type, data) {
        if (this.telemetryHooks.length === 0) return;

        const telemetryData = {
            type,
            data,
            metrics: this.getMetricsSummary(),
            timestamp: Date.now()
        };

        this.telemetryHooks.forEach(hook => {
            try {
                hook(telemetryData);
            } catch (error) {
                this.log('error', `Telemetry hook error: ${error.message}`);
            }
        });
    }

    /**
     * Get current metrics summary
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return JSON.parse(JSON.stringify(this.metrics));
    }

    /**
     * Get condensed metrics summary for telemetry
     * @returns {Object} Metrics summary
     */
    getMetricsSummary() {
        return {
            requests: {
                total: this.metrics.requests.total,
                successRate: this.metrics.requests.total > 0 
                    ? (this.metrics.requests.successful / this.metrics.requests.total * 100).toFixed(1)
                    : 0,
                avgDuration: Math.round(this.metrics.requests.averageDuration)
            },
            polling: {
                active: this.metrics.polling.activeSessions,
                successRate: this.metrics.polling.totalPolls > 0
                    ? (this.metrics.polling.successfulPolls / this.metrics.polling.totalPolls * 100).toFixed(1)
                    : 0
            },
            memory: {
                current: this.metrics.memory.messagesInMemory,
                peak: this.metrics.memory.peakMessagesInMemory
            }
        };
    }

    /**
     * Get performance health status
     * @returns {Object} Health status
     */
    getHealthStatus() {
        const summary = this.getMetricsSummary();
        
        return {
            status: this.calculateOverallHealth(summary),
            details: {
                requests: {
                    healthy: parseFloat(summary.requests.successRate) > 90,
                    successRate: summary.requests.successRate,
                    avgDuration: summary.requests.avgDuration
                },
                polling: {
                    healthy: parseFloat(summary.polling.successRate) > 80,
                    successRate: summary.polling.successRate,
                    activeSessions: summary.polling.active
                },
                memory: {
                    healthy: summary.memory.current < 4000,
                    currentUsage: summary.memory.current,
                    peakUsage: summary.memory.peak
                }
            },
            timestamp: Date.now()
        };
    }

    /**
     * Calculate overall health status
     * @param {Object} summary - Metrics summary
     * @returns {string} Health status (healthy, warning, critical)
     */
    calculateOverallHealth(summary) {
        const requestHealth = parseFloat(summary.requests.successRate) > 90;
        const pollingHealth = parseFloat(summary.polling.successRate) > 80;
        const memoryHealth = summary.memory.current < 4000;

        if (requestHealth && pollingHealth && memoryHealth) {
            return 'healthy';
        } else if (requestHealth && (pollingHealth || memoryHealth)) {
            return 'warning';
        } else {
            return 'critical';
        }
    }

    /**
     * Start periodic reporting
     */
    startPeriodicReporting() {
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
        }

        this.reportingTimer = setInterval(() => {
            const health = this.getHealthStatus();
            this.log('info', `Performance Report - Status: ${health.status}, Requests: ${health.details.requests.successRate}% success, Memory: ${health.details.memory.currentUsage} messages`);
            
            this.sendToTelemetry('periodic_report', health);
        }, this.reportingInterval);
    }

    /**
     * Stop periodic reporting
     */
    stopPeriodicReporting() {
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
            this.reportingTimer = null;
        }
    }

    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics = {
            requests: { total: 0, successful: 0, failed: 0, totalDuration: 0, averageDuration: 0 },
            polling: { activeSessions: 0, totalPolls: 0, successfulPolls: 0, failedPolls: 0 },
            memory: { messagesInMemory: 0, peakMessagesInMemory: 0, lastCleanup: null },
            performance: { pageLoadTime: 0, lastRequestDuration: 0, slowestRequestDuration: 0 }
        };
        
        this.log('info', 'Performance metrics reset');
    }

    /**
     * Enable or disable monitoring
     * @param {boolean} enabled - Whether monitoring should be enabled
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (enabled) {
            this.startPeriodicReporting();
            this.log('info', 'Performance monitoring enabled');
        } else {
            this.stopPeriodicReporting();
            this.log('info', 'Performance monitoring disabled');
        }
    }

    /**
     * Update reporting interval
     * @param {number} interval - New interval in milliseconds
     */
    setReportingInterval(interval) {
        this.reportingInterval = interval;
        if (this.isEnabled) {
            this.startPeriodicReporting();
        }
    }

    /**
     * Log with prefix
     * @param {string} level - Log level
     * @param {string} message - Log message
     */
    log(level, message) {
        loggingService.log(level, `[PerformanceMonitor] ${message}`);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopPeriodicReporting();
        this.telemetryHooks = [];
        this.log('info', 'Performance monitor destroyed');
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();