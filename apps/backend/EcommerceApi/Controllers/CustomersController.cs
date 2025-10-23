using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Customer;
using EcommerceApi.Services;
using EcommerceApi.DTOs.Common;
using EcommerceApi.DTOs.Address;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ICustomerService _customerService;
        private readonly ILogger<CustomersController> _logger;

        public CustomersController(AppDbContext context, ICustomerService customerService, ILogger<CustomersController> logger)
        {
            _context = context;
            _customerService = customerService;
            _logger = logger;
        }

        /// <summary>
        /// Get all customers with pagination
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<CustomerDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<CustomerDto>>> GetAllCustomers(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Customers.Include(c => c.User);
                var totalCount = await query.CountAsync();

                var customers = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(c => new CustomerDto
                    {
                        Id = c.Id,
                        UserId = c.UserId,
                        FullName = c.FullName,
                        Phone = c.Phone,
                        DateOfBirth = c.DateOfBirth,
                        UserEmail = c.User != null ? c.User.Email : null,
                        UserName = c.User != null ? c.User.Name : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<CustomerDto>
                {
                    Items = customers,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all customers");
                return StatusCode(500, new { message = "An error occurred while retrieving customers" });
            }
        }

        /// <summary>
        /// Get a customer by ID with their addresses
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
        {
            try
            {
                var customer = await _customerService.GetCustomerByIdAsync(id);
                if (customer == null)
                    return NotFound(new { message = $"Customer with ID {id} not found" });

                return Ok(MapToDto(customer));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer {CustomerId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the customer" });
            }
        }

        /// <summary>
        /// Get customer by User ID
        /// </summary>
        [HttpGet("by-user/{userId}")]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<CustomerDto>> GetCustomerByUserId(Guid userId)
        {
            try
            {
                var customer = await _customerService.GetCustomerByUserIdAsync(userId);
                if (customer == null)
                    return NotFound(new { message = $"Customer not found for user {userId}" });

                return Ok(MapToDto(customer));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer for user {UserId}", userId);
                return StatusCode(500, new { message = "An error occurred while retrieving the customer" });
            }
        }

        /// <summary>
        /// Create a customer profile for a user
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CustomerDto>> CreateCustomer([FromBody] CreateCustomerDto createDto)
        {
            try
            {
                var customer = await _customerService.CreateCustomerAsync(createDto);
                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, MapToDto(customer));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating customer");
                return StatusCode(500, new { message = "An error occurred while creating the customer" });
            }
        }

        /// <summary>
        /// Create or get customer (on-demand creation if doesn't exist)
        /// Used when a user tries to create an order without a customer profile
        /// </summary>
        [HttpPost("create-or-get")]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CustomerDto>> CreateOrGetCustomer([FromBody] CreateOrGetCustomerDto createOrGetDto)
        {
            try
            {
                var customer = await _customerService.CreateOrGetCustomerAsync(createOrGetDto.UserId);
                return Ok(MapToDto(customer));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating or getting customer");
                return StatusCode(500, new { message = "An error occurred while creating or getting the customer" });
            }
        }

        /// <summary>
        /// Update customer profile
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(CustomerDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<CustomerDto>> UpdateCustomer(Guid id, [FromBody] UpdateCustomerDto updateDto)
        {
            try
            {
                var customer = await _customerService.UpdateCustomerAsync(id, updateDto);
                return Ok(MapToDto(customer));
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer {CustomerId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the customer" });
            }
        }

        /// <summary>
        /// Get all addresses for a customer
        /// </summary>
        [HttpGet("{customerId}/addresses")]
        [ProducesResponseType(typeof(PagedResult<AddressDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PagedResult<AddressDto>>> GetCustomerAddresses(
            Guid customerId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var customerExists = await _customerService.CustomerExistsAsync(customerId);
                if (!customerExists)
                    return NotFound(new { message = $"Customer with ID {customerId} not found" });

                var query = _context.Addresses.Where(a => a.CustomerId == customerId);
                var totalCount = await query.CountAsync();

                var addresses = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
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
                    Items = addresses,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving addresses for customer {CustomerId}", customerId);
                return StatusCode(500, new { message = "An error occurred while retrieving addresses" });
            }
        }

        /// <summary>
        /// Delete a customer (soft delete - optional, can be enhanced)
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteCustomer(Guid id)
        {
            try
            {
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                    return NotFound(new { message = $"Customer with ID {id} not found" });

                // Check if customer has active orders
                var hasOrders = await _context.Orders.AnyAsync(o => o.CustomerId == id);
                if (hasOrders)
                    return BadRequest(new { message = "Cannot delete customer with existing orders" });

                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted customer {CustomerId}", id);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting customer {CustomerId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the customer" });
            }
        }

        private CustomerDto MapToDto(Models.Customer customer)
        {
            return new CustomerDto
            {
                Id = customer.Id,
                UserId = customer.UserId,
                FullName = customer.FullName,
                Phone = customer.Phone,
                DateOfBirth = customer.DateOfBirth,
                UserEmail = customer.User?.Email,
                UserName = customer.User?.Name
            };
        }
    }

    public class CreateOrGetCustomerDto
    {
        public Guid UserId { get; set; }
    }
}
