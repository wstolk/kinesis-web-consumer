// lib/kinesis.js
import {
    KinesisClient,
    DescribeStreamCommand,
    GetRecordsCommand,
    GetShardIteratorCommand,
    ProvisionedThroughputExceededException,
    ExpiredIteratorException
} from "@aws-sdk/client-kinesis";
import { fromIni } from '@aws-sdk/credential-providers';
import {loggingService} from './loggingService';

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const EMPTY_RESPONSE_RETRY_DELAY = 1000;
const MAX_EMPTY_RETRIES = 3;

/**
 * Creates a Kinesis client with the specified authentication method
 * @param {string} accessKeyId - AWS access key ID (for manual credentials)
 * @param {string} secretAccessKey - AWS secret access key (for manual credentials)
 * @param {string} sessionToken - AWS session token (optional, for manual credentials)
 * @param {string} region - AWS region
 * @param {boolean} useDefaultCredentials - Whether to use AWS default credential chain
 * @param {string} awsProfile - AWS profile name (when using profiles)
 * @returns {KinesisClient} Configured Kinesis client
 */
export const createKinesisClient = (accessKeyId, secretAccessKey, sessionToken, region, useDefaultCredentials = false, awsProfile = null) => {
    const clientConfig = { region };

    if (useDefaultCredentials) {
        if (awsProfile && awsProfile !== 'default') {
            // Use specific AWS profile
            clientConfig.credentials = fromIni({ profile: awsProfile });
            loggingService.log('info', `Creating Kinesis client for region ${region} using AWS profile: ${awsProfile}`);
        } else {
            // Use AWS SDK default credential chain
            // This will check: environment variables, IAM roles, ~/.aws/credentials, etc.
            loggingService.log('info', `Creating Kinesis client for region ${region} using default credential chain`);
        }
    } else {
        // Use manually provided credentials
        const resolvedSessionToken = (!sessionToken || sessionToken === '') ? null : sessionToken;
        clientConfig.credentials = {
            accessKeyId,
            secretAccessKey,
            sessionToken: resolvedSessionToken
        };
        loggingService.log('info', `Creating Kinesis client for region ${region} using manual credentials`);
    }

    return new KinesisClient(clientConfig);
};

const retryableOperation = async (operation, retries = 0) => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof ProvisionedThroughputExceededException && retries < MAX_RETRIES) {
            loggingService.log('warn', `ProvisionedThroughputExceededException encountered. Retry ${retries + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            return retryableOperation(operation, retries + 1);
        }
        if (error instanceof ExpiredIteratorException) {
            loggingService.log('warn', 'Iterator expired, requesting new iterator...');
            throw error;
        }
        loggingService.log('error', `Kinesis operation failed: ${error.message}`);
        throw error;
    }
};

export const getShardIterator = async (client, streamName, shardId, shardIteratorType, minutesAgo) => {
    loggingService.log('info', `Getting shard iterator for stream: ${streamName}, shard: ${shardId}, type: ${shardIteratorType}`);
    return retryableOperation(async () => {
        let timestamp = null;
        if (shardIteratorType === "AT_TIMESTAMP") {
            timestamp = new Date(Date.now() - (minutesAgo * 60 * 1000));
            loggingService.log('info', `Using timestamp: ${timestamp.toISOString()} (${minutesAgo} minutes ago)`);
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

export const getRecords = async (client, shardIterator, messageLimit, emptyRetries = 0) => {
    try {
        const result = await retryableOperation(async () => {
            const command = new GetRecordsCommand({
                ShardIterator: shardIterator,
                Limit: messageLimit,
            });

            const response = await client.send(command);
            let records = [];

            response.Records.forEach(record => {
                try {
                    record.Data = JSON.parse(Buffer.from(record.Data).toString('utf8'));
                    records.push(record);
                } catch (e) {
                    loggingService.log('warn', `Error parsing record data: ${e.message}`);
                    record.Data = Buffer.from(record.Data).toString('utf8');
                    records.push(record);
                }
            });

            return {
                records,
                nextShardIterator: response.NextShardIterator,
                millisBehindLatest: response.MillisBehindLatest
            };
        });

        if (result.records.length === 0 &&
            result.millisBehindLatest > 0 &&
            emptyRetries < MAX_EMPTY_RETRIES) {
            loggingService.log('info', `No records received but ${result.millisBehindLatest}ms behind. Retry ${emptyRetries + 1}/${MAX_EMPTY_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, EMPTY_RESPONSE_RETRY_DELAY));
            return getRecords(client, result.nextShardIterator, messageLimit, emptyRetries + 1);
        }

        return result;
    } catch (error) {
        if (error instanceof ExpiredIteratorException) {
            loggingService.log('warn', 'Iterator expired during getRecords, retrying with new iterator');
            throw error;
        }
        throw error;
    }
};

export const describeStream = async (client, streamName) => {
    loggingService.log('info', `Describing stream: ${streamName}`);

    let allShards = [];
    let exclusiveStartShardId = undefined;
    let streamDescription = null;

    do {
        const result = await retryableOperation(async () => {
            const command = new DescribeStreamCommand({
                StreamName: streamName,
                ...(exclusiveStartShardId && { ExclusiveStartShardId: exclusiveStartShardId }),
            });
            return client.send(command);
        });

        streamDescription = result.StreamDescription;
        allShards = allShards.concat(streamDescription.Shards);

        if (streamDescription.HasMoreShards) {
            exclusiveStartShardId = streamDescription.Shards[streamDescription.Shards.length - 1].ShardId;
        } else {
            exclusiveStartShardId = undefined;
        }
    } while (exclusiveStartShardId);

    loggingService.log('info', `Stream ${streamName} has ${allShards.length} shards`);
    return { ...streamDescription, Shards: allShards };
};

/**
 * Fetches records from all shards of a Kinesis stream
 * @param {KinesisClient} client - Configured Kinesis client
 * @param {string} streamName - Name of the Kinesis stream
 * @param {string} shardIteratorType - Type of shard iterator (TRIM_HORIZON, LATEST, etc.)
 * @param {number} messageLimit - Maximum number of messages to fetch
 * @param {number} minutesAgo - Minutes ago for AT_TIMESTAMP iterator type
 * @param {string} partitionKey - Optional partition key filter
 * @returns {Promise<Object>} Object containing records and metadata
 */
export const getAllShardRecords = async (client, streamName, shardIteratorType, messageLimit, minutesAgo, partitionKey) => {
    const streamDescription = await describeStream(client, streamName);
    const shards = streamDescription.Shards;

    let allRecords = [];
    let totalRecords = 0;

    if (partitionKey === '') {
        partitionKey = null;
    }

    loggingService.log('info', `Starting to fetch records from ${shards.length} shard(s) with ${messageLimit} message limit`);
    if (partitionKey) {
        loggingService.log('info', `Filtering for partition key: ${partitionKey}`);
    }

    for (const shard of shards) {
        loggingService.log('info', `Processing shard ${shard.ShardId}`);
        let shardIterator = await getShardIterator(client, streamName, shard.ShardId, shardIteratorType, minutesAgo);
        let keepReading = true;
        let retryCount = 0;

        while (keepReading && totalRecords < messageLimit && retryCount < MAX_RETRIES) {
            try {
                const {
                    records,
                    nextShardIterator,
                    millisBehindLatest
                } = await getRecords(client, shardIterator, messageLimit - totalRecords);

                loggingService.log('info', `Received ${records.length} records from shard ${shard.ShardId}, ${millisBehindLatest}ms behind latest`);

                let filteredRecords = records;
                if (partitionKey) {
                    filteredRecords = records.filter(record => record.PartitionKey === partitionKey);
                    loggingService.log('info', `Filtered to ${filteredRecords.length} records for partition key ${partitionKey}`);
                }

                const processedRecords = filteredRecords.map(record => ({
                    ...record,
                    ShardId: shard.ShardId,
                }));

                allRecords = allRecords.concat(processedRecords);
                totalRecords += filteredRecords.length;

                if (!nextShardIterator ||
                    (records.length === 0 && millisBehindLatest === 0) ||
                    totalRecords >= messageLimit) {
                    keepReading = false;
                    loggingService.log('info', `Finished reading from shard ${shard.ShardId}`);
                } else {
                    shardIterator = nextShardIterator;
                }
            } catch (error) {
                if (error instanceof ExpiredIteratorException) {
                    if (retryCount < MAX_RETRIES) {
                        loggingService.log('warn', `Getting new iterator for shard ${shard.ShardId} after expiration. Retry ${retryCount + 1}/${MAX_RETRIES}`);
                        shardIterator = await getShardIterator(client, streamName, shard.ShardId, shardIteratorType, minutesAgo);
                        retryCount++;
                    } else {
                        loggingService.log('error', `Max retries (${MAX_RETRIES}) reached for expired iterator on shard ${shard.ShardId}`);
                        keepReading = false;
                    }
                } else {
                    loggingService.log('error', `Error processing shard ${shard.ShardId}: ${error.message}`);
                    throw error;
                }
            }
        }

        if (totalRecords >= messageLimit) {
            loggingService.log('info', `Message limit (${messageLimit}) reached, stopping fetch`);
            break;
        }
    }

    loggingService.log('info', `Completed fetching ${totalRecords} total records from Kinesis stream ${streamName}`);
    const millisValues = allRecords.map(r => r.MillisBehindLatest || 0);
    return {
        records: allRecords,
        millisBehindLatest: millisValues.length > 0 ? Math.max(...millisValues) : 0,
    };
};