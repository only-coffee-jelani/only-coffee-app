# AWS S3 Setup Guide for Only Coffee

This guide walks you through setting up AWS S3 for image storage in the Only Coffee application.

## Prerequisites

- AWS Account
- AWS CLI installed (optional but recommended)
- Access to AWS Console

---

## Step 1: Create S3 Bucket

### Via AWS Console:

1. Log into [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3** service
3. Click **Create bucket**
4. Configure bucket:
   - **Bucket name:** `only-coffee-assets` (or your preferred name)
   - **AWS Region:** `us-east-1` (or your preferred region)
   - **Object Ownership:** ACLs disabled (recommended)
   - **Block Public Access settings:**
     - ❌ Uncheck "Block all public access"
     - ✅ Check "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
   - Leave other settings as default
5. Click **Create bucket**

### Via AWS CLI:

```bash
aws s3api create-bucket \
  --bucket only-coffee-assets \
  --region us-east-1
```

---

## Step 2: Configure Bucket CORS

CORS allows your web/mobile apps to upload images directly to S3.

### Via AWS Console:

1. Go to your bucket
2. Click **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Paste this configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedOrigins": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **Save changes**

### Via AWS CLI:

Create a file `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply it:
```bash
aws s3api put-bucket-cors \
  --bucket only-coffee-assets \
  --cors-configuration file://cors.json
```

---

## Step 3: Configure Bucket Policy (Public Read Access)

This allows anyone to view the uploaded images (necessary for app to display them).

### Via AWS Console:

1. Go to your bucket
2. Click **Permissions** tab
3. Scroll to **Bucket policy**
4. Click **Edit**
5. Paste this policy (replace `only-coffee-assets` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-coffee-assets/*"
    }
  ]
}
```

6. Click **Save changes**

### Via AWS CLI:

Create a file `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::only-coffee-assets/*"
    }
  ]
}
```

Apply it:
```bash
aws s3api put-bucket-policy \
  --bucket only-coffee-assets \
  --policy file://bucket-policy.json
```

---

## Step 4: Create IAM User for Backend

Create a dedicated IAM user with S3 access for your backend service.

### Via AWS Console:

1. Navigate to **IAM** service
2. Click **Users** → **Create user**
3. **User name:** `only-coffee-backend`
4. Click **Next**
5. **Permissions:** Select "Attach policies directly"
6. Search and select: **AmazonS3FullAccess** (or create custom policy below)
7. Click **Next** → **Create user**
8. Click on the created user
9. Go to **Security credentials** tab
10. Click **Create access key**
11. Select **Application running outside AWS**
12. Click **Next** → **Create access key**
13. **Important:** Save the Access Key ID and Secret Access Key

### Custom Policy (More Secure):

Instead of AmazonS3FullAccess, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::only-coffee-assets",
        "arn:aws:s3:::only-coffee-assets/*"
      ]
    }
  ]
}
```

---

## Step 5: Configure Backend Environment Variables

Add these to your `.env` file in `backend/services/gateway/`:

```env
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE  # Your Access Key ID
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY  # Your Secret
AWS_S3_BUCKET=only-coffee-assets
```

**Security Note:** Never commit these credentials to Git! Keep `.env` in your `.gitignore`.

---

## Step 6: Test the Upload

### Using curl:

```bash
# Upload a test image
curl -X POST http://localhost:3000/upload/menu-item-image \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/test-image.jpg"
```

Expected response:
```json
{
  "url": "https://only-coffee-assets.s3.us-east-1.amazonaws.com/menu-items/uuid.webp",
  "message": "Image uploaded successfully"
}
```

### Verify in Browser:

Open the returned URL in your browser. You should see the uploaded image.

---

## Step 7: Set Up CloudFront (Optional but Recommended)

CloudFront provides:
- Faster global image delivery
- HTTPS by default
- Lower S3 bandwidth costs
- Better performance

### Via AWS Console:

1. Navigate to **CloudFront**
2. Click **Create distribution**
3. **Origin domain:** Select your S3 bucket
4. **Origin access:** Origin access control (recommended)
5. Click **Create control setting**
6. **Name:** `only-coffee-s3-access`
7. Click **Create**
8. **Viewer protocol policy:** Redirect HTTP to HTTPS
9. **Allowed HTTP methods:** GET, HEAD
10. **Cache policy:** CachingOptimized
11. Click **Create distribution**
12. Wait for deployment (5-10 minutes)
13. **Update S3 Bucket Policy:** CloudFront will show a banner with policy to add

### Update Backend:

After CloudFront setup, update `UploadService` to use CloudFront URL:

```typescript
// In upload.service.ts
const cloudFrontDomain = this.configService.get<string>('CLOUDFRONT_DOMAIN');
return `https://${cloudFrontDomain}/${fileName}`;
```

Add to `.env`:
```env
CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net
```

---

## Step 8: Set Up S3 Lifecycle Rules (Cost Optimization)

Delete old unused images automatically.

### Via AWS Console:

1. Go to your bucket
2. Click **Management** tab
3. Click **Create lifecycle rule**
4. **Rule name:** `delete-old-temp-uploads`
5. **Scope:** Limit using one or more filters
6. **Prefix:** `temp/`
7. **Lifecycle rule actions:**
   - ✅ Expire current versions of objects
   - Days after object creation: **7**
8. Click **Create rule**

---

## Folder Structure

The backend automatically organizes uploads:

```
only-coffee-assets/
├── menu-items/
│   ├── uuid-1.webp
│   ├── uuid-2.webp
│   └── ...
├── stores/
│   ├── uuid-1.webp
│   ├── uuid-2.webp
│   └── ...
└── profiles/
    ├── uuid-1.webp
    ├── uuid-2.webp
    └── ...
```

---

## Image Processing Details

The backend automatically:
- ✅ Resizes images to optimal dimensions
- ✅ Converts to WebP format (smaller file size)
- ✅ Sets proper cache headers
- ✅ Generates unique filenames (UUID)

**Sizes:**
- Menu items: 800x800px
- Store images: 1200x800px
- Profile images: 400x400px (circular)

---

## Security Best Practices

1. **Never expose AWS credentials in code**
   - Use environment variables
   - Use AWS IAM roles on EC2/ECS instead of keys

2. **Restrict IAM permissions**
   - Use custom policy instead of FullAccess
   - Only grant necessary actions

3. **Enable S3 versioning**
   - Protects against accidental deletion
   - Allows rollback

4. **Enable S3 access logging**
   - Track who accessed your objects
   - Useful for debugging and security audits

5. **Use CloudFront**
   - Hides S3 bucket from direct access
   - Provides additional security layer

6. **Set up S3 Block Public Access**
   - Block public ACLs (while allowing bucket policy)
   - Prevents accidental exposure

---

## Cost Estimation

**S3 Storage (us-east-1):**
- First 50 TB: $0.023 per GB/month
- Example: 10,000 images × 200KB avg = 2GB = $0.05/month

**S3 Requests:**
- PUT/POST: $0.005 per 1,000 requests
- GET: $0.0004 per 1,000 requests
- Example: 100K uploads + 1M views = $0.90/month

**Data Transfer:**
- Out to internet: $0.09 per GB (first 10 TB)
- Out to CloudFront: Free
- Example: 10GB/month = $0.90 (or $0 with CloudFront)

**CloudFront (if used):**
- First 10 TB: $0.085 per GB
- Example: 10GB/month = $0.85

**Total estimated monthly cost for moderate usage: ~$2-5**

---

## Troubleshooting

### Issue: "Access Denied" when uploading

**Solution:**
- Check IAM user has correct permissions
- Verify AWS credentials in `.env`
- Check bucket policy allows public read

### Issue: Images not displaying in app

**Solution:**
- Check bucket policy allows public GetObject
- Verify URL is correct in database
- Check CORS configuration
- Try accessing URL directly in browser

### Issue: "Bucket already exists" error

**Solution:**
- S3 bucket names are globally unique
- Choose a different name
- Or use existing bucket

### Issue: Large upload times

**Solution:**
- Image optimization is working (Sharp processing)
- Original images may be large
- Consider implementing client-side compression
- Use CloudFront for faster delivery

---

## Monitoring

### Set up CloudWatch Alarms:

1. **High Upload Count:**
   - Metric: NumberOfObjects
   - Alert if > 1000 uploads/hour (adjust as needed)

2. **High Storage Cost:**
   - Metric: BucketSizeBytes
   - Alert if > 100GB (adjust as needed)

3. **Error Rate:**
   - Metric: 4xxErrors, 5xxErrors
   - Alert if > 1% of requests

---

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS CLI S3 Commands](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)

---

## Support

For issues or questions:
1. Check CloudWatch logs for backend errors
2. Review S3 access logs
3. Verify IAM permissions
4. Test with curl/Postman before debugging app

---

**Setup Date:** January 2025
**Last Updated:** January 2025
