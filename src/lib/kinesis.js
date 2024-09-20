// lib/kinesis.js
import {
    KinesisClient,
    DescribeStreamCommand,
    GetRecordsCommand,
    GetShardIteratorCommand,
    ProvisionedThroughputExceededException
} from "@aws-sdk/client-kinesis";

const RETRY_DELAY_MS = 2000; // 2 seconds delay for retry
const MAX_RETRIES = 3; // Maximum number of retries

export const createKinesisClient = (accessKeyId, secretAccessKey,sessionToken, region) => {
    return new KinesisClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken
        },
    });
};

const retryableOperation = async (operation, retries = 0) => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof ProvisionedThroughputExceededException && retries < MAX_RETRIES) {
            console.log(`ProvisionedThroughputExceededException encountered. Retrying in ${RETRY_DELAY_MS}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return retryableOperation(operation, retries + 1);
        }
        throw error;
    }
};

export const getShardIterator = async (client, streamName, shardId, shardIteratorType, minutesAgo) => {
    return retryableOperation(async () => {
        let timestamp = null;
        if (shardIteratorType === "AT_TIMESTAMP") {
            timestamp = new Date(new Date() - 1000 * 60 * minutesAgo);
        }

        const command = new GetShardIteratorCommand({
            StreamName: streamName,
            ShardId: shardId,
            ShardIteratorType: shardIteratorType,
            Timestamp: timestamp,
        });

        const response = await client.send(command);
        return response.ShardIterator;
    });
};

export const getRecords = async (client, shardIterator, messageLimit) => {
    return retryableOperation(async () => {
        const command = new GetRecordsCommand({
            ShardIterator: shardIterator,
            Limit: messageLimit,
        });

        const response = await client.send(command);
        // Parse record Data from base64 to string
        let records = response.Records.map(record => {
            record.Data = JSON.parse(Buffer.from(record.Data).toString('utf8'));
            return record;
        });

        return {
            records: records,
            nextShardIterator: response.NextShardIterator,
        };
    });
};

export const describeStream = async (client, streamName) => {
    return retryableOperation(async () => {
        const command = new DescribeStreamCommand({
            StreamName: streamName,
        });

        const response = await client.send(command);
        return response.StreamDescription;
    });
};

export const getAllShardRecords = async (client, streamName, shardIteratorType, messageLimit, minutesAgo, partitionKey) => {
    const streamDescription = await describeStream(client, streamName);
    const shards = streamDescription.Shards;

    let allRecords = [];
    let totalRecords = 0;

    for (const shard of shards) {
        console.log(`Getting records for shard ${shard.ShardId}`);
        let shardIterator = await getShardIterator(client, streamName, shard.ShardId, shardIteratorType, minutesAgo);
        let keepReading = true;

        while (keepReading && totalRecords < messageLimit) {
            const {
                records,
                nextShardIterator
            } = await getRecords(client, shardIterator, messageLimit - totalRecords);

            let filteredRecords = records;
            if (partitionKey) {
                filteredRecords = records.filter(record => record.PartitionKey === partitionKey);
            }

            console.log(filteredRecords);

            const processedRecords = filteredRecords.map(record => ({
                ...record,
                ShardId: shard.ShardId,
            }));

            allRecords = allRecords.concat(processedRecords);
            totalRecords += filteredRecords.length;

            if (!nextShardIterator || records.length === 0 || totalRecords >= messageLimit) {
                keepReading = false;
            } else {
                shardIterator = nextShardIterator;
            }
        }

        if (totalRecords >= messageLimit) {
            break;
        }
    }

    return {
        records: allRecords,
        millisBehindLatest: Math.max(...allRecords.map(r => r.MillisBehindLatest || 0)),
    };
};
