// pages/api/kinesis.js
import {createKinesisClient, getAllShardRecords} from '@/lib/kinesis';
import {mockFetchKinesisData} from '@/lib/mockKinesisService';
import {loggingService} from "@/lib/loggingService";

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
            useRealKinesis
        } = req.body;

        const redactedRequestBody = {...req.body, accessKeyId: 'REDACTED', secretAccessKey: 'REDACTED'};
        console.log('Request body:', redactedRequestBody);
        loggingService.log('info', `Fetching Kinesis data for stream ${streamName}`);
        loggingService.log('info', `Request body: ${JSON.stringify(redactedRequestBody)}`);

        try {
            let data;
            if (!useRealKinesis) {
                // Use mock data
                data = await mockFetchKinesisData({
                    accessKeyId,
                    secretAccessKey,
                    region,
                    streamName,
                    messageLimit,
                    shardIteratorType,
                    partitionKey
                });
            } else {
                // Use real Kinesis
                const client = createKinesisClient(accessKeyId, secretAccessKey, sessionToken, region);
                data = await getAllShardRecords(client, streamName, shardIteratorType, messageLimit, minutesAgo, partitionKey);
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Error:', error);
            loggingService.log('error', `Failed to fetch Kinesis data: ${error.message}`);
            res.status(500).json({error: error.message});
        }
    } else {
        // Only allow POST requests
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
