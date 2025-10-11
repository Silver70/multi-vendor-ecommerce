using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Payment
    {
        public Guid Id { get; set; }

        public Guid OrderId { get; set; }

        [Required]
        public string Method { get; set; } = "card";

        [Required]
        public string Status { get; set; } = "pending"; // pending, completed, failed, refunded

        public string? TransactionId { get; set; }

        [Required]
        public decimal Amount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Order? Order { get; set; }
    }
}
