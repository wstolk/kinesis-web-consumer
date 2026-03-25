# Security Audit Report - Kinesis Web Consumer

**Date:** 2026-03-25
**Auditor:** Automated Security Review (Claude)
**Application Version:** 0.1.0
**Scope:** Full application security audit including dependencies, code review, and configuration

---

## Executive Summary

The Kinesis Web Consumer application is a locally-run Next.js application with a generally sound security architecture. Server-side AWS operations and credential redaction patterns are well implemented. The audit identified **4 high**, **3 medium**, and **4 low** severity findings. Critical issues -- SSRF via unvalidated endpoint URLs, error message information leakage, and missing security headers -- have been remediated in this audit. Dependency vulnerabilities exist in Next.js 14.x but are largely mitigated by the application's usage patterns (no `next/image`, no rewrites, no React Server Components).

---

## 1. Dependency Audit

### 1.1 npm audit Results

| Package | Severity | Vulnerability | Applicable? |
|---------|----------|---------------|-------------|
| `next` 14.2.35 | High | GHSA-9g9p-9gw9-jx7f - DoS via Image Optimizer | **No** - `next/image` not used |
| `next` 14.2.35 | High | GHSA-h25m-26qc-wcjf - DoS via React Server Components | **No** - Pages Router, no RSC |
| `next` 14.2.35 | High | GHSA-ggv3-7p47-pfv8 - HTTP request smuggling in rewrites | **No** - No rewrites configured |
| `next` 14.2.35 | High | GHSA-3x4c-7xq6-9pq8 - Unbounded `next/image` disk cache | **No** - `next/image` not used |
| `glob` (via `@next/eslint-plugin-next`) | High | GHSA-5j98-mcp5-4vw2 - Command injection via CLI | **No** - Only devDependency, CLI not invoked |

**Assessment:** All reported high-severity CVEs are **not applicable** to this application due to unused features. However, upgrading to Next.js 15.x when feasible is recommended for defense-in-depth.

### 1.2 Recommended Dependency Updates

| Package | Current | Latest Stable | Priority | Notes |
|---------|---------|---------------|----------|-------|
| `next` | 14.2.35 | 15.5.14 / 16.2.1 | Medium | Major version bump; CVEs not currently applicable |
| `eslint-config-next` | 14.2.35 | 16.2.1 | Low | Should match Next.js version |
| `eslint` | ^8 | ^10 | Low | Major version, potential config changes |
| `react` / `react-dom` | ^18.3.1 | ^19.2.4 | Low | Major version, requires Next.js 15+ |
| `@mui/material` | ^6.5.0 | ^7.3.9 | Low | Major version, may have breaking changes |
| `uuid` | ^10.0.0 | ^13.0.0 | Low | Major version bump |
| `@fontsource/roboto` | ^5.2.9 | ^5.2.10 | Low | Patch update, safe to apply |

---

## 2. Code Security Findings

### FINDING-01: SSRF via Unvalidated Custom Endpoint URL [HIGH] -- FIXED

**File:** `src/pages/api/authenticate.js:44`
**Description:** The `endpoint` parameter from user input was passed directly to the AWS SDK `KinesisClient` configuration without URL validation. An attacker with access to the UI could supply arbitrary URLs (e.g., `file:///etc/passwd`, `gopher://`, or internal network addresses) to perform Server-Side Request Forgery.
**Remediation:** Added URL parsing and protocol validation. Only `http:` and `https:` protocols are now permitted. Malformed URLs are rejected with a 400 response.

### FINDING-02: Error Message Information Leakage [HIGH] -- FIXED

**Files:**
- `src/pages/api/kinesis.js:77` - Raw `error.message` returned to client
- `src/pages/api/authenticate.js:75` - Raw `error.message` included in 500 response
- `src/pages/api/aws-profiles.js:24` - Raw `error.message` exposed

**Description:** Internal error messages from the AWS SDK and Node.js runtime were returned verbatim to the client. These could reveal internal infrastructure details, AWS account information, SDK version details, or stack trace fragments.
**Remediation:** Replaced raw error messages with sanitized, user-friendly alternatives. A mapping of known AWS error types to safe messages is used in the kinesis endpoint. Generic messages are used for unexpected errors. Full errors remain in server-side console logs for debugging.

### FINDING-03: Missing Security Headers [HIGH] -- FIXED

**File:** `next.config.mjs`
**Description:** The application was missing `Content-Security-Policy` and `Strict-Transport-Security` headers.
**Remediation:** Added:
- `Content-Security-Policy` with restrictive defaults, allowing inline styles/scripts needed by MUI/Emotion
- `Strict-Transport-Security` with 1-year max-age and includeSubDomains

### FINDING-04: Session Token Not Redacted in Logs [HIGH] -- FIXED

**File:** `src/pages/api/kinesis.js:49`
**Description:** The request body was logged with `accessKeyId` and `secretAccessKey` redacted, but `sessionToken` was logged in plaintext. Session tokens are valid credentials that can be used for authentication.
**Remediation:** Added `sessionToken: 'REDACTED'` to the redacted request body.

### FINDING-05: Missing Input Validation for AWS Profile Name [MEDIUM] -- FIXED

**Files:**
- `src/pages/api/authenticate.js:8` - `awsProfile` passed to `fromIni()` without validation
- `src/pages/api/kinesis.js:21` - `awsProfile` passed to `createKinesisClient()` without validation

**Description:** The `awsProfile` parameter was not validated before being passed to the AWS SDK's `fromIni()` function. While the SDK itself handles this safely, defense-in-depth requires validating all user inputs at the API boundary.
**Remediation:** Added regex validation (`/^[a-zA-Z0-9_\-./]+$/`) for AWS profile names in both API endpoints.

### FINDING-06: Missing Stream Name Format Validation [MEDIUM] -- FIXED

**File:** `src/pages/api/kinesis.js:25`
**Description:** While `streamName` was checked for non-empty string, it was not validated against the AWS Kinesis stream name format (1-128 characters, alphanumeric plus `_`, `.`, `-`). Malformed names are passed to the AWS SDK which would generate errors, but validating early prevents unnecessary API calls and potential edge cases.
**Remediation:** Added format validation matching AWS Kinesis stream name constraints.

### FINDING-07: Log Injection via User-Controlled Values [MEDIUM] -- FIXED

**File:** `src/lib/loggingService.js:28`
**Description:** User-controlled values (stream names, partition keys, error messages) are interpolated into log messages that are streamed via SSE to all connected clients. A malicious value containing newlines could inject fake log entries or break the SSE protocol.
**Remediation:** Added log message sanitization: newline stripping and length truncation (2000 chars max). Also validated log level against an allowlist.

### FINDING-08: Credentials Stored in localStorage [LOW]

**File:** `src/pages/index.js:229`
**Description:** When using manual credentials, AWS access keys and secret keys are stored in browser `localStorage`. This data persists across sessions and is accessible to any JavaScript running on the same origin.
**Mitigation:** This is a known, documented design decision. The UI encourages using AWS profiles (which do not store credentials client-side). Manual credential mode displays a security warning. Since this is a locally-run developer tool, the risk is acceptable.
**Recommendation:** Consider using `sessionStorage` instead for manual credentials, so they are cleared when the browser tab closes.

### FINDING-09: No Server-Side Rate Limiting [LOW]

**Files:** `src/pages/api/kinesis.js`, `src/pages/api/authenticate.js`
**Description:** API endpoints have no server-side rate limiting. While client-side throttling exists in `dataFetchingService.js` (1-second minimum interval), there is no protection against direct API abuse.
**Mitigation:** This is a locally-run application, so the threat model does not include external attackers reaching the API. AWS SDK calls have their own rate limiting via `ProvisionedThroughputExceededException` handling.
**Recommendation:** If the application is ever exposed to a network, add rate limiting middleware (e.g., `express-rate-limit` or custom Next.js middleware).

### FINDING-10: Mock Data Mode Accessible in Production [LOW]

**File:** `src/pages/api/kinesis.js:56`
**Description:** The `useRealKinesis` flag is client-controlled. Setting it to `false` serves mock data without authentication. While this is a development feature, it is available in production builds.
**Mitigation:** Mock mode does not expose any real data or credentials. It only returns randomly generated sample data.
**Recommendation:** Consider disabling mock mode when `NODE_ENV=production` for cleaner separation.

### FINDING-11: Unbounded SSE Connections [LOW]

**File:** `src/lib/loggingService.js:13`
**Description:** The logging service caps SSE connections at 50 (`MAX_LOGGERS`), which is reasonable. However, there is no authentication on the `/api/logs` SSE endpoint. Anyone who can reach the server can subscribe to all application logs.
**Mitigation:** This is a locally-run application. Logs are operational messages only and do not contain credentials (after FINDING-04 fix).

---

## 3. Configuration Security

### 3.1 next.config.mjs

| Check | Status | Notes |
|-------|--------|-------|
| `poweredByHeader: false` | PASS | X-Powered-By header disabled |
| `X-Content-Type-Options: nosniff` | PASS | Prevents MIME sniffing |
| `X-Frame-Options: DENY` | PASS | Prevents clickjacking |
| `X-XSS-Protection: 1; mode=block` | PASS | Legacy XSS protection |
| `Referrer-Policy: strict-origin-when-cross-origin` | PASS | Controls referrer leakage |
| `Permissions-Policy` | PASS | Camera, mic, geolocation disabled |
| `Strict-Transport-Security` | PASS | Added in this audit |
| `Content-Security-Policy` | PASS | Added in this audit |

### 3.2 Dockerfile

| Check | Status | Notes |
|-------|--------|-------|
| Non-root user | PASS | Runs as `nextjs` (UID 1001) |
| Multi-stage build | PASS | Source code not in final image |
| Alpine base | PASS | Minimal attack surface |
| `NODE_ENV=production` | PASS | Set in runner stage |
| Telemetry disabled | PASS | `NEXT_TELEMETRY_DISABLED=1` |
| Signal handling (tini) | PASS | Uses tini as PID 1 |
| Health check | PASS | Configured with curl |
| `HOSTNAME=0.0.0.0` | INFO | Binds to all interfaces -- expected for Docker |
| Node.js version | INFO | Using Node 18.20 (LTS, EOL April 2025). Consider upgrading to Node 20 or 22 LTS. |

### 3.3 CORS Configuration

No custom CORS configuration found. Next.js API routes default to same-origin only, which is correct for this application.

### 3.4 Debug Endpoints

No debug-only endpoints found. The `/api/logs` SSE endpoint provides operational logs but contains no debug-level sensitive data after remediation.

---

## 4. Items Not Found (Positive Findings)

- No hardcoded secrets or credentials anywhere in the codebase
- No use of `dangerouslySetInnerHTML`, `eval()`, `Function()`, or `document.write()`
- No command injection vectors (`child_process`, `exec`, `spawn` not used)
- No SQL/NoSQL injection (no database layer)
- No prototype pollution patterns
- No path traversal vulnerabilities (filesystem access uses `os.homedir()` + fixed paths only)
- AWS credentials are properly redacted before logging
- React's JSX rendering provides automatic XSS protection
- Proper HTTP method enforcement on all API routes (405 for unsupported methods)
- Client properly cleans up resources (AbortControllers, intervals, EventSources) on unmount

---

## 5. Remediation Summary

### Completed in This Audit

| ID | Severity | Fix |
|----|----------|-----|
| FINDING-01 | High | URL validation for custom endpoints in `authenticate.js` |
| FINDING-02 | High | Sanitized error messages in all API routes |
| FINDING-03 | High | Added CSP and HSTS headers in `next.config.mjs` |
| FINDING-04 | High | Redacted `sessionToken` in logged request body |
| FINDING-05 | Medium | Added AWS profile name validation |
| FINDING-06 | Medium | Added stream name format validation |
| FINDING-07 | Medium | Added log injection protection in `loggingService.js` |

### Recommended Future Actions

| Priority | Action |
|----------|--------|
| Medium | Upgrade to Next.js 15.x when project allows a major version bump |
| Medium | Upgrade Node.js base image from 18 to 20 or 22 LTS in Dockerfile |
| Low | Use `sessionStorage` instead of `localStorage` for manual credentials |
| Low | Disable mock data mode in production builds |
| Low | Add rate limiting if application is ever network-exposed |
| Low | Apply minor dependency updates (`@fontsource/roboto` ^5.2.10) |

---

## Files Modified

- `src/pages/api/authenticate.js` -- SSRF fix, error sanitization, profile validation
- `src/pages/api/kinesis.js` -- Error sanitization, profile/stream validation, token redaction
- `src/pages/api/aws-profiles.js` -- Error message sanitization
- `src/lib/loggingService.js` -- Log injection protection
- `next.config.mjs` -- Added CSP and HSTS security headers
