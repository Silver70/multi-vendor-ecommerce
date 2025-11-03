using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class ChannelProduct
    {
        public Guid Id { get; set; }

        public Guid ChannelId { get; set; }
        public Guid ProductId { get; set; }

        // Channel-specific product data (overrides base product)
        [MaxLength(200)]
        public string? ChannelName { get; set; }  // Channel-specific product name
        public string? ChannelDescription { get; set; }
        public decimal? ChannelPrice { get; set; }  // Channel-specific price override
        public bool IsActive { get; set; } = true;  // Product visibility per channel
        public string? ExternalProductId { get; set; }  // 3rd-party product ID (SKU mapping)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Channel? Channel { get; set; }
        public Product? Product { get; set; }
    }
}
