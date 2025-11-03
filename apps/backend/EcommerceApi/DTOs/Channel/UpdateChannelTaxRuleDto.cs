using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class UpdateChannelTaxRuleDto
    {
        [MaxLength(100)]
        public string? Name { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        [Range(0, 1)]
        public decimal? TaxRate { get; set; }

        public Guid? CategoryId { get; set; }

        [MaxLength(2)]
        public string? ApplicableCountryCode { get; set; }

        [MaxLength(2)]
        public string? ApplicableRegionCode { get; set; }

        public bool? ApplyToB2B { get; set; }
        public bool? ApplyToB2C { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? MinimumOrderAmount { get; set; }

        [RegularExpression("^(inclusive|exclusive)$")]
        public string? TaxBehavior { get; set; }

        public bool? IsActive { get; set; }

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}
