# S3 Image Upload Implementation Guide

## Overview

This document explains the S3 image upload integration implemented for the multi-vendor e-commerce application. The system allows users to upload product images directly to AWS S3 without files passing through the backend server.

## Architecture

### High-Level Flow

```
1. User selects images in frontend
2. Frontend requests pre-signed URL from backend: POST /api/ImageUpload/get-signed-url
3. Backend generates pre-signed URL using S3Service
4. Frontend uploads image directly to S3 using the pre-signed URL
5. Frontend collects S3 URLs and includes them in product creation payload
6. Backend saves product with S3 image URLs to database
```

### Key Benefits

- **Security**: Users cannot directly upload to S3 without backend authorization
- **Performance**: Images bypass backend, no server storage, reduced bandwidth
- **Scalability**: S3 handles storage and delivery, CDN-ready
- **Reliability**: Separate file storage from application

## Implementation Components

### 1. Backend S3 Service

**Files:**

- `EcommerceApi/Services/IS3Service.cs` - Interface definition
- `EcommerceApi/Services/S3Service.cs` - AWS SDK implementation

**Key Methods:**

- `GeneratePresignedPostAsync()` - Creates pre-signed upload URLs
- `DeleteObjectAsync()` - Removes files from S3
- `DeleteObjectsAsync()` - Batch deletes files
- `ExtractS3KeyFromUrl()` - Parses S3 keys from URLs

**Configuration:**
Located in `appsettings.json`:

```json
"AWS": {
  "AccessKey": "your-aws-access-key",
  "SecretKey": "your-aws-secret-key",
  "Region": "ap-south-1",
  "BucketName": "multivendor-ecommerce-storage-bucket"
}
```

**Dependency Injection:**
Registered in `Program.cs`:

```csharp
builder.Services.AddScoped<IS3Service, S3Service>();
```

### 2. Image Upload Endpoint

**File:** `EcommerceApi/Controllers/ImageUploadController.cs`

**Endpoint:**

```
POST /api/ImageUpload/get-signed-url
Content-Type: application/json

{
  "fileName": "product-image.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2048576
}
```

**Response:**

```json
{
  "presignedUrl": "https://...",
  "s3Key": "products/20251028/abc12345-product-image.jpg",
  "s3Bucket": "multivendor-ecommerce-storage-bucket",
  "expiresAt": "2025-10-28T15:30:00Z"
}
```

**Validations:**

- File name required
- Content type must be image/\*
- File size: 1 byte to 10MB
- URLs expire in 1 hour

### 3. Frontend S3 Upload Hook

**File:** `frontend/src/hooks/useS3Upload.ts`

**Usage:**

```typescript
const { uploadFileToS3, uploadMultipleFiles, uploadProgress, resetProgress } = useS3Upload();

// Single file upload
const result = await uploadFileToS3(file);
// result = { s3Url, s3Key, s3Bucket }

// Multiple files
const results = await uploadMultipleFiles(files);

// Progress tracking
uploadProgress = {
  fileName: string,
  progress: 0-100,
  status: 'idle' | 'requesting-url' | 'uploading' | 'completed' | 'error',
  error?: string
}
```

### 4. Product Create Form Integration

**File:** `frontend/src/routes/dashboard/inventory/products/create.tsx`

**Features:**

- Real-time upload progress with loading indicator
- Shows "Uploaded" badge when complete
- Prevents form submission until all images uploaded
- Automatic S3 URL collection and inclusion in product data
- Graceful error handling with failed image removal

**Image State:**

```typescript
interface ProductImage {
  id: string;
  preview: string; // Local preview
  file?: File; // Original file
  s3Url?: string; // S3 URL after upload
  isUploading?: boolean; // Upload in progress
}
```

### 5. Product Creation DTO Updates

**Backend:** `EcommerceApi/DTOs/Product/CompositeProductDto.cs`

Added:

```csharp
public class ProductImageInputDto
{
    public string ImageUrl { get; set; }
    public bool IsPrimary { get; set; }
}

// In CreateCompositeProductDto
public List<ProductImageInputDto> Images { get; set; } = new();
```

**Frontend:** `frontend/src/lib/queries/products.ts`

Added:

```typescript
export interface ProductImageInput {
  imageUrl: string;
  isPrimary: boolean;
}

// In CreateCompositeProductDto
images?: ProductImageInput[];
```

### 6. Database Integration

**Model:** `EcommerceApi/Models/ProductImage.cs`

Already supports storing image URLs. No changes needed.

**Product Controller Update:**
`ProductsController.cs` - CreateCompositeProduct method now:

1. Saves variants as before
2. Saves product images with S3 URLs from request
3. Sets first image as primary if not specified

## Setup Instructions

### Prerequisites

- AWS S3 bucket created
- AWS IAM user with S3 upload permissions
- Access Key ID and Secret Access Key

### Configuration Steps

1. **Update appsettings.json** with AWS credentials:

```json
"AWS": {
  "AccessKey": "AKIAIOSFODNN7EXAMPLE",
  "SecretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Region": "ap-south-1",
  "BucketName": "multivendor-ecommerce-storage-bucket"
}
```

2. **Install NuGet packages** (already done):
   - AWSSDK.S3 (v4.0.8)

3. **Services are auto-registered** in Program.cs

4. **Frontend hook** is ready to use

### S3 Bucket CORS Configuration

Configure your S3 bucket CORS to allow frontend uploads:

```json
[
  {
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "AllowedMethods": ["PUT", "POST", "GET", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## File Structure

```
backend/EcommerceApi/
├── Services/
│   ├── IS3Service.cs          # Interface
│   └── S3Service.cs           # Implementation
├── Controllers/
│   └── ImageUploadController.cs # Signed URL endpoint
└── DTOs/Product/
    └── CompositeProductDto.cs  # Updated DTOs

frontend/
└── src/
    ├── hooks/
    │   └── useS3Upload.ts     # Upload hook
    └── routes/dashboard/inventory/products/
        └── create.tsx          # Integrated form
```

## Testing the Implementation

### Test the Signed URL Endpoint

```bash
curl -X POST http://localhost:5176/api/ImageUpload/get-signed-url \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-image.jpg",
    "contentType": "image/jpeg",
    "fileSize": 2048576
  }'
```

Expected response:

```json
{
  "presignedUrl": "https://...",
  "s3Key": "products/...",
  "s3Bucket": "multivendor-ecommerce-storage-bucket",
  "expiresAt": "..."
}
```

### Test the Product Create Form

1. Navigate to `/dashboard/inventory/products/create`
2. Select images - they should upload automatically
3. Watch for "Uploaded" badge confirmation
4. Fill in product details
5. Submit form - images should be saved with product

## Error Handling

### Frontend Errors

- **Upload URL Request Failed**: Network error, AWS credentials invalid
- **S3 Upload Failed**: Network timeout, file too large, invalid file type
- **Upload Images Removed**: Automatically removed on failure, user notified

### Backend Errors

- **Invalid File Size**: Returns 400 Bad Request
- **Invalid Content Type**: Returns 400 Bad Request
- **AWS Credentials Missing**: Throws during app startup
- **S3 Access Denied**: AWS SDK throws error (check IAM permissions)

## Performance Notes

### Image Upload

- Direct to S3: ~2-10MB takes 2-15 seconds (depends on connection)
- No backend processing or storage needed
- Parallel uploads supported (loop over files)

### S3 URL Structure

```
https://bucket-name.s3.region.amazonaws.com/products/YYYYMMDD/uuid-filename.jpg
```

### Expiration

- Pre-signed URLs expire after 1 hour
- No renewal needed - frontend must request new URL if needed
- Uploaded files are permanent until deleted

## Future Enhancements

1. **Image Resizing**: Lambda function to create thumbnails on S3
2. **Delete on Product Delete**: Call S3Service.DeleteObjectAsync() when removing products
3. **CloudFront Distribution**: Cache images globally
4. **Batch Upload**: Upload multiple files in parallel
5. **Image Validation**: Client-side validation before upload
6. **Upload Retry Logic**: Auto-retry failed uploads

## Security Considerations

✅ **Implemented:**

- Pre-signed URLs expire after 1 hour
- Content-type validation on backend
- File size limits (10MB max)
- Only image/\* MIME types allowed
- AWS IAM credentials secured in backend

⚠️ **Recommendations:**

- Use environment variables for AWS credentials in production
- Add image content scanning (antivirus) via Lambda
- Implement rate limiting on signed URL endpoint
- Use S3 bucket encryption at rest
- Enable S3 versioning for safety
- Set up S3 lifecycle policies for old images

## Troubleshooting

### "AWS credentials are not configured"

- Check appsettings.json has AccessKey and SecretKey
- Credentials cannot be empty strings
- Restart application after changing credentials

### CORS Errors When Uploading

- Configure S3 bucket CORS (see instructions above)
- Ensure frontend URL matches allowed origins
- PUT method must be allowed in CORS

### Pre-signed URL Returns 403

- AWS IAM user needs s3:GetObject and s3:PutObject permissions
- Check bucket policy allows the IAM user
- Verify region in config matches bucket region

### Images Not Showing in Product

- Check ProductImage table for saved URLs
- Verify S3 URL format is correct
- Ensure S3 URLs are public or signed for display

## References

- [AWS S3 Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [AWS SDK for .NET](https://docs.aws.amazon.com/sdkfornet/latest/developer-guide/)
- [CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
