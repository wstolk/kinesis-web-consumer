// lib/loggingService.js

// Declare global instance
let globalLoggingService;

const MAX_LOGGERS = 50;

class LoggingService {
    loggers = new Set();

    addLogger(res) {
        // Prevent unbounded growth of SSE connections
        if (this.loggers.size >= MAX_LOGGERS) {
            console.warn(`Max loggers (${MAX_LOGGERS}) reached, rejecting new connection`);
            return () => {};
        }

        this.loggers.add(res);

        // Send a test log immediately to verify connection
        this.log('info', 'Logger connected');

        return () => {
            this.loggers.delete(res);
        };
    }

    log(level, message) {
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
        global.loggingService = new LoggingService();
    }
    globalLoggingService = global.loggingService;
} else {
    globalLoggingService = new LoggingService();
}

export const loggingService = globalLoggingService;