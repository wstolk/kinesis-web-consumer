// pages/api/kinesis-poll.js
import { createKinesisClient, createPollingSession, pollShardRecords, destroyPollingSession } from '@/lib/kinesis';
import { loggingService } from '@/lib/loggingService';
import { MAX_MESSAGES_LIMIT, AWS_REGIONS } from '@/lib/constants';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { action } = req.body;

        if (action === 'start') {
            return handleStart(req, res);
        } else if (action === 'poll') {
            return handlePoll(req, res);
        } else if (action === 'stop') {
            return handleStop(req, res);
        } else {
            return res.status(400).json({ error: 'Invalid action. Use "start", "poll", or "stop".' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

async function handleStart(req, res) {
    const {
        sessionId,
        accessKeyId,
        secretAccessKey,
        sessionToken,
        region,
        streamName,
        useDefaultCredentials,
        awsProfile,
        endpoint,
    } = req.body;

    if (!sessionId || !streamName) {
        return res.status(400).json({ error: 'sessionId and streamName are required' });
    }
    if (!region || !AWS_REGIONS.includes(region)) {
        return res.status(400).json({ error: 'Invalid or missing region' });
    }
    if (streamName.length > 128 || !/^[a-zA-Z0-9_.\-]+$/.test(streamName)) {
        return res.status(400).json({ error: 'Invalid stream name format.' });
    }
    if (awsProfile && (typeof awsProfile !== 'string' || !/^[a-zA-Z0-9_\-./]+$/.test(awsProfile))) {
        return res.status(400).json({ error: 'Invalid AWS profile name.' });
    }

    try {
        const client = createKinesisClient(
            accessKeyId, secretAccessKey, sessionToken,
            region, useDefaultCredentials, awsProfile, endpoint
        );
        createPollingSession(sessionId, client, streamName);
        loggingService.log('info', `Polling session started for stream ${streamName}`);
        res.status(200).json({ started: true, sessionId });
    } catch (error) {
        loggingService.log('error', `Failed to start polling session: ${error.message}`);
        res.status(500).json({ error: 'Failed to start polling session.' });
    }
}

async function handlePoll(req, res) {
    const { sessionId, messageLimit = 100, partitionKey } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    const sanitizedLimit = Math.max(1, Math.min(Number(messageLimit) || 100, MAX_MESSAGES_LIMIT));

    try {
        const data = await pollShardRecords(sessionId, sanitizedLimit, partitionKey || null);
        res.status(200).json(data);
    } catch (error) {
        loggingService.log('error', `Poll failed: ${error.message}`);
        const safeErrorMessages = {
            'ResourceNotFoundException': 'Stream not found.',
            'AccessDeniedException': 'Access denied.',
            'ExpiredTokenException': 'Session expired. Please re-authenticate.',
        };
        const safeMessage = safeErrorMessages[error.name] || error.message || 'Poll failed.';
        res.status(500).json({ error: safeMessage });
    }
}

async function handleStop(req, res) {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }
    destroyPollingSession(sessionId);
    loggingService.log('info', `Polling session ${sessionId} stopped`);
    res.status(200).json({ stopped: true });
}
