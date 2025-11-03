using EcommerceApi.Models;

namespace EcommerceApi.Services
{
    /// <summary>
    /// Service for managing channel context from HTTP requests
    /// Extracts channel information from JWT or request context
    /// </summary>
    public interface IChannelContextService
    {
        /// <summary>
        /// Get the current channel ID from the request context
        /// </summary>
        Task<Guid?> GetCurrentChannelIdAsync();

        /// <summary>
        /// Get the current channel with full details
        /// </summary>
        Task<Channel?> GetCurrentChannelAsync();

        /// <summary>
        /// Check if the current user has access to a specific channel
        /// </summary>
        Task<bool> IsChannelAccessAllowedAsync(Guid channelId);

        /// <summary>
        /// Validate that the current user has access to a channel
        /// Throws UnauthorizedAccessException if not allowed
        /// </summary>
        Task ValidateChannelAccessAsync(Guid channelId);

        /// <summary>
        /// Get all channels the current user has access to
        /// </summary>
        Task<List<Channel>> GetAccessibleChannelsAsync();

        /// <summary>
        /// Get the current user's role (admin, vendor, customer)
        /// </summary>
        Task<string?> GetCurrentUserRoleAsync();

        /// <summary>
        /// Get the current user's ID
        /// </summary>
        Task<Guid?> GetCurrentUserIdAsync();
    }
}
