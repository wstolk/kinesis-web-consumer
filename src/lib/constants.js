// lib/constants.js

/**
 * Application-wide constants
 */

// UI Layout Constants
export const HEADER_HEIGHT = 64;
export const SIDEBAR_WIDTH = 300;

// AWS Regions List
export const AWS_REGIONS = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "af-south-1", "ap-east-1", "ap-south-1", "ap-northeast-1",
    "ap-northeast-2", "ap-northeast-3", "ap-southeast-1", "ap-southeast-2",
    "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-north-1", "eu-south-1", "me-south-1",
    "sa-east-1"
];

// Kinesis Configuration
export const SHARD_ITERATOR_TYPES = [
    "TRIM_HORIZON", 
    "AT_TIMESTAMP"
];

export const DEFAULT_MESSAGE_LIMIT = 50;
export const DEFAULT_MINUTES_AGO = 30;
export const DEFAULT_REGION = 'eu-central-1';

// Polling Configuration
export const POLLING_INTERVALS = [
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '30 seconds', value: 30000 },
    { label: '1 minute', value: 60000 },
    { label: '5 minutes', value: 300000 }
];

export const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds
export const MIN_POLLING_INTERVAL = 5000; // 5 seconds
export const MAX_POLLING_INTERVAL = 300000; // 5 minutes

// Production Limits
export const MAX_MESSAGES_LIMIT = 1000; // Cap for memory management
export const MAX_STORED_MESSAGES = 5000; // Max messages to keep in memory

// LocalStorage Keys
export const STORAGE_KEYS = {
    AWS_CREDENTIALS: 'awsCredentials',
    LAST_USED_PROFILE: 'lastUsedProfile',
    AWS_PROFILES: 'awsProfiles',
    AWS_STREAMS: 'awsStreams',
    KINESIS_FORM_DATA: 'kinesisFormData'
};

// API Endpoints
export const API_ENDPOINTS = {
    AUTHENTICATE: '/api/authenticate',
    KINESIS: '/api/kinesis',
    LOGS: '/api/logs',
    AWS_PROFILES: '/api/aws-profiles'
};

// Default Profile Structure
export const DEFAULT_PROFILE = {
    name: '',
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: '',
    region: DEFAULT_REGION,
    endpoint: '',
    useDefaultCredentials: true,
    awsProfile: 'default',
};