namespace EcommerceApi.DTOs.Channel
{
    public class ChannelTaxRuleDto
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal TaxRate { get; set; }
        public Guid? CategoryId { get; set; }
        public string? ApplicableCountryCode { get; set; }
        public string? ApplicableRegionCode { get; set; }
        public bool ApplyToB2B { get; set; }
        public bool ApplyToB2C { get; set; }
        public decimal? MinimumOrderAmount { get; set; }
        public string TaxBehavior { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
