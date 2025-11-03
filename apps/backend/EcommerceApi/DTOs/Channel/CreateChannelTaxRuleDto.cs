using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class CreateChannelTaxRuleDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required, Range(0, 1)]
        public decimal TaxRate { get; set; }

        public Guid? CategoryId { get; set; }

        [MaxLength(2)]
        public string? ApplicableCountryCode { get; set; }

        [MaxLength(2)]
        public string? ApplicableRegionCode { get; set; }

        public bool ApplyToB2B { get; set; } = true;
        public bool ApplyToB2C { get; set; } = true;

        [Range(0, double.MaxValue)]
        public decimal? MinimumOrderAmount { get; set; }

        [RegularExpression("^(inclusive|exclusive)$")]
        public string TaxBehavior { get; set; } = "inclusive";

        public bool IsActive { get; set; } = true;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
