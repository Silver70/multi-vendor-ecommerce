
using System.ComponentModel.DataAnnotations;


namespace EcommerceApi.Models
{
    public class User
    {
       public Guid Id { get; set; }

        // Clerk user ID for authentication
        [Required, MaxLength(100)]
        public string ClerkId { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        // PasswordHash is no longer needed with Clerk, but keeping for migration compatibility
        // Remove this field after all users are migrated to Clerk
        public string? PasswordHash { get; set; }

        [Required]
        public string Role { get; set; } = "customer"; // "customer", "admin", "vendor"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Address>? Addresses { get; set; }
        public ICollection<Order>? Orders { get; set; }
        public ICollection<Review>? Reviews { get; set; }
    }
}