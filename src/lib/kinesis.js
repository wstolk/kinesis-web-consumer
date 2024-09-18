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

export const getShardIterator = async (client, streamName, shardId) => {
    const command = new GetShardIteratorCommand({
        StreamName: streamName,
        ShardId: shardId,
        ShardIteratorType: 'TRIM_HORIZON',
    });

    const response = await client.send(command);
    return response.ShardIterator;
};

export const getRecords = async (client, shardIterator) => {
    const command = new GetRecordsCommand({
        ShardIterator: shardIterator,
        Limit: 100,
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
};

export const describeStream = async (client, streamName) => {
    const command = new DescribeStreamCommand({
        StreamName: streamName,
    });

    const response = await client.send(command);
    return response.StreamDescription.Shards[0].ShardId;
};
