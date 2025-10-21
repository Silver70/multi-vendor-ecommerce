using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Attribute
{
    public class AddAttributeValuesDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one value is required")]
        public List<string> Values { get; set; } = new();
    }
}
