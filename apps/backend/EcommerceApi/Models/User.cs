
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
        

        [Required]
        public string Role { get; set; } = "customer"; // "customer", "admin", "vendor"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<Review>? Reviews { get; set; }
        public Customer? Customer { get; set; }
    }
}