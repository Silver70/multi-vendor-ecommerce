using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.ProductVariant;
using EcommerceApi.DTOs.Common;
using EcommerceApi.Services;
using EcommerceApi.Models;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductVariantsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProductVariantsController> _logger;
        private readonly VariantGenerationService _variantService;

        public ProductVariantsController(
            AppDbContext context,
            ILogger<ProductVariantsController> logger,
            VariantGenerationService variantService)
        {
            _context = context;
            _logger = logger;
            _variantService = variantService;
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
                var variants = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Include(pv => pv.Product)
                    .ToListAsync();

                var items = new List<ProductVariantDto>();
                foreach (var variant in variants)
                {
                    var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                    items.Add(new ProductVariantDto
                    {
                        Id = variant.Id,
                        ProductId = variant.ProductId,
                        Sku = variant.Sku,
                        Price = variant.Price,
                        Stock = variant.Stock,
                        Attributes = attrs,
                        CreatedAt = variant.CreatedAt,
                        ProductName = variant.Product != null ? variant.Product.Name : null
                    });
                }

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
                var variant = await _context.ProductVariants
                    .Include(pv => pv.Product)
                    .FirstOrDefaultAsync(pv => pv.Id == id);

                if (variant == null)
                {
                    return NotFound(new { message = $"Product variant with ID {id} not found" });
                }

                var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                var productVariantDto = new ProductVariantDto
                {
                    Id = variant.Id,
                    ProductId = variant.ProductId,
                    Sku = variant.Sku,
                    Price = variant.Price,
                    Stock = variant.Stock,
                    Attributes = attrs,
                    CreatedAt = variant.CreatedAt,
                    ProductName = variant.Product != null ? variant.Product.Name : null
                };

                return Ok(productVariantDto);
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
                var product = await _context.Products.FindAsync(createDto.ProductId);
                if (product == null)
                {
                    return BadRequest(new { message = "Product not found" });
                }

                // Check if SKU already exists
                var skuExists = await _context.ProductVariants.AnyAsync(pv => pv.Sku == createDto.Sku);
                if (skuExists)
                {
                    return BadRequest(new { message = "A product variant with this SKU already exists" });
                }

                var productVariant = new ProductVariant
                {
                    Id = Guid.NewGuid(),
                    ProductId = createDto.ProductId,
                    Sku = createDto.Sku,
                    Price = createDto.Price,
                    Stock = createDto.Stock,
                    CreatedAt = DateTime.UtcNow,
                    VariantAttributes = new List<VariantAttributeValue>()
                };

                // Process attributes
                foreach (var attr in createDto.Attributes)
                {
                    // Find or create attribute
                    var attribute = await _context.ProductAttributes
                        .Include(a => a.Values)
                        .FirstOrDefaultAsync(a => a.Name.ToLower() == attr.Key.ToLower());

                    if (attribute == null)
                    {
                        attribute = new ProductAttribute
                        {
                            Id = Guid.NewGuid(),
                            Name = attr.Key
                        };
                        _context.ProductAttributes.Add(attribute);
                    }

                    // Find or create attribute value
                    var attributeValue = attribute.Values
                        .FirstOrDefault(v => v.Value.ToLower() == attr.Value.ToLower());

                    if (attributeValue == null)
                    {
                        attributeValue = new ProductAttributeValue
                        {
                            Id = Guid.NewGuid(),
                            AttributeId = attribute.Id,
                            Value = attr.Value,
                            Attribute = attribute
                        };
                        _context.ProductAttributeValues.Add(attributeValue);
                    }

                    productVariant.VariantAttributes.Add(new VariantAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        VariantId = productVariant.Id,
                        AttributeValueId = attributeValue.Id
                    });
                }

                _context.ProductVariants.Add(productVariant);
                await _context.SaveChangesAsync();

                var productVariantDto = new ProductVariantDto
                {
                    Id = productVariant.Id,
                    ProductId = productVariant.ProductId,
                    Sku = productVariant.Sku,
                    Price = productVariant.Price,
                    Stock = productVariant.Stock,
                    Attributes = createDto.Attributes,
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
                var productVariant = await _context.ProductVariants
                    .Include(pv => pv.VariantAttributes)
                    .FirstOrDefaultAsync(pv => pv.Id == id);

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

                // Remove old attribute associations
                _context.VariantAttributeValues.RemoveRange(productVariant.VariantAttributes);

                // Add new attribute associations
                productVariant.VariantAttributes = new List<VariantAttributeValue>();
                foreach (var attr in updateDto.Attributes)
                {
                    // Find or create attribute
                    var attribute = await _context.ProductAttributes
                        .Include(a => a.Values)
                        .FirstOrDefaultAsync(a => a.Name.ToLower() == attr.Key.ToLower());

                    if (attribute == null)
                    {
                        attribute = new ProductAttribute
                        {
                            Id = Guid.NewGuid(),
                            Name = attr.Key
                        };
                        _context.ProductAttributes.Add(attribute);
                    }

                    // Find or create attribute value
                    var attributeValue = attribute.Values
                        .FirstOrDefault(v => v.Value.ToLower() == attr.Value.ToLower());

                    if (attributeValue == null)
                    {
                        attributeValue = new ProductAttributeValue
                        {
                            Id = Guid.NewGuid(),
                            AttributeId = attribute.Id,
                            Value = attr.Value,
                            Attribute = attribute
                        };
                        _context.ProductAttributeValues.Add(attributeValue);
                    }

                    productVariant.VariantAttributes.Add(new VariantAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        VariantId = productVariant.Id,
                        AttributeValueId = attributeValue.Id
                    });
                }

                await _context.SaveChangesAsync();

                var productVariantDto = new ProductVariantDto
                {
                    Id = productVariant.Id,
                    ProductId = productVariant.ProductId,
                    Sku = productVariant.Sku,
                    Price = productVariant.Price,
                    Stock = productVariant.Stock,
                    Attributes = updateDto.Attributes,
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
