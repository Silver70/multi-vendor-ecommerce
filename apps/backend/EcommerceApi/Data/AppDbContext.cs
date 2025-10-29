using Microsoft.EntityFrameworkCore;
using EcommerceApi.Models;

namespace EcommerceApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Address> Addresses => Set<Address>();
        public DbSet<Category> Categories => Set<Category>();
        public DbSet<Vendor> Vendors => Set<Vendor>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
        public DbSet<ProductImage> ProductImages => Set<ProductImage>();
        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<InventoryLog> InventoryLogs => Set<InventoryLog>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<ProductAttribute> ProductAttributes => Set<ProductAttribute>();
        public DbSet<ProductAttributeValue> ProductAttributeValues => Set<ProductAttributeValue>();
        public DbSet<VariantAttributeValue> VariantAttributeValues => Set<VariantAttributeValue>();
        public DbSet<Customer> Customers => Set<Customer>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User -> Customer (one-to-many for CreatedBy relationship)
            modelBuilder.Entity<User>()
                .HasMany(u => u.CreatedCustomers)
                .WithOne(c => c.CreatedByUser)
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            // Customer -> Address (one-to-many)
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Addresses)
                .WithOne(a => a.Customer)
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Customer -> Order (one-to-many)
            modelBuilder.Entity<Customer>()
                .HasMany(c => c.Orders)
                .WithOne(o => o.Customer)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order -> Address (many-to-one)
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Address)
                .WithMany()
                .HasForeignKey(o => o.AddressId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order -> OrderItem (one-to-many)
            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne(oi => oi.Order)
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order -> Payment (one-to-many)
            modelBuilder.Entity<Order>()
                .HasMany(o => o.Payments)
                .WithOne(p => p.Order)
                .HasForeignKey(p => p.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Product -> ProductImage (one-to-many)
            modelBuilder.Entity<Product>()
                .HasMany(p => p.Images)
                .WithOne(pi => pi.Product)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProductVariant -> ProductImage (one-to-many)
            modelBuilder.Entity<ProductVariant>()
                .HasMany(pv => pv.Images)
                .WithOne(pi => pi.Variant)
                .HasForeignKey(pi => pi.VariantId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}