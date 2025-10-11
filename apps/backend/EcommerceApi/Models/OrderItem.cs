using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class OrderItem
    {
      public Guid Id { get; set; }

        public Guid OrderId { get; set; }
        public Guid VariantId { get; set; }

        public int Quantity { get; set; }

        [Required]
        public decimal Price { get; set; }

        // Navigation
        public Order? Order { get; set; }
        public ProductVariant? Variant { get; set; }
    }
}