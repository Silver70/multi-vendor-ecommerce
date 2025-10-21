using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class ProductVariant
    {
        public Guid Id { get; set; }

        public Guid ProductId { get; set; }

        [Required, MaxLength(50)]
        public string Sku { get; set; } = string.Empty;

        [Required]
        public decimal Price { get; set; }

        public int Stock { get; set; }


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Product? Product { get; set; }

        public ICollection<VariantAttributeValue> VariantAttributes { get; set; } = new List<VariantAttributeValue>();
        public ICollection<OrderItem>? OrderItems { get; set; }
        public ICollection<InventoryLog>? InventoryLogs { get; set; }
        public ICollection<ProductImage>? Images { get; set; }


    }
}
