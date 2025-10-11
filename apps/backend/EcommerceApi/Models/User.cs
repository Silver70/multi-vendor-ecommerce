
using System.ComponentModel.DataAnnotations;


namespace EcommerceApi.Models
{
    public class User
    {
       public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Role { get; set; } = "customer"; // "customer", "admin", "vendor"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        // public ICollection<Address>? Addresses { get; set; }
        // public ICollection<Order>? Orders { get; set; }
        // public ICollection<Review>? Reviews { get; set; }
    }
}