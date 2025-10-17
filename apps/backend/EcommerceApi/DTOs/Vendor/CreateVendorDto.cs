using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Vendor
{
    public class CreateVendorDto
    {
        [Required(ErrorMessage = "Name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email address")]
        [MaxLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public string? ContactEmail { get; set; }

        [Url(ErrorMessage = "Invalid URL")]
        [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]
        public string? Website { get; set; }
    }
}
