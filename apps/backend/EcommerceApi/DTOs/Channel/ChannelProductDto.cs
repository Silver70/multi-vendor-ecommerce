using EcommerceApi.DTOs.Product;

namespace EcommerceApi.DTOs.Channel
{
    public class ChannelProductDto
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public Guid ProductId { get; set; }
        public string? ChannelName { get; set; }
        public decimal? ChannelPrice { get; set; }
        public bool IsActive { get; set; }
        public string? ExternalProductId { get; set; }
        public ProductDto? Product { get; set; }
    }
}
