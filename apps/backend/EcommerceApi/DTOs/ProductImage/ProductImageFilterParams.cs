using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.ProductImage
{
    public class ProductImageFilterParams : PaginationParams
    {
        public Guid? ProductId { get; set; }
        public Guid? VariantId { get; set; }
        public bool? IsPrimary { get; set; }
    }
}
