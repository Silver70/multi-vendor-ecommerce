namespace EcommerceApi.DTOs.Payment
{
    public class PaymentDto
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? OrderUserName { get; set; }
        public decimal? OrderTotalAmount { get; set; }
    }
}
