using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;
using System.Security.Claims;

namespace EcommerceApi.Services
{
    /// <summary>
    /// Service for managing channel context from HTTP requests
    /// Extracts channel information from query parameters, headers, or JWT claims
    /// </summary>
    public class ChannelContextService : IChannelContextService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly AppDbContext _context;
        private readonly ILogger<ChannelContextService> _logger;

        public ChannelContextService(
            IHttpContextAccessor httpContextAccessor,
            AppDbContext context,
            ILogger<ChannelContextService> logger)
        {
            _httpContextAccessor = httpContextAccessor;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get the current channel ID from the request context
        /// Priority: Query parameter > Header > JWT claim > Default channel
        /// </summary>
        public async Task<Guid?> GetCurrentChannelIdAsync()
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null)
                return null;

            // 1. Check query parameter
            if (httpContext.Request.Query.TryGetValue("channelId", out var channelIdQuery))
            {
                if (Guid.TryParse(channelIdQuery.ToString(), out var channelId))
                    return channelId;
            }

            // 2. Check header
            if (httpContext.Request.Headers.TryGetValue("X-Channel-Id", out var channelIdHeader))
            {
                if (Guid.TryParse(channelIdHeader.ToString(), out var channelId))
                    return channelId;
            }

            // 3. Check JWT claim
            var user = httpContext.User;
            var channelClaim = user?.FindFirst("channel_id");
            if (channelClaim != null && Guid.TryParse(channelClaim.Value, out var claimChannelId))
                return claimChannelId;

            // 4. For vendor users, get their assigned channel
            var userId = GetUserIdFromContext(user);
            if (userId.HasValue)
            {
                var userEmail = user?.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(userEmail))
                {
                    var vendor = await _context.Vendors
                        .Include(v => v.ChannelVendors)
                        .FirstOrDefaultAsync(v => v.ContactEmail == userEmail);

                    if (vendor?.ChannelVendors?.Count == 1)
                        return vendor.ChannelVendors.First().ChannelId;
                }
            }

            return null;
        }

        /// <summary>
        /// Get the current channel with full details
        /// </summary>
        public async Task<Channel?> GetCurrentChannelAsync()
        {
            var channelId = await GetCurrentChannelIdAsync();
            if (!channelId.HasValue)
                return null;

            return await _context.Channels
                .Include(c => c.ChannelVendors)
                .Include(c => c.ChannelProducts)
                .Include(c => c.TaxRules)
                .FirstOrDefaultAsync(c => c.Id == channelId.Value);
        }

        /// <summary>
        /// Check if the current user has access to a specific channel
        /// Admins have access to all channels
        /// Vendors have access to channels they're assigned to
        /// Customers have general access
        /// </summary>
        public async Task<bool> IsChannelAccessAllowedAsync(Guid channelId)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return false;

            // Admin has access to all channels
            if (user.IsInRole("admin") || user.FindFirst(ClaimTypes.Role)?.Value == "admin")
                return true;

            // Check if channel exists
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                return false;

            // Vendor access - check if vendor is on this channel
            if (user.IsInRole("vendor") || user.FindFirst(ClaimTypes.Role)?.Value == "vendor")
            {
                var vendorEmail = user.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(vendorEmail))
                    return false;

                var vendor = await _context.Vendors
                    .Include(v => v.ChannelVendors)
                    .FirstOrDefaultAsync(v => v.ContactEmail == vendorEmail);

                if (vendor != null)
                    return vendor.ChannelVendors?.Any(cv => cv.ChannelId == channelId && cv.IsActive) == true;

                return false;
            }

            // Customer access - general access to active channels
            return channel.IsActive;
        }

        /// <summary>
        /// Validate that the current user has access to a channel
        /// </summary>
        public async Task ValidateChannelAccessAsync(Guid channelId)
        {
            var hasAccess = await IsChannelAccessAllowedAsync(channelId);
            if (!hasAccess)
            {
                _logger.LogWarning("User attempted unauthorized channel access: {ChannelId}", channelId);
                throw new UnauthorizedAccessException($"You do not have access to channel {channelId}");
            }
        }

        /// <summary>
        /// Get all channels the current user has access to
        /// </summary>
        public async Task<List<Channel>> GetAccessibleChannelsAsync()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return new List<Channel>();

            // Admin sees all channels
            if (user.IsInRole("admin") || user.FindFirst(ClaimTypes.Role)?.Value == "admin")
            {
                return await _context.Channels
                    .Where(c => c.IsActive)
                    .ToListAsync();
            }

            // Vendor sees only their channels
            if (user.IsInRole("vendor") || user.FindFirst(ClaimTypes.Role)?.Value == "vendor")
            {
                var vendorEmail = user.FindFirst(ClaimTypes.Email)?.Value;
                if (string.IsNullOrEmpty(vendorEmail))
                    return new List<Channel>();

                var vendor = await _context.Vendors
                    .Include(v => v.ChannelVendors!)
                    .ThenInclude(cv => cv.Channel)
                    .FirstOrDefaultAsync(v => v.ContactEmail == vendorEmail);

                if (vendor != null && vendor.ChannelVendors != null)
                {
                    return vendor.ChannelVendors
                        .Where(cv => cv.IsActive && cv.Channel != null)
                        .Select(cv => cv.Channel!)
                        .ToList();
                }

                return new List<Channel>();
            }

            // Customer sees all active channels
            return await _context.Channels
                .Where(c => c.IsActive)
                .ToListAsync();
        }

        /// <summary>
        /// Get the current user's role
        /// </summary>
        public Task<string?> GetCurrentUserRoleAsync()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return Task.FromResult<string?>(null);

            // Check claim first
            var roleClaim = user.FindFirst(ClaimTypes.Role);
            if (roleClaim != null)
                return Task.FromResult<string?>(roleClaim.Value);

            // Check role claims
            if (user.IsInRole("admin"))
                return Task.FromResult<string?>("admin");
            if (user.IsInRole("vendor"))
                return Task.FromResult<string?>("vendor");
            if (user.IsInRole("customer"))
                return Task.FromResult<string?>("customer");

            return Task.FromResult<string?>(null);
        }

        /// <summary>
        /// Get the current user's ID
        /// </summary>
        public Task<Guid?> GetCurrentUserIdAsync()
        {
            return Task.FromResult(GetUserIdFromContext(_httpContextAccessor.HttpContext?.User));
        }

        /// <summary>
        /// Helper method to extract user ID from context
        /// </summary>
        private Guid? GetUserIdFromContext(ClaimsPrincipal? user)
        {
            if (user == null)
                return null;

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)
                ?? user.FindFirst("sub")
                ?? user.FindFirst("user_id");

            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
                return userId;

            return null;
        }
    }
}
