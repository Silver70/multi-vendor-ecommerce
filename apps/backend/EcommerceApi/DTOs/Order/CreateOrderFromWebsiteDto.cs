using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Order
{
    public class CreateOrderFromWebsiteDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [EmailAddress, MaxLength(255)]
        public string? Email { get; set; }

        [Phone]
        public string? Phone { get; set; }

        [Required, MaxLength(255)]
        public string AddressLine1 { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? AddressLine2 { get; set; }

        [Required, MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? PostalCode { get; set; }

        [Required]
        public List<OrderItemInput> Items { get; set; } = new();
    }

    public class OrderItemInput
    {
        [Required]
        public Guid VariantId { get; set; }

        [Required, Range(1, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
