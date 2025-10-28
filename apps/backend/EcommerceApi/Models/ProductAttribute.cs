using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
   public class ProductAttribute
{
    public Guid Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty; // e.g. "Color", "Size", "Storage"

    public ICollection<ProductAttributeValue> Values { get; set; } = new List<ProductAttributeValue>();

    /// <summary>
    /// Marks this attribute as popular/featured to show in the quick-add section
    /// </summary>
    public bool IsPopular { get; set; } = false;

    /// <summary>
    /// Display order for popular attributes (lower number = higher priority)
    /// </summary>
    public int DisplayOrder { get; set; } = 999;
}

}