using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using System.Security.Claims;

namespace EcommerceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(AppDbContext context, ILogger<UserController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                // Get Clerk ID from JWT claims
                var clerkId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

                if (string.IsNullOrEmpty(clerkId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                // Find user in database by Clerk ID
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.ClerkId == clerkId);

                if (user == null)
                {
                    return NotFound(new { message = "User not found. Please ensure your account is properly synced." });
                }

                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role,
                    user.ClerkId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateUserDto updateDto)
        {
            try
            {
                var clerkId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

                if (string.IsNullOrEmpty(clerkId))
                {
                    return Unauthorized(new { message = "Invalid token" });
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.ClerkId == clerkId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Update user fields (you can expand this based on what you want to allow users to update)
                if (!string.IsNullOrWhiteSpace(updateDto.Name))
                {
                    user.Name = updateDto.Name;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating current user");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }

    public class UpdateUserDto
    {
        public string? Name { get; set; }
    }
}
