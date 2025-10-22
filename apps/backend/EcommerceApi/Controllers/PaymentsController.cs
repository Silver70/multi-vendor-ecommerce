using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Payment;
using EcommerceApi.DTOs.Common;

namespace EcommerceApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(AppDbContext context, ILogger<PaymentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(PagedResult<PaymentDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedResult<PaymentDto>>> GetPayments([FromQuery] PaymentFilterParams filterParams)
        {
            try
            {
                var query = _context.Payments.AsQueryable();

                if (filterParams.OrderId.HasValue)
                    query = query.Where(p => p.OrderId == filterParams.OrderId.Value);

                if (!string.IsNullOrWhiteSpace(filterParams.Status))
                    query = query.Where(p => p.Status == filterParams.Status);

                if (!string.IsNullOrWhiteSpace(filterParams.Method))
                    query = query.Where(p => p.Method == filterParams.Method);

                if (filterParams.FromDate.HasValue)
                    query = query.Where(p => p.CreatedAt >= filterParams.FromDate.Value);

                if (filterParams.ToDate.HasValue)
                    query = query.Where(p => p.CreatedAt <= filterParams.ToDate.Value);

                if (filterParams.MinAmount.HasValue)
                    query = query.Where(p => p.Amount >= filterParams.MinAmount.Value);

                if (filterParams.MaxAmount.HasValue)
                    query = query.Where(p => p.Amount <= filterParams.MaxAmount.Value);

                var totalCount = await query.CountAsync();
                query = ApplySorting(query, filterParams.SortBy, filterParams.SortDescending);

                var items = await query
                    .Skip((filterParams.PageNumber - 1) * filterParams.PageSize)
                    .Take(filterParams.PageSize)
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        OrderId = p.OrderId,
                        Method = p.Method,
                        Status = p.Status,
                        TransactionId = p.TransactionId,
                        Amount = p.Amount,
                        CreatedAt = p.CreatedAt,
                        OrderUserName = p.Order != null && p.Order.Customer != null ? p.Order.Customer.FullName : null,
                        OrderTotalAmount = p.Order != null ? p.Order.TotalAmount : null
                    })
                    .ToListAsync();

                return Ok(new PagedResult<PaymentDto>
                {
                    Items = items,
                    TotalCount = totalCount,
                    PageNumber = filterParams.PageNumber,
                    PageSize = filterParams.PageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payments");
                return StatusCode(500, new { message = "An error occurred while retrieving payments" });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<PaymentDto>> GetPayment(Guid id)
        {
            try
            {
                var payment = await _context.Payments
                    .Where(p => p.Id == id)
                    .Select(p => new PaymentDto
                    {
                        Id = p.Id,
                        OrderId = p.OrderId,
                        Method = p.Method,
                        Status = p.Status,
                        TransactionId = p.TransactionId,
                        Amount = p.Amount,
                        CreatedAt = p.CreatedAt,
                        OrderUserName = p.Order != null && p.Order.Customer != null ? p.Order.Customer.FullName : null,
                        OrderTotalAmount = p.Order != null ? p.Order.TotalAmount : null
                    })
                    .FirstOrDefaultAsync();

                if (payment == null)
                    return NotFound(new { message = $"Payment with ID {id} not found" });

                return Ok(payment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving payment {PaymentId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the payment" });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PaymentDto>> CreatePayment([FromBody] CreatePaymentDto createDto)
        {
            try
            {
                // Validate order exists
                var order = await _context.Orders.FindAsync(createDto.OrderId);
                if (order == null)
                    return BadRequest(new { message = "Order not found" });

                // Prevent payment for cancelled orders
                if (order.Status == "cancelled")
                    return BadRequest(new { message = "Cannot create payment for a cancelled order" });

                // Check if payment amount matches or doesn't exceed order total
                var existingPayments = await _context.Payments
                    .Where(p => p.OrderId == createDto.OrderId && p.Status == "completed")
                    .SumAsync(p => p.Amount);

                if (existingPayments + createDto.Amount > order.TotalAmount)
                    return BadRequest(new { message = $"Payment amount exceeds order total. Order total: {order.TotalAmount}, Already paid: {existingPayments}, Attempted: {createDto.Amount}" });

                var payment = new Models.Payment
                {
                    Id = Guid.NewGuid(),
                    OrderId = createDto.OrderId,
                    Method = createDto.Method,
                    Status = "pending",
                    TransactionId = createDto.TransactionId,
                    Amount = createDto.Amount,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                var paymentDto = new PaymentDto
                {
                    Id = payment.Id,
                    OrderId = payment.OrderId,
                    Method = payment.Method,
                    Status = payment.Status,
                    TransactionId = payment.TransactionId,
                    Amount = payment.Amount,
                    CreatedAt = payment.CreatedAt
                };

                return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, paymentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, new { message = "An error occurred while creating the payment" });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(typeof(PaymentDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<PaymentDto>> UpdatePayment(Guid id, [FromBody] UpdatePaymentDto updateDto)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(id);
                if (payment == null)
                    return NotFound(new { message = $"Payment with ID {id} not found" });

                // Validate status transition
                var validStatuses = new[] { "pending", "completed", "failed", "refunded" };
                if (!validStatuses.Contains(updateDto.Status.ToLower()))
                    return BadRequest(new { message = "Invalid payment status" });

                // Prevent updating completed or refunded payments
                if (payment.Status == "completed" || payment.Status == "refunded")
                    return BadRequest(new { message = $"Cannot update a {payment.Status} payment" });

                var oldStatus = payment.Status;
                payment.Status = updateDto.Status.ToLower();

                if (!string.IsNullOrWhiteSpace(updateDto.TransactionId))
                    payment.TransactionId = updateDto.TransactionId;

                // If payment is completed, update order status to paid
                if (payment.Status == "completed" && oldStatus != "completed")
                {
                    var order = await _context.Orders.FindAsync(payment.OrderId);
                    if (order != null && order.Status == "pending")
                    {
                        // Check if total payments equal order total
                        var totalPayments = await _context.Payments
                            .Where(p => p.OrderId == payment.OrderId && (p.Status == "completed" || p.Id == payment.Id))
                            .SumAsync(p => p.Amount);

                        if (totalPayments >= order.TotalAmount)
                        {
                            order.Status = "paid";
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var paymentDto = new PaymentDto
                {
                    Id = payment.Id,
                    OrderId = payment.OrderId,
                    Method = payment.Method,
                    Status = payment.Status,
                    TransactionId = payment.TransactionId,
                    Amount = payment.Amount,
                    CreatedAt = payment.CreatedAt
                };

                return Ok(paymentDto);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error updating payment {PaymentId}", id);
                return StatusCode(409, new { message = "The payment was modified by another user. Please refresh and try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating payment {PaymentId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the payment" });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeletePayment(Guid id)
        {
            try
            {
                var payment = await _context.Payments.FindAsync(id);
                if (payment == null)
                    return NotFound(new { message = $"Payment with ID {id} not found" });

                // Only allow deletion of pending or failed payments
                if (payment.Status != "pending" && payment.Status != "failed")
                    return BadRequest(new { message = "Only pending or failed payments can be deleted" });

                _context.Payments.Remove(payment);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting payment {PaymentId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the payment" });
            }
        }

        private IQueryable<Models.Payment> ApplySorting(IQueryable<Models.Payment> query, string? sortBy, bool descending)
        {
            if (string.IsNullOrWhiteSpace(sortBy))
                return query.OrderByDescending(p => p.CreatedAt);

            return sortBy.ToLower() switch
            {
                "createdat" => descending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
                "amount" => descending ? query.OrderByDescending(p => p.Amount) : query.OrderBy(p => p.Amount),
                "status" => descending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
                "method" => descending ? query.OrderByDescending(p => p.Method) : query.OrderBy(p => p.Method),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };
        }
    }
}
