// pages/api/kinesis.js
import {createKinesisClient, describeStream, getShardIterator, getRecords} from '../../lib/kinesis';
import {mockFetchKinesisData} from '../../lib/mockKinesisService';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {
            accessKeyId,
            secretAccessKey,
            region,
            streamName,
            messageLimit = 20,
            shardIteratorType = 'TRIM_HORIZON',
            shardId,
            minutesAgo,
            useRealKinesis
        } = req.body;

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
                    shardId
                });
            } else {
                // Use real Kinesis
                const client = createKinesisClient(accessKeyId, secretAccessKey, region);
                let shardToUse;
                if (shardId) {
                    shardToUse = shardId;
                } else {
                    const streamInfo = await describeStream(client, streamName);
                    shardToUse = streamInfo;
                }
                const shardIterator = await getShardIterator(client, streamName, shardToUse, shardIteratorType, minutesAgo);
                data = await getRecords(client, shardIterator, messageLimit);
            }

            res.status(200).json(data);
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({error: error.message});
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
