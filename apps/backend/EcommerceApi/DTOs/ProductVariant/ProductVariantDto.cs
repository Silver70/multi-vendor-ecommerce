namespace EcommerceApi.DTOs.ProductVariant
{
    public class ProductVariantDto
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public string Sku { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public Dictionary<string, string> Attributes { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public string? ProductName { get; set; }
    }
}
