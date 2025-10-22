using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Address;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AddressesController> _logger;

        public AddressesController(AppDbContext context, ILogger<AddressesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<AddressDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<AddressDto>>> GetAddresses([FromQuery] AddressFilterParams filterParams)
        {
            try
            {
                var query = _context.Addresses.AsQueryable();

                if (filterParams.CustomerId.HasValue)
                    query = query.Where(a => a.CustomerId == filterParams.CustomerId.Value);

                if (!string.IsNullOrWhiteSpace(filterParams.City))
                    query = query.Where(a => a.City.Contains(filterParams.City));

                if (!string.IsNullOrWhiteSpace(filterParams.Country))
                    query = query.Where(a => a.Country.Contains(filterParams.Country));

                var totalCount = await query.CountAsync();
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(a => new AddressDto
                    {
                        Id = a.Id,
                        CustomerId = a.CustomerId,
                        FullName = a.FullName,
                        Line1 = a.Line1,
                        Line2 = a.Line2,
                        City = a.City,
                        PostalCode = a.PostalCode,
                        Country = a.Country,
                        Phone = a.Phone,
                        CustomerName = a.Customer != null ? a.Customer.FullName : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<AddressDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = filterParams.PageNumber,
                    PageSize = filterParams.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving addresses");
                return StatusCode(500, new { message = "An error occurred while retrieving addresses" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(AddressDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AddressDto>> GetAddress(Guid id)
        {
            try
            {
                var address = await _context.Addresses
                    .Where(a => a.Id == id)
                    .Select(a => new AddressDto
                    {
                        Id = a.Id,
                        CustomerId = a.CustomerId,
                        FullName = a.FullName,
                        Line1 = a.Line1,
                        Line2 = a.Line2,
                        City = a.City,
                        PostalCode = a.PostalCode,
                        Country = a.Country,
                        Phone = a.Phone,
                        CustomerName = a.Customer != null ? a.Customer.FullName : null
                    })
                    .FirstOrDefaultAsync();

                if (address == null)
                    return NotFound(new { message = $"Address with ID {id} not found" });

                return Ok(address);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving address {AddressId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the address" });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(AddressDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<AddressDto>> CreateAddress([FromBody] CreateAddressDto createDto)
        {
            try
            {
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == createDto.CustomerId);
                if (!customerExists)
                    return BadRequest(new { message = "Customer not found" });

                var address = new Models.Address
                {
                    Id = Guid.NewGuid(),
                    CustomerId = createDto.CustomerId,
                    FullName = createDto.FullName,
                    Line1 = createDto.Line1,
                    Line2 = createDto.Line2,
                    City = createDto.City,
                    PostalCode = createDto.PostalCode,
                    Country = createDto.Country,
                    Phone = createDto.Phone
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                var addressDto = new AddressDto
                {
                    Id = address.Id,
                    CustomerId = address.CustomerId,
                    FullName = address.FullName,
                    Line1 = address.Line1,
                    Line2 = address.Line2,
                    City = address.City,
                    PostalCode = address.PostalCode,
                    Country = address.Country,
                    Phone = address.Phone
                };

                return CreatedAtAction(nameof(GetAddress), new { id = address.Id }, addressDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating address");
                return StatusCode(500, new { message = "An error occurred while creating the address" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(AddressDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<AddressDto>> UpdateAddress(Guid id, [FromBody] UpdateAddressDto updateDto)
        {
            try
            {
                var address = await _context.Addresses.FindAsync(id);
                if (address == null)
                    return NotFound(new { message = $"Address with ID {id} not found" });

                address.FullName = updateDto.FullName;
                address.Line1 = updateDto.Line1;
                address.Line2 = updateDto.Line2;
                address.City = updateDto.City;
                address.PostalCode = updateDto.PostalCode;
                address.Country = updateDto.Country;
                address.Phone = updateDto.Phone;

                await _context.SaveChangesAsync();

                var addressDto = new AddressDto
                {
                    Id = address.Id,
                    CustomerId = address.CustomerId,
                    FullName = address.FullName,
                    Line1 = address.Line1,
                    Line2 = address.Line2,
                    City = address.City,
                    PostalCode = address.PostalCode,
                    Country = address.Country,
                    Phone = address.Phone
                };

                return Ok(addressDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating address {AddressId}", id);
                return StatusCode(409, new { message = "The address was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating address {AddressId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the address" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteAddress(Guid id)
        {
            try
            {
                var address = await _context.Addresses.FindAsync(id);
                if (address == null)
                    return NotFound(new { message = $"Address with ID {id} not found" });

                // Check if address is being used by any orders
                var hasOrders = await _context.Orders.AnyAsync(o => o.AddressId == id);
                if (hasOrders)
                    return BadRequest(new { message = "Cannot delete address that is associated with existing orders" });

                _context.Addresses.Remove(address);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting address {AddressId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the address" });
            }
        }

        private IQueryable<Models.Address> ApplySorting(IQueryable<Models.Address> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
                return query.OrderBy(a => a.Country).ThenBy(a => a.City);

            return sortBy.ToLower() switch
            {
                "fullname" => descending ? query.OrderByDescending(a => a.FullName) : query.OrderBy(a => a.FullName),
                "city" => descending ? query.OrderByDescending(a => a.City) : query.OrderBy(a => a.City),
                "country" => descending ? query.OrderByDescending(a => a.Country) : query.OrderBy(a => a.Country),
                _ => query.OrderBy(a => a.Country).ThenBy(a => a.City)
            };
        }
    }
}
