using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.ProductImage;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductImagesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProductImagesController> _logger;

        public ProductImagesController(AppDbContext context, ILogger<ProductImagesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get paginated and filtered list of product images
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<ProductImageDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<ProductImageDto>>> GetProductImages([FromQuery] ProductImageFilterParams filterParams)
        {
            try
            {
                var query = _context.ProductImages.AsQueryable();

                // Apply filters
                if (filterParams.ProductId.HasValue)
                {
                    query = query.Where(pi => pi.ProductId == filterParams.ProductId.Value);
                }

                if (filterParams.VariantId.HasValue)
                {
                    query = query.Where(pi => pi.VariantId == filterParams.VariantId.Value);
                }

                if (filterParams.IsPrimary.HasValue)
                {
                    query = query.Where(pi => pi.IsPrimary == filterParams.IsPrimary.Value);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                // Apply pagination
                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(pi => new ProductImageDto
                    {
                        Id = pi.Id,
                        ProductId = pi.ProductId,
                        VariantId = pi.VariantId,
                        ImageUrl = pi.ImageUrl,
                        IsPrimary = pi.IsPrimary,
                        ProductName = pi.Product != null ? pi.Product.Name : null
                    })
                    .ToListAsync();

                var result = new PagedResult<ProductImageDto>
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
                _logger.LogError(ex, "Error retrieving product images");
                return StatusCode(500, new { message = "An error occurred while retrieving product images" });
            }
        }

        /// <summary>
        /// Get a specific product image by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductImageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ProductImageDto>> GetProductImage(Guid id)
        {
            try
            {
                var productImage = await _context.ProductImages
                    .Where(pi => pi.Id == id)
                    .Select(pi => new ProductImageDto
                    {
                        Id = pi.Id,
                        ProductId = pi.ProductId,
                        VariantId = pi.VariantId,
                        ImageUrl = pi.ImageUrl,
                        IsPrimary = pi.IsPrimary,
                        ProductName = pi.Product != null ? pi.Product.Name : null
                    })
                    .FirstOrDefaultAsync();

                if (productImage == null)
                {
                    return NotFound(new { message = $"Product image with ID {id} not found" });
                }

                return Ok(productImage);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product image {ImageId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product image" });
            }
        }

        /// <summary>
        /// Create a new product image
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ProductImageDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductImageDto>> CreateProductImage([FromBody] CreateProductImageDto createDto)
        {
            try
            {
                // Validate product exists
                var productExists = await _context.Products.AnyAsync(p => p.Id == createDto.ProductId);
                if (!productExists)
                {
                    return BadRequest(new { message = "Product not found" });
                }

                // Validate variant exists if VariantId is provided
                if (createDto.VariantId.HasValue)
                {
                    var variantExists = await _context.ProductVariants.AnyAsync(pv => pv.Id == createDto.VariantId.Value);
                    if (!variantExists)
                    {
                        return BadRequest(new { message = "Product variant not found" });
                    }
                }

                // If this is set as primary, unset other primary images for the same product/variant
                if (createDto.IsPrimary)
                {
                    var existingPrimaryImages = _context.ProductImages
                        .Where(pi => pi.ProductId == createDto.ProductId && pi.VariantId == createDto.VariantId && pi.IsPrimary);

                    await existingPrimaryImages.ForEachAsync(pi => pi.IsPrimary = false);
                }

                var productImage = new Models.ProductImage
                {
                    Id = Guid.NewGuid(),
                    ProductId = createDto.ProductId,
                    VariantId = createDto.VariantId,
                    ImageUrl = createDto.ImageUrl,
                    IsPrimary = createDto.IsPrimary
                };

                _context.ProductImages.Add(productImage);
                await _context.SaveChangesAsync();

                var productImageDto = new ProductImageDto
                {
                    Id = productImage.Id,
                    ProductId = productImage.ProductId,
                    VariantId = productImage.VariantId,
                    ImageUrl = productImage.ImageUrl,
                    IsPrimary = productImage.IsPrimary
                };

                return CreatedAtAction(nameof(GetProductImage), new { id = productImage.Id }, productImageDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product image");
                return StatusCode(500, new { message = "An error occurred while creating the product image" });
            }
        }

        /// <summary>
        /// Update an existing product image
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ProductImageDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductImageDto>> UpdateProductImage(Guid id, [FromBody] UpdateProductImageDto updateDto)
        {
            try
            {
                var productImage = await _context.ProductImages.FindAsync(id);
                if (productImage == null)
                {
                    return NotFound(new { message = $"Product image with ID {id} not found" });
                }

                // If this is set as primary, unset other primary images for the same product/variant
                if (updateDto.IsPrimary && !productImage.IsPrimary)
                {
                    var existingPrimaryImages = _context.ProductImages
                        .Where(pi => pi.ProductId == productImage.ProductId &&
                                     pi.VariantId == productImage.VariantId &&
                                     pi.IsPrimary &&
                                     pi.Id != id);

                    await existingPrimaryImages.ForEachAsync(pi => pi.IsPrimary = false);
                }

                productImage.ImageUrl = updateDto.ImageUrl;
                productImage.IsPrimary = updateDto.IsPrimary;

                await _context.SaveChangesAsync();

                var productImageDto = new ProductImageDto
                {
                    Id = productImage.Id,
                    ProductId = productImage.ProductId,
                    VariantId = productImage.VariantId,
                    ImageUrl = productImage.ImageUrl,
                    IsPrimary = productImage.IsPrimary
                };

                return Ok(productImageDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating product image {ImageId}", id);
                return StatusCode(409, new { message = "The product image was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product image {ImageId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product image" });
            }
        }

        /// <summary>
        /// Delete a product image
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteProductImage(Guid id)
        {
            try
            {
                var productImage = await _context.ProductImages.FindAsync(id);
                if (productImage == null)
                {
                    return NotFound(new { message = $"Product image with ID {id} not found" });
                }

                _context.ProductImages.Remove(productImage);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product image {ImageId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the product image" });
            }
        }

        private IQueryable<Models.ProductImage> ApplySorting(IQueryable<Models.ProductImage> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderBy(pi => pi.ProductId).ThenByDescending(pi => pi.IsPrimary);
            }

            query = sortBy.ToLower() switch
            {
                "productid" => descending ? query.OrderByDescending(pi => pi.ProductId) : query.OrderBy(pi => pi.ProductId),
                "isprimary" => descending ? query.OrderByDescending(pi => pi.IsPrimary) : query.OrderBy(pi => pi.IsPrimary),
                _ => query.OrderBy(pi => pi.ProductId).ThenByDescending(pi => pi.IsPrimary)
            };

            return query;
        }
    }
}
