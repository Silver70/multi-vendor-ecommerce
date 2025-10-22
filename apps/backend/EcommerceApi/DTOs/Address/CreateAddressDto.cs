using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Address
{
    public class CreateAddressDto
    {
        [Required(ErrorMessage = "Customer ID is required")]
        public Guid CustomerId { get; set; }

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address line 1 is required")]
        [MaxLength(200, ErrorMessage = "Address line 1 cannot exceed 200 characters")]
        public string Line1 { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Address line 2 cannot exceed 200 characters")]
        public string? Line2 { get; set; }

        [Required(ErrorMessage = "City is required")]
        [MaxLength(100, ErrorMessage = "City cannot exceed 100 characters")]
        public string City { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
        public string? PostalCode { get; set; }

        [Required(ErrorMessage = "Country is required")]
        [MaxLength(100, ErrorMessage = "Country cannot exceed 100 characters")]
        public string Country { get; set; } = string.Empty;

        [MaxLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
        [Phone(ErrorMessage = "Invalid phone number format")]
        public string? Phone { get; set; }
    }
}
