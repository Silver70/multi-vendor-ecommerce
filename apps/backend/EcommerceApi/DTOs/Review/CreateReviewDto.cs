using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Review
{
    public class CreateReviewDto
    {
        [Required(ErrorMessage = "User ID is required")]
        public Guid UserId { get; set; }

        [Required(ErrorMessage = "Product ID is required")]
        public Guid ProductId { get; set; }

        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "Comment cannot exceed 2000 characters")]
        public string? Comment { get; set; }
    }
}
