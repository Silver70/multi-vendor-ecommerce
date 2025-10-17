using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Review;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReviewsController> _logger;

        public ReviewsController(AppDbContext context, ILogger<ReviewsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<ReviewDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<ReviewDto>>> GetReviews([FromQuery] ReviewFilterParams filterParams)
        {
            try
            {
                var query = _context.Reviews.AsQueryable();

                if (filterParams.UserId.HasValue)
                    query = query.Where(r => r.UserId == filterParams.UserId.Value);

                if (filterParams.ProductId.HasValue)
                    query = query.Where(r => r.ProductId == filterParams.ProductId.Value);

                if (filterParams.MinRating.HasValue)
                    query = query.Where(r => r.Rating >= filterParams.MinRating.Value);

                if (filterParams.MaxRating.HasValue)
                    query = query.Where(r => r.Rating <= filterParams.MaxRating.Value);

                var totalCount = await query.CountAsync();
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(r => new ReviewDto
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        ProductId = r.ProductId,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt,
                        UserName = r.User != null ? r.User.Name : null,
                        ProductName = r.Product != null ? r.Product.Name : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<ReviewDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = filterParams.PageNumber,
                    PageSize = filterParams.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reviews");
                return StatusCode(500, new { message = "An error occurred while retrieving reviews" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ReviewDto>> GetReview(Guid id)
        {
            try
            {
                var review = await _context.Reviews
                    .Where(r => r.Id == id)
                    .Select(r => new ReviewDto
                    {
                        Id = r.Id,
                        UserId = r.UserId,
                        ProductId = r.ProductId,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt,
                        UserName = r.User != null ? r.User.Name : null,
                        ProductName = r.Product != null ? r.Product.Name : null
                    })
                    .FirstOrDefaultAsync();

                if (review == null)
                    return NotFound(new { message = $"Review with ID {id} not found" });

                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving review {ReviewId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the review" });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto createDto)
        {
            try
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == createDto.UserId);
                if (!userExists)
                    return BadRequest(new { message = "User not found" });

                var productExists = await _context.Products.AnyAsync(p => p.Id == createDto.ProductId);
                if (!productExists)
                    return BadRequest(new { message = "Product not found" });

                var existingReview = await _context.Reviews
                    .AnyAsync(r => r.UserId == createDto.UserId && r.ProductId == createDto.ProductId);
                if (existingReview)
                    return BadRequest(new { message = "User has already reviewed this product" });

                var review = new Models.Review
                {
                    Id = Guid.NewGuid(),
                    UserId = createDto.UserId,
                    ProductId = createDto.ProductId,
                    Rating = createDto.Rating,
                    Comment = createDto.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                var reviewDto = new ReviewDto
                {
                    Id = review.Id,
                    UserId = review.UserId,
                    ProductId = review.ProductId,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                };

                return CreatedAtAction(nameof(GetReview), new { id = review.Id }, reviewDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating review");
                return StatusCode(500, new { message = "An error occurred while creating the review" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ReviewDto>> UpdateReview(Guid id, [FromBody] UpdateReviewDto updateDto)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                    return NotFound(new { message = $"Review with ID {id} not found" });

                review.Rating = updateDto.Rating;
                review.Comment = updateDto.Comment;

                await _context.SaveChangesAsync();

                var reviewDto = new ReviewDto
                {
                    Id = review.Id,
                    UserId = review.UserId,
                    ProductId = review.ProductId,
                    Rating = review.Rating,
                    Comment = review.Comment,
                    CreatedAt = review.CreatedAt
                };

                return Ok(reviewDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating review {ReviewId}", id);
                return StatusCode(409, new { message = "The review was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating review {ReviewId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the review" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteReview(Guid id)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                    return NotFound(new { message = $"Review with ID {id} not found" });

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting review {ReviewId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the review" });
            }
        }

        private IQueryable<Models.Review> ApplySorting(IQueryable<Models.Review> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
                return query.OrderByDescending(r => r.CreatedAt);

            return sortBy.ToLower() switch
            {
                "rating" => descending ? query.OrderByDescending(r => r.Rating) : query.OrderBy(r => r.Rating),
                "createdat" => descending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt),
                _ => query.OrderByDescending(r => r.CreatedAt)
            };
        }
    }
}
