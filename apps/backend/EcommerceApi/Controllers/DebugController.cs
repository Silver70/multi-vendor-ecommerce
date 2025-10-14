using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EcommerceApi.Data;
using EcommerceApi.Models;

namespace EcommerceApi.Controllers
{
    /// <summary>
    /// DEBUG ONLY - Remove this controller in production
    /// This controller helps sync users manually when webhooks aren't working in local dev
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DebugController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DebugController> _logger;

        public DebugController(AppDbContext context, ILogger<DebugController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Manually sync the current authenticated Clerk user to the database
        /// Call this after registering/logging in with Clerk
        /// </summary>
        [HttpPost("sync-current-user")]
        [Authorize]
        public async Task<IActionResult> SyncCurrentUser([FromBody] SyncUserRequest request)
        {
            try
            {
                // Get Clerk ID from JWT
                var clerkId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

                if (string.IsNullOrEmpty(clerkId))
                {
                    return Unauthorized(new { message = "No Clerk ID in token" });
                }

                _logger.LogInformation("Syncing user with ClerkId: {ClerkId}", clerkId);

                // Check if user already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);
                if (existingUser != null)
                {
                    return Ok(new
                    {
                        message = "User already exists in database",
                        user = new
                        {
                            existingUser.Id,
                            existingUser.ClerkId,
                            existingUser.Name,
                            existingUser.Email,
                            existingUser.Role
                        }
                    });
                }

                // Get email from JWT claims
                var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email");
                var name = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue("name");

                if (string.IsNullOrEmpty(email))
                {
                    email = request.Email;
                }

                if (string.IsNullOrEmpty(name))
                {
                    name = request.Name;
                }

                if (string.IsNullOrEmpty(email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                // Create new user
                var user = new User
                {
                    ClerkId = clerkId,
                    Name = name ?? "User",
                    Email = email,
                    Role = "customer",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User synced successfully: {Email}", email);

                return Ok(new
                {
                    message = "User synced successfully",
                    user = new
                    {
                        user.Id,
                        user.ClerkId,
                        user.Name,
                        user.Email,
                        user.Role
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing user");
                return StatusCode(500, new { message = "Error syncing user", error = ex.Message });
            }
        }

        [HttpGet("check-database")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                var userCount = await _context.Users.CountAsync();
                var usersWithClerkId = await _context.Users.Where(u => u.ClerkId != null && u.ClerkId != "").CountAsync();

                var recentUsers = await _context.Users
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(5)
                    .Select(u => new
                    {
                        u.Id,
                        u.ClerkId,
                        u.Name,
                        u.Email,
                        u.Role,
                        u.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalUsers = userCount,
                    usersWithClerkId = usersWithClerkId,
                    recentUsers = recentUsers
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking database");
                return StatusCode(500, new { message = "Error checking database", error = ex.Message });
            }
        }
    }

    public class SyncUserRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
    }
}
