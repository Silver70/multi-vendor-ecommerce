using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Review
{
    public class ReviewFilterParams : PaginationParams
    {
        public Guid? UserId { get; set; }
        public Guid? ProductId { get; set; }
        public int? MinRating { get; set; }
        public int? MaxRating { get; set; }
    }
}
