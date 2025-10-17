using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Payment
{
    public class PaymentFilterParams : PaginationParams
    {
        public Guid? OrderId { get; set; }
        public string? Status { get; set; }
        public string? Method { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
    }
}
