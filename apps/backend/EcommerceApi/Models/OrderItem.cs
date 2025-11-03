using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class OrderItem
    {
        public Guid Id { get; set; }

        public Guid OrderId { get; set; }
        public Guid VariantId { get; set; }
        public Guid ChannelId { get; set; }  // 🆕 NEW: Denormalized for query efficiency

        public int Quantity { get; set; }

        [Required]
        public decimal Price { get; set; }

        // 🆕 NEW: External variant ID from channel (for inventory sync)
        public string? ExternalVariantId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Order? Order { get; set; }
        public ProductVariant? Variant { get; set; }
        public Channel? Channel { get; set; }  // 🆕 NEW
    }
}