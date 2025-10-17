using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Order
{
    public class UpdateOrderDto
    {
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(pending|paid|shipped|delivered|cancelled)$",
            ErrorMessage = "Status must be one of: pending, paid, shipped, delivered, cancelled")]
        public string Status { get; set; } = string.Empty;
    }
}
