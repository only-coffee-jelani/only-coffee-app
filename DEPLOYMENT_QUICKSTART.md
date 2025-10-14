# Only Coffee - Backend Deployment Quick Start

## 🚀 Deploy to AWS in 30 Minutes

This guide will get your Only Coffee backend deployed to AWS Elastic Beanstalk quickly.

## Prerequisites (5 minutes)

1. **AWS Account** - Create at https://aws.amazon.com (free tier available)
2. **Install AWS CLI**:
   ```bash
   # macOS
   brew install awscli

   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   ```

3. **Install EB CLI**:
   ```bash
   pip install awsebcli --upgrade --user
   ```

4. **Install Node.js 20**:
   ```bash
   # macOS
   brew install node@20

   # Or download from: https://nodejs.org/
   ```

## Step 1: AWS Setup (5 minutes)

### Configure AWS Credentials
```bash
aws configure
```

You'll need:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Shown once when creating access key
- **Region**: `us-east-1`
- **Output format**: `json`

## Step 2: Database Setup (10 minutes)

### Option A: Using AWS Console (Easier)

1. Go to **AWS Console → RDS**
2. Click **Create database**
3. Choose **PostgreSQL**
4. Select **Free tier** template
5. Settings:
   - **DB instance identifier**: `only-coffee-db`
   - **Master username**: `postgres`
   - **Master password**: Create a strong password (save it!)
6. Click **Create database**
7. Wait 5-10 minutes for creation
8. Copy the **Endpoint** URL (looks like: `only-coffee-db.xxxx.us-east-1.rds.amazonaws.com`)

### Option B: Using CLI (Faster)

```bash
aws rds create-db-instance \
  --db-instance-identifier only-coffee-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password Dieb4utr1I! \
  --allocated-storage 20
```

## Step 3: Redis Setup (5 minutes)

### Using AWS Console
1. Go to **AWS Console → ElastiCache**
2. Click **Create cluster → Redis**
3. Settings:
   - **Name**: `only-coffee-redis`
   - **Node type**: `cache.t3.micro`
4. Click **Create**
5. Copy the **Configuration endpoint**

### Using CLI
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id only-coffee-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

## Step 4: Initialize Elastic Beanstalk (3 minutes)

```bash
cd backend
eb init
```

Answer prompts:
- **Region**: `us-east-1`
- **Application name**: `only-coffee-backend`
- **Platform**: `Node.js`
- **Platform version**: Select `Node.js 20`
- **CodeCommit**: `n` (No)
- **SSH**: `y` (Yes - recommended)

## Step 5: Create Environment (5 minutes)

```bash
eb create only-coffee-prod --single
```

This creates:
- EC2 instance
- Load balancer
- Security groups
- Auto-scaling

Wait 5-10 minutes for environment creation.

## Step 6: Set Environment Variables (2 minutes)

Replace the placeholder values with your actual credentials:

```bash
eb setenv \
  NODE_ENV=production \
  PORT=3000 \
  DB_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USERNAME=postgres \
  DB_PASSWORD=Dieb4utr1I! \
  DB_DATABASE=only_coffee_prod \
  REDIS_HOST=your-redis-endpoint.cache.amazonaws.com \
  REDIS_PORT=6379 \
  JWT_SECRET=$(openssl rand -base64 32) \
  JWT_REFRESH_SECRET=$(openssl rand -base64 32) \
  GOOGLE_CLIENT_ID=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com \
  STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY \
  CORS_ORIGIN=https://api.onlycoffee.com
```

## Step 7: Deploy (3 minutes)

```bash
# Build the application
npm run build

# Deploy to Elastic Beanstalk
eb deploy
```

Wait 3-5 minutes for deployment.

## Step 8: Run Migrations (2 minutes)

```bash
# SSH into the instance
eb ssh

# Navigate to app directory
cd /var/app/current

# Run migrations
npm run migration:run

# Exit SSH
exit
```

## Step 9: Seed Store Locations (1 minute)

```bash
# SSH into instance
eb ssh

# Connect to database
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE

# Copy and paste contents of seed-stores.sql
# Then exit
\q
exit
```

## Step 10: Verify Deployment ✅

```bash
# Check status
eb status

# View logs
eb logs

# Open in browser
eb open
```

Your API should be live at: `http://your-env.us-east-1.elasticbeanstalk.com`

Test the health endpoint:
```bash
curl http://your-env.us-east-1.elasticbeanstalk.com/health
```

## Update iOS App

Update `APIClient.swift` in your iOS app:

```swift
#if DEBUG
private let baseURL = "http://localhost:3000/api/v1"
#else
private let baseURL = "http://your-env.us-east-1.elasticbeanstalk.com/api/v1"
#endif
```

## Common Issues & Solutions

### Issue: Can't connect to database
**Solution**: Update RDS security group to allow inbound from EB security group
```bash
# Get EB security group
aws ec2 describe-security-groups --filters "Name=group-name,Values=*ElasticBeanstalk*"

# Add to RDS security group inbound rules in AWS Console
```

### Issue: Application not starting
**Solution**: Check logs
```bash
eb logs
# Look for errors in /var/log/web.stdout.log
```

### Issue: 502 Bad Gateway
**Solution**: Verify application is listening on PORT 3000
```bash
eb ssh
curl localhost:3000/health
```

## Monitoring & Maintenance

### View Logs in Real-Time
```bash
eb logs --stream
```

### Check Application Health
```bash
eb health --refresh
```

### Update Application
```bash
# Make code changes
npm run build
eb deploy
```

### Scale Up
```bash
# Increase to 2 instances
eb scale 2

# Change instance type
eb scale --instance-type t3.small
```

## Cost Breakdown

**Monthly Costs (Estimated):**
- EC2 t3.micro: $8
- RDS db.t3.micro: $15
- ElastiCache cache.t3.micro: $12
- Load Balancer: $16
- **Total: ~$51/month**

**Free Tier Eligible:** First 12 months with AWS Free Tier

## Next Steps

1. **Set up SSL certificate** (Let's Encrypt or AWS Certificate Manager)
2. **Configure custom domain** (api.onlycoffee.com)
3. **Set up monitoring** (CloudWatch alarms)
4. **Configure CI/CD** (GitHub Actions)
5. **Set up staging environment**
6. **Enable auto-scaling**

## Need Help?

- Full deployment guide: See `DEPLOYMENT.md`
- AWS Support: https://console.aws.amazon.com/support/
- Elastic Beanstalk docs: https://docs.aws.amazon.com/elasticbeanstalk/

## Quick Commands Reference

```bash
# Deploy
eb deploy

# View status
eb status

# View logs
eb logs

# SSH into instance
eb ssh

# Open in browser
eb open

# Set environment variable
eb setenv KEY=value

# Terminate environment
eb terminate
```

---

**🎉 Congratulations! Your Only Coffee backend is now live!**

Test your API at: `http://your-env.us-east-1.elasticbeanstalk.com/health`
