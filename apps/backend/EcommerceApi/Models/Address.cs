using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models 
{
    public class Address
    {
        public Guid Id { get; set; }

        [Required]
        public Guid CustomerId { get; set; }

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Line1 { get; set; } = string.Empty;

        public string? Line2 { get; set; }

        [Required, MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [Required, MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        // Navigation
        public Customer? Customer { get; set; }
    }
}