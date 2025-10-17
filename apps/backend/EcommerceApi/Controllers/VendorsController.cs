using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Vendor;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VendorsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<VendorsController> _logger;

        public VendorsController(AppDbContext context, ILogger<VendorsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get paginated and filtered list of vendors
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<VendorDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<VendorDto>>> GetVendors([FromQuery] VendorFilterParams filterParams)
        {
            try
            {
                var query = _context.Vendors.AsQueryable();

                // Apply filters
                if (!string.IsNullOrWhiteSpace(filterParams.Name))
                {
                    query = query.Where(v => v.Name.Contains(filterParams.Name));
                }

                if (!string.IsNullOrWhiteSpace(filterParams.ContactEmail))
                {
                    query = query.Where(v => v.ContactEmail != null && v.ContactEmail.Contains(filterParams.ContactEmail));
                }

                // Get total count for pagination
                var totalCount = await query.CountAsync();

                // Apply sorting
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                // Apply pagination
                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(v => new VendorDto
                    {
                        Id = v.Id,
                        Name = v.Name,
                        ContactEmail = v.ContactEmail,
                        Website = v.Website
                    })
                    .ToListAsync();

                var result = new PagedResult<VendorDto>
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
                _logger.LogError(ex, "Error retrieving vendors");
                return StatusCode(500, new { message = "An error occurred while retrieving vendors" });
            }
        }

        /// <summary>
        /// Get a specific vendor by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<VendorDto>> GetVendor(Guid id)
        {
            try
            {
                var vendor = await _context.Vendors
                    .Where(v => v.Id == id)
                    .Select(v => new VendorDto
                    {
                        Id = v.Id,
                        Name = v.Name,
                        ContactEmail = v.ContactEmail,
                        Website = v.Website
                    })
                    .FirstOrDefaultAsync();

                if (vendor == null)
                {
                    return NotFound(new { message = $"Vendor with ID {id} not found" });
                }

                return Ok(vendor);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vendor {VendorId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the vendor" });
            }
        }

        /// <summary>
        /// Create a new vendor
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(VendorDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<VendorDto>> CreateVendor([FromBody] CreateVendorDto createDto)
        {
            try
            {
                // Check if vendor with same name already exists
                var nameExists = await _context.Vendors.AnyAsync(v => v.Name == createDto.Name);
                if (nameExists)
                {
                    return BadRequest(new { message = "A vendor with this name already exists" });
                }

                // Check if email already exists
                if (!string.IsNullOrWhiteSpace(createDto.ContactEmail))
                {
                    var emailExists = await _context.Vendors.AnyAsync(v => v.ContactEmail == createDto.ContactEmail);
                    if (emailExists)
                    {
                        return BadRequest(new { message = "A vendor with this email already exists" });
                    }
                }

                var vendor = new Models.Vendor
                {
                    Id = Guid.NewGuid(),
                    Name = createDto.Name,
                    ContactEmail = createDto.ContactEmail,
                    Website = createDto.Website
                };

                _context.Vendors.Add(vendor);
                await _context.SaveChangesAsync();

                var vendorDto = new VendorDto
                {
                    Id = vendor.Id,
                    Name = vendor.Name,
                    ContactEmail = vendor.ContactEmail,
                    Website = vendor.Website
                };

                return CreatedAtAction(nameof(GetVendor), new { id = vendor.Id }, vendorDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating vendor");
                return StatusCode(500, new { message = "An error occurred while creating the vendor" });
            }
        }

        /// <summary>
        /// Update an existing vendor
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(VendorDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<VendorDto>> UpdateVendor(Guid id, [FromBody] UpdateVendorDto updateDto)
        {
            try
            {
                var vendor = await _context.Vendors.FindAsync(id);
                if (vendor == null)
                {
                    return NotFound(new { message = $"Vendor with ID {id} not found" });
                }

                // Check if name already exists for a different vendor
                var nameExists = await _context.Vendors
                    .AnyAsync(v => v.Name == updateDto.Name && v.Id != id);
                if (nameExists)
                {
                    return BadRequest(new { message = "A vendor with this name already exists" });
                }

                // Check if email already exists for a different vendor
                if (!string.IsNullOrWhiteSpace(updateDto.ContactEmail))
                {
                    var emailExists = await _context.Vendors
                        .AnyAsync(v => v.ContactEmail == updateDto.ContactEmail && v.Id != id);
                    if (emailExists)
                    {
                        return BadRequest(new { message = "A vendor with this email already exists" });
                    }
                }

                vendor.Name = updateDto.Name;
                vendor.ContactEmail = updateDto.ContactEmail;
                vendor.Website = updateDto.Website;

                await _context.SaveChangesAsync();

                var vendorDto = new VendorDto
                {
                    Id = vendor.Id,
                    Name = vendor.Name,
                    ContactEmail = vendor.ContactEmail,
                    Website = vendor.Website
                };

                return Ok(vendorDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating vendor {VendorId}", id);
                return StatusCode(409, new { message = "The vendor was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating vendor {VendorId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the vendor" });
            }
        }

        /// <summary>
        /// Delete a vendor
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteVendor(Guid id)
        {
            try
            {
                var vendor = await _context.Vendors
                    .Include(v => v.Products)
                    .FirstOrDefaultAsync(v => v.Id == id);

                if (vendor == null)
                {
                    return NotFound(new { message = $"Vendor with ID {id} not found" });
                }

                // Check if vendor has products
                if (vendor.Products != null && vendor.Products.Any())
                {
                    return BadRequest(new { message = "Cannot delete vendor with associated products. Reassign or delete products first." });
                }

                _context.Vendors.Remove(vendor);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting vendor {VendorId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the vendor" });
            }
        }

        private IQueryable<Models.Vendor> ApplySorting(IQueryable<Models.Vendor> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
            {
                return query.OrderBy(v => v.Name);
            }

            query = sortBy.ToLower() switch
            {
                "name" => descending ? query.OrderByDescending(v => v.Name) : query.OrderBy(v => v.Name),
                "contactemail" => descending ? query.OrderByDescending(v => v.ContactEmail) : query.OrderBy(v => v.ContactEmail),
                _ => query.OrderBy(v => v.Name)
            };

            return query;
        }
    }
}
