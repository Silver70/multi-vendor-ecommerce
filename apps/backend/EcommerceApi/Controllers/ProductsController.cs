using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Product;
using EcommerceApi.DTOs.Common;
using EcommerceApi.Utils;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProductsController> _logger;
        private readonly SlugGenerator _slugGenerator;
        private readonly VariantGenerationService _variantService;

        public ProductsController(
            AppDbContext context,
            ILogger<ProductsController> logger,
            SlugGenerator slugGenerator,
            VariantGenerationService variantService)
        {
            _context = context;
            _logger = logger;
            _slugGenerator = slugGenerator;
            _variantService = variantService;
        }

        /// <summary>
        /// Create a product with attributes and variants in one request
        /// </summary>
        [HttpPost("composite")]
        [ProducesResponseType(typeof(CompositeProductResponseDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CompositeProductResponseDto>> CreateCompositeProduct([FromBody] CreateCompositeProductDto createDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Validate category exists
                var category = await _context.Categories.FindAsync(createDto.ProductInfo.CategoryId);
                if (category == null)
                {
                    return BadRequest(new { message = "Category not found" });
                }

                // Validate vendor exists if provided
                string? vendorName = null;
                if (createDto.ProductInfo.VendorId.HasValue)
                {
                    var vendor = await _context.Vendors.FindAsync(createDto.ProductInfo.VendorId.Value);
                    if (vendor == null)
                    {
                        return BadRequest(new { message = "Vendor not found" });
                    }
                    vendorName = vendor.Name;
                }

                // Generate unique slug
                var slug = await _slugGenerator.GenerateUniqueSlugAsync(
                    createDto.ProductInfo.Name,
                    category.Name,
                    vendorName);

                // Create product
                var product = new Models.Product
                {
                    Id = Guid.NewGuid(),
                    VendorId = createDto.ProductInfo.VendorId,
                    CategoryId = createDto.ProductInfo.CategoryId,
                    Name = createDto.ProductInfo.Name,
                    Description = createDto.ProductInfo.Description,
                    Slug = slug,
                    IsActive = createDto.ProductInfo.IsActive,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();

                // Process attributes and create variants if provided
                List<Models.ProductVariant> variants = new();
                if (createDto.Attributes.Any() && createDto.Variants.Any())
                {
                    var attributeValueMap = await _variantService.ProcessAttributesAsync(createDto.Attributes);
                    variants = await _variantService.CreateVariantsAsync(
                        product.Id,
                        product.Name,
                        createDto.Variants,
                        attributeValueMap);
                }

                await transaction.CommitAsync();

                // Build response
                var response = new CompositeProductResponseDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Slug = product.Slug,
                    Description = product.Description,
                    CategoryId = product.CategoryId,
                    VendorId = product.VendorId,
                    IsActive = product.IsActive,
                    CreatedAt = product.CreatedAt,
                    UpdatedAt = product.UpdatedAt,
                    Attributes = createDto.Attributes.Select(a => new ProductAttributeOutputDto
                    {
                        Name = a.Name,
                        Values = a.Values
                    }).ToList(),
                    Variants = new List<VariantOutputDto>()
                };

                // Load variant attributes
                foreach (var variant in variants)
                {
                    var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                    response.Variants.Add(new VariantOutputDto
                    {
                        Id = variant.Id,
                        Sku = variant.Sku,
                        Price = variant.Price,
                        Stock = variant.Stock,
                        Attributes = attrs,
                        CreatedAt = variant.CreatedAt
                    });
                }

                return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating composite product");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update a product with attributes and variants (replaces all variants)
        /// </summary>
        [HttpPut("{id}/composite")]
        [ProducesResponseType(typeof(CompositeProductResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CompositeProductResponseDto>> UpdateCompositeProduct(
            Guid id,
            [FromBody] UpdateCompositeProductDto updateDto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var product = await _context.Products.FindAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                // Validate category exists
                var categoryExists = await _context.Categories.AnyAsync(c => c.Id == updateDto.ProductInfo.CategoryId);
                if (!categoryExists)
                {
                    return BadRequest(new { message = "Category not found" });
                }

                // Validate vendor exists if provided
                if (updateDto.ProductInfo.VendorId.HasValue)
                {
                    var vendorExists = await _context.Vendors.AnyAsync(v => v.Id == updateDto.ProductInfo.VendorId.Value);
                    if (!vendorExists)
                    {
                        return BadRequest(new { message = "Vendor not found" });
                    }
                }

                // Update product info
                product.VendorId = updateDto.ProductInfo.VendorId;
                product.CategoryId = updateDto.ProductInfo.CategoryId;
                product.Name = updateDto.ProductInfo.Name;
                product.Description = updateDto.ProductInfo.Description;
                product.IsActive = updateDto.ProductInfo.IsActive;
                product.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Delete old variants and create new ones only if variants are provided
                List<Models.ProductVariant> variants = new();
                if (updateDto.Variants.Any())
                {
                    await _variantService.DeleteProductVariantsAsync(product.Id);

                    if (updateDto.Attributes.Any())
                    {
                        var attributeValueMap = await _variantService.ProcessAttributesAsync(updateDto.Attributes);
                        variants = await _variantService.CreateVariantsAsync(
                            product.Id,
                            product.Name,
                            updateDto.Variants,
                            attributeValueMap);
                    }
                }

                await transaction.CommitAsync();

                // Build response
                var response = new CompositeProductResponseDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Slug = product.Slug,
                    Description = product.Description,
                    CategoryId = product.CategoryId,
                    VendorId = product.VendorId,
                    IsActive = product.IsActive,
                    CreatedAt = product.CreatedAt,
                    UpdatedAt = product.UpdatedAt,
                    Attributes = updateDto.Attributes.Select(a => new ProductAttributeOutputDto
                    {
                        Name = a.Name,
                        Values = a.Values
                    }).ToList(),
                    Variants = new List<VariantOutputDto>()
                };

                // Load variant attributes
                foreach (var variant in variants)
                {
                    var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                    response.Variants.Add(new VariantOutputDto
                    {
                        Id = variant.Id,
                        Sku = variant.Sku,
                        Price = variant.Price,
                        Stock = variant.Stock,
                        Attributes = attrs,
                        CreatedAt = variant.CreatedAt
                    });
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating composite product {ProductId}", id);
                return StatusCode(500, new { message = ex.Message });
            }
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
                        Slug = p.Slug,
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
        /// Get a specific product by slug
        /// </summary>
        [HttpGet("slug/{slug}")]
        [ProducesResponseType(typeof(ProductDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ProductDetailsDto>> GetProductBySlug(string slug)
        {
            try
            {
                var product = await _context.Products
                    .Include(p => p.Vendor)
                    .Include(p => p.Category)
                    .Include(p => p.Variants)
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Slug == slug);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with slug '{slug}' not found" });
                }

                var productDto = new ProductDetailsDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Slug = product.Slug,
                    Description = product.Description ?? "",
                    CategoryId = product.CategoryId,
                    VendorId = product.VendorId,
                    CategoryName = product.Category != null ? product.Category.Name : "",
                    VendorName = product.Vendor != null ? product.Vendor.Name : "",
                    IsActive = product.IsActive,
                    ImageUrls = product.Images != null ? product.Images.Select(i => i.ImageUrl).ToList() : new List<string>(),
                    Attributes = new List<ProductAttributeOutputDto>(),
                    Variants = new List<VariantDto>()
                };

                // Load variants with attributes and build product attributes list
                if (product.Variants != null)
                {
                    var attributeDict = new Dictionary<string, HashSet<string>>();

                    foreach (var variant in product.Variants)
                    {
                        var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                        productDto.Variants.Add(new VariantDto
                        {
                            Id = variant.Id,
                            Sku = variant.Sku,
                            Price = variant.Price,
                            Stock = variant.Stock,
                            Attributes = attrs
                        });

                        // Collect unique attribute names and values
                        foreach (var (key, value) in attrs)
                        {
                            if (!attributeDict.ContainsKey(key))
                            {
                                attributeDict[key] = new HashSet<string>();
                            }
                            attributeDict[key].Add(value);
                        }
                    }

                    // Build product attributes from collected data
                    foreach (var (attrName, values) in attributeDict)
                    {
                        productDto.Attributes.Add(new ProductAttributeOutputDto
                        {
                            Name = attrName,
                            Values = values.ToList()
                        });
                    }
                }

                return Ok(productDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving product by slug {Slug}", slug);
                return StatusCode(500, new { message = "An error occurred while retrieving the product" });
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
                    .Include(p => p.Images)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (product == null)
                {
                    return NotFound(new { message = $"Product with ID {id} not found" });
                }

                var productDto = new ProductDetailsDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Slug = product.Slug,
                    Description = product.Description ?? "",
                    CategoryId = product.CategoryId,
                    VendorId = product.VendorId,
                    CategoryName = product.Category != null ? product.Category.Name : "",
                    VendorName = product.Vendor != null ? product.Vendor.Name : "",
                    IsActive = product.IsActive,
                    ImageUrls = product.Images != null ? product.Images.Select(i => i.ImageUrl).ToList() : new List<string>(),
                    Attributes = new List<ProductAttributeOutputDto>(),
                    Variants = new List<VariantDto>()
                };

                // Load variants with attributes and build product attributes list
                if (product.Variants != null)
                {
                    var attributeDict = new Dictionary<string, HashSet<string>>();

                    foreach (var variant in product.Variants)
                    {
                        var attrs = await _variantService.LoadVariantAttributesAsync(variant.Id);
                        productDto.Variants.Add(new VariantDto
                        {
                            Id = variant.Id,
                            Sku = variant.Sku,
                            Price = variant.Price,
                            Stock = variant.Stock,
                            Attributes = attrs
                        });

                        // Collect unique attribute names and values
                        foreach (var (key, value) in attrs)
                        {
                            if (!attributeDict.ContainsKey(key))
                            {
                                attributeDict[key] = new HashSet<string>();
                            }
                            attributeDict[key].Add(value);
                        }
                    }

                    // Build product attributes from collected data
                    foreach (var (attrName, values) in attributeDict)
                    {
                        productDto.Attributes.Add(new ProductAttributeOutputDto
                        {
                            Name = attrName,
                            Values = values.ToList()
                        });
                    }
                }

                return Ok(productDto);
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
                // Validate category exists and get category name
                var category = await _context.Categories.FindAsync(createDto.CategoryId);
                if (category == null)
                {
                    return BadRequest(new { message = "Category not found" });
                }

                // Validate vendor exists if VendorId is provided and get vendor name
                string? vendorName = null;
                if (createDto.VendorId.HasValue)
                {
                    var vendor = await _context.Vendors.FindAsync(createDto.VendorId.Value);
                    if (vendor == null)
                    {
                        return BadRequest(new { message = "Vendor not found" });
                    }
                    vendorName = vendor.Name;
                }

                // Generate unique slug
                var slug = await _slugGenerator.GenerateUniqueSlugAsync(createDto.Name, category.Name, vendorName);

                var product = new Models.Product
                {
                    Id = Guid.NewGuid(),
                    VendorId = createDto.VendorId,
                    CategoryId = createDto.CategoryId,
                    Name = createDto.Name,
                    Description = createDto.Description,
                    Slug = slug,
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
                    Slug = product.Slug,
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
            using var transaction = await _context.Database.BeginTransactionAsync();
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

                // Delete all variants and their custom attributes
                await _variantService.DeleteProductVariantsAsync(id);

                // Delete the product
                _context.Products.Remove(product);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
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
