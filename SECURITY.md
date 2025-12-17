# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Updates

### Latest Security Audit (December 2025)

#### Resolved Critical Vulnerabilities
- **Next.js Authorization Bypass** (GHSA-f82v-jwr5-mffw) - CVSS 9.1 - ✅ Fixed in 14.2.35
- **Next.js Denial of Service** (GHSA-mwv6-3258-q52c, GHSA-5j59-xgg2-r9c4) - CVSS 7.5 - ✅ Fixed in 14.2.35
- **Next.js Cache Poisoning** (GHSA-qpjv-v59x-3qc4) - ✅ Fixed in 14.2.35
- **Next.js Image Optimization XSS** (GHSA-xv57-4mr9-wg8v) - ✅ Fixed in 14.2.35
- **PrismJS DOM Clobbering** - ✅ Fixed by removing react-code-blocks dependency

#### Dependency Updates
- Updated Next.js from 14.2.12 to 14.2.35
- Updated AWS SDK packages to 3.954.0
- Updated Material-UI packages to 6.5.0
- Updated Emotion packages to latest
- Removed vulnerable react-code-blocks dependency

#### Known Issues (Low Risk)

**Development Dependencies Only**
- `glob` (10.2.0 - 10.4.5) - Command injection vulnerability
  - **Impact**: Development/linting only, not in production build
  - **Severity**: High (dev-only)
  - **Mitigation**: Not used in production runtime
  - **Fix**: Requires Next.js 16 upgrade (major version change)
  - **Status**: Accepted risk for dev dependencies

These vulnerabilities are in ESLint configuration packages and are not included in the production Docker image or runtime.

## Security Scanning

### Automated Checks
The project includes automated security scanning in the CI/CD pipeline:
- **npm audit** runs on every build and PR
- Only critical vulnerabilities in production dependencies block releases
- Development dependency vulnerabilities are reported but don't fail builds
- Audit reports are archived for 30 days

### Local Security Checks
Run security audits locally:

```bash
# Check production dependencies only
npm run audit

# Check all dependencies (including dev)
npm audit

# Attempt automatic fixes
npm run audit:fix

# Check for critical/high severity issues
npm audit --audit-level=high
```

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email the maintainer with details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

### AWS Credentials
- **Never commit AWS credentials** to the repository
- Use AWS profiles or IAM roles in production
- Mount credentials as read-only in Docker: `-v ~/.aws:/root/.aws:ro`
- Prefer default credential chain over manual credentials

### Docker Security
- Images run as non-root user (UID 1001)
- Multi-stage builds minimize attack surface
- Standalone Next.js output reduces dependencies
- Images are signed with cosign for verification

### Runtime Security
- Server-side AWS operations prevent credential exposure
- Input validation on all API routes
- Request throttling prevents DoS attacks
- Circuit breaker pattern for external service failures
- Memory limits prevent unbounded growth

### Dependencies
- Regular security updates via automated scanning
- Production dependencies separated from dev dependencies
- Minimal dependency tree in production builds
- Automated vulnerability alerts via GitHub

## Security Features

- **Authentication**: Support for AWS profiles, IAM roles, and credential chain
- **Authorization**: All AWS operations server-side only
- **Input Validation**: Sanitization of user inputs in API routes
- **Rate Limiting**: Request throttling and deduplication
- **Error Handling**: No sensitive data in error messages
- **Logging**: Credential redaction in logs
- **Docker**: Non-root user, read-only mounts, signed images

## Compliance

This project follows:
- OWASP Top 10 security best practices
- AWS security best practices for credential management
- Docker security best practices for containerization
- Secure coding practices for Node.js applications

## Updates

Last updated: December 17, 2025

For the latest security information, check:
- [npm audit report](https://github.com/wstolk/kinesis-web-consumer/actions)
- [Dependency updates](package.json)
- [Known vulnerabilities](#known-issues-low-risk)
