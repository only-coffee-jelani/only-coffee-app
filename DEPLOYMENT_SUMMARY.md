# Only Coffee - Deployment Setup Summary

## ✅ What Was Created

Your backend is now ready for AWS Elastic Beanstalk deployment! Here's everything that was set up:

### Configuration Files

1. **`.elasticbeanstalk/config.yml`**
   - Elastic Beanstalk application configuration
   - Environment settings for production

2. **`.ebextensions/`** (Deployment configurations)
   - `nodecommand.config` - Node.js runtime settings
   - `https.config` - HTTPS/SSL configuration
   - `01_packages.config` - System dependencies

3. **`.platform/hooks/prebuild/`**
   - `01_install_dependencies.sh` - Build script for deployment

4. **`.env.production`**
   - Production environment template
   - ⚠️ **IMPORTANT**: Fill in real credentials before deploying
   - Never commit to git (already in .gitignore)

5. **`.ebignore`**
   - Specifies files to exclude from deployment package

6. **`Procfile`**
   - Tells EB how to start your application

### Database & Migrations

7. **`shared/src/database/data-source.ts`**
   - TypeORM data source configuration
   - Handles production database connections

8. **`run-migrations.sh`**
   - Script to run database migrations on production

9. **`seed-stores.sql`**
   - SQL to insert 4 store locations:
     - New Orleans - 636 St Ann St
     - Houston Food Truck
     - Houston Galleria Mall
     - New York - 433 Broadway

### Deployment Scripts

10. **`deploy.sh`**
    - One-command deployment script
    - Runs tests, builds, and deploys

11. **`.gitignore`**
    - Protects secrets from being committed
    - Excludes production environment files

### Documentation

12. **`DEPLOYMENT.md`**
    - Comprehensive deployment guide
    - Step-by-step AWS setup
    - Troubleshooting section
    - Cost estimates

13. **`DEPLOYMENT_QUICKSTART.md`**
    - 30-minute quick start guide
    - Simplified instructions
    - Common issues & solutions

## 🚀 Next Steps to Deploy

### 1. Fill in Production Secrets (5 minutes)

Edit `backend/.env.production` and replace placeholders with real values:

```bash
# Database (from AWS RDS)
DB_HOST=your-actual-rds-endpoint.us-east-1.rds.amazonaws.com
DB_PASSWORD=your-secure-password

# Redis (from AWS ElastiCache)
REDIS_HOST=your-actual-redis-endpoint.cache.amazonaws.com

# JWT Secrets (generate random strings)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Stripe (from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Toast POS (from toasttab.com)
TOAST_API_KEY=your-key
TOAST_CLIENT_ID=your-id
TOAST_CLIENT_SECRET=your-secret
```

### 2. Install Prerequisites

```bash
# Install AWS CLI
brew install awscli  # macOS
# OR download from: https://aws.amazon.com/cli/

# Install EB CLI
pip install awsebcli --upgrade --user

# Configure AWS credentials
aws configure
```

### 3. Set Up AWS Resources

**Option A: Quick Start (Follow DEPLOYMENT_QUICKSTART.md)**
- 30 minutes total
- Creates RDS PostgreSQL database
- Creates ElastiCache Redis
- Deploys to Elastic Beanstalk

**Option B: Detailed Setup (Follow DEPLOYMENT.md)**
- Complete step-by-step guide
- More configuration options
- SSL setup included

### 4. Deploy

```bash
cd backend

# Initialize EB
eb init

# Create environment
eb create only-coffee-prod

# Set environment variables
eb setenv NODE_ENV=production DB_HOST=xxx ...

# Deploy
./deploy.sh
```

### 5. Run Migrations

```bash
# SSH into instance
eb ssh

# Run migrations
cd /var/app/current
npm run migration:run

# Seed stores
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE < seed-stores.sql
```

### 6. Update iOS App

Update the API URL in your iOS app:

```swift
// mobile/ios/OnlyCoffee/Networking/APIClient.swift
#if DEBUG
private let baseURL = "http://localhost:3000/api/v1"
#else
private let baseURL = "http://your-eb-env.us-east-1.elasticbeanstalk.com/api/v1"
#endif
```

## 📊 Expected Costs

### Development/Testing
- **~$51/month**
  - EC2 t3.micro: $8
  - RDS db.t3.micro: $15
  - ElastiCache: $12
  - Load Balancer: $16

### Production (with scaling)
- **~$111/month**
  - EC2 t3.small (2 instances): $30
  - RDS db.t3.small: $30
  - ElastiCache: $25
  - Load Balancer: $16
  - Data transfer: $10

### Free Tier
- First 12 months: Many services free
- Free tier includes: 750 hours EC2, RDS, etc.

## 🔒 Security Checklist

Before deploying to production:

- [ ] `.env.production` has strong passwords
- [ ] JWT secrets are randomly generated (32+ characters)
- [ ] `.env.production` is in .gitignore
- [ ] Database is not publicly accessible
- [ ] RDS security groups configured
- [ ] SSL certificate configured (in https.config)
- [ ] CORS_ORIGIN set to your actual domain
- [ ] Stripe uses production keys (not test keys)
- [ ] All API keys are from production accounts

## 📝 Store Locations Added

The `seed-stores.sql` file will create these locations:

1. **French Quarter, New Orleans**
   - Address: 636 St Ann St
   - Phone: +1-504-555-0100
   - Email: frenchquarter@onlycoffee.com

2. **Houston Food Truck**
   - Location: Houston, TX
   - Phone: +1-713-555-0200
   - Email: houston@onlycoffee.com

3. **Galleria Mall, Houston**
   - Address: Food Court (Next to Ice Rink)
   - Phone: +1-713-555-0300
   - Email: galleria@onlycoffee.com

4. **SoHo, New York**
   - Address: 433 Broadway
   - Phone: +1-212-555-0400
   - Email: soho@onlycoffee.com

## 🆘 Need Help?

### Quick Commands
```bash
eb status          # Check environment status
eb health          # Check application health
eb logs            # View recent logs
eb logs --stream   # Stream logs in real-time
eb ssh             # SSH into instance
eb deploy          # Deploy updates
eb open            # Open app in browser
```

### Common Issues

**Can't connect to database**
→ Check RDS security groups allow EB security group

**502 Bad Gateway**
→ App not listening on PORT 3000, check logs with `eb logs`

**Migrations fail**
→ Check database credentials in environment variables

**Out of memory**
→ Increase instance type: `eb scale --instance-type t3.small`

### Resources
- AWS EB Docs: https://docs.aws.amazon.com/elasticbeanstalk/
- Full Guide: See `DEPLOYMENT.md`
- Quick Start: See `DEPLOYMENT_QUICKSTART.md`

## ✨ What's Next After Deployment?

1. **Set up custom domain**
   - Register domain (api.onlycoffee.com)
   - Point to EB environment
   - Configure SSL certificate

2. **Set up monitoring**
   - CloudWatch alarms
   - Error notifications
   - Performance metrics

3. **Configure CI/CD**
   - GitHub Actions for auto-deploy
   - Automated testing
   - Staging environment

4. **Scale as needed**
   - Auto-scaling policies
   - Multi-AZ deployment
   - Load balancer health checks

## 🎉 Ready to Deploy!

Everything is configured and ready. Just follow the steps in `DEPLOYMENT_QUICKSTART.md` to get your backend live in ~30 minutes!

Your app will be available at:
`http://your-environment.us-east-1.elasticbeanstalk.com`

---

**Questions?** Check the deployment guides or AWS documentation.
