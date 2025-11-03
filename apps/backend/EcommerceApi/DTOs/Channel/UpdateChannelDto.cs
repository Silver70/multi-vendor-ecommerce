using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class UpdateChannelDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
        public string? ExternalId { get; set; }

        // 🆕 NEW: Regional & Tax Configuration
        public string? CountryCode { get; set; }
        public string? RegionCode { get; set; }
        public string? CurrencyCode { get; set; }
        public bool? IsB2B { get; set; }
        public string? TaxIdentificationNumber { get; set; }

        [Range(0, 1)]
        public decimal? DefaultTaxRate { get; set; }

        [RegularExpression("^(inclusive|exclusive)$")]
        public string? TaxBehavior { get; set; }
    }
}
