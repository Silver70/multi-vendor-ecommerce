using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
    public class Order
    {
        public Guid Id { get; set; }

        public Guid CustomerId { get; set; }
        public Guid AddressId { get; set; }
        public Guid ChannelId { get; set; }  // 🆕 NEW: Which channel this order came from

        [Required]
        public string Status { get; set; } = "pending"; // pending, paid, shipped, delivered, cancelled

        // Pricing breakdown
        public decimal SubtotalAmount { get; set; }  // 🆕 MODIFIED: Base amount before tax/shipping
        public decimal TaxAmount { get; set; } = 0m;  // 🆕 NEW: Calculated tax
        public decimal ShippingAmount { get; set; } = 0m;  // Shipping cost
        public decimal TotalAmount { get; set; }  // Subtotal + Tax + Shipping

        // Tax information
        public string? AppliedTaxRuleName { get; set; }  // 🆕 NEW: Which tax rule was applied
        public decimal AppliedTaxRate { get; set; } = 0m;  // 🆕 NEW: The tax rate used for this order
        public bool TaxInclusive { get; set; } = false;  // 🆕 NEW: Whether tax is included in item prices

        // Currency
        public string CurrencyCode { get; set; } = "USD";  // 🆕 NEW: Order currency (from channel)

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // External identifier from channel
        public string? ExternalOrderId { get; set; }  // 🆕 NEW: e.g., Shopify order ID

        // Navigation
        public Customer? Customer { get; set; }
        public Address? Address { get; set; }
        public Channel? Channel { get; set; }  // 🆕 NEW
        public ICollection<OrderItem>? Items { get; set; }
        public ICollection<Payment>? Payments { get; set; }
    }
}