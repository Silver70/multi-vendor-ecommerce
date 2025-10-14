using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;

namespace EcommerceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhookController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(AppDbContext context, IConfiguration config, ILogger<WebhookController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        [HttpGet("clerk/test")]
        public IActionResult TestWebhook()
        {
            _logger.LogInformation("Webhook test endpoint called");
            return Ok(new { message = "Webhook endpoint is accessible", timestamp = DateTime.UtcNow });
        }

        [HttpPost("clerk")]
        public async Task<IActionResult> ClerkWebhook()
        {
            try
            {
                _logger.LogInformation("=== Clerk Webhook Received ===");

                // Read the request body
                using var reader = new StreamReader(Request.Body);
                var body = await reader.ReadToEndAsync();

                _logger.LogInformation("Webhook body length: {Length}", body.Length);
                _logger.LogInformation("Webhook body: {Body}", body);

                // Verify webhook signature
                var webhookSecret = _config["Clerk:WebhookSecret"];
                if (string.IsNullOrEmpty(webhookSecret))
                {
                    _logger.LogError("Clerk webhook secret is not configured");
                    return StatusCode(500, "Webhook secret not configured");
                }

                // Get Svix headers
                var svixId = Request.Headers["svix-id"].FirstOrDefault();
                var svixTimestamp = Request.Headers["svix-timestamp"].FirstOrDefault();
                var svixSignature = Request.Headers["svix-signature"].FirstOrDefault();

                _logger.LogInformation("Svix headers - ID: {Id}, Timestamp: {Timestamp}, Signature: {Sig}",
                    svixId, svixTimestamp, svixSignature?.Substring(0, Math.Min(20, svixSignature?.Length ?? 0)));

                if (string.IsNullOrEmpty(svixId) || string.IsNullOrEmpty(svixTimestamp) || string.IsNullOrEmpty(svixSignature))
                {
                    _logger.LogWarning("Missing required Svix headers");
                    return BadRequest("Missing required headers");
                }

                // Verify the signature
                // FOR DEBUGGING: Set this to true to skip signature verification temporarily
                bool skipSignatureVerification = _config.GetValue<bool>("Clerk:SkipWebhookSignatureVerification");

                if (!skipSignatureVerification)
                {
                    if (!VerifyWebhookSignature(webhookSecret, svixId, svixTimestamp, body, svixSignature))
                    {
                        _logger.LogWarning("Invalid webhook signature");
                        return Unauthorized("Invalid signature");
                    }
                    _logger.LogInformation("Webhook signature verified successfully");
                }
                else
                {
                    _logger.LogWarning("⚠️ SKIPPING signature verification - FOR DEBUGGING ONLY!");
                }

                // Parse the webhook payload
                var webhook = JsonSerializer.Deserialize<ClerkWebhookEvent>(body);
                if (webhook == null)
                {
                    _logger.LogWarning("Failed to parse webhook payload");
                    return BadRequest("Invalid payload");
                }

                _logger.LogInformation($"Received Clerk webhook event: {webhook.Type}");

                // Handle different event types
                switch (webhook.Type)
                {
                    case "user.created":
                        await HandleUserCreated(webhook.Data);
                        break;

                    case "user.updated":
                        await HandleUserUpdated(webhook.Data);
                        break;

                    case "user.deleted":
                        await HandleUserDeleted(webhook.Data);
                        break;

                    default:
                        _logger.LogInformation($"Unhandled webhook event type: {webhook.Type}");
                        break;
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Clerk webhook");
                return StatusCode(500, "Internal server error");
            }
        }

        private bool VerifyWebhookSignature(string secret, string messageId, string timestamp, string payload, string signature)
        {
            try
            {
                _logger.LogInformation("Verifying webhook signature...");
                _logger.LogInformation("Secret (first 10 chars): {Secret}", secret.Substring(0, Math.Min(10, secret.Length)));
                _logger.LogInformation("Message ID: {MessageId}", messageId);
                _logger.LogInformation("Timestamp: {Timestamp}", timestamp);
                _logger.LogInformation("Payload length: {Length}", payload.Length);

                // Svix signature format: "v1,<base64_signature> v1,<base64_signature>"
                // The secret from Clerk includes "whsec_" prefix which needs to be removed and base64 decoded
                var secretWithoutPrefix = secret.Replace("whsec_", "");

                // Base64 decode the secret
                byte[] secretBytes;
                try
                {
                    secretBytes = Convert.FromBase64String(secretWithoutPrefix);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to decode webhook secret");
                    // Try using it as-is
                    secretBytes = Encoding.UTF8.GetBytes(secret);
                }

                // Construct the signed content (Svix format)
                var signedContent = $"{messageId}.{timestamp}.{payload}";
                _logger.LogInformation("Signed content length: {Length}", signedContent.Length);

                // Compute HMAC-SHA256
                using var hmac = new HMACSHA256(secretBytes);
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent));
                var computedSignature = Convert.ToBase64String(hash);
                var fullComputedSignature = $"v1,{computedSignature}";

                _logger.LogInformation("Computed signature: {Sig}", fullComputedSignature.Substring(0, Math.Min(30, fullComputedSignature.Length)));
                _logger.LogInformation("Received signature: {Sig}", signature.Substring(0, Math.Min(30, signature.Length)));

                // Svix can send multiple signatures separated by spaces
                var signatures = signature.Split(' ');
                var isValid = signatures.Any(sig => sig.Trim() == fullComputedSignature);

                _logger.LogInformation("Signature verification result: {Result}", isValid);
                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying webhook signature");
                return false;
            }
        }

        private async Task HandleUserCreated(ClerkUserData userData)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == userData.Id);
                if (existingUser != null)
                {
                    _logger.LogInformation($"User with ClerkId {userData.Id} already exists");
                    return;
                }

                // Get primary email
                var primaryEmail = userData.EmailAddresses?.FirstOrDefault(e => e.Id == userData.PrimaryEmailAddressId);
                if (primaryEmail == null)
                {
                    _logger.LogWarning($"No primary email found for user {userData.Id}");
                    return;
                }

                // Create new user
                var user = new User
                {
                    ClerkId = userData.Id,
                    Name = $"{userData.FirstName} {userData.LastName}".Trim(),
                    Email = primaryEmail.EmailAddress,
                    Role = "customer", // Default role
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created user with ClerkId {userData.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user from Clerk webhook");
                throw;
            }
        }

        private async Task HandleUserUpdated(ClerkUserData userData)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == userData.Id);
                if (user == null)
                {
                    _logger.LogWarning($"User with ClerkId {userData.Id} not found for update");
                    // Create the user if it doesn't exist
                    await HandleUserCreated(userData);
                    return;
                }

                // Update user data
                var primaryEmail = userData.EmailAddresses?.FirstOrDefault(e => e.Id == userData.PrimaryEmailAddressId);
                if (primaryEmail != null)
                {
                    user.Email = primaryEmail.EmailAddress;
                }

                user.Name = $"{userData.FirstName} {userData.LastName}".Trim();

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Updated user with ClerkId {userData.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user from Clerk webhook");
                throw;
            }
        }

        private async Task HandleUserDeleted(ClerkUserData userData)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == userData.Id);
                if (user == null)
                {
                    _logger.LogWarning($"User with ClerkId {userData.Id} not found for deletion");
                    return;
                }

                // Note: You might want to soft delete instead of hard delete
                // to preserve order history, etc.
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Deleted user with ClerkId {userData.Id}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user from Clerk webhook");
                throw;
            }
        }
    }

    // Webhook payload models
    public class ClerkWebhookEvent
    {
        [System.Text.Json.Serialization.JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("data")]
        public ClerkUserData Data { get; set; } = new();
    }

    public class ClerkUserData
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("last_name")]
        public string? LastName { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("primary_email_address_id")]
        public string? PrimaryEmailAddressId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("email_addresses")]
        public List<ClerkEmailAddress>? EmailAddresses { get; set; }
    }

    public class ClerkEmailAddress
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [System.Text.Json.Serialization.JsonPropertyName("email_address")]
        public string EmailAddress { get; set; } = string.Empty;
    }
}
