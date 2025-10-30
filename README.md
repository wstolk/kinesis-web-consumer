# Kinesis Stream Consumer

## Overview

![Kinesis Web Consumer Overview](./media/kinesis_stream_consumer_overview.png)

Kinesis Stream Consumer is a web-based application that allows users to connect to and view messages from Amazon Kinesis streams. 
It provides a user-friendly interface for inputting AWS credentials, connecting to Kinesis streams, and displaying stream data with filtering and sorting capabilities.

Please note that this application is intended for development and testing purposes.
It will not handle large amounts of data efficiently and is not optimized for production use.

**It will currently store your AWS credentials to localstorage!**

## Data View

![Kinesis Web Consumer Data View](./media/kinesis_stream_consumer_data_view.png)

The main panel displays messages from the chosen Kinesis stream. 
It will by design not automatically refresh the data, but the user can manually refresh the data by clicking the "Connect to Kinesis" button.

When a message is selected, the user can view the full message content in a modal. 
The application also supports filtering messages by Partition Key and Shard ID, as well as sorting messages by timestamp.

By default, the application will assume the message data is in JSON format and will attempt to parse it for better readability.
If the message data is not in JSON format, the application will display the raw data.

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
- **Multiple Authentication Methods**: AWS profiles, default credential chain, or manual credentials
- **Secure by Default**: No credential storage in browser when using AWS profiles
- **Docker Support**: Full support for mounted AWS credentials and environment variables
- Connect to AWS Kinesis streams using multiple authentication methods
- Manage multiple Kinesis stream connections simultaneously within profiles
- View Kinesis stream messages in real-time
- Filter messages by Partition Key and Shard ID
- Sort messages by timestamp
- View detailed message content in a modal
- Toggle between mock data and real Kinesis data in development mode
- Custom endpoint support for LocalStack and AWS-compatible services
- Real-time logging with server-sent events
- Caching of form entries for quick reconnection

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
5. View messages in the main panel, use filters and sorting as needed.
6. Click on a message to view its full content in a modal.
7. Monitor real-time logs in the bottom panel for debugging.

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
