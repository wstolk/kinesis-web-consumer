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

The application supports multiple Kinesis stream connections by allowing users to create profiles. 
Each profile can store AWS credentials and stream details for quick reconnection.

Additionally, it's possible to define custom endpoints for the AWS SDK, which can be useful for connecting to localstack or other AWS-compatible services.

![Kinesis Web Consumer Form View](./media/kinesis_stream_consumer_profile_management.png)

## Running the Application with Docker

The preferred method to run the application is using Docker. This ensures a consistent environment and simplifies the setup process.

### Pulling the Docker Image

To pull the Docker image, run the following command:

```sh
docker pull ghcr.io/wstolk/kinesis-web-consumer:latest
```

### Running the Docker Container

To run the Docker container, use the following command:

```sh
docker run -d -p 3000:3000 --name kinesis-web-consumer ghcr.io/wstolk/kinesis-web-consumer:latest
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

- Connect to AWS Kinesis streams using AWS credentials
- Manage multiple Kinesis stream connections simultaneously within profiles
- View Kinesis stream messages in real-time
- Filter messages by Partition Key and Shard ID
- Sort messages by timestamp
- View detailed message content in a modal
- Toggle between mock data and real Kinesis data in development mode
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
2. Enter your AWS credentials in the authentication popup.
3. Click "Connect to Kinesis" to fetch stream data.
4. View messages in the main panel, use filters and sorting as needed.
5. Click on a message to view its full content in a modal.
6. Debug any issues using the log console.

## Development Features

- Cached form entries for quick testing and development.

## Security Considerations

- This application handles sensitive AWS credentials. It is not (yet) intended for production use.
- Do not commit any real AWS credentials to the repository.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
