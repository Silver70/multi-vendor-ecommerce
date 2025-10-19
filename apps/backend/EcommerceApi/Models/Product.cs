using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Product
    {
        public Guid Id { get; set; }

        public Guid? VendorId { get; set; }
        public Guid CategoryId { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        // 🆕 SEO-friendly identifier
        [Required, MaxLength(200)]
        public string Slug { get; set; } = string.Empty;
        // Navigation
        public Vendor? Vendor { get; set; }
         public Category? Category { get; set; }
        public ICollection<ProductVariant>? Variants { get; set; }
        public ICollection<ProductImage>? Images { get; set; }
        public ICollection<Review>? Reviews { get; set; }
    }
}
