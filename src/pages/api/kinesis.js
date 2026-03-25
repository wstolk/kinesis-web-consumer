// pages/api/kinesis.js
import {createKinesisClient, getAllShardRecords} from '@/lib/kinesis';
import {mockFetchKinesisData} from '@/lib/mockKinesisService';
import {loggingService} from "@/lib/loggingService";
import {MAX_MESSAGES_LIMIT, SHARD_ITERATOR_TYPES, AWS_REGIONS} from "@/lib/constants";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {
            accessKeyId,
            secretAccessKey,
            sessionToken,
            region,
            streamName,
            messageLimit = 20,
            shardIteratorType = 'TRIM_HORIZON',
            partitionKey,
            minutesAgo,
            useRealKinesis,
            useDefaultCredentials,
            awsProfile,
            endpoint
        } = req.body;

        // Input validation
        if (!streamName || typeof streamName !== 'string' || streamName.trim().length === 0) {
            return res.status(400).json({ error: 'streamName is required and must be a non-empty string' });
        }

        if (!region || !AWS_REGIONS.includes(region)) {
            return res.status(400).json({ error: `Invalid or missing region. Must be one of: ${AWS_REGIONS.join(', ')}` });
        }

        if (!SHARD_ITERATOR_TYPES.includes(shardIteratorType)) {
            return res.status(400).json({ error: `Invalid shardIteratorType. Must be one of: ${SHARD_ITERATOR_TYPES.join(', ')}` });
        }

        const sanitizedMessageLimit = Math.max(1, Math.min(Number(messageLimit) || 20, MAX_MESSAGES_LIMIT));

        if (shardIteratorType === 'AT_TIMESTAMP' && (minutesAgo === undefined || minutesAgo === null || Number(minutesAgo) < 0)) {
            return res.status(400).json({ error: 'minutesAgo is required and must be a non-negative number when using AT_TIMESTAMP' });
        }

        if (!useDefaultCredentials && useRealKinesis) {
            if (!accessKeyId || !secretAccessKey) {
                return res.status(400).json({ error: 'accessKeyId and secretAccessKey are required when not using default credentials' });
            }
        }

        // Validate awsProfile to prevent injection
        if (awsProfile && (typeof awsProfile !== 'string' || !/^[a-zA-Z0-9_\-./]+$/.test(awsProfile))) {
            return res.status(400).json({ error: 'Invalid AWS profile name.' });
        }

        // Validate streamName format (AWS Kinesis stream names: 1-128 chars, [a-zA-Z0-9_.-])
        if (streamName.length > 128 || !/^[a-zA-Z0-9_.\-]+$/.test(streamName)) {
            return res.status(400).json({ error: 'Invalid stream name format.' });
        }

        const redactedRequestBody = {...req.body, accessKeyId: 'REDACTED', secretAccessKey: 'REDACTED', sessionToken: 'REDACTED'};
        loggingService.log('info', `Fetching Kinesis data for stream ${streamName}`);
        loggingService.log('debug', `Request body: ${JSON.stringify(redactedRequestBody)}`);

        let client;
        try {
            let data;
            if (!useRealKinesis) {
                // Use mock data
                data = await mockFetchKinesisData({
                    accessKeyId,
                    secretAccessKey,
                    region,
                    streamName,
                    messageLimit: sanitizedMessageLimit,
                    shardIteratorType,
                    partitionKey
                });
            } else {
                // Use real Kinesis
                client = createKinesisClient(accessKeyId, secretAccessKey, sessionToken, region, useDefaultCredentials, awsProfile, endpoint);
                data = await getAllShardRecords(client, streamName, shardIteratorType, sanitizedMessageLimit, minutesAgo, partitionKey);
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Error:', error);
            loggingService.log('error', `Failed to fetch Kinesis data: ${error.message}`);

            // Return sanitized error messages - avoid leaking internal details
            const safeErrorMessages = {
                'ResourceNotFoundException': 'Stream not found. Please verify the stream name and region.',
                'AccessDeniedException': 'Access denied. Please check your AWS permissions.',
                'InvalidClientTokenId': 'Invalid credentials. Please verify your AWS access keys.',
                'SignatureDoesNotMatch': 'Invalid credentials. Please verify your AWS secret key.',
                'ExpiredTokenException': 'Session token has expired. Please re-authenticate.',
            };
            const errorName = error.name || '';
            const safeMessage = safeErrorMessages[errorName] || 'An error occurred while fetching Kinesis data.';
            res.status(500).json({error: safeMessage});
        } finally {
            if (client) {
                client.destroy();
            }
        }
    } else {
        // Only allow POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
