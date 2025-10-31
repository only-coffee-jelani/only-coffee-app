# Kinesis Event Processor Lambda Function

AWS Lambda function that processes user behavioral events from Kinesis Data Stream in real-time.

## Function Overview

**Trigger**: AWS Kinesis Data Stream (`only-coffee-user-events`)
**Runtime**: Node.js 18.x
**Memory**: 256 MB
**Timeout**: 60 seconds
**Batch Size**: 100 records
**Batching Window**: 5 seconds

## What It Does

This Lambda function processes events from the Kinesis stream and:

1. **Updates User Profiles** - Updates real-time metrics in PostgreSQL `user_profiles` table
   - Last activity timestamps
   - Purchase counts and lifetime value
   - App open counts
   - Cart abandonment rates
   - Streak milestones

2. **Streams to BigQuery** - Sends events to Google BigQuery for long-term analytics
   - All events are stored for data warehouse queries
   - Powers ML model training datasets

3. **Triggers AI Promotions** - Detects high-value events and queues promotion generation
   - Purchase completed
   - Cart abandoned
   - Streak milestones (7, 14, 30 days)
   - Geofence entered (near store)
   - Weather-based triggers
   - Churn risk detected

## Environment Variables

Set these in AWS Lambda configuration:

```env
# PostgreSQL Database
DB_HOST=only-coffee-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=only_coffee
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_SSL=true

# Google BigQuery
BIGQUERY_PROJECT_ID=only-coffee-analytics
BIGQUERY_DATASET=user_events
BIGQUERY_KEY_FILE=/var/task/bigquery-key.json
```

## Deployment

### Prerequisites

1. **AWS IAM Role** with permissions:
   - Kinesis: `GetRecords`, `GetShardIterator`, `DescribeStream`, `ListStreams`
   - CloudWatch Logs: `CreateLogGroup`, `CreateLogStream`, `PutLogEvents`
   - VPC (if RDS in VPC): `CreateNetworkInterface`, `DescribeNetworkInterfaces`, `DeleteNetworkInterface`

2. **Kinesis Stream** created:
   ```bash
   aws kinesis create-stream \
     --stream-name only-coffee-user-events \
     --shard-count 1 \
     --region us-east-1
   ```

3. **BigQuery Setup**:
   - Project created: `only-coffee-analytics`
   - Dataset created: `user_events`
   - Service account key downloaded: `bigquery-key.json`

### Deploy the Function

```bash
# Set environment variables
export AWS_LAMBDA_ROLE_ARN="arn:aws:iam::YOUR-ACCOUNT-ID:role/OnlyCoffeeLambdaRole"
export AWS_ACCOUNT_ID="YOUR-ACCOUNT-ID"
export DB_HOST="your-db-host"
export DB_NAME="only_coffee"
export DB_USER="postgres"
export DB_PASSWORD="your-password"
export BIGQUERY_PROJECT_ID="only-coffee-analytics"
export BIGQUERY_DATASET="user_events"

# Deploy
cd backend/lambda/kinesis-event-processor
chmod +x deploy.sh
./deploy.sh
```

This will:
1. Install Node.js dependencies
2. Package the function code
3. Create/update the Lambda function
4. Set up Kinesis event source mapping
5. Configure environment variables

## Testing

### Test with Sample Event

```bash
# Create test event
cat > test-event.json <<EOF
{
  "Records": [
    {
      "kinesis": {
        "data": "$(echo '{
          "eventId": "test-123",
          "userId": "user-456",
          "eventType": "purchase_completed",
          "timestamp": "2024-01-01T12:00:00Z",
          "metadata": {
            "totalAmount": 25.50,
            "items": [
              {"menuItemId": "item-1", "name": "Latte"}
            ]
          },
          "sessionId": "session-789",
          "deviceType": "iOS",
          "appVersion": "1.0.0",
          "streamedAt": "2024-01-01T12:00:00Z",
          "source": "only-coffee-backend"
        }' | base64)",
        "partitionKey": "user-456"
      },
      "eventID": "shardId-000000000000:49590338271490256608559692538361571095921575989136588898",
      "eventSource": "aws:kinesis"
    }
  ]
}
EOF

# Invoke Lambda
aws lambda invoke \
  --function-name only-coffee-kinesis-processor \
  --payload file://test-event.json \
  --region us-east-1 \
  output.json

# Check result
cat output.json
```

### Monitor Logs

```bash
# Tail CloudWatch logs
aws logs tail /aws/lambda/only-coffee-kinesis-processor \
  --follow \
  --region us-east-1
```

### Check Kinesis Stream Status

```bash
# Describe stream
aws kinesis describe-stream \
  --stream-name only-coffee-user-events \
  --region us-east-1

# Get event source mapping
aws lambda list-event-source-mappings \
  --function-name only-coffee-kinesis-processor \
  --region us-east-1
```

## Monitoring

### CloudWatch Metrics

The function emits standard Lambda metrics:
- **Invocations**: Number of times function is invoked
- **Duration**: Execution time in milliseconds
- **Errors**: Number of errors
- **Throttles**: Number of throttled requests
- **IteratorAge**: Age of the last Kinesis record processed (should be < 1 second)

### Alarms to Set Up

```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name kinesis-processor-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=only-coffee-kinesis-processor

# High iterator age (processing lag)
aws cloudwatch put-metric-alarm \
  --alarm-name kinesis-processor-lag \
  --alarm-description "Alert on processing lag" \
  --metric-name IteratorAge \
  --namespace AWS/Lambda \
  --statistic Maximum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 60000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=only-coffee-kinesis-processor
```

## Performance

### Batch Processing
- Processes up to 100 records per invocation
- 5-second batching window for efficiency
- Parallel processing of profile updates, BigQuery inserts, and promotion triggers

### Cost Optimization
- **Lambda**: ~5K invocations/day × $0.20/1M = ~$0.001/day
- **Kinesis**: 1 shard × $0.015/hour = $0.36/day (always on)
- **BigQuery**: 100MB/day streaming inserts = FREE (10GB/day limit)

**Total**: ~$0.37/day = $11/month (well within free tier for Lambda and BigQuery)

## Troubleshooting

### Common Issues

**1. "Cannot connect to PostgreSQL"**
- Ensure Lambda has VPC access to RDS
- Check security group allows Lambda's security group
- Verify DB credentials in environment variables

**2. "BigQuery permission denied"**
- Ensure service account has `BigQuery Data Editor` role
- Check `bigquery-key.json` is included in deployment package
- Verify `BIGQUERY_KEY_FILE` path is correct

**3. "IteratorAge increasing"**
- Function is processing slower than events arriving
- Increase Lambda memory (more CPU)
- Add more Kinesis shards for parallel processing
- Optimize database queries

**4. "Throttling errors"**
- Increase Lambda reserved concurrency
- Add more Kinesis shards to spread load
- Optimize function duration

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Run locally (requires PostgreSQL and BigQuery access)
node -e "
const handler = require('./index').handler;
const event = require('./test-event.json');
handler(event).then(console.log).catch(console.error);
"
```

### Update Function Code Only

```bash
# Quick update without full deployment
zip -r function.zip index.js node_modules/ package.json

aws lambda update-function-code \
  --function-name only-coffee-kinesis-processor \
  --zip-file fileb://function.zip \
  --region us-east-1
```

## Architecture

```
User Events Flow:
┌──────────────┐
│ Mobile App   │
└──────┬───────┘
       │ HTTP POST /api/v1/events/track
       ▼
┌──────────────┐
│ API Gateway  │ EventsService
└──────┬───────┘
       │ Save to PostgreSQL + Push to Kinesis
       ▼
┌──────────────┐
│   Kinesis    │ Data Stream (1 shard)
│ Data Stream  │
└──────┬───────┘
       │ Trigger Lambda (batches of 100)
       ▼
┌──────────────┐
│   Lambda     │ This Function
│  Processor   │
└──────┬───────┘
       │
       ├─► Update PostgreSQL (user_profiles)
       ├─► Insert to BigQuery (analytics)
       └─► Queue AI Promotions (high-value events)
```

## Next Steps

After deploying this function:
1. Enable Kinesis streaming in backend: `ENABLE_KINESIS=true`
2. Monitor CloudWatch logs for first events
3. Verify BigQuery table receives data
4. Set up CloudWatch alarms for errors/lag
5. Implement Phase 2: ML models for segmentation and churn prediction
