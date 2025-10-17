using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.ProductVariant
{
    public class CreateProductVariantDto
    {
        [Required(ErrorMessage = "Product ID is required")]
        public Guid ProductId { get; set; }

        [Required(ErrorMessage = "SKU is required")]
        [MaxLength(50, ErrorMessage = "SKU cannot exceed 50 characters")]
        public string Sku { get; set; } = string.Empty;

        [Required(ErrorMessage = "Price is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int Stock { get; set; } = 0;

        [MaxLength(1000, ErrorMessage = "Attributes cannot exceed 1000 characters")]
        public string? Attributes { get; set; }
    }
}
