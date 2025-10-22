using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.Customer;

namespace EcommerceApi.Services
{
    public interface ICustomerService
    {
        Task<Customer?> GetCustomerByIdAsync(Guid customerId);
        Task<Customer?> GetCustomerByUserIdAsync(Guid userId);
        Task<Customer> CreateOrGetCustomerAsync(Guid userId);
        Task<Customer> CreateCustomerAsync(CreateCustomerDto createDto);
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
                .Include(c => c.User)
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.Id == customerId);
        }

        public async Task<Customer?> GetCustomerByUserIdAsync(Guid userId)
        {
            return await _context.Customers
                .Include(c => c.User)
                .Include(c => c.Addresses)
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        /// <summary>
        /// Creates a minimal customer if one doesn't exist for the user.
        /// This is used for on-demand customer creation.
        /// </summary>
        public async Task<Customer> CreateOrGetCustomerAsync(Guid userId)
        {
            // Check if customer already exists
            var existingCustomer = await GetCustomerByUserIdAsync(userId);
            if (existingCustomer != null)
                return existingCustomer;

            // Verify user exists
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new InvalidOperationException($"User with ID {userId} not found");

            // Create minimal customer profile
            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = user.Name, // Use user's name as default
                Phone = null,
                DateOfBirth = null
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created customer {CustomerId} for user {UserId}", customer.Id, userId);

            return customer;
        }

        public async Task<Customer> CreateCustomerAsync(CreateCustomerDto createDto)
        {
            // Verify user exists
            var user = await _context.Users.FindAsync(createDto.UserId);
            if (user == null)
                throw new InvalidOperationException($"User with ID {createDto.UserId} not found");

            // Check if customer already exists
            var existingCustomer = await GetCustomerByUserIdAsync(createDto.UserId);
            if (existingCustomer != null)
                throw new InvalidOperationException($"Customer already exists for user {createDto.UserId}");

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                UserId = createDto.UserId,
                FullName = createDto.FullName,
                Phone = createDto.Phone,
                DateOfBirth = createDto.DateOfBirth
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created customer {CustomerId} for user {UserId}", customer.Id, createDto.UserId);

            return customer;
        }

        public async Task<Customer> UpdateCustomerAsync(Guid customerId, UpdateCustomerDto updateDto)
        {
            var customer = await GetCustomerByIdAsync(customerId);
            if (customer == null)
                throw new InvalidOperationException($"Customer with ID {customerId} not found");

            customer.FullName = updateDto.FullName;
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
