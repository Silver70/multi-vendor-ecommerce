using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Product
{
    public class ProductFilterParams : PaginationParams
    {
        public string? Name { get; set; }
        public Guid? CategoryId { get; set; }
        public Guid? VendorId { get; set; }
        public bool? IsActive { get; set; }
    }
}
