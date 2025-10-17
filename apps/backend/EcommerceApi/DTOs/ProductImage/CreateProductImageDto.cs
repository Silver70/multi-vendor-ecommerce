using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.ProductImage
{
    public class CreateProductImageDto
    {
        [Required(ErrorMessage = "Product ID is required")]
        public Guid ProductId { get; set; }

        public Guid? VariantId { get; set; }

        [Required(ErrorMessage = "Image URL is required")]
        [Url(ErrorMessage = "Invalid URL format")]
        [MaxLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; } = false;
    }
}
