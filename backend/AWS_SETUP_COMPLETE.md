# ✅ AWS EB CLI Setup Complete!

## What Was Done

1. **Updated `.zprofile`** - Added Python 3.9/bin to your PATH
2. **Updated `.bash_profile`** - Cleaned up and added Python path
3. **Verified EB CLI** - Already installed and now accessible

## EB CLI is Ready! 🎉

```bash
$ eb --version
EB CLI 3.25.1 (Python 3.9.6)
```

## Quick Start - Deploy Backend in 30 Minutes

### 1. Configure AWS Credentials (2 minutes)
```bash
aws configure
```

Enter your AWS credentials:
- AWS Access Key ID: [from AWS Console → IAM]
- AWS Secret Access Key: [from AWS Console → IAM]
- Default region: `us-east-1`
- Output format: `json`

### 2. Create Database (10 minutes)
Already done! You set the password in DEPLOYMENT_QUICKSTART.md:
- Password: `Dieb4utr1I!`

```bash
aws rds create-db-instance \
  --db-instance-identifier only-coffee-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password Dieb4utr1I! \
  --allocated-storage 20
```

Wait 5-10 minutes, then get the endpoint:
```bash
aws rds describe-db-instances \
  --db-instance-identifier only-coffee-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

### 3. Create Redis (5 minutes)
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id only-coffee-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1
```

Wait 5 minutes, then get the endpoint:
```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id only-coffee-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text
```

### 4. Initialize EB (3 minutes)
```bash
cd backend
eb init
```

Select:
- Region: `us-east-1`
- Application: `only-coffee-backend`
- Platform: `Node.js 20`
- SSH: `Yes`

### 5. Create Environment (5 minutes)
```bash
eb create only-coffee-prod --single
```

### 6. Set Environment Variables (2 minutes)

First, get your database and redis endpoints from steps 2 and 3, then:

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
  GOOGLE_CLIENT_ID=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com
```

### 7. Deploy (3 minutes)
```bash
npm run build
eb deploy
```

### 8. Run Migrations (2 minutes)
```bash
eb ssh
cd /var/app/current
npm run migration:run
exit
```

### 9. Seed Stores (1 minute)
```bash
eb ssh
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE

# Copy and paste contents from seed-stores.sql
# Then exit:
\q
exit
```

### 10. Test Deployment ✅
```bash
# Check status
eb status

# Get your URL
eb open

# Test health endpoint
curl $(eb status | grep CNAME | awk '{print $2}')/health
```

## Your Backend URL

After deployment, your API will be available at:
```
http://only-coffee-prod.us-east-1.elasticbeanstalk.com
```

## Update iOS App

Update the API URL in your iOS app:

```swift
// mobile/ios/OnlyCoffee/Networking/APIClient.swift

#if DEBUG
private let baseURL = "http://localhost:3000/api/v1"
#else
private let baseURL = "http://only-coffee-prod.us-east-1.elasticbeanstalk.com/api/v1"
#endif
```

## Common EB Commands

```bash
# Deploy updates
eb deploy

# View logs
eb logs
eb logs --stream

# Check status
eb status
eb health

# SSH into instance
eb ssh

# Open in browser
eb open

# Set environment variable
eb setenv KEY=value

# Scale application
eb scale 2                      # Scale to 2 instances
eb scale --instance-type t3.small  # Change instance type

# Terminate environment
eb terminate only-coffee-prod
```

## Troubleshooting

### Can't find eb command
Close and reopen your terminal, then:
```bash
source ~/.zprofile
which eb
```

### Database connection failed
1. Check RDS is running: `aws rds describe-db-instances`
2. Update security group to allow EB traffic
3. Verify DB_HOST environment variable

### Application won't start
```bash
eb logs
# Look for errors in /var/log/web.stdout.log
```

## Next Steps

1. ✅ EB CLI installed and working
2. Follow DEPLOYMENT_QUICKSTART.md for full deployment
3. Use DEPLOYMENT_CHECKLIST.md to track progress
4. Refer to DEPLOYMENT.md for detailed troubleshooting

## Cost Estimate

- EC2 t3.micro: ~$8/month
- RDS db.t3.micro: ~$15/month
- ElastiCache: ~$12/month
- Load Balancer: ~$16/month
- **Total: ~$51/month** (Free tier eligible for 12 months)

---

**Ready to deploy!** 🚀

Follow DEPLOYMENT_QUICKSTART.md starting from Step 1.
