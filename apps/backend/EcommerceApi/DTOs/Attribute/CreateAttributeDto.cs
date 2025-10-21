using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Attribute
{
    public class CreateAttributeDto
    {
        [Required(ErrorMessage = "Attribute name is required")]
        [MaxLength(50, ErrorMessage = "Attribute name cannot exceed 50 characters")]
        public string Name { get; set; } = string.Empty;

        public List<string> Values { get; set; } = new();
    }
}
