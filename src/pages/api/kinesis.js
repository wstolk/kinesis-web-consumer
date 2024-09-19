// pages/api/kinesis.js
import {createKinesisClient, describeStream, getShardIterator, getRecords, getAllShardRecords} from '../../lib/kinesis';
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
            partitionKey,
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
                    partitionKey
                });
            } else {
                // Use real Kinesis
                const client = createKinesisClient(accessKeyId, secretAccessKey, region);
                data = await getAllShardRecords(client, streamName, shardIteratorType, messageLimit, minutesAgo, partitionKey);
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
