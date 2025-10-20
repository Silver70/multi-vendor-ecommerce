namespace EcommerceApi.DTOs.Order
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid AddressId { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? UserName { get; set; }
        public AddressInfo? Address { get; set; }
        public List<OrderItemInfo>? Items { get; set; }

        public List<PaymentInfo>? Payments { get; set; }
    }

    public class AddressInfo
    {
        public string FullName { get; set; } = string.Empty;
        public string Line1 { get; set; } = string.Empty;
        public string? Line2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public string Country { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    public class OrderItemInfo
    {
        public Guid Id { get; set; }
        public Guid VariantId { get; set; }
        public string? VariantSku { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Subtotal => Quantity * Price;
    }

    public class PaymentInfo
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string Method { get; set; } = string.Empty;
    }
}
