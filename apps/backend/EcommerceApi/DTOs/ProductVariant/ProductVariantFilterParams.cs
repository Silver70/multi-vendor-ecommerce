using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.ProductVariant
{
    public class ProductVariantFilterParams : PaginationParams
    {
        public Guid? ProductId { get; set; }
        public string? Sku { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public bool? InStock { get; set; }
    }
}
