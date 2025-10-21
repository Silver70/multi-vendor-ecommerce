using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
   public class ProductAttribute
{
    public Guid Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty; // e.g. "Color", "Size", "Storage"

    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();
}

}