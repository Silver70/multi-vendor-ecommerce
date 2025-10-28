# S3 Implementation - Setup Checklist

## Build Status ✅
- [x] Backend builds successfully (0 errors, 54 warnings from pre-existing code)
- [x] Frontend TypeScript compiles without errors
- [x] All files created and integrated

## Before Running the Application

### 1. Configure AWS Credentials
**File:** `apps/backend/EcommerceApi/appsettings.json`

```json
"AWS": {
  "AccessKey": "REPLACE_WITH_YOUR_ACCESS_KEY",
  "SecretKey": "REPLACE_WITH_YOUR_SECRET_KEY",
  "Region": "ap-south-1",
  "BucketName": "multivendor-ecommerce-storage-bucket"
}
```

**Where to find these:**
1. Go to AWS Console → IAM → Users
2. Create or select a user with S3 permissions
3. Generate Access Key ID and Secret Access Key
4. Keep them safe and secret!

⚠️ **Important**: The app will crash on startup if credentials are empty strings.

### 2. Configure S3 Bucket CORS

**Bucket Name:** `multivendor-ecommerce-storage-bucket`
**Region:** `ap-south-1`

**Steps:**
1. Go to AWS S3 Console
2. Select the bucket
3. Go to Permissions → CORS
4. Add this configuration:

```json
[
  {
    "AllowedHeaders": [
      "Content-Type",
      "Authorization"
    ],
    "AllowedMethods": [
      "PUT",
      "POST",
      "GET",
      "DELETE"
    ],
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

⚠️ **Note**: When deploying to production, change `AllowedOrigins` to your actual domain.

### 3. Verify IAM Permissions

The IAM user needs these S3 permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::multivendor-ecommerce-storage-bucket/*"
    }
  ]
}
```

## Testing Checklist

### Backend Endpoint Test
```bash
# Test the signed URL endpoint
curl -X POST http://localhost:5176/api/ImageUpload/get-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-image.jpg",
    "contentType": "image/jpeg",
    "fileSize": 2048576
  }'

# Expected: 200 OK with presignedUrl, s3Key, s3Bucket
```

### Frontend Test
1. Start backend: `dotnet run` in `apps/backend/EcommerceApi`
2. Start frontend: `npm run dev` in `apps/frontend`
3. Navigate to: `http://localhost:3000/dashboard/inventory/products/create`
4. Test image upload:
   - Select an image
   - Wait for "Uploaded" badge to appear
   - Fill in product details
   - Submit form
   - Verify product was created with images

### Full End-to-End Test
```bash
# 1. Create a product with images via the form
# 2. Check database for saved image URLs
# 3. Verify S3 bucket contains the uploaded images
# 4. View the product - images should display
```

## Files Created/Modified

### Created Files
- ✅ `backend/EcommerceApi/Services/IS3Service.cs`
- ✅ `backend/EcommerceApi/Services/S3Service.cs`
- ✅ `backend/EcommerceApi/Controllers/ImageUploadController.cs`
- ✅ `frontend/src/hooks/useS3Upload.ts`
- ✅ `S3_IMPLEMENTATION_GUIDE.md` (documentation)
- ✅ `S3_SETUP_CHECKLIST.md` (this file)

### Modified Files
- ✅ `backend/EcommerceApi/Program.cs` (DI registration)
- ✅ `backend/EcommerceApi/DTOs/Product/CompositeProductDto.cs` (added Images)
- ✅ `backend/EcommerceApi/Controllers/ProductsController.cs` (save images)
- ✅ `frontend/src/lib/queries/products.ts` (add ProductImageInput)
- ✅ `frontend/src/routes/dashboard/inventory/products/create.tsx` (integrate S3)

## Troubleshooting

### Application Won't Start
**Error:** "AWS credentials (AccessKey and SecretKey) are not configured in appsettings"

**Solution:** Add AWS credentials to `appsettings.json` (see step 1)

### CORS Error When Uploading
**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:** Configure S3 bucket CORS (see step 2)

### 403 Forbidden When Uploading
**Error:** "Access Denied" or "InvalidAccessKeyId"

**Solution:**
- Check AWS credentials are correct
- Verify IAM user has S3 permissions (see step 3)
- Check bucket name matches in code and config

### Pre-signed URL Endpoint Returns 500
**Error:** "An error occurred while generating the upload URL"

**Solution:**
- Check AWS credentials are valid
- Verify IAM user has S3 permissions
- Check region matches bucket region
- Review application logs

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│                                                      │
│  1. User selects image                              │
│  2. Requests signed URL → /api/ImageUpload/url      │
│  3. Receives pre-signed URL                         │
│  4. Uploads directly to S3 (no backend)             │
│  5. Collects S3 URLs                                │
│  6. Submits product form with image URLs            │
└──────────────────────────────────────────────────────┘
              ↕                          ↕
┌──────────────────────────────────────────────────────┐
│               BACKEND (.NET 8)                       │
│                                                      │
│  ImageUploadController:                             │
│    - Validates file metadata                        │
│    - Generates pre-signed URL                       │
│    - Returns to frontend                            │
│                                                      │
│  S3Service:                                         │
│    - Integrates with AWS SDK                        │
│    - Manages S3 operations                          │
│                                                      │
│  ProductsController:                                │
│    - Saves product + image URLs to database         │
└──────────────────────────────────────────────────────┘
              ↕                          ↕
┌──────────────────────────────────────────────────────┐
│              AWS S3 Bucket                           │
│         multivendor-ecommerce-storage-bucket         │
│                                                      │
│  Structure: products/YYYYMMDD/uuid-filename.jpg     │
└──────────────────────────────────────────────────────┘
```

## Next Steps (After Verification)

1. Test the implementation thoroughly
2. Set up CloudFront distribution (optional, for CDN)
3. Configure lifecycle policies for old images (optional)
4. Add image deletion when product is deleted (future)
5. Deploy to production with updated allowed origins

## References

- [S3 Implementation Guide](./S3_IMPLEMENTATION_GUIDE.md)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)

---

**Last Updated:** 2025-10-28
**Status:** Ready for Testing ✅
