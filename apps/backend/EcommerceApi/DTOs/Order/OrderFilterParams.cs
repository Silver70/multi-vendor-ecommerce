using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Order
{
    public class OrderFilterParams : PaginationParams
    {
        public Guid? UserId { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
    }
}
