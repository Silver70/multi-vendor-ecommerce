using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Address
{
    public class AddressFilterParams : PaginationParams
    {
        public Guid? CustomerId { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
    }
}
