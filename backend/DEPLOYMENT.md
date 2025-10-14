# Only Coffee Backend Deployment Guide - AWS Elastic Beanstalk

## Prerequisites

1. **AWS Account** - Sign up at https://aws.amazon.com
2. **AWS CLI** - Install from https://aws.amazon.com/cli/
3. **EB CLI** - Install Elastic Beanstalk CLI:
   ```bash
   pip install awsebcli --upgrade --user
   ```
4. **Node.js 20+** and **npm 10+**

## Step 1: AWS Account Setup

### 1.1 Configure AWS CLI
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `us-east-1`
- Default output format: `json`

### 1.2 Create IAM User for Deployment
1. Go to AWS Console → IAM → Users → Create User
2. User name: `only-coffee-deployer`
3. Attach policies:
   - `AWSElasticBeanstalkFullAccess`
   - `AmazonRDSFullAccess`
   - `ElastiCacheFullAccess`
   - `IAMFullAccess`
4. Create access keys and save them

## Step 2: Database Setup (RDS PostgreSQL)

### 2.1 Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier only-coffee-prod-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --publicly-accessible false
```

**Note**: Save the endpoint URL that's created - you'll need it for `.env.production`

### 2.2 Alternative: Create via AWS Console
1. Go to AWS Console → RDS → Create database
2. Choose PostgreSQL
3. Template: Free tier (for testing) or Production
4. DB instance identifier: `only-coffee-prod-db`
5. Master username: `postgres`
6. Master password: **Create a strong password**
7. Instance configuration: db.t3.micro (or larger for production)
8. Storage: 20 GB minimum
9. Enable automated backups
10. Create database

## Step 3: Redis Setup (ElastiCache)

### 3.1 Create ElastiCache Redis Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id only-coffee-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --engine-version 7.0
```

**Note**: Save the configuration endpoint - you'll need it for `.env.production`

### 3.2 Alternative: Create via AWS Console
1. Go to AWS Console → ElastiCache → Create cluster
2. Choose Redis
3. Cluster name: `only-coffee-redis`
4. Node type: cache.t3.micro
5. Number of replicas: 0 (for dev), 1-2 (for production)
6. Create cluster

## Step 4: Initialize Elastic Beanstalk

### 4.1 Initialize EB Application
```bash
cd backend
eb init
```

Answer the prompts:
- Select region: `us-east-1`
- Application name: `only-coffee-backend`
- Platform: `Node.js`
- Platform version: `Node.js 20 running on 64bit Amazon Linux 2023`
- CodeCommit: `No`
- SSH: `Yes` (recommended for debugging)

### 4.2 Create Environment
```bash
eb create only-coffee-production \
  --instance-type t3.small \
  --envvars NODE_ENV=production,PORT=3000 \
  --single
```

This creates:
- EC2 instance
- Load balancer
- Auto-scaling group
- Security groups
- CloudWatch logs

## Step 5: Configure Environment Variables

### 5.1 Set Environment Variables via EB CLI
```bash
eb setenv \
  NODE_ENV=production \
  DB_HOST=your-rds-endpoint.us-east-1.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USERNAME=postgres \
  DB_PASSWORD=YOUR_DB_PASSWORD \
  DB_DATABASE=only_coffee_prod \
  REDIS_HOST=your-redis-endpoint.cache.amazonaws.com \
  REDIS_PORT=6379 \
  JWT_SECRET=YOUR_SECURE_JWT_SECRET \
  JWT_REFRESH_SECRET=YOUR_SECURE_REFRESH_SECRET \
  STRIPE_SECRET_KEY=sk_live_YOUR_KEY \
  GOOGLE_CLIENT_ID=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com
```

### 5.2 Or Set via AWS Console
1. Go to Elastic Beanstalk → Environments → only-coffee-production
2. Configuration → Software → Environment properties
3. Add each variable from `.env.production`

## Step 6: Deploy Application

### 6.1 Build Application
```bash
npm run build
```

### 6.2 Deploy to Elastic Beanstalk
```bash
eb deploy
```

This will:
1. Create deployment package
2. Upload to S3
3. Deploy to EC2 instances
4. Run prebuild hooks
5. Start application
6. Health check

### 6.3 Monitor Deployment
```bash
eb status
eb health
eb logs
```

## Step 7: Run Database Migrations

### 7.1 SSH into Instance
```bash
eb ssh
```

### 7.2 Run Migrations
```bash
cd /var/app/current
npm run migration:run
```

### 7.3 Exit SSH
```bash
exit
```

## Step 8: Configure SSL Certificate

### 8.1 Request Certificate in ACM
```bash
aws acm request-certificate \
  --domain-name api.onlycoffee.com \
  --validation-method DNS
```

### 8.2 Validate Domain
1. Go to ACM Console
2. View certificate details
3. Add CNAME records to your DNS provider
4. Wait for validation (usually 5-30 minutes)

### 8.3 Update Load Balancer
1. Go to EC2 → Load Balancers
2. Select your EB load balancer
3. Add listener: HTTPS:443
4. Select your ACM certificate
5. Forward to target group

### 8.4 Update `.ebextensions/https.config`
Replace `CERTIFICATE_ID` with your ACM certificate ARN

## Step 9: Configure Custom Domain

### 9.1 Get Load Balancer DNS
```bash
eb status
```
Look for "CNAME" - this is your EB environment URL

### 9.2 Create DNS Records
In your DNS provider (Route 53, Cloudflare, etc.):
- Create CNAME record: `api.onlycoffee.com` → `your-env.us-east-1.elasticbeanstalk.com`

## Step 10: Set Up Monitoring

### 10.1 CloudWatch Alarms
```bash
# CPU Utilization
aws cloudwatch put-metric-alarm \
  --alarm-name only-coffee-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### 10.2 Set Up Log Streaming
```bash
eb logs --stream
```

## Common Commands

### Deploy Updates
```bash
npm run build
eb deploy
```

### View Logs
```bash
eb logs                    # Download logs
eb logs --stream          # Stream logs in real-time
```

### Check Status
```bash
eb status                  # Environment status
eb health                  # Instance health
```

### Open Application
```bash
eb open
```

### Update Environment
```bash
eb config                  # Edit configuration
eb setenv KEY=value       # Set environment variable
```

### Scale Application
```bash
eb scale 3                 # Scale to 3 instances
```

### Terminate Environment
```bash
eb terminate only-coffee-production
```

## Troubleshooting

### Application Won't Start
1. Check logs: `eb logs`
2. SSH into instance: `eb ssh`
3. Check build output: `cat /var/log/eb-engine.log`
4. Check application logs: `pm2 logs` or check CloudWatch

### Database Connection Issues
1. Verify RDS security group allows inbound on port 5432
2. Add EB security group to RDS security group inbound rules
3. Check DB_HOST environment variable
4. Test connection: `eb ssh` then `psql -h DB_HOST -U postgres`

### Redis Connection Issues
1. Verify ElastiCache security group allows inbound on port 6379
2. Add EB security group to ElastiCache security group inbound rules
3. Check REDIS_HOST environment variable

### 502 Bad Gateway
1. Application isn't listening on PORT 3000
2. Check health check endpoint: `/health`
3. Application crashed - check logs

### Out of Memory
1. Increase instance type: `eb scale --instance-type t3.medium`
2. Check for memory leaks in application
3. Add swap space (not recommended for production)

## Cost Estimation

### Development Environment
- EC2 t3.micro: ~$8/month
- RDS db.t3.micro: ~$15/month
- ElastiCache cache.t3.micro: ~$12/month
- Load Balancer: ~$16/month
- **Total: ~$51/month**

### Production Environment
- EC2 t3.small (2 instances): ~$30/month
- RDS db.t3.small: ~$30/month
- ElastiCache cache.t3.small: ~$25/month
- Load Balancer: ~$16/month
- Data transfer: ~$10/month
- **Total: ~$111/month**

## Security Best Practices

1. **Never commit `.env.production`** - Add to `.gitignore`
2. **Use AWS Secrets Manager** for sensitive data
3. **Enable VPC** for RDS and ElastiCache (not publicly accessible)
4. **Configure Security Groups** to only allow necessary traffic
5. **Enable SSL/TLS** for all production traffic
6. **Rotate credentials** regularly
7. **Enable CloudWatch** logging and monitoring
8. **Set up alerts** for errors and high resource usage

## Next Steps

1. Set up CI/CD with GitHub Actions
2. Configure auto-scaling policies
3. Set up staging environment
4. Implement blue-green deployments
5. Add WAF (Web Application Firewall)
6. Set up CloudFront CDN
7. Implement backup strategies

## Support

- AWS Documentation: https://docs.aws.amazon.com/elastic-beanstalk/
- EB CLI Reference: https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html
