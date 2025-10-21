using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
   public class ProductAttributeValue
{
    public Guid Id { get; set; }
    public Guid AttributeId { get; set; }

    [Required, MaxLength(50)]
    public string Value { get; set; } = string.Empty; // e.g. "Red", "Blue", "128GB"

    public ProductAttribute Attribute { get; set; } = null!;
    // public ICollection<VariantAttributeValue> VariantAttributes { get; set; } = new List<VariantAttributeValue>();
}

}