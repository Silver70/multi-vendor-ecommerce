using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Payment
{
    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Order ID is required")]
        public Guid OrderId { get; set; }

        [Required(ErrorMessage = "Payment method is required")]
        [MaxLength(50, ErrorMessage = "Payment method cannot exceed 50 characters")]
        public string Method { get; set; } = string.Empty;

        [Required(ErrorMessage = "Amount is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than 0")]
        public decimal Amount { get; set; }

        [MaxLength(200, ErrorMessage = "Transaction ID cannot exceed 200 characters")]
        public string? TransactionId { get; set; }
    }
}
