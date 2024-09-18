// lib/kinesis.js
import {
    KinesisClient,
    DescribeStreamCommand,
    GetRecordsCommand,
    GetShardIteratorCommand
} from "@aws-sdk/client-kinesis";

export const createKinesisClient = (accessKeyId, secretAccessKey, region) => {
    return new KinesisClient({
        region,
        credentials: {
            accessKeyId,
            secretAccessKey,
        },
    });
};

export const getShardIterator = async (client, streamName, shardId, shardIteratorType, minutesAgo) => {
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
};

export const getRecords = async (client, shardIterator, messageLimit) => {
    const command = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: messageLimit,
    });

    const response = await client.send(command);
    console.log(response)
    // Parse record Data from base64 to string
    let records = response.Records.map(record => {
        record.Data = JSON.parse(Buffer.from(record.Data).toString('utf8'));
        return record;
    });

    return {
        records: records,
        nextShardIterator: response.NextShardIterator,
    };
};

export const describeStream = async (client, streamName) => {
    const command = new DescribeStreamCommand({
        StreamName: streamName,
    });

    const response = await client.send(command);
    return response.StreamDescription.Shards[0].ShardId;
};
