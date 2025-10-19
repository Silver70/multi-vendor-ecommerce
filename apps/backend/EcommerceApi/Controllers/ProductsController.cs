using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Product;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProductsController> _logger;

        public ProductsController(AppDbContext context, ILogger<ProductsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get paginated and filtered list of products
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<ProductDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<ProductDto>>> GetProducts([FromQuery] ProductFilterParams filterParams)
        {
            try
            {
                var query = _context.Products.AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(filterParams.Name))
                {
                    query = query.Where(p => p.Name.Contains(filterParams.Name));
                }

                if (filterParams.CategoryId.HasValue)
                {
                    query = query.Where(p => p.CategoryId == filterParams.CategoryId.Value);
                }

                if (filterParams.VendorId.HasValue)
                {
                    query = query.Where(p => p.VendorId == filterParams.VendorId.Value);
                }

                if (filterParams.IsActive.HasValue)
                {
                    query = query.Where(p => p.IsActive == filterParams.IsActive.Value);
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                // Apply pagination
                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(p => new ProductDto
                    {
                        Id = p.Id,
                        VendorId = p.VendorId,
                        CategoryId = p.CategoryId,
                        Name = p.Name,
                        Description = p.Description,
                        IsActive = p.IsActive,
                        CreatedAt = p.CreatedAt,
                        UpdatedAt = p.UpdatedAt,
                        VendorName = p.Vendor != null ? p.Vendor.Name : null,
                        CategoryName = p.Category != null ? p.Category.Name : null
                    })
                    .ToListAsync();

                var result = new PagedResult<ProductDto>
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
                _logger.LogError(ex, "Error retrieving products");
                return StatusCode(500, new { message = "An error occurred while retrieving products" });
            }
        }

        /// <summary>
        /// Get a specific product by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ProductDto>> GetProduct(Guid id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Vendor)
                    .Include(p => p.Category)
                    .Include(p => p.Variants)
                    .Where(p => p.Id == id)
                    .Select(p => new ProductDetailsDto
                     {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        CategoryName = p.Category.Name,
                        VendorName = p.Vendor.Name,
                        Variants = p.Variants.Select(v => new VariantDto
                        {
                            Id = v.Id,
                            Sku = v.Sku,
                            Price = v.Price,
                            Stock = v.Stock
                        }).ToList(),
                        ImageUrls = p.Images.Select(i => i.ImageUrl).ToList()
                     })
                    .FirstOrDefaultAsync();

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                return Ok(product);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
            }
        }

        /// <summary>
        /// Create a new product
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] CreateProductDto createDto)
        {
            try
            {
                // Validate category exists
                var categoryExists = await _context.Categories.AnyAsync(c => c.Id == createDto.CategoryId);
                if (!categoryExists)
                {
                    return BadRequest(new { message = "Category not found" });
                }

                // Validate vendor exists if VendorId is provided
                if (createDto.VendorId.HasValue)
                {
                    var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == createDto.VendorId.Value);
                    if (!vendorExists)
                    {
                        return BadRequest(new { message = "Vendor not found" });
                    }
                }

                var product = new Models.Product
                {
                    Id = Guid.NewGuid(),
                    VendorId = createDto.VendorId,
                    CategoryId = createDto.CategoryId,
                    Name = createDto.Name,
                    Description = createDto.Description,
                    IsActive = createDto.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                var productDto = new ProductDto
                {
                    Id = product.Id,
                    VendorId = product.VendorId,
                    CategoryId = product.CategoryId,
                    Name = product.Name,
                    Description = product.Description,
                    IsActive = product.IsActive,
                    CreatedAt = product.CreatedAt,
                    UpdatedAt = product.UpdatedAt
                };

                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating product");
                return StatusCode(500, new { message = "An error occurred while creating the product" });
            }
        }

        /// <summary>
        /// Update an existing product
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ProductDto>> UpdateProduct(Guid id, [FromBody] UpdateProductDto updateDto)
        {
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                // Validate category exists
                var categoryExists = await _context.Categories.AnyAsync(c => c.Id == updateDto.CategoryId);
                if (!categoryExists)
                {
                    return BadRequest(new { message = "Category not found" });
                }

                // Validate vendor exists if VendorId is provided
                if (updateDto.VendorId.HasValue)
                {
                    var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == updateDto.VendorId.Value);
                    if (!vendorExists)
                    {
                        return BadRequest(new { message = "Vendor not found" });
                    }
                }

                product.VendorId = updateDto.VendorId;
                product.CategoryId = updateDto.CategoryId;
                product.Name = updateDto.Name;
                product.Description = updateDto.Description;
                product.IsActive = updateDto.IsActive;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var productDto = new ProductDto
                {
                    Id = product.Id,
                    VendorId = product.VendorId,
                    CategoryId = product.CategoryId,
                    Name = product.Name,
                    Description = product.Description,
                    IsActive = product.IsActive,
                    CreatedAt = product.CreatedAt,
                    UpdatedAt = product.UpdatedAt
                };

                return Ok(productDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating product {ProductId}", id);
                return StatusCode(409, new { message = "The product was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the product" });
            }
        }

        /// <summary>
        /// Delete a product
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Variants)
                    .Include(p => p.Images)
                    .Include(p => p.Reviews)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                // Check if product has variants with order items
                if (product.Variants != null && product.Variants.Any())
                {
                    var variantIds = product.Variants.Select(v => v.Id).ToList();
                    var hasOrderItems = await _context.OrderItems.AnyAsync(oi => variantIds.Contains(oi.VariantId));

                    if (hasOrderItems)
                    {
                        return BadRequest(new { message = "Cannot delete product with variants that have associated orders. Consider deactivating instead." });
                    }
                }

                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting product {ProductId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the product" });
            }
        }

        private IQueryable<Models.Product> ApplySorting(IQueryable<Models.Product> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderByDescending(p => p.CreatedAt);
            }

            query = sortBy.ToLower() switch
            {
                "name" => descending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "createdat" => descending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                "updatedat" => descending ? query.OrderByDescending(p => p.UpdatedAt) : query.OrderBy(p => p.UpdatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            return query;
        }
    }
}
