using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Review
{
    public class UpdateReviewDto
    {
        [Required(ErrorMessage = "Rating is required")]
        [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5")]
        public int Rating { get; set; }

        [MaxLength(2000, ErrorMessage = "Comment cannot exceed 2000 characters")]
        public string? Comment { get; set; }
    }
}
