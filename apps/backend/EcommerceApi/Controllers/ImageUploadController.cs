using Microsoft.AspNetCore.Mvc;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ImageUploadController : ControllerBase
{
    private readonly IS3Service _s3Service;
    private readonly ILogger<ImageUploadController> _logger;

    public ImageUploadController(
        IS3Service s3Service,
        ILogger<ImageUploadController> logger)
    {
        _s3Service = s3Service;
        _logger = logger;
    }

    /// <summary>
    /// Get a pre-signed URL for uploading a file directly to S3.
    /// This allows the frontend to upload files directly to S3 without going through the backend.
    /// </summary>
    /// <param name="request">The upload request containing file metadata</param>
    /// <returns>Pre-signed URL response with S3 upload details</returns>
    [HttpPost("get-signed-url")]
    [ProducesResponseType(typeof(GetSignedUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<GetSignedUrlResponse>> GetSignedUploadUrl(
        [FromBody] GetSignedUrlRequest request)
    {
        try
        {
            // Validate request
            if (string.IsNullOrWhiteSpace(request.FileName))
            {
                return BadRequest(new { message = "FileName is required" });
            }

            if (string.IsNullOrWhiteSpace(request.ContentType))
            {
                return BadRequest(new { message = "ContentType is required" });
            }

            if (request.FileSize <= 0 || request.FileSize > 10 * 1024 * 1024) // Max 10MB
            {
                return BadRequest(new { message = "FileSize must be between 1 byte and 10MB" });
            }

            // Validate content type (only images allowed)
            if (!request.ContentType.StartsWith("image/"))
            {
                return BadRequest(new { message = "Only image files are allowed" });
            }

            // Generate pre-signed POST policy
            var presignedPost = await _s3Service.GeneratePresignedPostAsync(
                request.FileName,
                request.ContentType,
                request.FileSize);

            _logger.LogInformation(
                "Generated signed upload URL for file: {FileName}",
                request.FileName);

            return Ok(new GetSignedUrlResponse
            {
                PresignedUrl = presignedPost.S3Url,
                S3Key = presignedPost.S3Key,
                S3Bucket = presignedPost.BucketName,
                ExpiresAt = DateTime.UtcNow.AddHours(1),
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating signed upload URL");
            return StatusCode(500, new { message = "An error occurred while generating the upload URL" });
        }
    }
}

/// <summary>
/// Request to get a pre-signed URL for uploading a file to S3
/// </summary>
public class GetSignedUrlRequest
{
    /// <summary>
    /// The name of the file to be uploaded (e.g., "product-image.jpg")
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// The MIME type of the file (e.g., "image/jpeg", "image/png")
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// The size of the file in bytes
    /// </summary>
    public long FileSize { get; set; }
}

/// <summary>
/// Response containing the pre-signed URL and metadata for S3 upload
/// </summary>
public class GetSignedUrlResponse
{
    /// <summary>
    /// The pre-signed URL to use for uploading the file to S3
    /// </summary>
    public string PresignedUrl { get; set; } = string.Empty;

    /// <summary>
    /// The S3 object key (path) where the file will be stored
    /// </summary>
    public string S3Key { get; set; } = string.Empty;

    /// <summary>
    /// The S3 bucket name
    /// </summary>
    public string S3Bucket { get; set; } = string.Empty;

    /// <summary>
    /// When the pre-signed URL expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}
