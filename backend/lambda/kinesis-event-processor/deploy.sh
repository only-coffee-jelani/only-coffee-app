#!/bin/bash

# Deploy Kinesis Event Processor Lambda Function
# This script packages and deploys the Lambda function to AWS

set -e

FUNCTION_NAME="only-coffee-kinesis-processor"
REGION="us-east-1"
ROLE_ARN="${AWS_LAMBDA_ROLE_ARN}"

echo "📦 Installing dependencies..."
npm install --production

echo "📦 Creating deployment package..."
zip -r function.zip index.js node_modules/ package.json

echo "🚀 Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION
else
  echo "Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 60 \
    --memory-size 256 \
    --region $REGION \
    --environment Variables="{
      DB_HOST=${DB_HOST},
      DB_PORT=${DB_PORT},
      DB_NAME=${DB_NAME},
      DB_USER=${DB_USER},
      DB_PASSWORD=${DB_PASSWORD},
      DB_SSL=true,
      BIGQUERY_PROJECT_ID=${BIGQUERY_PROJECT_ID},
      BIGQUERY_DATASET=${BIGQUERY_DATASET},
      BIGQUERY_KEY_FILE=/var/task/bigquery-key.json
    }"
fi

echo "🔗 Setting up Kinesis event source mapping..."

# Check if event source mapping exists
MAPPING_UUID=$(aws lambda list-event-source-mappings \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query "EventSourceMappings[?contains(EventSourceArn, 'only-coffee-user-events')].UUID" \
  --output text)

if [ -z "$MAPPING_UUID" ]; then
  echo "Creating event source mapping..."
  aws lambda create-event-source-mapping \
    --function-name $FUNCTION_NAME \
    --event-source-arn arn:aws:kinesis:${REGION}:${AWS_ACCOUNT_ID}:stream/only-coffee-user-events \
    --starting-position LATEST \
    --batch-size 100 \
    --maximum-batching-window-in-seconds 5 \
    --region $REGION
else
  echo "Event source mapping already exists: $MAPPING_UUID"
fi

echo "✅ Deployment complete!"
echo ""
echo "Function ARN:"
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query 'Configuration.FunctionArn' --output text

# Cleanup
rm -f function.zip

echo ""
echo "To test the function:"
echo "aws lambda invoke --function-name $FUNCTION_NAME --region $REGION output.json"
