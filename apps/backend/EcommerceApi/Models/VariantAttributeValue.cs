using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class VariantAttributeValue
{
    public Guid Id { get; set; }
    public Guid VariantId { get; set; }
    public Guid AttributeValueId { get; set; }

    public ProductVariant Variant { get; set; } = null!;
    public ProductAttributeValue AttributeValue { get; set; } = null!;
}

}