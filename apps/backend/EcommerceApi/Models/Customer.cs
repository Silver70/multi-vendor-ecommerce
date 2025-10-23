using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Customer
    {
        public Guid Id { get; set; }

        // Optional: Who created this customer (admin/owner)
        public Guid? CreatedByUserId { get; set; }

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress, MaxLength(255)]
        public string? Email { get; set; }

        [Phone]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }

        // Metadata
        public bool IsFromWebsite { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User? CreatedByUser { get; set; }
        public ICollection<Address> Addresses { get; set; } = new List<Address>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}


