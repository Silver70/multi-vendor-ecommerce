using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Channel
    {
        public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;  // e.g., "Shopify", "Direct Web"

        [Required]
        public string Type { get; set; } = string.Empty;  // e.g., "shopify", "woocommerce", "web"

        [MaxLength(500)]
        public string? Description { get; set; }

        // Channel configuration
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Optional: External channel identifier (for 3rd party integrations)
        public string? ExternalId { get; set; }

        // 🆕 Regional & Localization Settings
        [Required, MaxLength(2)]
        public string CountryCode { get; set; } = string.Empty;  // ISO 3166-1 alpha-2 (e.g., "US", "UK", "DE", "FR")

        [MaxLength(2)]
        public string? RegionCode { get; set; }  // ISO 3166-2 (e.g., "CA" for California, "ON" for Ontario)

        [Required, MaxLength(3)]
        public string CurrencyCode { get; set; } = string.Empty;  // ISO 4217 (e.g., "USD", "EUR", "GBP", "CAD")

        // 🆕 Tax Configuration
        public bool IsB2B { get; set; } = false;  // B2B channels may not charge tax
        public string? TaxIdentificationNumber { get; set; }  // Tax ID for this channel (e.g., VAT number)
        public decimal DefaultTaxRate { get; set; } = 0m;  // Default tax rate percentage (e.g., 0.20 for 20%)
        public string TaxBehavior { get; set; } = "inclusive";  // "inclusive" or "exclusive" - whether prices include tax

        // Navigation properties
        public ICollection<ChannelVendor>? ChannelVendors { get; set; }  // Many-to-many: Channels <-> Vendors
        public ICollection<ChannelProduct>? ChannelProducts { get; set; } // Many-to-many: Channels <-> Products
        public ICollection<Order>? Orders { get; set; }  // One-to-many: Channel has many Orders
        public ICollection<ChannelTaxRule>? TaxRules { get; set; }  // 🆕 NEW: One-to-many: Channel has many TaxRules
    }
}
