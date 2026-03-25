// pages/api/logs.js
import {loggingService} from '../../lib/loggingService';

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        // Disable response buffering
        res.flushHeaders();

        // Add this response object as a logger
        const removeLogger = loggingService.addLogger(res);

        // Keep connection alive with heartbeat
        let cleanedUp = false;
        const heartbeat = setInterval(() => {
            try {
                res.write(':heartbeat\n\n');
            } catch (error) {
                console.error('Heartbeat error:', error);
                cleanup();
            }
        }, 30000);

        const cleanup = () => {
            if (cleanedUp) return;
            cleanedUp = true;
            clearInterval(heartbeat);
            removeLogger();
            try {
                res.end();
            } catch (error) {
                console.error('Error ending response:', error);
            }
        };

        // Clean up on close
        req.on('close', cleanup);
        res.on('error', cleanup);
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}