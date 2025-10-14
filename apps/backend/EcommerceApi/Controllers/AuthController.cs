// Controllers/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EcommerceApi.Data;
using EcommerceApi.Models;
using Microsoft.AspNetCore.Authorization;

namespace EcommerceApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);


            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                return BadRequest(new { message = "User already exists" });

            var user = new User
            {
                Name = registerDto.Name,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Role = "customer"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            Console.WriteLine($"[AUTH] Login attempt for email: {loginDto.Email}");

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                Console.WriteLine($"[AUTH] Login failed for email: {loginDto.Email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var token = GenerateJwtToken(user);
            Console.WriteLine($"[AUTH] Generated JWT token for user: {user.Email}");
            Console.WriteLine($"[AUTH] Token: {token.Substring(0, Math.Min(50, token.Length))}...");

            // Return token in response body instead of cookie for cross-origin compatibility
            return Ok(new {
                message = "Logged in successfully",
                token = token,
                user = new {
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Role
                }
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt");
            return Ok("Logged out");
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                _config["Jwt:Issuer"],
                _config["Jwt:Audience"],
                claims,
                expires: DateTime.UtcNow.AddHours(12),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        // Debug logging
        Console.WriteLine($"[AUTH] /me endpoint hit");
        Console.WriteLine($"[AUTH] Has jwt cookie: {Request.Cookies.ContainsKey("jwt")}");
        Console.WriteLine($"[AUTH] User.Identity.IsAuthenticated: {User.Identity?.IsAuthenticated}");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Console.WriteLine($"[AUTH] UserId from claims: {userId}");

        if (userId == null)
        {
            Console.WriteLine("[AUTH] No userId found in claims - returning Unauthorized");
            return Unauthorized(new { message = "Not authenticated" });
        }

        var user = await _context.Users.FindAsync(Guid.Parse(userId));
        if (user == null)
        {
            Console.WriteLine("[AUTH] User not found in database - returning Unauthorized");
            return Unauthorized(new { message = "User not found" });
        }

        Console.WriteLine($"[AUTH] Successfully authenticated user: {user.Email}");
        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Role
        });
    }
    }
}
