using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Customer
        { 
            public Guid Id { get; set; }

            [Required]
            public Guid UserId { get; set; }

            [Required, MaxLength(100)]
            public string FullName { get; set; } = string.Empty;

            [Phone]
            public string? Phone { get; set; }

            public DateTime? DateOfBirth { get; set; }

            // Navigation
            public User? User { get; set; }
            public ICollection<Address> Addresses { get; set; } = new List<Address>();
            public ICollection<Order> Orders { get; set; } = new List<Order>();
          
        }

}


