namespace EcommerceApi.DTOs.Channel
{
    public class ChannelDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }

        // 🆕 NEW: Regional & Tax Info
        public string CountryCode { get; set; } = string.Empty;
        public string? RegionCode { get; set; }
        public string CurrencyCode { get; set; } = string.Empty;
        public bool IsB2B { get; set; }
        public decimal DefaultTaxRate { get; set; }
        public string TaxBehavior { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
