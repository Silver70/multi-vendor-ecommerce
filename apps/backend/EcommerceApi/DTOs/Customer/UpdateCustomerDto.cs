using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Customer
{
    public class UpdateCustomerDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress, MaxLength(255)]
        public string? Email { get; set; }

        [Phone]
        public string? Phone { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }
}
