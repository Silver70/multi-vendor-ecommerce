using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.Customer;

namespace EcommerceApi.Services
{
    public interface ICustomerService
    {
        Task<Customer?> GetCustomerByIdAsync(Guid customerId);
        Task<Customer?> GetCustomerByEmailAsync(string email);
        Task<Customer> CreateCustomerAsync(CreateCustomerDto createDto, Guid? createdByUserId = null);
        Task<List<Customer>> GetCustomersByAdminAsync(Guid adminUserId);
        Task<List<Customer>> GetWebsiteCustomersAsync();
        Task<Customer> UpdateCustomerAsync(Guid customerId, UpdateCustomerDto updateDto);
        Task<bool> CustomerExistsAsync(Guid customerId);
    }

    public class CustomerService : ICustomerService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CustomerService> _logger;

        public CustomerService(AppDbContext context, ILogger<CustomerService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Customer?> GetCustomerByIdAsync(Guid customerId)
        {
            return await _context.Customers
                .Include(c => c.CreatedByUser)
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Id == customerId);
        }

        /// <summary>
        /// Get customer by email (for storefront orders)
        /// </summary>
        public async Task<Customer?> GetCustomerByEmailAsync(string email)
        {
            return await _context.Customers
                .Include(c => c.CreatedByUser)
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Email == email);
        }

        /// <summary>
        /// Create customer - allows duplicates, tracks creator
        /// </summary>
        public async Task<Customer> CreateCustomerAsync(CreateCustomerDto createDto, Guid? createdByUserId = null)
        {
            // NO duplicate check anymore - allows admin to create multiple customers

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                CreatedByUserId = createdByUserId,
                FullName = createDto.FullName,
                Email = createDto.Email,
                Phone = createDto.Phone,
                DateOfBirth = createDto.DateOfBirth,
                IsFromWebsite = createdByUserId == null,  // If no admin, from website
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Created customer {CustomerId} by {CreatedBy}. IsFromWebsite: {IsFromWebsite}",
                customer.Id,
                createdByUserId ?? Guid.Empty,
                customer.IsFromWebsite
            );

            return customer;
        }

        /// <summary>
        /// Get customers created by specific admin
        /// </summary>
        public async Task<List<Customer>> GetCustomersByAdminAsync(Guid adminUserId)
        {
            return await _context.Customers
                .Where(c => c.CreatedByUserId == adminUserId)
                .Include(c => c.Addresses)
                .Include(c => c.Orders)
                .ToListAsync();
        }

        /// <summary>
        /// Get all website customers (no admin creator)
        /// </summary>
        public async Task<List<Customer>> GetWebsiteCustomersAsync()
        {
            return await _context.Customers
                .Where(c => c.IsFromWebsite)
                .Include(c => c.Addresses)
                .Include(c => c.Orders)
                .ToListAsync();
        }

        public async Task<Customer> UpdateCustomerAsync(Guid customerId, UpdateCustomerDto updateDto)
        {
            var customer = await GetCustomerByIdAsync(customerId);
            if (customer == null)
                throw new InvalidOperationException($"Customer with ID {customerId} not found");

            customer.FullName = updateDto.FullName;
            customer.Email = updateDto.Email;
            customer.Phone = updateDto.Phone;
            customer.DateOfBirth = updateDto.DateOfBirth;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated customer {CustomerId}", customerId);

            return customer;
        }

        public async Task<bool> CustomerExistsAsync(Guid customerId)
        {
            return await _context.Customers.AnyAsync(c => c.Id == customerId);
        }
    }
}
