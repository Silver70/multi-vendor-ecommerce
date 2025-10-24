namespace EcommerceApi.DTOs.Analytics
{
    public class ReviewSummaryDto
    {
        public int TotalReviews { get; set; }
        public decimal AverageRating { get; set; }
        public int ProductsWithReviews { get; set; }
        public int ProductsWithoutReviews { get; set; }
        public decimal ReviewCoverage { get; set; } // Percentage of products with reviews
    }

    public class RatingDistributionDto
    {
        public int Stars { get; set; } // 1-5
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class ProductRatingDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public int OneStarCount { get; set; }
        public int TwoStarCount { get; set; }
        public int ThreeStarCount { get; set; }
        public int FourStarCount { get; set; }
        public int FiveStarCount { get; set; }
    }

    public class TopRatedProductsDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Category { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }

    public class LowRatedProductsDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Category { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }

    public class ReviewTrendDto
    {
        public DateTime Date { get; set; }
        public int ReviewCount { get; set; }
        public decimal AverageRating { get; set; }
    }
}
