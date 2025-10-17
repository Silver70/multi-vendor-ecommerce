using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Product
{
    public class UpdateProductDto
    {
        public Guid? VendorId { get; set; }

        [Required(ErrorMessage = "Category ID is required")]
        public Guid CategoryId { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters")]
        public string? Description { get; set; }

        public bool IsActive { get; set; }
    }
}
