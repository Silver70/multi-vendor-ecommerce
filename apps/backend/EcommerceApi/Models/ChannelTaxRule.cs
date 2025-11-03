using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class ChannelTaxRule
    {
        public Guid Id { get; set; }

        public Guid ChannelId { get; set; }

        // Tax rule parameters
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;  // e.g., "VAT", "GST", "Sales Tax", "Luxury Tax"

        [MaxLength(500)]
        public string? Description { get; set; }

        // Tax rate (as decimal: 0.20 = 20%)
        [Range(0, 1)]
        public decimal TaxRate { get; set; }

        // Product category filter (optional)
        public Guid? CategoryId { get; set; }  // If null, applies to all products in category

        // Regional filter
        public string? ApplicableCountryCode { get; set; }  // ISO 3166-1 alpha-2 (e.g., "DE")
        public string? ApplicableRegionCode { get; set; }  // ISO 3166-2 (e.g., "CA")

        // B2B vs B2C
        public bool ApplyToB2B { get; set; } = true;
        public bool ApplyToB2C { get; set; } = true;

        // Minimum order amount threshold
        public decimal? MinimumOrderAmount { get; set; }  // Tax only applies if order exceeds this

        // Tax behavior for this rule
        public string TaxBehavior { get; set; } = "inclusive";  // "inclusive" or "exclusive"

        // Rule validity
        public bool IsActive { get; set; } = true;
        public DateTime? StartDate { get; set; }  // When this rule becomes effective
        public DateTime? EndDate { get; set; }  // When this rule expires (e.g., seasonal tax)

        // Audit
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Channel? Channel { get; set; }
        public Category? Category { get; set; }  // Optional category filter
    }
}
