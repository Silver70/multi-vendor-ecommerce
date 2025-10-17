using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.ProductVariant;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductVariantsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProductVariantsController> _logger;

        public ProductVariantsController(AppDbContext context, ILogger<ProductVariantsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get paginated and filtered list of product variants
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<ProductVariantDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<ProductVariantDto>>> GetProductVariants([FromQuery] ProductVariantFilterParams filterParams)
        {
            try
            {
                var query = _context.ProductVariants.AsQueryable();

                // Apply filters
                if (filterParams.ProductId.HasValue)
                {
                    query = query.Where(pv => pv.ProductId == filterParams.ProductId.Value);
                }

                if (!string.IsNullOrWhiteSpace(filterParams.Sku))
                {
                    query = query.Where(pv => pv.Sku.Contains(filterParams.Sku));
                }

                if (filterParams.MinPrice.HasValue)
                {
                    query = query.Where(pv => pv.Price >= filterParams.MinPrice.Value);
                }

                if (filterParams.MaxPrice.HasValue)
                {
                    query = query.Where(pv => pv.Price <= filterParams.MaxPrice.Value);
                }

                if (filterParams.InStock.HasValue)
                {
                    query = filterParams.InStock.Value
                        ? query.Where(pv => pv.Stock > 0)
                        : query.Where(pv => pv.Stock == 0);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                // Apply pagination
                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(pv => new ProductVariantDto
                    {
                        Id = pv.Id,
                        ProductId = pv.ProductId,
                        Sku = pv.Sku,
                        Price = pv.Price,
                        Stock = pv.Stock,
                        Attributes = pv.Attributes,
                        CreatedAt = pv.CreatedAt,
                        ProductName = pv.Product != null ? pv.Product.Name : null
                    })
                    .ToListAsync();

                var result = new PagedResult<ProductVariantDto>
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
                _logger.LogError(ex, "Error retrieving product variants");
                return StatusCode(500, new { message = "An error occurred while retrieving product variants" });
            }
        }

        /// <summary>
        /// Get a specific product variant by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductVariantDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ProductVariantDto>> GetProductVariant(Guid id)
        {
            try
            {
                var productVariant = await _context.ProductVariants
                    .Where(pv => pv.Id == id)
                    .Select(pv => new ProductVariantDto
                    {
                        Id = pv.Id,
                        ProductId = pv.ProductId,
                        Sku = pv.Sku,
                        Price = pv.Price,
                        Stock = pv.Stock,
                        Attributes = pv.Attributes,
                        CreatedAt = pv.CreatedAt,
                        ProductName = pv.Product != null ? pv.Product.Name : null
                    })
                    .FirstOrDefaultAsync();

                if (productVariant == null)
                {
                    return NotFound(new { message = $"Product variant with ID {id} not found" });
                }

                return Ok(productVariant);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product variant {VariantId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product variant" });
            }
        }

        /// <summary>
        /// Create a new product variant
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ProductVariantDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductVariantDto>> CreateProductVariant([FromBody] CreateProductVariantDto createDto)
        {
            try
            {
                // Validate product exists
                var productExists = await _context.Products.AnyAsync(p => p.Id == createDto.ProductId);
                if (!productExists)
                {
                    return BadRequest(new { message = "Product not found" });
                }

                // Check if SKU already exists
                var skuExists = await _context.ProductVariants.AnyAsync(pv => pv.Sku == createDto.Sku);
                if (skuExists)
                {
                    return BadRequest(new { message = "A product variant with this SKU already exists" });
                }

                var productVariant = new Models.ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = createDto.ProductId,
                    Sku = createDto.Sku,
                    Price = createDto.Price,
                    Stock = createDto.Stock,
                    Attributes = createDto.Attributes,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProductVariants.Add(productVariant);
                await _context.SaveChangesAsync();

                var productVariantDto = new ProductVariantDto
                {
                    Id = productVariant.Id,
                    ProductId = productVariant.ProductId,
                    Sku = productVariant.Sku,
                    Price = productVariant.Price,
                    Stock = productVariant.Stock,
                    Attributes = productVariant.Attributes,
                    CreatedAt = productVariant.CreatedAt
                };

                return CreatedAtAction(nameof(GetProductVariant), new { id = productVariant.Id }, productVariantDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product variant");
                return StatusCode(500, new { message = "An error occurred while creating the product variant" });
            }
        }

        /// <summary>
        /// Update an existing product variant
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ProductVariantDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductVariantDto>> UpdateProductVariant(Guid id, [FromBody] UpdateProductVariantDto updateDto)
        {
            try
            {
                var productVariant = await _context.ProductVariants.FindAsync(id);
                if (productVariant == null)
                {
                    return NotFound(new { message = $"Product variant with ID {id} not found" });
                }

                // Check if SKU already exists for a different variant
                var skuExists = await _context.ProductVariants
                    .AnyAsync(pv => pv.Sku == updateDto.Sku && pv.Id != id);
                if (skuExists)
                {
                    return BadRequest(new { message = "A product variant with this SKU already exists" });
                }

                productVariant.Sku = updateDto.Sku;
                productVariant.Price = updateDto.Price;
                productVariant.Stock = updateDto.Stock;
                productVariant.Attributes = updateDto.Attributes;

                await _context.SaveChangesAsync();

                var productVariantDto = new ProductVariantDto
                {
                    Id = productVariant.Id,
                    ProductId = productVariant.ProductId,
                    Sku = productVariant.Sku,
                    Price = productVariant.Price,
                    Stock = productVariant.Stock,
                    Attributes = productVariant.Attributes,
                    CreatedAt = productVariant.CreatedAt
                };

                return Ok(productVariantDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating product variant {VariantId}", id);
                return StatusCode(409, new { message = "The product variant was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product variant {VariantId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product variant" });
            }
        }

        /// <summary>
        /// Delete a product variant
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteProductVariant(Guid id)
        {
            try
            {
                var productVariant = await _context.ProductVariants
                    .Include(pv => pv.OrderItems)
                    .FirstOrDefaultAsync(pv => pv.Id == id);

                if (productVariant == null)
                {
                    return NotFound(new { message = $"Product variant with ID {id} not found" });
                }

                // Check if variant has associated order items
                if (productVariant.OrderItems != null && productVariant.OrderItems.Any())
                {
                    return BadRequest(new { message = "Cannot delete product variant with associated orders. Consider deactivating the product instead." });
                }

                _context.ProductVariants.Remove(productVariant);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product variant {VariantId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the product variant" });
            }
        }

        private IQueryable<Models.ProductVariant> ApplySorting(IQueryable<Models.ProductVariant> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderByDescending(pv => pv.CreatedAt);
            }

            query = sortBy.ToLower() switch
            {
                "sku" => descending ? query.OrderByDescending(pv => pv.Sku) : query.OrderBy(pv => pv.Sku),
                "price" => descending ? query.OrderByDescending(pv => pv.Price) : query.OrderBy(pv => pv.Price),
                "stock" => descending ? query.OrderByDescending(pv => pv.Stock) : query.OrderBy(pv => pv.Stock),
                "createdat" => descending ? query.OrderByDescending(pv => pv.CreatedAt) : query.OrderBy(pv => pv.CreatedAt),
                _ => query.OrderByDescending(pv => pv.CreatedAt)
            };

            return query;
        }
    }
}
