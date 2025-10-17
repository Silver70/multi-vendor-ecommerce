using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Payment
{
    public class UpdatePaymentDto
    {
        [Required(ErrorMessage = "Status is required")]
        [RegularExpression("^(pending|completed|failed|refunded)$",
            ErrorMessage = "Status must be one of: pending, completed, failed, refunded")]
        public string Status { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Transaction ID cannot exceed 200 characters")]
        public string? TransactionId { get; set; }
    }
}
