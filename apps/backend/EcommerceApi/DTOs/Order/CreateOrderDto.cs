using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Order
{
    public class CreateOrderDto
    {
        [Required(ErrorMessage = "Customer ID is required")]
        public Guid CustomerId { get; set; }

        [Required(ErrorMessage = "Channel ID is required")]
        public Guid ChannelId { get; set; }  // 🆕 NEW: Required field

        [Required(ErrorMessage = "Address ID is required")]
        public Guid AddressId { get; set; }

        [Required(ErrorMessage = "At least one order item is required")]
        [MinLength(1, ErrorMessage = "Order must contain at least one item")]
        public List<CreateOrderItemDto> Items { get; set; } = new();

        // Optional: Shipping amount (defaults to 0 if not provided)
        [Range(0, double.MaxValue, ErrorMessage = "Shipping amount must be non-negative")]
        public decimal ShippingAmount { get; set; } = 0m;
    }

    public class CreateOrderItemDto
    {
        [Required(ErrorMessage = "Variant ID is required")]
        public Guid VariantId { get; set; }

        [Required(ErrorMessage = "Quantity is required")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1")]
        public int Quantity { get; set; }
    }
}
