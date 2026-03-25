# CLAUDE.md - AI Assistant Guide for Kinesis Web Consumer

## Project Overview

**Kinesis Web Consumer** is a production-ready Next.js web application that enables users to connect to and view messages from Amazon Kinesis streams. It provides a user-friendly interface with real-time polling, filtering, sorting, and comprehensive AWS authentication support.

### Key Features
- **AWS Authentication**: Support for AWS profiles, IAM roles, default credential chain, and manual credentials
- **Real-time Polling**: Configurable auto-refresh with intelligent error handling and circuit breaker patterns
- **Production Optimizations**: Connection pooling, request throttling, memory management, retry logic
- **Docker Support**: Containerized deployment with AWS credential mounting
- **Stream Management**: Multi-stream support, shard-level data access, partition key filtering
- **Data Export**: JSON export functionality for filtered message sets

### Technology Stack
- **Framework**: Next.js 14.2.12 (App Router disabled, Pages Router used)
- **React**: 18.x with hooks-based architecture
- **UI Library**: Material-UI (MUI) v6.1.0 with Emotion styling
- **AWS SDK**: @aws-sdk/client-kinesis v3.651.1, @aws-sdk/credential-providers v3.920.0
- **Runtime**: Node.js 18+ (Alpine Linux in Docker)

---

## Architecture

### Application Structure

```
kinesis-web-consumer/
├── src/
│   ├── components/       # React UI components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Core services and utilities
│   └── pages/            # Next.js pages and API routes
│       ├── api/          # Backend API endpoints
│       ├── _app.js       # App wrapper with providers
│       └── index.js      # Main application page
├── .github/workflows/    # CI/CD pipelines
├── Dockerfile            # Multi-stage production build
├── docker-compose.yml    # Local development setup
└── package.json          # Dependencies and scripts
```

### Core Architecture Patterns

1. **Service Layer Pattern**: Business logic encapsulated in singleton services (`lib/`)
2. **Context Pattern**: Global state management via React Context (`contexts/`)
3. **Custom Hooks**: Reusable stateful logic (`hooks/usePolling.js`)
4. **API Routes**: Next.js serverless functions for AWS operations (`pages/api/`)
5. **Component Composition**: Modular UI components with clear responsibilities

---

## Directory Structure Deep Dive

### `/src/components/`
React components for the UI layer. Each component handles a specific UI concern.

**Key Components:**
- `Header.js` - Top navigation bar with polling controls and profile management
- `Sidebar.js` - Left panel with Kinesis connection form
- `MessageList.js` - Main message display with filtering, sorting, and export
- `MessageModal.js` - Full message detail viewer
- `AuthModal.js` - AWS credential authentication dialog
- `LogViewer.js` - Real-time server-sent events log display
- `ErrorNotification.js` - Global error snackbar notification
- `AccessKeyForm.js` - Form for manual AWS credential input

### `/src/contexts/`
React Context providers for global state.

- `KinesisModeContext.js` - Toggle between real Kinesis and mock data (development feature)

### `/src/hooks/`
Custom React hooks for reusable stateful logic.

- `usePolling.js` - Manages polling state, controls, and statistics with React integration

### `/src/lib/`
Core services, utilities, and business logic (singleton pattern).

**Critical Services:**
- `kinesis.js` - AWS Kinesis SDK wrapper with retry logic and error handling
- `dataFetchingService.js` - Production-ready request manager with throttling, deduplication, retries
- `pollingService.js` - Polling orchestration with circuit breaker pattern
- `loggingService.js` - Server-sent events logging system
- `performanceMonitor.js` - Performance metrics and memory tracking
- `awsProfiles.js` - AWS profile file parser (~/.aws/config and ~/.aws/credentials)
- `mockKinesisService.js` - Mock data generator for development
- `constants.js` - Application-wide constants and configuration
- `theme.js` - Material-UI theme configuration
- `createEmotionCache.js` - Emotion CSS-in-JS cache setup

### `/src/pages/`
Next.js pages (routing) and API routes (backend).

**Pages:**
- `_app.js` - Application wrapper with MUI theme provider and context providers
- `index.js` - Main application page (home route)

**API Routes:** (`/src/pages/api/`)
- `kinesis.js` - POST endpoint to fetch Kinesis stream records
- `authenticate.js` - POST endpoint to validate AWS credentials and list streams
- `aws-profiles.js` - GET endpoint to retrieve AWS profiles from ~/.aws/ files
- `logs.js` - GET endpoint for server-sent events log streaming

---

## Key Files and Their Purposes

### Configuration Files

**`package.json`**
- Scripts: `dev` (development), `build` (production build), `start` (production server), `lint`
- Key dependencies: Next.js, React, MUI, AWS SDK
- No test framework currently configured

**`next.config.mjs`**
- Output mode: `standalone` (for Docker optimization)
- Path alias: `@/*` maps to `./src/*`
- Instrumentation hook: Disabled

**`jsconfig.json`**
- Path mapping for `@/*` imports
- Enables IDE autocomplete for aliased paths

**`.eslintrc.json`**
- Extends Next.js core-web-vitals ESLint config
- Standard linting rules applied

**`Dockerfile`**
- Multi-stage build: deps → builder → runner
- Production image: Node 18 Alpine, standalone Next.js output
- Non-root user: nextjs (UID 1001)
- Exposed port: 3000

**`.github/workflows/docker-publish.yml`**
- Triggers: Push tags (v*.*.*), PRs to main
- Multi-platform builds: linux/amd64, linux/arm64
- Registry: GitHub Container Registry (ghcr.io)
- Image signing with cosign

### Core Application Files

**`src/pages/index.js`** (Main Application)
- Single-page application root component
- Manages authentication state, message display, polling controls
- Integrates all major components (Header, Sidebar, MessageList, AuthModal, LogViewer)
- LocalStorage persistence for credentials, profiles, streams
- Memory management with MAX_STORED_MESSAGES limit (5000)

**`src/pages/api/kinesis.js`** (Data Fetching Endpoint)
- POST endpoint accepting AWS credentials and stream parameters
- Supports both real Kinesis and mock data modes
- Parameters: accessKeyId, secretAccessKey, sessionToken, region, streamName, messageLimit, shardIteratorType, partitionKey, minutesAgo, useDefaultCredentials, awsProfile
- Returns: `{ records: [...], millisBehindLatest: number }`

**`src/lib/kinesis.js`** (AWS SDK Wrapper)
- `createKinesisClient()` - Factory for Kinesis client with multiple auth methods
- `getAllShardRecords()` - Fetches records from all shards with pagination
- `getShardIterator()` - Gets iterator for shard with timestamp support
- `getRecords()` - Fetches records with automatic JSON parsing
- `describeStream()` - Gets stream metadata and shard list
- Retry logic for `ProvisionedThroughputExceededException` (3 retries, 2s delay)
- Iterator expiration handling with automatic new iterator requests

**`src/lib/dataFetchingService.js`** (Production Request Manager)
- Request deduplication: Prevents duplicate concurrent requests
- Request throttling: Minimum 1-second interval between requests
- Retry logic: 3 retries with exponential backoff (1s → 2s → 4s, max 10s)
- Timeout protection: 30-second request timeout
- Permanent error detection: No retries for auth/validation errors
- Performance monitoring integration
- AbortController support for request cancellation

**`src/lib/pollingService.js`** (Polling Orchestration)
- Circuit breaker pattern: Auto-pause on 3 consecutive failures
- Session management: Multiple concurrent polling sessions supported
- Statistics tracking: Success/failure rates, request counts, error counts
- Configurable intervals: 5 seconds to 5 minutes
- Automatic cleanup on errors exceeding threshold

**`src/lib/constants.js`** (Configuration Constants)
- UI layout: `HEADER_HEIGHT` (64px), `SIDEBAR_WIDTH` (300px)
- AWS regions: Complete list of available regions
- Message limits: `MAX_MESSAGES_LIMIT` (1000), `MAX_STORED_MESSAGES` (5000)
- Polling intervals: Predefined options from 5s to 5m
- LocalStorage keys: Centralized storage key definitions
- API endpoints: Centralized API route paths

---

## Development Workflows

### Local Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Application available at http://localhost:3000

# Build for production
npm run build

# Run production build locally
npm start

# Lint code
npm run lint
```

### Docker Development

```bash
# Build image locally
docker build -t kinesis-web-consumer .

# Run with AWS profile mounting (recommended)
docker run -d -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  --name kinesis-web-consumer \
  kinesis-web-consumer

# Run with environment variables
docker run -d -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_DEFAULT_REGION=eu-central-1 \
  --name kinesis-web-consumer \
  kinesis-web-consumer

# View logs
docker logs -f kinesis-web-consumer

# Stop and remove
docker stop kinesis-web-consumer
docker rm kinesis-web-consumer
```

### CI/CD Pipeline

**Trigger Conditions:**
- **Version Tags**: `git tag v1.0.0 && git push origin v1.0.0`
- **Pull Requests**: Automatic build on PRs to main (no push)

**Build Process:**
1. Checkout repository
2. Set up Docker Buildx for multi-platform builds
3. Login to GitHub Container Registry (ghcr.io)
4. Build for linux/amd64 and linux/arm64
5. Push to registry (tags only)
6. Sign image with cosign (tags only)

**Image Naming:**
- Format: `ghcr.io/wstolk/kinesis-web-consumer:tag`
- Tags: Version tags (v1.0.0) or branch names

---

## Code Conventions & Patterns

### File Naming
- **React Components**: PascalCase (e.g., `MessageList.js`, `AuthModal.js`)
- **Services/Utilities**: camelCase (e.g., `kinesis.js`, `pollingService.js`)
- **Constants**: camelCase file, UPPER_SNAKE_CASE exports
- **API Routes**: kebab-case or camelCase (e.g., `aws-profiles.js`, `kinesis.js`)

### Import Patterns
- **Absolute imports**: Use `@/` alias for src directory
  ```javascript
  import { usePolling } from '@/hooks/usePolling';
  import { loggingService } from '@/lib/loggingService';
  import MessageList from '@/components/MessageList';
  ```
- **Relative imports**: Only for sibling files in same directory

### State Management
- **Global State**: React Context (see `contexts/`)
- **Component State**: `useState` hook
- **Side Effects**: `useEffect` hook
- **Refs**: `useRef` for non-reactive values (intervals, DOM refs)
- **LocalStorage**: Persistent state for credentials, profiles, streams, form data

### Error Handling
- **API Routes**: Try-catch with JSON error responses
  ```javascript
  try {
    // operation
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  ```
- **Client-side**: Error state + ErrorNotification component
- **Logging**: Use `loggingService.log(level, message)` for all logs
  - Levels: 'debug', 'info', 'warn', 'error'

### Async Patterns
- **Prefer async/await**: Over promise chains
- **Error propagation**: Let errors bubble with meaningful messages
- **Retry logic**: Implement in services, not components
- **Timeouts**: Use AbortController for fetch requests

### Component Patterns
- **Functional Components**: All components use function syntax
- **Props Destructuring**: Destructure props in function parameters
- **Prop Types**: Not currently enforced (consider adding)
- **Default Props**: Use default parameters or destructuring defaults

### Styling
- **Material-UI**: Primary styling system
- **sx prop**: Inline styles for component-specific styling
- **Theme**: Centralized in `src/lib/theme.js`
- **Responsive**: Use MUI breakpoints (`xs`, `sm`, `md`, `lg`, `xl`)

---

## AWS Integration Details

### Authentication Methods (Priority Order)

1. **AWS Profiles** (Recommended)
   - Files: `~/.aws/config` and `~/.aws/credentials`
   - Parsed by `src/lib/awsProfiles.js` on server-side
   - Selected via AuthModal dropdown
   - No localStorage credential storage
   - Example:
     ```ini
     # ~/.aws/credentials
     [production]
     aws_access_key_id = AKIA...
     aws_secret_access_key = ...

     # ~/.aws/config
     [profile production]
     region = us-east-1
     ```

2. **Default Credential Chain**
   - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`
   - IAM roles (EC2/ECS)
   - No UI configuration needed
   - Automatically used when `useDefaultCredentials: true`

3. **Manual Credentials** (Development/Testing)
   - Direct input via AuthModal
   - Stored in browser localStorage
   - Support for session tokens and custom endpoints
   - Security warning displayed to users

### Kinesis Operations

**Supported Shard Iterator Types:**
- `TRIM_HORIZON` - Start from oldest record in shard
- `AT_TIMESTAMP` - Start from specific timestamp (uses `minutesAgo` parameter)

**Message Fetching Flow:**
1. Client calls `/api/kinesis` with parameters
2. Server creates Kinesis client with appropriate auth method
3. Server calls `getAllShardRecords()` to fetch from all shards
4. Records parsed (JSON if possible, raw string otherwise)
5. Results returned with metadata (millisBehindLatest)
6. Client formats and displays messages

**Partition Key Filtering:**
- Server-side filtering after record retrieval
- Applied per-shard during fetching
- Reduces data transfer for specific partitions

---

## Production Optimizations

### Memory Management
- **MAX_STORED_MESSAGES**: 5000 messages max in browser memory
- **Deduplication**: Removes duplicate messages based on timestamp + partitionKey + data
- **Automatic Trimming**: Old messages discarded when limit exceeded
- **Performance Monitoring**: Tracks message count and memory usage

### Request Optimization
- **Connection Pooling**: Reuses HTTP connections via keep-alive
- **Request Deduplication**: Prevents identical concurrent requests
- **Throttling**: Minimum 1-second interval between requests
- **Timeout Protection**: 30-second timeout for all API calls
- **Retry Logic**: 3 retries with exponential backoff and jitter

### Error Recovery
- **Circuit Breaker**: Auto-pause polling after 3 consecutive failures
- **Exponential Backoff**: 1s → 2s → 4s → 8s (max 10s)
- **Jitter**: Randomized delay to prevent thundering herd
- **Permanent Error Detection**: No retries for auth/validation errors
- **Iterator Expiration Handling**: Automatic new iterator requests

### Polling Best Practices
- **Start Conservative**: Begin with 50-100 message limits, 30s intervals
- **Monitor Performance**: Watch browser memory during extended sessions
- **High-Volume Streams**: Use longer intervals (1-5 minutes)
- **Network Consideration**: Adjust limits based on message sizes

---

## Testing Strategy

### Current State
- **No automated tests**: Test framework not currently configured
- **Manual testing**: Primary testing method
- **Mock data mode**: Toggle in UI for testing without AWS credentials

### Testing Recommendations for Future
- **Unit Tests**: Jest + React Testing Library for components
- **Integration Tests**: API route testing with mocked AWS SDK
- **E2E Tests**: Playwright or Cypress for full user flows
- **Mock Services**: Already have `mockKinesisService.js` for development

---

## Common Tasks for AI Assistants

### Adding a New Component
1. Create file in `src/components/` with PascalCase name
2. Use functional component pattern with hooks
3. Import Material-UI components as needed
4. Use `@/` alias for imports from src
5. Export as default: `export default ComponentName`
6. Import in parent component or page

### Adding a New API Route
1. Create file in `src/pages/api/` (e.g., `myroute.js`)
2. Export default async handler function
3. Check request method: `if (req.method === 'POST')`
4. Use try-catch with JSON responses
5. Log operations with `loggingService.log()`
6. Return appropriate HTTP status codes

### Adding a New Service
1. Create file in `src/lib/` with camelCase name
2. Implement as class or object literal
3. Export singleton instance: `export const myService = new MyService()`
4. Integrate logging: `import { loggingService } from './loggingService'`
5. Follow error handling patterns from existing services

### Modifying Kinesis Fetching Logic
- **Entry point**: `src/pages/api/kinesis.js`
- **Core logic**: `src/lib/kinesis.js` (getAllShardRecords, getRecords)
- **Request handling**: `src/lib/dataFetchingService.js`
- **Testing**: Use mock mode toggle in UI

### Adding Configuration Constants
1. Add to `src/lib/constants.js`
2. Use UPPER_SNAKE_CASE for constant names
3. Group related constants together
4. Export individually: `export const MY_CONSTANT = value;`
5. Import where needed: `import { MY_CONSTANT } from '@/lib/constants';`

### Modifying Polling Behavior
- **Hook**: `src/hooks/usePolling.js` (React integration)
- **Service**: `src/lib/pollingService.js` (Core logic)
- **Configuration**: `src/lib/constants.js` (Intervals, limits)
- **UI Controls**: `src/components/Header.js` and `src/components/MessageList.js`

---

## Important Notes for AI Assistants

### Security Considerations
1. **Never commit AWS credentials**: Check for hardcoded keys before committing
2. **Redact logs**: Use existing patterns in `src/pages/api/kinesis.js` for credential redaction
3. **Validate inputs**: Sanitize user inputs in API routes
4. **Use read-only mounts**: Docker AWS credential mounts should be `:ro`

### Performance Considerations
1. **Message limits**: Respect MAX_MESSAGES_LIMIT (1000) and MAX_STORED_MESSAGES (5000)
2. **Polling intervals**: Never allow intervals below MIN_POLLING_INTERVAL (5 seconds)
3. **Request throttling**: Don't bypass dataFetchingService throttling
4. **Memory management**: Always implement cleanup in useEffect return functions

### Code Quality
1. **Follow existing patterns**: Match style of surrounding code
2. **Use path aliases**: Always use `@/` imports from src directory
3. **Log important operations**: Use loggingService for debugging
4. **Handle errors gracefully**: Provide user-friendly error messages
5. **Avoid over-engineering**: Keep solutions simple and focused

### Git Workflow
1. **Branch naming**: Use descriptive names (e.g., `feature/add-filtering`, `fix/polling-bug`)
2. **Commit messages**: Clear, concise, present tense (e.g., "Add partition key filtering")
3. **Version tags**: Semantic versioning (v1.0.0, v1.1.0, v2.0.0)
4. **Pull requests**: Required for main branch

### Docker Considerations
1. **Standalone build**: next.config.mjs must have `output: "standalone"`
2. **Multi-platform**: Builds for both amd64 and arm64
3. **Non-root user**: Always run as nextjs user (UID 1001)
4. **Credential mounting**: Prefer volume mounts over environment variables

### Common Pitfalls to Avoid
1. **Don't bypass services**: Always use dataFetchingService, not direct fetch()
2. **Don't ignore memory limits**: Respect MAX_STORED_MESSAGES
3. **Don't hardcode values**: Use constants from constants.js
4. **Don't skip logging**: Log errors, important operations, and state changes
5. **Don't forget cleanup**: useEffect cleanup for intervals, timeouts, subscriptions
6. **Don't break standalone build**: Avoid dependencies on runtime file access
7. **Don't modify AWS SDK calls directly**: Use wrapper functions in kinesis.js

### When Making Changes
1. **Read existing code first**: Understand current patterns before modifying
2. **Test locally**: Run `npm run dev` to verify changes
3. **Check Docker build**: Run `docker build .` to ensure standalone build works
4. **Update documentation**: Modify this file if architecture changes
5. **Consider backwards compatibility**: LocalStorage schema changes need migration

---

## Debugging Tips

### Server-Side Debugging
- **View logs**: Check `docker logs` or terminal output from `npm run dev`
- **LoggingService**: All operations logged to `/api/logs` endpoint
- **Error messages**: Check API route try-catch blocks for errors

### Client-Side Debugging
- **LogViewer component**: Real-time SSE logs displayed in UI
- **Browser DevTools**: React DevTools for component state inspection
- **Network tab**: Inspect API calls to `/api/kinesis`, `/api/authenticate`
- **LocalStorage**: Check Application tab for stored credentials and profiles

### Common Issues
1. **AWS credential errors**: Check profile configuration, IAM permissions
2. **Polling not starting**: Verify lastFetchParams is set (fetch data first)
3. **Memory issues**: Check message count against MAX_STORED_MESSAGES
4. **CORS errors**: Verify API routes are in `/pages/api/` directory
5. **Import errors**: Check `@/` alias configuration in jsconfig.json

---

## Recent Changes and Evolution

### Latest Features
- **Polling functionality**: Added auto-refresh with configurable intervals
- **AWS profile support**: Integration with ~/.aws/config and ~/.aws/credentials
- **Default credential chain**: Support for environment variables and IAM roles
- **Production optimizations**: Connection pooling, throttling, circuit breaker
- **ARM64 support**: Multi-platform Docker builds

### Architecture Decisions
- **Pages Router**: Using Pages Router, not App Router (Next.js 14 default)
- **Singleton services**: Centralized business logic in lib/ with singleton pattern
- **LocalStorage persistence**: Client-side storage for UX, not security
- **Server-side auth**: AWS operations performed server-side for security
- **SSE logging**: Server-sent events for real-time log streaming

---

## Quick Reference

### File Import Paths
```javascript
// Components
import Header from '@/components/Header';

// Hooks
import { usePolling } from '@/hooks/usePolling';

// Services
import { loggingService } from '@/lib/loggingService';
import { dataFetchingService } from '@/lib/dataFetchingService';

// Constants
import { MAX_MESSAGES_LIMIT } from '@/lib/constants';

// Contexts
import { useKinesisMode } from '@/contexts/KinesisModeContext';
```

### Key API Endpoints
- `POST /api/kinesis` - Fetch Kinesis stream records
- `POST /api/authenticate` - Validate credentials and list streams
- `GET /api/aws-profiles` - Retrieve AWS profiles from ~/.aws/
- `GET /api/logs` - Server-sent events log stream

### Environment Variables
- `AWS_ACCESS_KEY_ID` - AWS access key (fallback auth)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key (fallback auth)
- `AWS_DEFAULT_REGION` - Default AWS region
- `AWS_PROFILE` - AWS profile to use (if multiple profiles)
- `NODE_ENV` - Node environment (development/production)

### Build Commands
```bash
npm run dev        # Development server (hot reload)
npm run build      # Production build
npm start          # Production server
npm run lint       # ESLint
docker build .     # Docker image build
```

---

## Summary

This is a well-structured Next.js application with production-ready patterns for AWS Kinesis stream consumption. The architecture emphasizes:

1. **Separation of concerns**: Components (UI), Services (logic), Hooks (state), API (backend)
2. **Error resilience**: Retries, circuit breakers, exponential backoff
3. **Performance**: Request throttling, deduplication, memory management
4. **Security**: Server-side AWS operations, credential mounting, no hardcoded secrets
5. **Developer experience**: Path aliases, logging service, mock mode, hot reload

When working on this codebase, prioritize simplicity, follow existing patterns, and leverage the service layer for business logic. Always test locally with Docker to ensure the standalone build works correctly.

---

## Design Context

### Users
Mixed technical team — DevOps, backend developers, and other technical roles who need visibility into Kinesis stream data. They use this tool for debugging, monitoring, and inspecting stream contents. Sessions can be long (monitoring) or short (quick data lookup). Users expect efficiency and clarity over polish.

### Brand Personality
**Professional, trustworthy, clear.** A calm, no-nonsense tool that instills confidence. It should feel like reliable infrastructure tooling — not flashy, but undeniably well-made. Three words: **dependable, clean, precise.**

### Aesthetic Direction
- **Visual tone:** Data-dense observability tool. Information-first, with strong scannability and clear visual hierarchy. Inspired by Datadog and Grafana — optimized for reading and scanning structured data, not for marketing.
- **Theme:** Both light and dark mode with a toggle. Dark mode is the natural fit for long monitoring sessions; light mode for quick lookups or bright environments.
- **Color palette:** Functional color usage — blues for primary actions, semantic colors for status (green/success, amber/warning, red/error). Avoid decorative color. Current MUI blue (#1976d2) is fine as a foundation.
- **Typography:** Roboto (already in use). Monospace for data values, partition keys, timestamps, and JSON content. Clear size hierarchy between headings, labels, and data.
- **Spacing:** Compact but not cramped. Data density is important — users want to see many messages at once without excessive whitespace.
- **Anti-references:** Avoid anything that looks like a marketing site, consumer app, or overly playful SaaS product. No rounded bubbly cards, no gradient hero sections, no decorative illustrations.

### Design Principles

1. **Content density over decoration** — Every pixel should serve the data. Minimize chrome, maximize the information on screen. Padding and spacing should be tight and intentional.

2. **Scannability first** — Users scan streams of messages quickly. Use consistent alignment, monospace for data, clear visual grouping, and subtle alternating row treatments to aid rapid scanning.

3. **Quiet confidence** — The interface should feel solid and professional without drawing attention to itself. Subtle transitions, muted colors, restrained use of elevation and borders. No bouncing, no flash.

4. **Functional color only** — Color communicates meaning (status, actions, errors), never decoration. Maintain high contrast ratios for accessibility, especially in dark mode.

5. **Respect the workflow** — Don't interrupt. Modals only when necessary. Inline editing and feedback where possible. The tool should stay out of the way and let users focus on the data.
