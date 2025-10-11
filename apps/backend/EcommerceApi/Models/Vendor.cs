using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Vendor
    {
       public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        public string? ContactEmail { get; set; }

        public string? Website { get; set; }

        // Navigation
        public ICollection<Product>? Products { get; set; }
    }
}
