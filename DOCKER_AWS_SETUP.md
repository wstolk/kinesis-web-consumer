# AWS Profile & Credential Chain - Docker Setup

## AWS Profiles (Recommended)

Mount your AWS configuration to use profiles from `~/.aws/config` and `~/.aws/credentials`:

```bash
# Mount AWS credentials directory (recommended)
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  kinesis-web-consumer

# Use specific profile
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE=my-production-profile \
  kinesis-web-consumer

# LocalStack with mounted profiles
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE=localstack \
  kinesis-web-consumer
```

## Environment Variables for Docker

When AWS profiles are not available, you can pass AWS credentials via environment variables:

```bash
# Run with AWS environment variables (fallback option)
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret_key \
  -e AWS_SESSION_TOKEN=your_session_token \
  -e AWS_DEFAULT_REGION=eu-central-1 \
  kinesis-web-consumer

# Note: Profiles are preferred over environment variables
# Or mount AWS credentials directory (recommended)
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  kinesis-web-consumer
```

## Profile Configuration Examples

Create profiles in `~/.aws/config` and `~/.aws/credentials`:

### ~/.aws/config
```ini
[default]
region = eu-central-1

[profile production]
region = us-east-1

[profile localstack]
region = us-east-1
endpoint_url = http://localhost:4566
```

### ~/.aws/credentials
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

[production]
aws_access_key_id = PROD_ACCESS_KEY
aws_secret_access_key = PROD_SECRET_KEY

[localstack]
aws_access_key_id = test
aws_secret_access_key = test
```

## EC2/ECS IAM Roles

For production deployments, use IAM roles:

```bash
# EC2 instance with IAM role
docker run -p 3000:3000 kinesis-web-consumer

# ECS task with IAM role
# No additional configuration needed - AWS SDK will automatically discover credentials
```

## LocalStack with AWS Profiles

```bash
# LocalStack with profile configuration
docker run -p 3000:3000 \
  -v ~/.aws:/root/.aws:ro \
  -e AWS_PROFILE=localstack \
  kinesis-web-consumer

# Or with environment override (fallback)
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=test \
  -e AWS_SECRET_ACCESS_KEY=test \
  -e AWS_DEFAULT_REGION=us-east-1 \
  kinesis-web-consumer
```