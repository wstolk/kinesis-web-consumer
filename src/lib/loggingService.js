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
        // Sanitize log message to prevent log injection
        const validLevels = ['debug', 'info', 'warn', 'error'];
        const sanitizedLevel = validLevels.includes(level) ? level : 'info';
        const sanitizedMessage = typeof message === 'string'
            ? message.replace(/[\r\n]/g, ' ').slice(0, 2000)
            : String(message).replace(/[\r\n]/g, ' ').slice(0, 2000);

        const logEntry = {
            timestamp: new Date().toISOString(),
            level: sanitizedLevel,
            message: sanitizedMessage
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