using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Category;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(AppDbContext context, ILogger<CategoriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get paginated and filtered list of categories
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<CategoryDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<CategoryDto>>> GetCategories([FromQuery] CategoryFilterParams filterParams)
        {
            try
            {
                var query = _context.Categories
                    .Include(c => c.Products)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(filterParams.Name))
                {
                    query = query.Where(c => c.Name.Contains(filterParams.Name));
                }

                if (filterParams.ParentId.HasValue)
                {
                    query = query.Where(c => c.ParentId == filterParams.ParentId.Value);
                }

                if (filterParams.HasParent.HasValue)
                {
                    query = filterParams.HasParent.Value
                        ? query.Where(c => c.ParentId != null)
                        : query.Where(c => c.ParentId == null);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                // Apply pagination
                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        ParentId = c.ParentId,
                        Name = c.Name,
                        Slug = c.Slug,
                        ParentName = c.Parent != null ? c.Parent.Name : null,
                        ProductCount = c.Products != null ? c.Products.Count : 0
                    })
                    .ToListAsync();

                var result = new PagedResult<CategoryDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = filterParams.PageNumber,
                    PageSize = filterParams.PageSize
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving categories");
                return StatusCode(500, new { message = "An error occurred while retrieving categories" });
            }
        }

        /// <summary>
        /// Get a specific category by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CategoryDto>> GetCategory(Guid id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.Products)
                    .Where(c => c.Id == id)
                    .Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        ParentId = c.ParentId,
                        Name = c.Name,
                        Slug = c.Slug,
                        ParentName = c.Parent != null ? c.Parent.Name : null,
                        ProductCount = c.Products != null ? c.Products.Count : 0
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                return Ok(category);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the category" });
            }
        }

        /// <summary>
        /// Create a new category
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CategoryDto>> CreateCategory([FromBody] CreateCategoryDto createDto)
        {
            try
            {
                // Validate parent exists if ParentId is provided
                if (createDto.ParentId.HasValue)
                {
                    var parentExists = await _context.Categories.AnyAsync(c => c.Id == createDto.ParentId.Value);
                    if (!parentExists)
                    {
                        return BadRequest(new { message = "Parent category not found" });
                    }
                }

                // Auto-generate slug from name if not provided
                string slug = string.IsNullOrWhiteSpace(createDto.Slug)
                    ? GenerateSlug(createDto.Name)
                    : createDto.Slug;

                // Check if slug already exists
                var slugExists = await _context.Categories.AnyAsync(c => c.Slug == slug);
                if (slugExists)
                {
                    return BadRequest(new { message = "A category with this slug already exists" });
                }

                var category = new Models.Category
                {
                    Id = Guid.NewGuid(),
                    ParentId = createDto.ParentId,
                    Name = createDto.Name,
                    Slug = slug
                };

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                var categoryDto = new CategoryDto
                {
                    Id = category.Id,
                    ParentId = category.ParentId,
                    Name = category.Name,
                    Slug = category.Slug
                };

                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, categoryDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating category");
                return StatusCode(500, new { message = "An error occurred while creating the category" });
            }
        }

        /// <summary>
        /// Update an existing category
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(CategoryDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CategoryDto>> UpdateCategory(Guid id, [FromBody] UpdateCategoryDto updateDto)
        {
            try
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                // Validate parent exists if ParentId is provided
                if (updateDto.ParentId.HasValue)
                {
                    // Prevent circular reference (category cannot be its own parent)
                    if (updateDto.ParentId.Value == id)
                    {
                        return BadRequest(new { message = "Category cannot be its own parent" });
                    }

                    var parentExists = await _context.Categories.AnyAsync(c => c.Id == updateDto.ParentId.Value);
                    if (!parentExists)
                    {
                        return BadRequest(new { message = "Parent category not found" });
                    }
                }

                // Check if slug already exists for a different category
                var slugExists = await _context.Categories
                    .AnyAsync(c => c.Slug == updateDto.Slug && c.Id != id);
                if (slugExists)
                {
                    return BadRequest(new { message = "A category with this slug already exists" });
                }

                category.ParentId = updateDto.ParentId;
                category.Name = updateDto.Name;
                category.Slug = updateDto.Slug;

                await _context.SaveChangesAsync();

                var categoryDto = new CategoryDto
                {
                    Id = category.Id,
                    ParentId = category.ParentId,
                    Name = category.Name,
                    Slug = category.Slug
                };

                return Ok(categoryDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating category {CategoryId}", id);
                return StatusCode(409, new { message = "The category was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the category" });
            }
        }

        /// <summary>
        /// Delete a category
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            try
            {
                var category = await _context.Categories
                    .Include(c => c.Subcategories)
                    .Include(c => c.Products)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (category == null)
                {
                    return NotFound(new { message = $"Category with ID {id} not found" });
                }

                // Check if category has subcategories
                if (category.Subcategories != null && category.Subcategories.Any())
                {
                    return BadRequest(new { message = "Cannot delete category with subcategories. Delete subcategories first." });
                }

                // Check if category has products
                if (category.Products != null && category.Products.Any())
                {
                    return BadRequest(new { message = "Cannot delete category with associated products. Reassign or delete products first." });
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting category {CategoryId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the category" });
            }
        }

        private IQueryable<Models.Category> ApplySorting(IQueryable<Models.Category> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderBy(c => c.Name);
            }

            query = sortBy.ToLower() switch
            {
                "name" => descending ? query.OrderByDescending(c => c.Name) : query.OrderBy(c => c.Name),
                "slug" => descending ? query.OrderByDescending(c => c.Slug) : query.OrderBy(c => c.Slug),
                _ => query.OrderBy(c => c.Name)
            };

            return query;
        }

        private string GenerateSlug(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            return text
                .ToLower()
                .Trim()
                .Replace(" ", "-")
                .Replace("--", "-")
                // Remove non-alphanumeric characters except hyphens
                .Where(c => char.IsLetterOrDigit(c) || c == '-')
                .Aggregate(new System.Text.StringBuilder(), (sb, c) => sb.Append(c))
                .ToString()
                .TrimEnd('-');
        }
    }
}
