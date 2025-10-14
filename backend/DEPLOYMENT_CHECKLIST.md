# Only Coffee Backend - Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment Setup

### AWS Account Setup
- [ ] Create AWS account at https://aws.amazon.com
- [ ] Set up billing alerts (recommended: alert at $10, $50, $100)
- [ ] Create IAM user for deployment
- [ ] Download and save access keys
- [ ] Install AWS CLI: `brew install awscli` or https://aws.amazon.com/cli/
- [ ] Run `aws configure` with your credentials
- [ ] Install EB CLI: `pip install awsebcli --upgrade --user`

### Database Setup (AWS RDS)
- [ ] Create PostgreSQL RDS instance (db.t3.micro for dev)
- [ ] Note down the endpoint URL
- [ ] Note down the master password
- [ ] Configure security groups (allow inbound from EB)
- [ ] Create database: `only_coffee_prod`

### Redis Setup (AWS ElastiCache)
- [ ] Create ElastiCache Redis cluster (cache.t3.micro)
- [ ] Note down the configuration endpoint
- [ ] Configure security groups (allow inbound from EB)

### Environment Variables
- [ ] Copy `.env.example` to `.env.production`
- [ ] Fill in DB_HOST with RDS endpoint
- [ ] Fill in DB_PASSWORD with secure password
- [ ] Fill in REDIS_HOST with ElastiCache endpoint
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Generate JWT_REFRESH_SECRET: `openssl rand -base64 32`
- [ ] Add Google OAuth credentials
- [ ] Add Stripe production keys (not test keys!)
- [ ] Add Toast POS API credentials
- [ ] Set CORS_ORIGIN to your domain
- [ ] Verify all placeholder values are replaced
- [ ] **NEVER commit .env.production to git**

## Elastic Beanstalk Setup

### Initialize Application
- [ ] Navigate to backend directory: `cd backend`
- [ ] Run `eb init`
  - [ ] Select region: `us-east-1`
  - [ ] Application name: `only-coffee-backend`
  - [ ] Platform: `Node.js`
  - [ ] Platform version: `Node.js 20`
  - [ ] SSH: Yes (recommended)

### Create Environment
- [ ] Run `eb create only-coffee-prod --single`
- [ ] Wait for environment creation (~5-10 minutes)
- [ ] Verify creation: `eb status`

### Configure Environment
- [ ] Set all environment variables using `eb setenv`
- [ ] Or set via AWS Console → EB → Configuration → Environment properties
- [ ] Verify health check endpoint: `/health`

## Pre-Deployment Checks

### Code Review
- [ ] All dependencies installed: `npm install`
- [ ] Code compiles without errors: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed
- [ ] API endpoints return correct status codes
- [ ] Error handling implemented

### Security Review
- [ ] `.gitignore` includes `.env.production`
- [ ] No hardcoded secrets in code
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database uses strong password
- [ ] CORS configured for specific domains
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (using TypeORM)
- [ ] XSS protection (using Helmet)

### Database Review
- [ ] Migration files created
- [ ] Migrations tested locally
- [ ] Seed data prepared (seed-stores.sql)
- [ ] Backup strategy planned
- [ ] Database indexes defined

## Deployment

### Build and Deploy
- [ ] Run build: `npm run build`
- [ ] Verify dist/ folder created
- [ ] Run deployment script: `./deploy.sh`
- [ ] Or deploy manually: `eb deploy`
- [ ] Wait for deployment (~3-5 minutes)
- [ ] Check deployment status: `eb status`

### Post-Deployment Tasks
- [ ] SSH into instance: `eb ssh`
- [ ] Navigate to app: `cd /var/app/current`
- [ ] Run migrations: `npm run migration:run`
- [ ] Exit SSH: `exit`
- [ ] Test health endpoint: `curl http://your-env.elasticbeanstalk.com/health`
- [ ] Verify logs: `eb logs`

### Seed Data
- [ ] SSH into instance: `eb ssh`
- [ ] Connect to database: `psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE`
- [ ] Run seed-stores.sql contents
- [ ] Verify stores created: `SELECT * FROM store;`
- [ ] Exit: `\q` then `exit`

## Verification

### API Testing
- [ ] Health check responds: `/health`
- [ ] Authentication endpoints work: `/auth/login`
- [ ] Store endpoints return data: `/stores`
- [ ] Menu endpoints work: `/menu`
- [ ] Orders can be created: `/orders`
- [ ] Error responses are correct (404, 500, etc.)

### Database Connectivity
- [ ] Application connects to RDS successfully
- [ ] Queries execute without errors
- [ ] Connection pooling working
- [ ] No connection timeout errors

### Redis Connectivity
- [ ] Application connects to ElastiCache
- [ ] Session storage works
- [ ] Caching works
- [ ] No Redis connection errors

### Performance
- [ ] Response times acceptable (<200ms for simple queries)
- [ ] No memory leaks
- [ ] CPU usage reasonable (<50% average)
- [ ] Database query performance acceptable

### Monitoring
- [ ] CloudWatch logs enabled
- [ ] Error logs visible: `eb logs`
- [ ] Health dashboard accessible: `eb health`
- [ ] Set up CloudWatch alarms (CPU, memory, errors)

## iOS App Integration

### Update iOS App
- [ ] Update API base URL in `APIClient.swift`
- [ ] Change from localhost to EB URL
- [ ] Test API calls from iOS app
- [ ] Verify authentication works
- [ ] Test all features end-to-end

### Testing
- [ ] Create test account
- [ ] Login from iOS app
- [ ] Browse menu
- [ ] Add items to cart
- [ ] Create order
- [ ] View order history
- [ ] Test rewards
- [ ] Test profile updates

## SSL & Domain (Optional but Recommended)

### SSL Certificate
- [ ] Request certificate in ACM
- [ ] Validate domain ownership
- [ ] Wait for certificate approval
- [ ] Update `.ebextensions/https.config` with certificate ARN
- [ ] Deploy changes

### Custom Domain
- [ ] Purchase domain (api.onlycoffee.com)
- [ ] Create CNAME record pointing to EB environment
- [ ] Wait for DNS propagation
- [ ] Test HTTPS access
- [ ] Update iOS app with HTTPS URL

## Post-Launch

### Monitoring Setup
- [ ] Set up error alerts (Sentry or CloudWatch)
- [ ] Set up performance monitoring
- [ ] Set up uptime monitoring (UptimeRobot or Pingdom)
- [ ] Configure log retention

### Backup Strategy
- [ ] Enable RDS automated backups (7-30 days)
- [ ] Test restore from backup
- [ ] Document backup procedures
- [ ] Set up manual backup schedule

### Documentation
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Document troubleshooting steps
- [ ] Share credentials with team (use password manager)

### Scaling Preparation
- [ ] Set up auto-scaling policies
- [ ] Test load balancer health checks
- [ ] Configure CloudWatch alarms for scaling
- [ ] Document scaling procedures

## Maintenance

### Regular Tasks
- [ ] Monitor logs weekly
- [ ] Review CloudWatch metrics
- [ ] Update dependencies monthly
- [ ] Security patches as needed
- [ ] Database backups verified
- [ ] SSL certificate renewal (annual)

### Emergency Procedures
- [ ] Document rollback process
- [ ] Test rollback procedure
- [ ] Emergency contact list
- [ ] Incident response plan

## Cost Optimization

### Review Costs
- [ ] Set up AWS Cost Explorer
- [ ] Review monthly bills
- [ ] Identify unused resources
- [ ] Optimize instance sizes
- [ ] Consider reserved instances (for predictable usage)

## Sign-Off

### Deployment Approval
- [ ] Code reviewed by: __________________
- [ ] Security reviewed by: __________________
- [ ] Deployed by: __________________
- [ ] Deployment date: __________________
- [ ] Deployment time: __________________
- [ ] Environment URL: __________________

### Post-Deployment Verification
- [ ] All tests passed
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] iOS app connected successfully
- [ ] Signed off by: __________________
- [ ] Date: __________________

---

## Quick Reference

**Deploy updates:**
```bash
npm run build && eb deploy
```

**View logs:**
```bash
eb logs
eb logs --stream
```

**Check status:**
```bash
eb status
eb health
```

**Emergency rollback:**
```bash
# List versions
eb appversion

# Deploy previous version
eb deploy --version v1_previous
```

**Scale up/down:**
```bash
eb scale 2  # Number of instances
eb scale --instance-type t3.small  # Change instance type
```

---

**Last Updated:** 2025-10-14
**Maintained By:** Only Coffee DevOps Team
