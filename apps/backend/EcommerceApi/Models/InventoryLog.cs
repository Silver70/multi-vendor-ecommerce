using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class InventoryLog
    {
       public Guid Id { get; set; }

        public Guid VariantId { get; set; }

        public int Change { get; set; } // +5 restock, -1 order placed

        [MaxLength(100)]
        public string? Reason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ProductVariant? Variant { get; set; }
    }
}
