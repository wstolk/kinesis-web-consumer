# Kinesis Stream Consumer

## Overview

![Kinesis Web Consumer Overview](./media/kinesis_stream_consumer_overview.png)

Kinesis Stream Consumer is a production-ready web-based application that allows users to connect to and view messages from Amazon Kinesis streams. 
It provides a user-friendly interface for inputting AWS credentials, connecting to Kinesis streams, and displaying stream data with filtering, sorting, and real-time polling capabilities.

**Key Production Features:**
- **AWS Profile Integration**: Primary authentication using `~/.aws/config` and `~/.aws/credentials` files
- **Auto-Polling**: Configurable real-time data refresh with intelligent error handling
- **Production Optimizations**: Connection pooling, request throttling, memory management, and circuit breaker patterns
- **Docker Support**: Containerized deployment with credential mounting support
- **Enhanced Error Handling**: Retry logic, backoff strategies, and comprehensive logging

**Security Note**: While the application supports manual credential entry for development, production deployments should use AWS profiles, IAM roles, or environment variables to avoid storing credentials in browser localStorage.

## Data View & Auto-Polling

![Kinesis Web Consumer Data View](./media/kinesis_stream_consumer_data_view.png)

The main panel displays messages from the chosen Kinesis stream with both manual and automatic refresh capabilities.

### Manual Data Fetching
Click the "Connect to Kinesis" button to fetch data on-demand with configurable parameters:
- **Message Limit**: Control the number of messages retrieved (max 1,000 for performance)
- **Shard Iterator Type**: Choose between `TRIM_HORIZON` or `AT_TIMESTAMP`
- **Time Range**: Specify minutes ago when using timestamp-based iteration
- **Partition Key Filtering**: Retrieve messages from specific partitions

### Auto-Polling (Production Feature)
Enable real-time data refresh using the polling controls in the header:
- **Play/Pause Button**: Start or stop automatic data refresh
- **Interval Selection**: Configure polling frequency (5 seconds to 5 minutes)
- **Status Monitoring**: View success rates and error counts
- **Intelligent Error Handling**: Automatic backoff on consecutive failures
- **Memory Management**: Automatic message limit enforcement and duplicate removal

### Message Display
- **JSON Parsing**: Automatic parsing and formatting for JSON data
- **Raw Data Support**: Display non-JSON data as-is
- **Filtering**: Filter by Partition Key and Shard ID
- **Sorting**: Sort messages by timestamp (ascending/descending)
- **Modal View**: Click any message to view full content in a detailed modal
- **Export**: Download filtered messages as JSON

## Profile Management

The application supports multiple authentication methods with AWS profiles as the recommended approach:

### AWS Profiles (Recommended)
Use your existing AWS profile configuration from `~/.aws/config` and `~/.aws/credentials`:
- **Secure**: No credentials stored in browser localStorage
- **Convenient**: Leverages existing AWS CLI setup
- **Production-ready**: Supports IAM roles and temporary credentials

### Manual Credentials (Fallback)
For development, testing, or when AWS profiles are unavailable:
- Direct input of access keys and secrets
- Support for session tokens and custom endpoints
- Stored locally in browser for convenience

### Authentication Priority
1. **AWS Profiles** - Primary method using `~/.aws/` files
2. **Default Credential Chain** - Environment variables, IAM roles
3. **Manual Credentials** - Development/testing fallback

![Kinesis Web Consumer Profile Management](./media/kinesis_stream_consumer_profile_management.png)

## Running the Application with Docker

The preferred method to run the application is using Docker. This ensures a consistent environment and simplifies the setup process.

### Pulling the Docker Image

To pull the Docker image, run the following command:

```sh
docker pull ghcr.io/wstolk/kinesis-web-consumer:latest
```

### Running the Docker Container

To run the Docker container with AWS profile support (recommended):

```sh
# With AWS profiles (recommended for security)
docker run -d -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  --name kinesis-web-consumer \
  ghcr.io/wstolk/kinesis-web-consumer:latest

# With specific AWS profile
docker run -d -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE=my-profile \
  --name kinesis-web-consumer \
  ghcr.io/wstolk/kinesis-web-consumer:latest

# With environment variables (fallback)
docker run -d -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_DEFAULT_REGION=eu-central-1 \
  --name kinesis-web-consumer \
  ghcr.io/wstolk/kinesis-web-consumer:latest
```

This will start the application and make it available at `http://localhost:3000`.

### Stopping the Docker Container

To stop the running container, use the following command:

```sh
docker stop kinesis-web-consumer
```

### Removing the Docker Container

To remove the container, use the following command:

```sh
docker rm kinesis-web-consumer
```

### Additional Docker Commands

- **View logs**: `docker logs kinesis-web-consumer`
- **Restart the container**: `docker restart kinesis-web-consumer`

Ensure you have Docker installed on your system before running these commands. For more information on Docker, visit the [official Docker documentation](https://docs.docker.com/get-started/).

## Features

- **AWS Profile Integration**: Use existing AWS CLI profiles from `~/.aws/config` and `~/.aws/credentials`
- **Auto-Polling**: Configurable real-time data refresh with intelligent error handling
- **Production Optimizations**: Connection pooling, request throttling, memory management
- **Multiple Authentication Methods**: AWS profiles, default credential chain, or manual credentials
- **Secure by Default**: No credential storage in browser when using AWS profiles
- **Docker Support**: Full support for mounted AWS credentials and environment variables
- Connect to AWS Kinesis streams using multiple authentication methods
- Manage multiple Kinesis stream connections simultaneously within profiles
- View Kinesis stream messages in real-time with automatic refresh
- Filter messages by Partition Key and Shard ID
- Sort messages by timestamp
- View detailed message content in a modal
- Toggle between mock data and real Kinesis data in development mode
- Custom endpoint support for LocalStack and AWS-compatible services
- Real-time logging with server-sent events
- Export message data as JSON files
- Memory management with configurable message limits

## Production Deployment

### Performance Optimizations

The application includes several production-ready optimizations:

- **Message Limits**: Maximum 1,000 messages per request with 5,000 message memory cap
- **Connection Pooling**: Efficient connection reuse and duplicate request prevention
- **Request Throttling**: Minimum 1-second intervals between API calls
- **Memory Management**: Automatic cleanup and deduplication during polling
- **Error Recovery**: Circuit breaker pattern with exponential backoff
- **Request Timeouts**: 30-second timeout protection for all API calls

### Auto-Polling Configuration

Configure real-time data refresh through the header controls:

1. **Enable Polling**: Click the play button in the header after connecting to a stream
2. **Set Interval**: Choose from 5 seconds to 5 minutes polling frequency
3. **Monitor Status**: View success rates and error counts in real-time
4. **Error Handling**: Automatic backoff on consecutive failures with circuit breaker protection

### Scaling Recommendations

For high-throughput production environments:

- **Start Small**: Begin with 50-100 message limits and 30-second intervals
- **Monitor Performance**: Watch browser memory usage during extended sessions
- **Adjust Intervals**: Use longer polling intervals (1-5 minutes) for high-volume streams
- **Network Consideration**: Factor in message sizes when setting limits

### Security Best Practices

1. **AWS Profiles**: Use mounted `~/.aws` directory rather than manual credentials
2. **IAM Roles**: Leverage EC2/ECS IAM roles for cloud deployments
3. **Environment Variables**: Set AWS credentials via container environment variables
4. **Reverse Proxy**: Deploy behind nginx/Apache with HTTPS termination
5. **Access Control**: Implement authentication for multi-user environments

### Monitoring & Troubleshooting

**Built-in Monitoring:**
- Real-time logs via Server-Sent Events in the browser
- Polling statistics displayed in header (success/failure rates)
- Performance metrics tracking request durations
- Error classification (temporary vs permanent failures)

**Common Issues:**
- **High Memory**: Reduce message limits and polling frequency
- **Timeouts**: Verify AWS credentials and network connectivity  
- **Rate Limiting**: Increase polling intervals or reduce message limits
- **Profile Errors**: Check AWS profile configuration and file permissions

## Technologies Used

- Next.js
- React
- Material-UI
- AWS SDK for JavaScript

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- An AWS account with Kinesis streams set up (for production use)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/kinesis-stream-consumer.git
   cd kinesis-stream-consumer
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Development Mode

Run the following command:

```
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Mode

Build the application:

```
npm run build
```

Start the production server:

```
npm start
```

## Usage

1. Open the application in your web browser.
2. **For AWS Profiles (Recommended)**:
   - The application will automatically discover profiles from `~/.aws/config` and `~/.aws/credentials`
   - Select your desired AWS profile from the dropdown
   - Region will be auto-detected from your profile configuration
3. **For Manual Credentials**:
   - Toggle to "Use Manual Credentials" 
   - Enter your AWS credentials in the authentication popup
4. Click "Connect to Kinesis" to fetch stream data.
5. **Enable Auto-Polling** (Production Feature):
   - Click the play button in the header to start real-time data refresh
   - Configure polling interval (5s to 5m) using the interval chip
   - Monitor success rates and errors in the polling status indicator
6. View messages in the main panel, use filters and sorting as needed.
7. Click on a message to view its full content in a modal.
8. Monitor real-time logs in the bottom panel for debugging.
9. **Export Data**: Use the download button to export filtered messages as JSON.

## AWS Profile Setup

For the best experience, configure AWS profiles in your `~/.aws/` directory:

### ~/.aws/config
```ini
[default]
region = eu-central-1

[profile production]
region = us-east-1

[profile development]
region = eu-west-1

[profile localstack]
region = us-east-1
```

### ~/.aws/credentials
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

[production]
aws_access_key_id = PROD_ACCESS_KEY
aws_secret_access_key = PROD_SECRET_KEY

[development]
aws_access_key_id = DEV_ACCESS_KEY
aws_secret_access_key = DEV_SECRET_KEY

[localstack]
aws_access_key_id = test
aws_secret_access_key = test
```

## Development Features

- Cached form entries for quick testing and development.

## Security Considerations

- **AWS Profiles**: Recommended for production use - no credentials stored in browser
- **Manual Credentials**: Development/testing only - stored in browser localStorage
- **Docker Security**: Use mounted credentials (`-v ~/.aws:/root/.aws:ro`) for secure container deployment
- **IAM Roles**: Fully supported for EC2/ECS deployments via default credential chain
- Do not commit any real AWS credentials to the repository
- Use least-privilege IAM policies for Kinesis access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
