// lib/mockKinesisService.js
import { v4 as uuidv4 } from 'uuid';

const generateMockMessage = (shardId) => {
    const eventTypes = ['click', 'view', 'purchase', 'signup'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return {
        ApproximateArrivalTimestamp: new Date().getTime(),
        Data: Buffer.from(JSON.stringify({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            eventType: eventType,
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            data: {
                page: `/page_${Math.floor(Math.random() * 10)}`,
                duration: Math.floor(Math.random() * 300)
            }
        })).toString('base64'),
        PartitionKey: `partition_${Math.floor(Math.random() * 10)}`,
        SequenceNumber: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        ShardId: shardId
    };
};

const mockShards = [
    { ShardId: 'shardId-000000000000' },
    { ShardId: 'shardId-000000000001' },
    { ShardId: 'shardId-000000000002' },
];

export const mockFetchKinesisData = async ({
                                               accessKeyId,
                                               secretAccessKey,
                                               region,
                                               streamName,
                                               messageLimit = 20,
                                               shardIteratorType = 'TRIM_HORIZON',
                                               shardId
                                           }) => {
    console.log('Mock fetching Kinesis data with settings:', {
        accessKeyId,
        secretAccessKey,
        region,
        streamName,
        messageLimit,
        shardIteratorType,
        shardId
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Select shard based on input or randomly if not provided
    const selectedShard = shardId
        ? mockShards.find(s => s.ShardId === shardId) || mockShards[0]
        : mockShards[Math.floor(Math.random() * mockShards.length)];

    // Generate mock messages
    const mockMessages = Array.from(
        { length: Math.min(messageLimit, 100) }, // Limit to 100 messages max
        () => generateMockMessage(selectedShard.ShardId)
    );

    // Simulate different shard iterator types
    let filteredMessages = [...mockMessages];
    switch (shardIteratorType) {
        case 'LATEST':
            filteredMessages = mockMessages.slice(-Math.min(5, messageLimit));
            break;
        case 'AT_SEQUENCE_NUMBER':
        case 'AFTER_SEQUENCE_NUMBER':
            const sequenceStartIndex = Math.floor(Math.random() * Math.max(mockMessages.length - messageLimit, 0));
            filteredMessages = mockMessages.slice(sequenceStartIndex, sequenceStartIndex + messageLimit);
            break;
        case 'AT_TIMESTAMP':
            // Simulate messages from a random point in time
            const timestampStartIndex = Math.floor(Math.random() * Math.max(mockMessages.length - messageLimit, 0));
            filteredMessages = mockMessages.slice(timestampStartIndex, timestampStartIndex + messageLimit);
            break;
        // 'TRIM_HORIZON' is default, return all messages up to messageLimit
    }

    return {
        records: filteredMessages,
        nextShardIterator: uuidv4(),
        MillisBehindLatest: Math.floor(Math.random() * 1000)
    };
};
