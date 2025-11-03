namespace EcommerceApi.DTOs.Product
{
    public class ProductDto
    {
        public Guid Id { get; set; }
        public Guid? VendorId { get; set; }
        public Guid CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Slug { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public decimal BasePrice { get; set; }  // 🆕 NEW
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string? VendorName { get; set; }
        public string? CategoryName { get; set; }
        public string? ImageUrl { get; set; }
    }
}
