using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Category
{
    public class CreateCategoryDto
    {
        public Guid? ParentId { get; set; }

        [Required(ErrorMessage = "Name is required")]
        [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Slug is required")]
        [MaxLength(100, ErrorMessage = "Slug cannot exceed 100 characters")]
        [RegularExpression(@"^[a-z0-9-]+$", ErrorMessage = "Slug must contain only lowercase letters, numbers, and hyphens")]
        public string Slug { get; set; } = string.Empty;
    }
}
