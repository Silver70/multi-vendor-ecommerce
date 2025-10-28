using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Attribute;
using EcommerceApi.Models;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AttributesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AttributesController> _logger;

        public AttributesController(AppDbContext context, ILogger<AttributesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all global attributes with their values
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(List<AttributeDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<AttributeDto>>> GetAttributes([FromQuery] bool? popular = null)
        {
            try
            {
                IQueryable<ProductAttribute> query = _context.ProductAttributes.Include(a => a.Values);

                // Filter by popularity if requested
                if (popular.HasValue && popular.Value)
                {
                    query = query.Where(a => a.IsPopular).OrderBy(a => a.DisplayOrder);
                }

                var attributes = await query
                    .Select(a => new AttributeDto
                    {
                        Id = a.Id,
                        Name = a.Name,
                        Values = a.Values.Select(v => new AttributeValueDto
                        {
                            Id = v.Id,
                            Value = v.Value
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(attributes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attributes");
                return StatusCode(500, new { message = "An error occurred while retrieving attributes" });
            }
        }

        /// <summary>
        /// Get a specific attribute by ID with its values
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(AttributeDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AttributeDto>> GetAttribute(Guid id)
        {
            try
            {
                var attribute = await _context.ProductAttributes
                    .Include(a => a.Values)
                    .Where(a => a.Id == id)
                    .Select(a => new AttributeDto
                    {
                        Id = a.Id,
                        Name = a.Name,
                        Values = a.Values.Select(v => new AttributeValueDto
                        {
                            Id = v.Id,
                            Value = v.Value
                        }).ToList()
                    })
                    .FirstOrDefaultAsync();

                if (attribute == null)
                {
                    return NotFound(new { message = $"Attribute with ID {id} not found" });
                }

                return Ok(attribute);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving attribute {AttributeId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the attribute" });
            }
        }

        /// <summary>
        /// Create a new global attribute with optional values
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(AttributeDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AttributeDto>> CreateAttribute([FromBody] CreateAttributeDto createDto)
        {
            try
            {
                // Check if attribute with same name already exists
                var exists = await _context.ProductAttributes
                    .AnyAsync(a => a.Name.ToLower() == createDto.Name.ToLower());

                if (exists)
                {
                    return BadRequest(new { message = $"Attribute with name '{createDto.Name}' already exists" });
                }

                var attribute = new ProductAttribute
                {
                    Id = Guid.NewGuid(),
                    Name = createDto.Name,
                    Values = createDto.Values.Select(v => new ProductAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        Value = v
                    }).ToList()
                };

                _context.ProductAttributes.Add(attribute);
                await _context.SaveChangesAsync();

                var attributeDto = new AttributeDto
                {
                    Id = attribute.Id,
                    Name = attribute.Name,
                    Values = attribute.Values.Select(v => new AttributeValueDto
                    {
                        Id = v.Id,
                        Value = v.Value
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetAttribute), new { id = attribute.Id }, attributeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating attribute");
                return StatusCode(500, new { message = "An error occurred while creating the attribute" });
            }
        }

        /// <summary>
        /// Add values to an existing attribute
        /// </summary>
        [HttpPost("{id}/values")]
        [ProducesResponseType(typeof(AttributeDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AttributeDto>> AddAttributeValues(Guid id, [FromBody] AddAttributeValuesDto addValuesDto)
        {
            try
            {
                var attribute = await _context.ProductAttributes
                    .Include(a => a.Values)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (attribute == null)
                {
                    return NotFound(new { message = $"Attribute with ID {id} not found" });
                }

                // Check for duplicate values
                var existingValues = attribute.Values.Select(v => v.Value.ToLower()).ToHashSet();
                var newValues = addValuesDto.Values.Where(v => !existingValues.Contains(v.ToLower())).ToList();

                if (newValues.Count == 0)
                {
                    return BadRequest(new { message = "All provided values already exist for this attribute" });
                }

                foreach (var value in newValues)
                {
                    attribute.Values.Add(new ProductAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        AttributeId = id,
                        Value = value
                    });
                }

                await _context.SaveChangesAsync();

                var attributeDto = new AttributeDto
                {
                    Id = attribute.Id,
                    Name = attribute.Name,
                    Values = attribute.Values.Select(v => new AttributeValueDto
                    {
                        Id = v.Id,
                        Value = v.Value
                    }).ToList()
                };

                return Ok(attributeDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding values to attribute {AttributeId}", id);
                return StatusCode(500, new { message = "An error occurred while adding values to the attribute" });
            }
        }

        /// <summary>
        /// Delete a global attribute
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteAttribute(Guid id)
        {
            try
            {
                var attribute = await _context.ProductAttributes
                    .Include(a => a.Values)
                    .ThenInclude(v => v.VariantAttributes)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (attribute == null)
                {
                    return NotFound(new { message = $"Attribute with ID {id} not found" });
                }

                // Check if any values are being used by variants
                var isInUse = attribute.Values.Any(v => v.VariantAttributes.Any());
                if (isInUse)
                {
                    return BadRequest(new { message = "Cannot delete attribute that is being used by product variants" });
                }

                _context.ProductAttributes.Remove(attribute);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attribute {AttributeId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the attribute" });
            }
        }

        /// <summary>
        /// Delete a specific attribute value
        /// </summary>
        [HttpDelete("{attributeId}/values/{valueId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteAttributeValue(Guid attributeId, Guid valueId)
        {
            try
            {
                var attributeValue = await _context.ProductAttributeValues
                    .Include(v => v.VariantAttributes)
                    .FirstOrDefaultAsync(v => v.Id == valueId && v.AttributeId == attributeId);

                if (attributeValue == null)
                {
                    return NotFound(new { message = $"Attribute value not found" });
                }

                // Check if value is being used by any variants
                if (attributeValue.VariantAttributes.Any())
                {
                    return BadRequest(new { message = "Cannot delete attribute value that is being used by product variants" });
                }

                _context.ProductAttributeValues.Remove(attributeValue);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attribute value {ValueId}", valueId);
                return StatusCode(500, new { message = "An error occurred while deleting the attribute value" });
            }
        }
    }
}
