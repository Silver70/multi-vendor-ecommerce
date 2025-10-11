using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Order
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public Guid AddressId { get; set; }

        [Required]
        public string Status { get; set; } = "pending"; // pending, paid, shipped, delivered, cancelled

        public decimal TotalAmount { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User? User { get; set; }
        public Address? Address { get; set; }
        public ICollection<OrderItem>? Items { get; set; }
        public ICollection<Payment>? Payments { get; set; }
    }
}