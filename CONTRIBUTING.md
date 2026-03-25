# Contributing to Kinesis Web Consumer

Thanks for your interest in contributing. This guide covers the development setup, code style, and pull request process.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Branch and Commit Conventions](#branch-and-commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm
- Docker (optional, for container testing)

### Getting started

```bash
git clone https://github.com/wstolk/kinesis-web-consumer.git
cd kinesis-web-consumer
npm install
npm run dev
```

The app runs at `http://localhost:3000`. You can use **mock data mode** (toggle in the UI) to develop without AWS credentials.

### Local Kinesis with LocalStack

To test against a real Kinesis-compatible endpoint locally:

```bash
docker compose up -d
```

This starts LocalStack with a `my-stream` Kinesis stream on `localhost:4566`. In the app, set the custom endpoint to `http://localhost:4566`.

### Verify the Docker build

Before submitting changes, confirm the standalone Docker build still works:

```bash
docker build -t kinesis-web-consumer .
```

---

## Code Style

The project uses ESLint with the `next/core-web-vitals` preset. Run the linter with:

```bash
npm run lint
```

### Key conventions

| Area | Convention |
|---|---|
| Components | Functional components with hooks; PascalCase filenames (`MessageList.js`) |
| Services/utilities | Singleton pattern in `src/lib/`; camelCase filenames (`pollingService.js`) |
| Constants | UPPER_SNAKE_CASE exports in `src/lib/constants.js` |
| Imports | Use `@/` path alias for anything in `src/` (e.g., `import { loggingService } from '@/lib/loggingService'`) |
| Styling | Material-UI `sx` prop; theme defined in `src/lib/theme.js` |
| Logging | Use `loggingService.log(level, message)` -- not `console.log` |
| Error handling | API routes: try-catch returning JSON. Client: `ErrorNotification` component |
| Async | Prefer `async`/`await` over promise chains |

### Things to avoid

- Bypassing `dataFetchingService` with direct `fetch()` calls for Kinesis operations
- Hardcoding values that belong in `src/lib/constants.js`
- Skipping cleanup in `useEffect` return functions (intervals, timeouts, subscriptions)
- Adding dependencies on runtime file access that would break the standalone Next.js build

---

## Branch and Commit Conventions

### Branch naming

Use descriptive, prefixed branch names:

- `feature/add-partition-filter` -- new functionality
- `fix/polling-memory-leak` -- bug fixes
- `refactor/simplify-auth-flow` -- code improvements
- `docs/update-readme` -- documentation changes

### Commit messages

Write clear, concise messages in present tense:

```
Add partition key filtering to message list
Fix memory leak in polling cleanup
Update Docker base image to Node 20
```

### Version tags

The project uses semantic versioning. Tags trigger the CI/CD pipeline:

```bash
git tag v1.1.0
git push origin v1.1.0
```

---

## Pull Request Process

1. **Create a branch** from `main` using the naming convention above.
2. **Make your changes** and verify locally:
   - `npm run lint` passes
   - `npm run build` succeeds
   - `docker build .` completes (if you changed dependencies or config)
3. **Open a pull request** against `main` with:
   - A clear title describing the change
   - A description explaining *why* the change is needed
   - Any relevant screenshots for UI changes
4. **CI checks** must pass -- the pipeline builds multi-platform Docker images on every PR.
5. A maintainer will review your PR. Address any feedback, then the PR will be merged.

---

## Project Structure

For a detailed architecture overview, see the [Architecture section in README.md](README.md#architecture).

Quick reference for where to make common changes:

| Task | Files to modify |
|---|---|
| Add a UI component | `src/components/` (new file) + import in parent |
| Add an API endpoint | `src/pages/api/` (new file) |
| Add a service | `src/lib/` (new file, singleton pattern) |
| Change Kinesis logic | `src/lib/kinesis.js`, `src/pages/api/kinesis.js` |
| Change polling behavior | `src/hooks/usePolling.js`, `src/lib/pollingService.js` |
| Add a constant | `src/lib/constants.js` |
| Change the theme | `src/lib/theme.js` |
