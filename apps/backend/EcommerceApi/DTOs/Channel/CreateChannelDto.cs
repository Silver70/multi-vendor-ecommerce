using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class CreateChannelDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public string? ExternalId { get; set; }

        // 🆕 NEW: Regional & Tax Configuration
        [Required, MaxLength(2)]
        public string CountryCode { get; set; } = string.Empty;  // ISO 3166-1 alpha-2

        [MaxLength(2)]
        public string? RegionCode { get; set; }  // ISO 3166-2

        [Required, MaxLength(3)]
        public string CurrencyCode { get; set; } = string.Empty;  // ISO 4217

        public bool IsB2B { get; set; } = false;

        public string? TaxIdentificationNumber { get; set; }

        [Range(0, 1)]
        public decimal DefaultTaxRate { get; set; } = 0m;

        [RegularExpression("^(inclusive|exclusive)$")]
        public string TaxBehavior { get; set; } = "inclusive";
    }
}
