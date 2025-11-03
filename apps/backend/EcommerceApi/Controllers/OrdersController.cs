using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Order;
using EcommerceApi.DTOs.Common;
using EcommerceApi.DTOs.Customer;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IChannelService _channelService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(AppDbContext context, IChannelService channelService, ILogger<OrdersController> logger)
        {
            _context = context;
            _channelService = channelService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<OrderDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<OrderDto>>> GetOrders([FromQuery] OrderFilterParams filterParams)
        {
            try
            {
                var query = _context.Orders.AsQueryable();

                if (filterParams.CustomerId.HasValue)
                    query = query.Where(o => o.CustomerId == filterParams.CustomerId.Value);

                if (!string.IsNullOrWhiteSpace(filterParams.Status))
                    query = query.Where(o => o.Status == filterParams.Status);

                if (filterParams.FromDate.HasValue)
                    query = query.Where(o => o.CreatedAt >= filterParams.FromDate.Value);

                if (filterParams.ToDate.HasValue)
                    query = query.Where(o => o.CreatedAt <= filterParams.ToDate.Value);

                if (filterParams.MinAmount.HasValue)
                    query = query.Where(o => o.TotalAmount >= filterParams.MinAmount.Value);

                if (filterParams.MaxAmount.HasValue)
                    query = query.Where(o => o.TotalAmount <= filterParams.MaxAmount.Value);

                var totalCount = await query.CountAsync();
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                var items = await query
                    .Include(o => o.Channel)
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        CustomerId = o.CustomerId,
                        AddressId = o.AddressId,
                        ChannelId = o.ChannelId,
                        Status = o.Status,
                        SubtotalAmount = o.SubtotalAmount,
                        TaxAmount = o.TaxAmount,
                        ShippingAmount = o.ShippingAmount,
                        TotalAmount = o.TotalAmount,
                        AppliedTaxRuleName = o.AppliedTaxRuleName,
                        AppliedTaxRate = o.AppliedTaxRate,
                        TaxInclusive = o.TaxInclusive,
                        CurrencyCode = o.CurrencyCode,
                        ExternalOrderId = o.ExternalOrderId,
                        CreatedAt = o.CreatedAt,
                        Customer = o.Customer != null ? MapCustomerToDto(o.Customer) : null,
                        Address = o.Address != null ? new AddressInfo
                        {
                            FullName = o.Address.FullName,
                            Line1 = o.Address.Line1,
                            Line2 = o.Address.Line2,
                            City = o.Address.City,
                            PostalCode = o.Address.PostalCode,
                            Country = o.Address.Country,
                            Phone = o.Address.Phone
                        } : null,
                        Channel = o.Channel != null ? MapChannelToDto(o.Channel) : null,
                        Items = null // Don't include items in list view for performance
                    })
                    .ToListAsync();

                return Ok(new PagedResult<OrderDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = filterParams.PageNumber,
                    PageSize = filterParams.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving orders");
                return StatusCode(500, new { message = "An error occurred while retrieving orders" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<OrderDto>> GetOrder(Guid id)
        {
            try
            {
                var order = await _context.Orders
                    .Include(o => o.Channel)
                    .Where(o => o.Id == id)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        CustomerId = o.CustomerId,
                        AddressId = o.AddressId,
                        ChannelId = o.ChannelId,
                        Status = o.Status,
                        SubtotalAmount = o.SubtotalAmount,
                        TaxAmount = o.TaxAmount,
                        ShippingAmount = o.ShippingAmount,
                        TotalAmount = o.TotalAmount,
                        AppliedTaxRuleName = o.AppliedTaxRuleName,
                        AppliedTaxRate = o.AppliedTaxRate,
                        TaxInclusive = o.TaxInclusive,
                        CurrencyCode = o.CurrencyCode,
                        ExternalOrderId = o.ExternalOrderId,
                        CreatedAt = o.CreatedAt,
                        Customer = o.Customer != null ? MapCustomerToDto(o.Customer) : null,
                        Address = o.Address != null ? new AddressInfo
                        {
                            FullName = o.Address.FullName,
                            Line1 = o.Address.Line1,
                            Line2 = o.Address.Line2,
                            City = o.Address.City,
                            PostalCode = o.Address.PostalCode,
                            Country = o.Address.Country,
                            Phone = o.Address.Phone
                        } : null,
                        Channel = o.Channel != null ? MapChannelToDto(o.Channel) : null,

                        Items = o.Items != null ? o.Items.Select(item => new OrderItemInfo
                        {
                            Id = item.Id,
                            VariantId = item.VariantId,
                            VariantSku = item.Variant != null ? item.Variant.Sku : null,
                            ProductName = item.Variant != null && item.Variant.Product != null ? item.Variant.Product.Name : null,
                            Quantity = item.Quantity,
                            Price = item.Price
                        }).ToList() : null,
                        Payments = o.Payments != null
                        ? o.Payments.Select(p => new PaymentInfo
                        {
                            Id = p.Id,
                            OrderId = p.OrderId,
                            Method = p.Method
                        }).ToList()
                        : null,
                    })
                    .FirstOrDefaultAsync();

                if (order == null)
                    return NotFound(new { message = $"Order with ID {id} not found" });

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the order" });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto createDto)
        {
            try
            {
                // Validate customer exists
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == createDto.CustomerId);
                if (!customerExists)
                    return BadRequest(new { message = "Customer not found" });

                // 🆕 NEW: Validate channel exists
                var channel = await _context.Channels.FindAsync(createDto.ChannelId);
                if (channel == null)
                    return BadRequest(new { message = "Channel not found" });

                // Validate address exists and belongs to customer
                var address = await _context.Addresses
                    .FirstOrDefaultAsync(a => a.Id == createDto.AddressId && a.CustomerId == createDto.CustomerId);
                if (address == null)
                    return BadRequest(new { message = "Address not found or does not belong to the customer" });

                // Validate all variants exist and have sufficient stock
                var variantIds = createDto.Items.Select(i => i.VariantId).ToList();
                var variants = await _context.ProductVariants
                    .Include(v => v.Product)
                    .Where(v => variantIds.Contains(v.Id))
                    .ToListAsync();

                if (variants.Count != variantIds.Count)
                    return BadRequest(new { message = "One or more product variants not found" });

                // Check stock availability
                foreach (var item in createDto.Items)
                {
                    var variant = variants.First(v => v.Id == item.VariantId);
                    if (variant.Stock < item.Quantity)
                        return BadRequest(new { message = $"Insufficient stock for variant {variant.Sku}. Available: {variant.Stock}, Requested: {item.Quantity}" });
                }

                // Calculate subtotal amount
                decimal subtotalAmount = 0;
                var orderItems = new List<Models.OrderItem>();

                foreach (var item in createDto.Items)
                {
                    var variant = variants.First(v => v.Id == item.VariantId);
                    var orderItem = new Models.OrderItem
                    {
                        Id = Guid.NewGuid(),
                        VariantId = item.VariantId,
                        Quantity = item.Quantity,
                        Price = variant.Price,
                        ChannelId = createDto.ChannelId  // 🆕 NEW: Set channel ID
                    };
                    orderItems.Add(orderItem);
                    subtotalAmount += orderItem.Price * orderItem.Quantity;

                    // Decrease stock
                    variant.Stock -= item.Quantity;
                }

                // 🆕 NEW: Calculate tax using channel tax rules
                var (taxAmount, taxRate, ruleName) = await _channelService.CalculateTaxAsync(
                    createDto.ChannelId,
                    subtotalAmount,
                    categoryId: null,  // Can be enhanced to use first item's category
                    isB2B: false);  // Can be enhanced to use customer type

                // Calculate total amount with tax and shipping
                decimal shippingAmount = createDto.ShippingAmount;
                decimal totalAmount = subtotalAmount + taxAmount + shippingAmount;

                // Create order with tax information
                var order = new Models.Order
                {
                    Id = Guid.NewGuid(),
                    CustomerId = createDto.CustomerId,
                    ChannelId = createDto.ChannelId,  // 🆕 NEW
                    AddressId = createDto.AddressId,
                    Status = "pending",
                    SubtotalAmount = subtotalAmount,  // 🆕 NEW
                    TaxAmount = taxAmount,  // 🆕 NEW
                    ShippingAmount = shippingAmount,  // 🆕 NEW
                    TotalAmount = totalAmount,
                    AppliedTaxRuleName = ruleName,  // 🆕 NEW
                    AppliedTaxRate = taxRate,  // 🆕 NEW
                    TaxInclusive = channel.TaxBehavior == "inclusive",  // 🆕 NEW
                    CurrencyCode = channel.CurrencyCode,  // 🆕 NEW
                    CreatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);

                // Add order items
                foreach (var orderItem in orderItems)
                {
                    orderItem.OrderId = order.Id;
                    _context.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();

                // Create inventory logs
                foreach (var item in createDto.Items)
                {
                    var inventoryLog = new Models.InventoryLog
                    {
                        Id = Guid.NewGuid(),
                        VariantId = item.VariantId,
                        Change = -item.Quantity,
                        Reason = $"Order {order.Id} created",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InventoryLogs.Add(inventoryLog);
                }

                await _context.SaveChangesAsync();

                // Fetch the full order with customer details
                var createdOrder = await _context.Orders
                    .Where(o => o.Id == order.Id)
                    .Include(o => o.Customer)
                    .ThenInclude(c => c.CreatedByUser)
                    .Include(o => o.Address)
                    .FirstOrDefaultAsync();

                var orderDto = new OrderDto
                {
                    Id = createdOrder.Id,
                    CustomerId = createdOrder.CustomerId,
                    AddressId = createdOrder.AddressId,
                    Status = createdOrder.Status,
                    TotalAmount = createdOrder.TotalAmount,
                    CreatedAt = createdOrder.CreatedAt,
                    Customer = createdOrder.Customer != null ? MapCustomerToDto(createdOrder.Customer) : null,
                    Address = createdOrder.Address != null ? new AddressInfo
                    {
                        FullName = createdOrder.Address.FullName,
                        Line1 = createdOrder.Address.Line1,
                        Line2 = createdOrder.Address.Line2,
                        City = createdOrder.Address.City,
                        PostalCode = createdOrder.Address.PostalCode,
                        Country = createdOrder.Address.Country,
                        Phone = createdOrder.Address.Phone
                    } : null
                };

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, orderDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, new { message = "An error occurred while creating the order" });
            }
        }

        /// <summary>
        /// Create order from website (anonymous/guest checkout)
        /// Finds or creates customer based on email, creates address, and order
        /// </summary>
        [HttpPost("from-website")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<OrderDto>> CreateOrderFromWebsite([FromBody] CreateOrderFromWebsiteDto createOrderDto)
        {
            try
            {
                // Inject customer service through dependency resolution (for this we'll use context directly)
                var _customerService = HttpContext.RequestServices.GetRequiredService<ICustomerService>();

                // Find or create customer
                var customer = await _customerService.GetCustomerByEmailAsync(createOrderDto.Email);
                if (customer == null)
                {
                    customer = await _customerService.CreateCustomerAsync(new CreateCustomerDto
                    {
                        FullName = createOrderDto.FullName,
                        Email = createOrderDto.Email,
                        Phone = createOrderDto.Phone,
                        DateOfBirth = null
                    }, createdByUserId: null); // null means from website
                }

                // Create or use address
                var address = new Models.Address
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customer.Id,
                    FullName = createOrderDto.FullName,
                    Line1 = createOrderDto.AddressLine1,
                    Line2 = createOrderDto.AddressLine2,
                    City = createOrderDto.City,
                    Country = createOrderDto.Country,
                    PostalCode = createOrderDto.PostalCode,
                    Phone = createOrderDto.Phone
                };

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();

                // Validate all variants exist and have sufficient stock
                var variantIds = createOrderDto.Items.Select(i => i.VariantId).ToList();
                var variants = await _context.ProductVariants
                    .Where(v => variantIds.Contains(v.Id))
                    .ToListAsync();

                if (variants.Count != variantIds.Count)
                    return BadRequest(new { message = "One or more product variants not found" });

                // Check stock availability
                foreach (var item in createOrderDto.Items)
                {
                    var variant = variants.First(v => v.Id == item.VariantId);
                    if (variant.Stock < item.Quantity)
                        return BadRequest(new { message = $"Insufficient stock for variant {variant.Sku}. Available: {variant.Stock}, Requested: {item.Quantity}" });
                }

                // Calculate total amount and create order items
                decimal totalAmount = 0;
                var orderItems = new List<Models.OrderItem>();

                foreach (var item in createOrderDto.Items)
                {
                    var variant = variants.First(v => v.Id == item.VariantId);
                    var orderItem = new Models.OrderItem
                    {
                        Id = Guid.NewGuid(),
                        VariantId = item.VariantId,
                        Quantity = item.Quantity,
                        Price = variant.Price
                    };
                    orderItems.Add(orderItem);
                    totalAmount += orderItem.Price * orderItem.Quantity;

                    // Decrease stock
                    variant.Stock -= item.Quantity;
                }

                // Create order
                var order = new Models.Order
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customer.Id,
                    AddressId = address.Id,
                    Status = "pending",
                    TotalAmount = totalAmount,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);

                // Add order items
                foreach (var orderItem in orderItems)
                {
                    orderItem.OrderId = order.Id;
                    _context.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();

                // Create inventory logs
                foreach (var item in createOrderDto.Items)
                {
                    var inventoryLog = new Models.InventoryLog
                    {
                        Id = Guid.NewGuid(),
                        VariantId = item.VariantId,
                        Change = -item.Quantity,
                        Reason = $"Order {order.Id} created (website)",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.InventoryLogs.Add(inventoryLog);
                }

                await _context.SaveChangesAsync();

                // Fetch the full order with details
                var createdOrder = await _context.Orders
                    .Where(o => o.Id == order.Id)
                    .Include(o => o.Customer)
                    .ThenInclude(c => c.CreatedByUser)
                    .Include(o => o.Address)
                    .FirstOrDefaultAsync();

                var orderDto = new OrderDto
                {
                    Id = createdOrder.Id,
                    CustomerId = createdOrder.CustomerId,
                    AddressId = createdOrder.AddressId,
                    Status = createdOrder.Status,
                    TotalAmount = createdOrder.TotalAmount,
                    CreatedAt = createdOrder.CreatedAt,
                    Customer = createdOrder.Customer != null ? MapCustomerToDto(createdOrder.Customer) : null,
                    Address = createdOrder.Address != null ? new AddressInfo
                    {
                        FullName = createdOrder.Address.FullName,
                        Line1 = createdOrder.Address.Line1,
                        Line2 = createdOrder.Address.Line2,
                        City = createdOrder.Address.City,
                        PostalCode = createdOrder.Address.PostalCode,
                        Country = createdOrder.Address.Country,
                        Phone = createdOrder.Address.Phone
                    } : null
                };

                _logger.LogInformation("Created order {OrderId} from website for customer {CustomerId}", order.Id, customer.Id);

                return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, orderDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order from website");
                return StatusCode(500, new { message = "An error occurred while creating the order" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<OrderDto>> UpdateOrder(Guid id, [FromBody] UpdateOrderDto updateDto)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { message = $"Order with ID {id} not found" });

                // Validate status transition
                var validStatuses = new[] { "pending", "paid", "shipped", "delivered", "cancelled" };
                if (!validStatuses.Contains(updateDto.Status.ToLower()))
                    return BadRequest(new { message = "Invalid order status" });

                // Prevent updating cancelled orders
                if (order.Status == "cancelled")
                    return BadRequest(new { message = "Cannot update a cancelled order" });

                // Handle cancellation - restore stock
                if (updateDto.Status.ToLower() == "cancelled" && order.Status != "cancelled")
                {
                    var orderItems = await _context.OrderItems
                        .Where(oi => oi.OrderId == id)
                        .ToListAsync();

                    foreach (var item in orderItems)
                    {
                        var variant = await _context.ProductVariants.FindAsync(item.VariantId);
                        if (variant != null)
                        {
                            variant.Stock += item.Quantity;

                            // Create inventory log for stock restoration
                            var inventoryLog = new Models.InventoryLog
                            {
                                Id = Guid.NewGuid(),
                                VariantId = item.VariantId,
                                Change = item.Quantity,
                                Reason = $"Order {order.Id} cancelled",
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.InventoryLogs.Add(inventoryLog);
                        }
                    }
                }

                order.Status = updateDto.Status.ToLower();
                await _context.SaveChangesAsync();

                var orderDto = new OrderDto
                {
                    Id = order.Id,
                    CustomerId = order.CustomerId,
                    AddressId = order.AddressId,
                    Status = order.Status,
                    TotalAmount = order.TotalAmount,
                    CreatedAt = order.CreatedAt
                };

                return Ok(orderDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating order {OrderId}", id);
                return StatusCode(409, new { message = "The order was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the order" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteOrder(Guid id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    return NotFound(new { message = $"Order with ID {id} not found" });

                // Only allow deletion of pending orders
                if (order.Status != "pending")
                    return BadRequest(new { message = "Only pending orders can be deleted. Please cancel the order instead." });

                // Check if there are any payments
                var hasPayments = await _context.Payments.AnyAsync(p => p.OrderId == id);
                if (hasPayments)
                    return BadRequest(new { message = "Cannot delete order with associated payments" });

                // Restore stock for order items
                var orderItems = await _context.OrderItems
                    .Where(oi => oi.OrderId == id)
                    .ToListAsync();

                foreach (var item in orderItems)
                {
                    var variant = await _context.ProductVariants.FindAsync(item.VariantId);
                    if (variant != null)
                    {
                        variant.Stock += item.Quantity;

                        // Create inventory log
                        var inventoryLog = new Models.InventoryLog
                        {
                            Id = Guid.NewGuid(),
                            VariantId = item.VariantId,
                            Change = item.Quantity,
                            Reason = $"Order {order.Id} deleted",
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.InventoryLogs.Add(inventoryLog);
                    }
                }

                // Delete order items
                _context.OrderItems.RemoveRange(orderItems);

                // Delete order
                _context.Orders.Remove(order);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting order {OrderId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the order" });
            }
        }

        private static CustomerDto MapCustomerToDto(Models.Customer customer)
        {
            return new CustomerDto
            {
                Id = customer.Id,
                CreatedByUserId = customer.CreatedByUserId,
                FullName = customer.FullName,
                Email = customer.Email,
                Phone = customer.Phone,
                DateOfBirth = customer.DateOfBirth,
                IsFromWebsite = customer.IsFromWebsite,
                CreatedAt = customer.CreatedAt,
                CreatedByUserName = customer.CreatedByUser?.Name
            };
        }

        // 🆕 NEW: Map Channel to ChannelDto
        private static EcommerceApi.DTOs.Channel.ChannelDto MapChannelToDto(Models.Channel channel)
        {
            return new EcommerceApi.DTOs.Channel.ChannelDto
            {
                Id = channel.Id,
                Name = channel.Name,
                Type = channel.Type,
                Description = channel.Description,
                IsActive = channel.IsActive,
                CountryCode = channel.CountryCode,
                RegionCode = channel.RegionCode,
                CurrencyCode = channel.CurrencyCode,
                IsB2B = channel.IsB2B,
                DefaultTaxRate = channel.DefaultTaxRate,
                TaxBehavior = channel.TaxBehavior,
                CreatedAt = channel.CreatedAt,
                UpdatedAt = channel.UpdatedAt
            };
        }

        private IQueryable<Models.Order> ApplySorting(IQueryable<Models.Order> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
                return query.OrderByDescending(o => o.CreatedAt);

            return sortBy.ToLower() switch
            {
                "createdat" => descending ? query.OrderByDescending(o => o.CreatedAt) : query.OrderBy(o => o.CreatedAt),
                "totalamount" => descending ? query.OrderByDescending(o => o.TotalAmount) : query.OrderBy(o => o.TotalAmount),
                "status" => descending ? query.OrderByDescending(o => o.Status) : query.OrderBy(o => o.Status),
                _ => query.OrderByDescending(o => o.CreatedAt)
            };
        }
    }
}
