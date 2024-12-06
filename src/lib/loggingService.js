// lib/loggingService.js
import {EventEmitter} from 'events';

// Declare global instance
let globalLoggingService;

class LoggingService extends EventEmitter {
    loggers = new Set();

    addLogger(res) {
        console.log('Adding new logger', this.loggers.size);
        this.loggers.add(res);

        // Send a test log immediately to verify connection
        this.log('info', 'Logger connected');

        return () => {
            console.log('Removing logger');
            this.loggers.delete(res);
        };
    }

    log(level, message) {
        console.log(`Logging: [${level}] ${message}`, 'Active loggers:', this.loggers.size);
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };

        this.loggers.forEach(res => {
            try {
                res.write(`data: ${JSON.stringify(logEntry)}\n\n`);
                if (res.flush) {
                    res.flush();
                }
            } catch (error) {
                console.error('Error writing to logger:', error);
                this.loggers.delete(res);
            }
        });
    }
}

// Create or get the global instance
if (process.env.NODE_ENV === 'development') {
    if (!global.loggingService) {
        console.log('Creating new global logging service instance');
        global.loggingService = new LoggingService();
    }
    globalLoggingService = global.loggingService;
} else {
    globalLoggingService = new LoggingService();
}

export const loggingService = globalLoggingService;