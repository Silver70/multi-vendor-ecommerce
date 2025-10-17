using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Vendor
{
    public class VendorFilterParams : PaginationParams
    {
        public string? Name { get; set; }
        public string? ContactEmail { get; set; }
    }
}
