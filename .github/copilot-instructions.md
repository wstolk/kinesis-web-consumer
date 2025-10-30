# Kinesis Web Consumer - AI Coding Instructions

## Architecture Overview

This is a Next.js web application that provides a browser-based interface for consuming AWS Kinesis streams. The app follows a profile-based architecture where users can save multiple AWS credential sets for different environments (prod, dev, localstack).

### Key Components

- **AWS Profile Integration**: Primary authentication method using `~/.aws/config` and `~/.aws/credentials` files with profile selection
- **Profile Management**: Users create named profiles with either AWS profiles or manual credentials stored in localStorage
- **Dual Mode Operation**: Toggle between real Kinesis (`src/lib/kinesis.js`) and mock data (`src/lib/mockKinesisService.js`) via `KinesisModeContext`
- **Real-time Logging**: SSE-based logging system (`src/lib/loggingService.js`) streams backend logs to frontend
- **Material-UI Layout**: Fixed header + collapsible sidebar + main content area with responsive design

### Data Flow

1. **Profile Discovery**: `/api/aws-profiles` scans `~/.aws/config` and `~/.aws/credentials` for available profiles
2. **Authentication**: `/api/authenticate` validates credentials using AWS profiles or manual credentials and lists available streams
3. **Stream Consumption**: `/api/kinesis` fetches records from all shards with retry logic and filtering
4. **State Management**: React Context for Kinesis mode + localStorage for app profiles + AWS filesystem profiles
5. **Error Handling**: Centralized error notifications with specific AWS error code handling

## Development Patterns

### File Organization
- **Pages**: Next.js pages in `src/pages/` (main app in `index.js`)
- **API Routes**: Backend logic in `src/pages/api/` (authenticate.js, kinesis.js, logs.js)
- **Components**: Reusable UI components in `src/components/`
- **Services**: Business logic in `src/lib/` (kinesis client, mock service, logging, AWS profile discovery)
- **Contexts**: React contexts in `src/contexts/` (KinesisModeContext for dev/prod toggle)

### AWS Integration Specifics
- **Client Creation**: Use `createKinesisClient()` in `src/lib/kinesis.js` - handles both manual credentials and default credential chain
- **Default Credential Chain**: Profiles can use `useDefaultCredentials: true` to leverage AWS SDK default chain (env vars, IAM roles, ~/.aws/credentials)
- **Docker Credential Support**: Pass AWS env vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) or mount `~/.aws:/root/.aws:ro` for container-based deployments
- **Retry Logic**: Built-in handling for `ProvisionedThroughputExceededException` and `ExpiredIteratorException`
- **Custom Endpoints**: Support for LocalStack via endpoint override in authentication
- **Data Parsing**: Automatic JSON parsing with fallback to raw string for non-JSON data

### State Management Patterns
- **localStorage Keys**: `awsCredentials`, `lastUsedProfile`, `awsProfiles`, `awsStreams`
- **Profile Structure**: `{name, accessKeyId, secretAccessKey, sessionToken, region, endpoint, useDefaultCredentials, awsProfile}`
- **Context Usage**: `useKinesisMode()` for toggling between real/mock data globally
- **Credential Types**: Toggle between manual credentials and AWS default credential chain per profile
- **AWS Profile Discovery**: `src/lib/awsProfiles.js` scans filesystem for available AWS profiles with region detection

## Critical Development Workflows

### Local Development
```bash
npm run dev           # Start development server on port 3000
npm run build         # Production build
npm run start         # Start production server
```

### Docker Development
```bash
docker build -t kinesis-web-consumer .
docker run -p 3000:3000 kinesis-web-consumer

# With AWS environment variables
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_DEFAULT_REGION=eu-central-1 \
  kinesis-web-consumer

# With mounted AWS credentials (recommended for profiles)
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  kinesis-web-consumer

# With specific profile
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE=my-profile \
  kinesis-web-consumer
```

### Testing with LocalStack
- Set custom endpoint in profile (e.g., `http://localhost:4566`)
- Use mock mode via `KinesisModeContext` for offline development  
- Check `src/lib/mockKinesisService.js` for mock data patterns
- AWS profiles work with LocalStack when using appropriate endpoint configuration

### Debugging
- Backend logs stream to frontend via `/api/logs` SSE endpoint
- Use `loggingService.log(level, message)` for structured logging
- Check browser localStorage for cached credentials/profiles
- Toggle `useRealKinesis` context for comparing real vs mock behavior
- AWS profile discovery available at `/api/aws-profiles` for troubleshooting profile issues

## Key Integration Points

### AWS Profile Integration
- **Profile Discovery**: `src/lib/awsProfiles.js` scans `~/.aws/config` and `~/.aws/credentials` files
- **Authentication Priority**: AWS profiles (recommended) → Default credential chain → Manual credentials
- **Profile API**: `/api/aws-profiles` lists available profiles with region auto-detection
- **fromIni Provider**: Uses `@aws-sdk/credential-providers` for profile-based authentication
- **Region Auto-Detection**: Automatically extracts region from profile configuration files

### AWS SDK Configuration
- All AWS operations go through `src/lib/kinesis.js`
- Authentication validation in `/api/authenticate` before stream operations
- Support for temporary credentials (sessionToken) and custom endpoints
- Automatic TLS disable for localhost endpoints (LocalStack compatibility)

### Error Handling Patterns
- API errors bubble up to `ErrorNotification` component
- AWS-specific error codes (InvalidClientTokenId, AccessDeniedException) get custom handling
- Retry logic with exponential backoff for throughput limits
- Iterator expiration handling with automatic renewal

### Performance Considerations
- Message limit controls (default 20, configurable)
- Shard-level iteration with early termination on limits
- Empty response retry logic (max 3 retries with 1s delay)
- Frontend virtualization for large message lists

## Security Notes

- **Credential Options**: Use default credential chain for production (IAM roles, env vars) or manual credentials for development/testing
- **LocalStorage Warning**: Manual credentials stored in browser localStorage (development/testing only)
- No server-side credential persistence
- Session tokens automatically nullified if empty
- Profile names used for UI display, not security boundaries

When adding features, maintain the profile-based workflow and ensure both real/mock modes continue working. All AWS operations should go through the established service layer with proper error handling and logging.