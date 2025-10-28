namespace EcommerceApi.Services;

public interface IS3Service
{
    /// <summary>
    /// Generates a pre-signed POST policy for direct browser uploads to S3.
    /// This is more secure than pre-signed URLs as it includes the policy document.
    /// </summary>
    /// <param name="fileName">The name of the file to upload</param>
    /// <param name="contentType">The MIME type of the file (e.g., image/jpeg)</param>
    /// <param name="fileSize">The maximum file size in bytes</param>
    /// <returns>Pre-signed POST policy with S3 bucket, key, policy, signature, etc.</returns>
    Task<S3PresignedPostResponse> GeneratePresignedPostAsync(
        string fileName,
        string contentType,
        long fileSize);

    /// <summary>
    /// Deletes an object from S3 by its key.
    /// </summary>
    /// <param name="s3Key">The S3 object key to delete</param>
    Task DeleteObjectAsync(string s3Key);

    /// <summary>
    /// Deletes multiple objects from S3.
    /// </summary>
    /// <param name="s3Keys">List of S3 object keys to delete</param>
    Task DeleteObjectsAsync(List<string> s3Keys);

    /// <summary>
    /// Extracts the S3 key from a full S3 URL.
    /// </summary>
    /// <param name="s3Url">The full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/key)</param>
    /// <returns>The S3 object key</returns>
    string ExtractS3KeyFromUrl(string s3Url);
}

public class S3PresignedPostResponse
{
    public string BucketName { get; set; } = string.Empty;
    public string S3Key { get; set; } = string.Empty;
    public string Policy { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public string Credential { get; set; } = string.Empty;
    public string Algorithm { get; set; } = "AWS4-HMAC-SHA256";
    public string Date { get; set; } = string.Empty;
    public string S3Url { get; set; } = string.Empty;
}
