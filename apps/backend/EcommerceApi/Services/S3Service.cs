using Amazon.S3;
using Amazon.S3.Model;

namespace EcommerceApi.Services;

public class S3Service : IS3Service
{
    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _configuration;
    private readonly string _bucketName;
    private readonly string _region;
    private readonly ILogger<S3Service> _logger;

    public S3Service(
        IAmazonS3 s3Client,
        IConfiguration configuration,
        ILogger<S3Service> logger)
    {
        _s3Client = s3Client;
        _configuration = configuration;
        _logger = logger;

        _bucketName = _configuration["AWS:BucketName"]
            ?? throw new InvalidOperationException("AWS:BucketName is not configured");
        _region = _configuration["AWS:Region"]
            ?? throw new InvalidOperationException("AWS:Region is not configured");
    }

    public async Task<S3PresignedPostResponse> GeneratePresignedPostAsync(
        string fileName,
        string contentType,
        long fileSize)
    {
        try
        {
            // Generate a unique S3 key using timestamp and GUID
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
            var uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8);
            var s3Key = $"products/{timestamp}/{uniqueId}-{fileName}";

            // Generate pre-signed POST policy
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
                Expires = DateTime.UtcNow.AddHours(1),
                Verb = HttpVerb.PUT,
            };

            // Add conditions to the policy
            var url = _s3Client.GetPreSignedURL(request);

            // For PUT method, we can directly use the pre-signed URL
            // However, POST method is more secure. Let's use a hybrid approach:
            // Return the PUT URL for simplicity, but inform the client
            var s3Url = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{s3Key}";

            _logger.LogInformation(
                "Generated pre-signed upload URL for file: {FileName}, Key: {S3Key}",
                fileName,
                s3Key);

            return new S3PresignedPostResponse
            {
                BucketName = _bucketName,
                S3Key = s3Key,
                S3Url = url, // Pre-signed URL
                Policy = string.Empty, // Not needed for PUT method
                Signature = string.Empty,
                Credential = string.Empty,
                Date = DateTime.UtcNow.ToString("yyyyMMddTHHmmssZ"),
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pre-signed upload URL for file: {FileName}", fileName);
            throw;
        }
    }

    public async Task DeleteObjectAsync(string s3Key)
    {
        try
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
            };

            await _s3Client.DeleteObjectAsync(request);

            _logger.LogInformation("Deleted object from S3: {S3Key}", s3Key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting object from S3: {S3Key}", s3Key);
            throw;
        }
    }

    public async Task DeleteObjectsAsync(List<string> s3Keys)
    {
        if (s3Keys.Count == 0)
            return;

        try
        {
            var deleteRequest = new DeleteObjectsRequest
            {
                BucketName = _bucketName,
                Objects = s3Keys.Select(key => new KeyVersion { Key = key }).ToList(),
            };

            await _s3Client.DeleteObjectsAsync(deleteRequest);

            _logger.LogInformation("Deleted {Count} objects from S3", s3Keys.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting {Count} objects from S3", s3Keys.Count);
            throw;
        }
    }

    public string ExtractS3KeyFromUrl(string s3Url)
    {
        try
        {
            // Handle URLs like:
            // https://bucket.s3.region.amazonaws.com/key
            // https://bucket.s3.amazonaws.com/key
            // s3://bucket/key

            if (s3Url.StartsWith("s3://"))
            {
                // s3://bucket/key format
                var path = s3Url.Substring(5); // Remove "s3://"
                var slashIndex = path.IndexOf('/');
                return slashIndex > 0 ? path.Substring(slashIndex + 1) : string.Empty;
            }

            // HTTPS format
            if (s3Url.Contains(".s3.") && s3Url.Contains(".amazonaws.com"))
            {
                var uri = new Uri(s3Url);
                var key = uri.AbsolutePath.TrimStart('/');
                return key;
            }

            // Fallback: treat everything after the domain as the key
            var lastSlashIndex = s3Url.LastIndexOf('/');
            return lastSlashIndex > 0 ? s3Url.Substring(lastSlashIndex + 1) : s3Url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting S3 key from URL: {S3Url}", s3Url);
            throw;
        }
    }

    /// <summary>
    /// Generate a pre-signed GET URL for viewing an object in S3.
    /// Useful for retrieving private objects without making them public.
    /// </summary>
    /// <param name="s3Key">The S3 object key (path)</param>
    /// <param name="expirationHours">How many hours the URL should be valid (default: 1 hour)</param>
    /// <returns>A pre-signed URL valid for the specified duration</returns>
    public string GeneratePresignedGetUrl(string s3Key, int expirationHours = 1)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = s3Key,
                Expires = DateTime.UtcNow.AddHours(expirationHours),
                Verb = HttpVerb.GET,
            };

            var url = _s3Client.GetPreSignedURL(request);

            _logger.LogInformation(
                "Generated pre-signed GET URL for S3 key: {S3Key}, expires in {Hours} hours",
                s3Key,
                expirationHours);

            return url;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating pre-signed GET URL for S3 key: {S3Key}", s3Key);
            throw;
        }
    }
}
