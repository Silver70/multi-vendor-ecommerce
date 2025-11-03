using EcommerceApi.DTOs.Channel;
using EcommerceApi.DTOs.Customer;

namespace EcommerceApi.DTOs.Order
{
    public class OrderDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid AddressId { get; set; }
        public Guid ChannelId { get; set; }  // 🆕 NEW: Which channel this order came from
        public string Status { get; set; } = string.Empty;

        // Pricing breakdown
        public decimal SubtotalAmount { get; set; }  // 🆕 NEW: Base amount before tax/shipping
        public decimal TaxAmount { get; set; } = 0m;  // 🆕 NEW: Calculated tax
        public decimal ShippingAmount { get; set; } = 0m;  // 🆕 NEW: Shipping cost
        public decimal TotalAmount { get; set; }  // Subtotal + Tax + Shipping

        // Tax information
        public string? AppliedTaxRuleName { get; set; }  // 🆕 NEW: Which tax rule was applied
        public decimal AppliedTaxRate { get; set; } = 0m;  // 🆕 NEW: The tax rate used for this order
        public bool TaxInclusive { get; set; } = false;  // 🆕 NEW: Whether tax is included in item prices

        // Currency
        public string CurrencyCode { get; set; } = "USD";  // 🆕 NEW: Order currency (from channel)

        // External identifier from channel
        public string? ExternalOrderId { get; set; }  // 🆕 NEW: e.g., Shopify order ID

        public DateTime CreatedAt { get; set; }

        // Full nested customer object
        public CustomerDto? Customer { get; set; }

        // Address info (snapshot at order time)
        public AddressInfo? Address { get; set; }

        // Channel info
        public ChannelDto? Channel { get; set; }  // 🆕 NEW

        // Order items and payments
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
