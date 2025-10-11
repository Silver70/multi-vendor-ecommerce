using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class ProductImage
    {
       public Guid Id { get; set; }

        public Guid ProductId { get; set; }
        public Guid? VariantId { get; set; }

        [Required]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; }

        // Navigation
        public Product? Product { get; set; }
        public ProductVariant? Variant { get; set; }
    }
}
