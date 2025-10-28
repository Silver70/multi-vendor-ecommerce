using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Product
{
    /// <summary>
    /// DTO for creating a product with all attributes and variants in one request
    /// </summary>
    public class CreateCompositeProductDto
    {
        [Required]
        public ProductInfoDto ProductInfo { get; set; } = null!;

        public List<ProductAttributeInputDto> Attributes { get; set; } = new();

        public List<VariantInputDto> Variants { get; set; } = new();

        public List<ProductImageInputDto> Images { get; set; } = new();
    }

    /// <summary>
    /// DTO for updating a product with all attributes and variants
    /// </summary>
    public class UpdateCompositeProductDto
    {
        [Required]
        public ProductInfoDto ProductInfo { get; set; } = null!;

        public List<ProductAttributeInputDto> Attributes { get; set; } = new();

        public List<VariantInputDto> Variants { get; set; } = new();
    }

    public class ProductInfoDto
    {
        [Required(ErrorMessage = "Product name is required")]
        [MaxLength(200, ErrorMessage = "Product name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required(ErrorMessage = "Category ID is required")]
        public Guid CategoryId { get; set; }

        public Guid? VendorId { get; set; }

        [Required(ErrorMessage = "Base price is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class ProductAttributeInputDto
    {
        [Required(ErrorMessage = "Attribute name is required")]
        [MaxLength(50, ErrorMessage = "Attribute name cannot exceed 50 characters")]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MinLength(1, ErrorMessage = "At least one attribute value is required")]
        public List<string> Values { get; set; } = new();
    }

    public class VariantInputDto
    {
        public string? Sku { get; set; }

        [Required(ErrorMessage = "Price is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than 0")]
        public decimal Price { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Stock cannot be negative")]
        public int Stock { get; set; } = 0;

        [Required]
        public Dictionary<string, string> Attributes { get; set; } = new();
    }

    /// <summary>
    /// Response DTO for composite product operations
    /// </summary>
    public class CompositeProductResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }
        public Guid CategoryId { get; set; }
        public Guid? VendorId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<ProductAttributeOutputDto> Attributes { get; set; } = new();
        public List<VariantOutputDto> Variants { get; set; } = new();
    }

    public class ProductAttributeOutputDto
    {
        public string Name { get; set; } = string.Empty;
        public List<string> Values { get; set; } = new();
    }

    public class VariantOutputDto
    {
        public Guid Id { get; set; }
        public string Sku { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public Dictionary<string, string> Attributes { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class ProductImageInputDto
    {
        [Required(ErrorMessage = "Image URL is required")]
        [Url(ErrorMessage = "Invalid URL format")]
        [MaxLength(500, ErrorMessage = "Image URL cannot exceed 500 characters")]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; } = false;
    }
}
