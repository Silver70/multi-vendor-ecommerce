# Channels Entity Introduction - Backend Impact Analysis

## Executive Summary

Introducing a `Channels` entity as a sales context in a headless e-commerce backend requires significant architectural changes. A channel represents a sales context (e.g., Shopify, WooCommerce, Direct Web, Amazon, etc.) through which products are sold. This document outlines all components that need modification.

---

## 1. Database Model Changes

### 1.1 New `Channel` Entity

```csharp
public class Channel
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;  // e.g., "Shopify", "Direct Web"

    [Required]
    public string Type { get; set; } = string.Empty;  // e.g., "shopify", "woocommerce", "web"

    [MaxLength(500)]
    public string? Description { get; set; }

    // Channel configuration
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Optional: External channel identifier (for 3rd party integrations)
    public string? ExternalId { get; set; }

    // 🆕 NEW: Regional & Localization Settings
    [Required, MaxLength(2)]
    public string CountryCode { get; set; } = string.Empty;  // ISO 3166-1 alpha-2 (e.g., "US", "UK", "DE", "FR")

    [MaxLength(2)]
    public string? RegionCode { get; set; }  // ISO 3166-2 (e.g., "CA" for California, "ON" for Ontario)

    [Required, MaxLength(3)]
    public string CurrencyCode { get; set; } = string.Empty;  // ISO 4217 (e.g., "USD", "EUR", "GBP", "CAD")

    // 🆕 NEW: Tax Configuration
    public bool IsB2B { get; set; } = false;  // B2B channels may not charge tax
    public string? TaxIdentificationNumber { get; set; }  // Tax ID for this channel (e.g., VAT number)
    public decimal DefaultTaxRate { get; set; } = 0m;  // Default tax rate percentage (e.g., 0.20 for 20%)
    public string TaxBehavior { get; set; } = "inclusive";  // "inclusive" or "exclusive" - whether prices include tax

    // Navigation properties
    public ICollection<ChannelVendor>? ChannelVendors { get; set; }  // Many-to-many: Channels <-> Vendors
    public ICollection<ChannelProduct>? ChannelProducts { get; set; } // Many-to-many: Channels <-> Products
    public ICollection<Order>? Orders { get; set; }  // One-to-many: Channel has many Orders
    public ICollection<ChannelTaxRule>? TaxRules { get; set; }  // 🆕 NEW: One-to-many: Channel has many TaxRules
}
```

### 1.2 Junction Tables for Many-to-Many Relationships

#### ChannelVendor (Channels <-> Vendors)
```csharp
public class ChannelVendor
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }
    public Guid VendorId { get; set; }

    // Channel-specific vendor settings
    public bool IsActive { get; set; } = true;
    public string? ExternalVendorId { get; set; }  // 3rd-party vendor identifier
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Channel? Channel { get; set; }
    public Vendor? Vendor { get; set; }
}
```

#### ChannelProduct (Channels <-> Products)
```csharp
public class ChannelProduct
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }
    public Guid ProductId { get; set; }

    // Channel-specific product data (overrides base product)
    [MaxLength(200)]
    public string? ChannelName { get; set; }  // Channel-specific product name
    public string? ChannelDescription { get; set; }
    public decimal? ChannelPrice { get; set; }  // Channel-specific price override
    public bool IsActive { get; set; } = true;  // Product visibility per channel
    public string? ExternalProductId { get; set; }  // 3rd-party product ID (SKU mapping)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Channel? Channel { get; set; }
    public Product? Product { get; set; }
}
```

#### ChannelTaxRule (Channel Tax Configuration)
```csharp
public class ChannelTaxRule
{
    public Guid Id { get; set; }

    public Guid ChannelId { get; set; }

    // Tax rule parameters
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;  // e.g., "VAT", "GST", "Sales Tax", "Luxury Tax"

    [MaxLength(500)]
    public string? Description { get; set; }

    // Tax rate (as decimal: 0.20 = 20%)
    [Range(0, 1)]
    public decimal TaxRate { get; set; }

    // Product category filter (optional)
    public Guid? CategoryId { get; set; }  // If null, applies to all products in category

    // Regional filter
    public string? ApplicableCountryCode { get; set; }  // ISO 3166-1 alpha-2 (e.g., "DE")
    public string? ApplicableRegionCode { get; set; }  // ISO 3166-2 (e.g., "CA")

    // B2B vs B2C
    public bool ApplyToB2B { get; set; } = true;
    public bool ApplyToB2C { get; set; } = true;

    // Minimum order amount threshold
    public decimal? MinimumOrderAmount { get; set; }  // Tax only applies if order exceeds this

    // Tax behavior for this rule
    public string TaxBehavior { get; set; } = "inclusive";  // "inclusive" or "exclusive"

    // Rule validity
    public bool IsActive { get; set; } = true;
    public DateTime? StartDate { get; set; }  // When this rule becomes effective
    public DateTime? EndDate { get; set; }  // When this rule expires (e.g., seasonal tax)

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Channel? Channel { get; set; }
    public Category? Category { get; set; }  // Optional category filter
}
```

### 1.3 Modifications to Existing Entities

#### Order Entity
```csharp
public class Order
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }
    public Guid AddressId { get; set; }
    public Guid ChannelId { get; set; }  // 🆕 NEW: Which channel this order came from

    [Required]
    public string Status { get; set; } = "pending";

    // Pricing breakdown
    public decimal SubtotalAmount { get; set; }  // 🆕 MODIFIED: Base amount before tax/shipping
    public decimal TaxAmount { get; set; } = 0m;  // 🆕 NEW: Calculated tax
    public decimal ShippingAmount { get; set; } = 0m;  // Shipping cost
    public decimal TotalAmount { get; set; }  // Subtotal + Tax + Shipping

    // Tax information
    public string? AppliedTaxRuleName { get; set; }  // 🆕 NEW: Which tax rule was applied
    public decimal AppliedTaxRate { get; set; } = 0m;  // 🆕 NEW: The tax rate used for this order
    public bool TaxInclusive { get; set; } = false;  // 🆕 NEW: Whether tax is included in item prices

    // Currency
    public string CurrencyCode { get; set; } = "USD";  // 🆕 NEW: Order currency (from channel)

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // External identifier from channel
    public string? ExternalOrderId { get; set; }  // 🆕 NEW: e.g., Shopify order ID

    // Navigation
    public Customer? Customer { get; set; }
    public Address? Address { get; set; }
    public Channel? Channel { get; set; }  // 🆕 NEW
    public ICollection<OrderItem>? Items { get; set; }
    public ICollection<Payment>? Payments { get; set; }
}
```

#### Product Entity
```csharp
public class Product
{
    public Guid Id { get; set; }

    public Guid? VendorId { get; set; }
    public Guid CategoryId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // 🆕 NEW: Base price (channel-specific prices override this)
    public decimal BasePrice { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Required, MaxLength(200)]
    public string Slug { get; set; } = string.Empty;

    // Navigation
    public Vendor? Vendor { get; set; }
    public Category? Category { get; set; }
    public ICollection<ProductVariant>? Variants { get; set; }
    public ICollection<ProductImage>? Images { get; set; }
    public ICollection<Review>? Reviews { get; set; }
    public ICollection<ChannelProduct>? ChannelProducts { get; set; }  // 🆕 NEW
}
```

#### OrderItem Entity
```csharp
public class OrderItem
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }
    public Guid VariantId { get; set; }
    public Guid ChannelId { get; set; }  // 🆕 NEW: Denormalized for query efficiency

    public decimal Price { get; set; }
    public int Quantity { get; set; }

    // 🆕 NEW: External variant ID from channel (for inventory sync)
    public string? ExternalVariantId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Order? Order { get; set; }
    public ProductVariant? Variant { get; set; }
    public Channel? Channel { get; set; }  // 🆕 NEW
}
```

#### Vendor Entity
```csharp
public class Vendor
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [EmailAddress]
    public string? ContactEmail { get; set; }

    public string? Website { get; set; }

    // 🆕 NEW: Track which channels this vendor is active on
    public ICollection<ChannelVendor>? ChannelVendors { get; set; }

    // Existing
    public ICollection<Product>? Products { get; set; }
}
```

### 1.4 AppDbContext Changes

```csharp
public class AppDbContext : DbContext
{
    // ... existing DbSets ...

    // 🆕 NEW
    public DbSet<Channel> Channels => Set<Channel>();
    public DbSet<ChannelVendor> ChannelVendors => Set<ChannelVendor>();
    public DbSet<ChannelProduct> ChannelProducts => Set<ChannelProduct>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 🆕 NEW: Channel -> Order (one-to-many)
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Channel)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.ChannelId)
            .OnDelete(DeleteBehavior.Restrict);  // Don't delete orders if channel is deleted

        // 🆕 NEW: ChannelVendor (many-to-many with payload)
        modelBuilder.Entity<ChannelVendor>()
            .HasOne(cv => cv.Channel)
            .WithMany(c => c.ChannelVendors)
            .HasForeignKey(cv => cv.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChannelVendor>()
            .HasOne(cv => cv.Vendor)
            .WithMany(v => v.ChannelVendors)
            .HasForeignKey(cv => cv.VendorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique constraint: One vendor per channel
        modelBuilder.Entity<ChannelVendor>()
            .HasIndex(cv => new { cv.ChannelId, cv.VendorId })
            .IsUnique();

        // 🆕 NEW: ChannelProduct (many-to-many with payload)
        modelBuilder.Entity<ChannelProduct>()
            .HasOne(cp => cp.Channel)
            .WithMany(c => c.ChannelProducts)
            .HasForeignKey(cp => cp.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChannelProduct>()
            .HasOne(cp => cp.Product)
            .WithMany(p => p.ChannelProducts)
            .HasForeignKey(cp => cp.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // 🆕 NEW: OrderItem -> Channel
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Channel)
            .WithMany()
            .HasForeignKey(oi => oi.ChannelId)
            .OnDelete(DeleteBehavior.Restrict);

        // 🆕 NEW: Product BasePrice index
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.VendorId);
    }
}
```

---

## 2. DTO Changes

### 2.1 New DTOs

#### `DTOs/Channel/ChannelDto.cs`
```csharp
public class ChannelDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Type { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }

    // 🆕 NEW: Regional & Tax Info
    public string CountryCode { get; set; }
    public string? RegionCode { get; set; }
    public string CurrencyCode { get; set; }
    public bool IsB2B { get; set; }
    public decimal DefaultTaxRate { get; set; }
    public string TaxBehavior { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### `DTOs/Channel/CreateChannelDto.cs`
```csharp
public class CreateChannelDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; }

    [Required]
    public string Type { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public string? ExternalId { get; set; }

    // 🆕 NEW: Regional & Tax Configuration
    [Required, MaxLength(2)]
    public string CountryCode { get; set; }  // ISO 3166-1 alpha-2

    [MaxLength(2)]
    public string? RegionCode { get; set; }  // ISO 3166-2

    [Required, MaxLength(3)]
    public string CurrencyCode { get; set; }  // ISO 4217

    public bool IsB2B { get; set; } = false;

    public string? TaxIdentificationNumber { get; set; }

    [Range(0, 1)]
    public decimal DefaultTaxRate { get; set; } = 0m;

    [RegularExpression("^(inclusive|exclusive)$")]
    public string TaxBehavior { get; set; } = "inclusive";
}
```

#### `DTOs/Channel/UpdateChannelDto.cs`
```csharp
public class UpdateChannelDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public bool? IsActive { get; set; }
    public string? ExternalId { get; set; }

    // 🆕 NEW: Regional & Tax Configuration
    public string? CountryCode { get; set; }
    public string? RegionCode { get; set; }
    public string? CurrencyCode { get; set; }
    public bool? IsB2B { get; set; }
    public string? TaxIdentificationNumber { get; set; }

    [Range(0, 1)]
    public decimal? DefaultTaxRate { get; set; }

    [RegularExpression("^(inclusive|exclusive)$")]
    public string? TaxBehavior { get; set; }
}
```

#### `DTOs/Channel/ChannelTaxRuleDto.cs`
```csharp
public class ChannelTaxRuleDto
{
    public Guid Id { get; set; }
    public Guid ChannelId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public decimal TaxRate { get; set; }
    public Guid? CategoryId { get; set; }
    public string? ApplicableCountryCode { get; set; }
    public string? ApplicableRegionCode { get; set; }
    public bool ApplyToB2B { get; set; }
    public bool ApplyToB2C { get; set; }
    public decimal? MinimumOrderAmount { get; set; }
    public string TaxBehavior { get; set; }
    public bool IsActive { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

#### `DTOs/Channel/CreateChannelTaxRuleDto.cs`
```csharp
public class CreateChannelTaxRuleDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required, Range(0, 1)]
    public decimal TaxRate { get; set; }

    public Guid? CategoryId { get; set; }

    [MaxLength(2)]
    public string? ApplicableCountryCode { get; set; }

    [MaxLength(2)]
    public string? ApplicableRegionCode { get; set; }

    public bool ApplyToB2B { get; set; } = true;
    public bool ApplyToB2C { get; set; } = true;

    [Range(0, double.MaxValue)]
    public decimal? MinimumOrderAmount { get; set; }

    [RegularExpression("^(inclusive|exclusive)$")]
    public string TaxBehavior { get; set; } = "inclusive";

    public bool IsActive { get; set; } = true;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

#### `DTOs/Channel/UpdateChannelTaxRuleDto.cs`
```csharp
public class UpdateChannelTaxRuleDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Range(0, 1)]
    public decimal? TaxRate { get; set; }

    public Guid? CategoryId { get; set; }

    [MaxLength(2)]
    public string? ApplicableCountryCode { get; set; }

    [MaxLength(2)]
    public string? ApplicableRegionCode { get; set; }

    public bool? ApplyToB2B { get; set; }
    public bool? ApplyToB2C { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? MinimumOrderAmount { get; set; }

    [RegularExpression("^(inclusive|exclusive)$")]
    public string? TaxBehavior { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
```

#### `DTOs/Channel/ChannelProductDto.cs`
```csharp
public class ChannelProductDto
{
    public Guid Id { get; set; }
    public Guid ChannelId { get; set; }
    public Guid ProductId { get; set; }
    public string? ChannelName { get; set; }
    public decimal? ChannelPrice { get; set; }
    public bool IsActive { get; set; }
    public string? ExternalProductId { get; set; }
    public ProductDto? Product { get; set; }
}
```

#### `DTOs/Channel/ChannelVendorDto.cs`
```csharp
public class ChannelVendorDto
{
    public Guid Id { get; set; }
    public Guid ChannelId { get; set; }
    public Guid VendorId { get; set; }
    public bool IsActive { get; set; }
    public string? ExternalVendorId { get; set; }
    public VendorDto? Vendor { get; set; }
}
```

### 2.2 Modified DTOs

#### `DTOs/Order/OrderDto.cs` - Add ChannelId & Tax Info
```csharp
public class OrderDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ChannelId { get; set; }  // 🆕 NEW
    public string Status { get; set; }

    // 🆕 MODIFIED: Pricing breakdown
    public decimal SubtotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal ShippingAmount { get; set; }
    public decimal TotalAmount { get; set; }

    // 🆕 NEW: Tax & Currency Info
    public string? AppliedTaxRuleName { get; set; }
    public decimal AppliedTaxRate { get; set; }
    public bool TaxInclusive { get; set; }
    public string CurrencyCode { get; set; }

    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto>? Items { get; set; }
    public ChannelDto? Channel { get; set; }  // 🆕 NEW
}
```

#### `DTOs/Order/CreateOrderDto.cs` - Add ChannelId
```csharp
public class CreateOrderDto
{
    [Required]
    public Guid CustomerId { get; set; }

    [Required]
    public Guid ChannelId { get; set; }  // 🆕 NEW: Required field

    [Required]
    public Guid AddressId { get; set; }

    [Required]
    public List<CreateOrderItemDto> Items { get; set; }
}
```

#### `DTOs/Product/ProductDto.cs` - Add BasePrice
```csharp
public class ProductDto
{
    public Guid Id { get; set; }
    public Guid? VendorId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }  // 🆕 NEW
    public bool IsActive { get; set; }
    public string Slug { get; set; }
    public List<ProductVariantDto>? Variants { get; set; }
    public List<ChannelProductDto>? ChannelProducts { get; set; }  // 🆕 NEW
}
```

---

## 3. API Controller Changes

### 3.1 New Controller: `ChannelsController.cs`

```csharp
[ApiController]
[Route("api/[controller]")]
public class ChannelsController : ControllerBase
{
    private readonly IChannelService _channelService;
    private readonly ILogger<ChannelsController> _logger;

    public ChannelsController(IChannelService channelService, ILogger<ChannelsController> logger)
    {
        _channelService = channelService;
        _logger = logger;
    }

    // GET /api/channels
    [HttpGet]
    public async Task<ActionResult<List<ChannelDto>>> GetChannels()
    {
        var channels = await _channelService.GetAllChannelsAsync();
        return Ok(channels);
    }

    // GET /api/channels/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ChannelDto>> GetChannel(Guid id)
    {
        var channel = await _channelService.GetChannelByIdAsync(id);
        if (channel == null) return NotFound();
        return Ok(channel);
    }

    // POST /api/channels
    [HttpPost]
    public async Task<ActionResult<ChannelDto>> CreateChannel([FromBody] CreateChannelDto dto)
    {
        var channel = await _channelService.CreateChannelAsync(dto);
        return CreatedAtAction(nameof(GetChannel), new { id = channel.Id }, channel);
    }

    // PUT /api/channels/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<ChannelDto>> UpdateChannel(Guid id, [FromBody] UpdateChannelDto dto)
    {
        var channel = await _channelService.UpdateChannelAsync(id, dto);
        if (channel == null) return NotFound();
        return Ok(channel);
    }

    // DELETE /api/channels/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChannel(Guid id)
    {
        var success = await _channelService.DeleteChannelAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    // POST /api/channels/{channelId}/products
    [HttpPost("{channelId}/products")]
    public async Task<ActionResult<ChannelProductDto>> AddProductToChannel(
        Guid channelId,
        [FromBody] CreateChannelProductDto dto)
    {
        var channelProduct = await _channelService.AddProductToChannelAsync(channelId, dto);
        return CreatedAtAction(nameof(GetChannelProducts), new { channelId }, channelProduct);
    }

    // GET /api/channels/{channelId}/products
    [HttpGet("{channelId}/products")]
    public async Task<ActionResult<List<ChannelProductDto>>> GetChannelProducts(Guid channelId)
    {
        var products = await _channelService.GetChannelProductsAsync(channelId);
        return Ok(products);
    }

    // POST /api/channels/{channelId}/vendors
    [HttpPost("{channelId}/vendors")]
    public async Task<ActionResult<ChannelVendorDto>> AddVendorToChannel(
        Guid channelId,
        [FromBody] CreateChannelVendorDto dto)
    {
        var channelVendor = await _channelService.AddVendorToChannelAsync(channelId, dto);
        return CreatedAtAction(nameof(GetChannelVendors), new { channelId }, channelVendor);
    }

    // GET /api/channels/{channelId}/vendors
    [HttpGet("{channelId}/vendors")]
    public async Task<ActionResult<List<ChannelVendorDto>>> GetChannelVendors(Guid channelId)
    {
        var vendors = await _channelService.GetChannelVendorsAsync(channelId);
        return Ok(vendors);
    }

    // 🆕 NEW: Tax Rule Endpoints

    // POST /api/channels/{channelId}/tax-rules
    [HttpPost("{channelId}/tax-rules")]
    public async Task<ActionResult<ChannelTaxRuleDto>> CreateTaxRule(
        Guid channelId,
        [FromBody] CreateChannelTaxRuleDto dto)
    {
        var taxRule = await _channelService.CreateTaxRuleAsync(channelId, dto);
        return CreatedAtAction(nameof(GetTaxRule), new { channelId, ruleId = taxRule.Id }, taxRule);
    }

    // GET /api/channels/{channelId}/tax-rules
    [HttpGet("{channelId}/tax-rules")]
    public async Task<ActionResult<List<ChannelTaxRuleDto>>> GetChannelTaxRules(Guid channelId)
    {
        var rules = await _channelService.GetChannelTaxRulesAsync(channelId);
        return Ok(rules);
    }

    // GET /api/channels/{channelId}/tax-rules/{ruleId}
    [HttpGet("{channelId}/tax-rules/{ruleId}")]
    public async Task<ActionResult<ChannelTaxRuleDto>> GetTaxRule(Guid channelId, Guid ruleId)
    {
        var rule = await _channelService.GetTaxRuleByIdAsync(ruleId);
        if (rule == null || rule.ChannelId != channelId) return NotFound();
        return Ok(rule);
    }

    // PUT /api/channels/{channelId}/tax-rules/{ruleId}
    [HttpPut("{channelId}/tax-rules/{ruleId}")]
    public async Task<ActionResult<ChannelTaxRuleDto>> UpdateTaxRule(
        Guid channelId,
        Guid ruleId,
        [FromBody] UpdateChannelTaxRuleDto dto)
    {
        var rule = await _channelService.UpdateTaxRuleAsync(ruleId, dto);
        if (rule == null || rule.ChannelId != channelId) return NotFound();
        return Ok(rule);
    }

    // DELETE /api/channels/{channelId}/tax-rules/{ruleId}
    [HttpDelete("{channelId}/tax-rules/{ruleId}")]
    public async Task<IActionResult> DeleteTaxRule(Guid channelId, Guid ruleId)
    {
        var success = await _channelService.DeleteTaxRuleAsync(ruleId, channelId);
        if (!success) return NotFound();
        return NoContent();
    }
}
```

### 3.2 Modified Controllers

#### `ProductsController.cs` Changes
- Add `BasePrice` to create/update endpoints
- Add filtering by channel in list endpoint
- Update composite product creation to support channel context

#### `OrdersController.cs` Changes
- Add `ChannelId` as required field in create endpoint
- Add channel filtering to GetOrders()
- Add channel-specific order statistics
- Update order query filters to include channel

#### `VendorsController.cs` Changes
- Add endpoint: GET `/api/vendors/{id}/channels` - List channels vendor is active on
- Add endpoint: POST/DELETE vendor from channel
- Validate vendor deletion only if not active on any channel

#### `AnalyticsController.cs` Changes
- Add `channelId` parameter to revenue endpoints
- Add breakdown by channel
- Add vendor-channel revenue analysis

---

## 4. Service Layer Changes

### 4.1 New Service: `IChannelService`

```csharp
public interface IChannelService
{
    Task<ChannelDto> CreateChannelAsync(CreateChannelDto dto);
    Task<ChannelDto?> GetChannelByIdAsync(Guid id);
    Task<List<ChannelDto>> GetAllChannelsAsync();
    Task<ChannelDto?> UpdateChannelAsync(Guid id, UpdateChannelDto dto);
    Task<bool> DeleteChannelAsync(Guid id);

    Task<ChannelProductDto> AddProductToChannelAsync(Guid channelId, CreateChannelProductDto dto);
    Task<List<ChannelProductDto>> GetChannelProductsAsync(Guid channelId);
    Task<ChannelProductDto?> UpdateChannelProductAsync(Guid channelProductId, UpdateChannelProductDto dto);
    Task<bool> RemoveProductFromChannelAsync(Guid channelProductId);

    Task<ChannelVendorDto> AddVendorToChannelAsync(Guid channelId, CreateChannelVendorDto dto);
    Task<List<ChannelVendorDto>> GetChannelVendorsAsync(Guid channelId);
    Task<bool> RemoveVendorFromChannelAsync(Guid channelVendorId);
    Task<List<ChannelVendorDto>> GetVendorChannelsAsync(Guid vendorId);

    Task<decimal> GetChannelProductPriceAsync(Guid channelId, Guid productId);

    // 🆕 NEW: Tax Rule Management
    Task<ChannelTaxRuleDto> CreateTaxRuleAsync(Guid channelId, CreateChannelTaxRuleDto dto);
    Task<ChannelTaxRuleDto?> GetTaxRuleByIdAsync(Guid ruleId);
    Task<List<ChannelTaxRuleDto>> GetChannelTaxRulesAsync(Guid channelId);
    Task<ChannelTaxRuleDto?> UpdateTaxRuleAsync(Guid ruleId, UpdateChannelTaxRuleDto dto);
    Task<bool> DeleteTaxRuleAsync(Guid ruleId, Guid channelId);

    // Tax calculation helper
    Task<(decimal taxAmount, decimal taxRate, string? ruleName)> CalculateTaxAsync(
        Guid channelId,
        decimal orderAmount,
        Guid? categoryId = null,
        bool isB2B = false);
}
```

### 4.2 Service Implementation Changes

#### Existing Services Modified

**`CustomerService.cs`** Changes:
- Add method: `GetCustomerOrdersByChannelAsync(Guid customerId, Guid channelId)`
- Validate channel exists before order operations

**`VariantGenerationService.cs`** Changes:
- No changes required (works at product level, channels are order-level)

**`OrderService.cs`** Changes:
- Add `CreateOrderWithChannelAsync()` - validates channel exists and products are available
- Add filtering: `GetOrdersByChannelAsync(Guid channelId, PaginationParams params)`
- Validate inventory per channel if different channel has different stock levels
- Update order status change to respect channel policies
- 🆕 NEW: Call `_channelService.CalculateTaxAsync()` to compute order tax on creation
- 🆕 NEW: Populate `SubtotalAmount`, `TaxAmount`, `ShippingAmount` fields
- 🆕 NEW: Store `AppliedTaxRuleName`, `AppliedTaxRate`, `TaxInclusive`, `CurrencyCode` from channel

**`S3Service.cs`** Changes:
- No changes required (unchanged)

**`PaymentService.cs`** Changes (if exists):
- 🆕 NEW: Use `TotalAmount` which now includes SubtotalAmount + TaxAmount + ShippingAmount
- 🆕 NEW: Pass currency information to payment gateway (from `order.CurrencyCode`)

---

## 5. Data Seeding Changes

### 5.1 `DatabaseSeeder.cs` Updates

```csharp
public static class DatabaseSeeder
{
    public static async Task SeedDatabaseAsync(AppDbContext context)
    {
        // ... existing seeds ...

        // 🆕 NEW: Seed Channels
        if (!context.Channels.Any())
        {
            var channels = new List<Channel>
            {
                new Channel
                {
                    Id = Guid.NewGuid(),
                    Name = "Direct Web",
                    Type = "web",
                    Description = "Direct e-commerce website",
                    IsActive = true,
                    CountryCode = "US",
                    CurrencyCode = "USD",
                    IsB2B = false,
                    DefaultTaxRate = 0.07m,  // 7% sales tax
                    TaxBehavior = "exclusive",
                    CreatedAt = DateTime.UtcNow
                },
                new Channel
                {
                    Id = Guid.NewGuid(),
                    Name = "Shopify",
                    Type = "shopify",
                    Description = "Shopify marketplace",
                    IsActive = true,
                    CountryCode = "CA",
                    RegionCode = "ON",
                    CurrencyCode = "CAD",
                    IsB2B = false,
                    DefaultTaxRate = 0.13m,  // 13% HST (Ontario)
                    TaxBehavior = "exclusive",
                    CreatedAt = DateTime.UtcNow
                },
                new Channel
                {
                    Id = Guid.NewGuid(),
                    Name = "Amazon EU",
                    Type = "amazon",
                    Description = "Amazon Europe marketplace",
                    IsActive = true,
                    CountryCode = "DE",
                    CurrencyCode = "EUR",
                    IsB2B = false,
                    DefaultTaxRate = 0.19m,  // 19% VAT (Germany)
                    TaxBehavior = "inclusive",
                    TaxIdentificationNumber = "DE123456789",
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.Channels.AddRangeAsync(channels);

            // 🆕 NEW: Map vendors to channels
            var channelVendors = new List<ChannelVendor>
            {
                new ChannelVendor
                {
                    ChannelId = channels[0].Id,
                    VendorId = vendors[0].Id,  // Map vendor to web channel
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                // ... more mappings ...
            };

            await context.ChannelVendors.AddRangeAsync(channelVendors);

            // 🆕 NEW: Seed Tax Rules
            var taxRules = new List<ChannelTaxRule>
            {
                // US Channel - Basic sales tax
                new ChannelTaxRule
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channels[0].Id,
                    Name = "US Sales Tax",
                    TaxRate = 0.07m,
                    ApplicableCountryCode = "US",
                    ApplyToB2B = false,
                    ApplyToB2C = true,
                    TaxBehavior = "exclusive",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // Canada Channel - HST
                new ChannelTaxRule
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channels[1].Id,
                    Name = "Ontario HST",
                    TaxRate = 0.13m,
                    ApplicableCountryCode = "CA",
                    ApplicableRegionCode = "ON",
                    ApplyToB2B = false,
                    ApplyToB2C = true,
                    TaxBehavior = "exclusive",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // EU Channel - VAT (Standard)
                new ChannelTaxRule
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channels[2].Id,
                    Name = "Germany VAT",
                    TaxRate = 0.19m,
                    ApplicableCountryCode = "DE",
                    ApplyToB2B = false,
                    ApplyToB2C = true,
                    TaxBehavior = "inclusive",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // EU Channel - Reduced VAT (for specific categories like food)
                new ChannelTaxRule
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channels[2].Id,
                    Name = "Germany VAT - Reduced",
                    Description = "Applied to food and certain essential items",
                    TaxRate = 0.07m,
                    ApplicableCountryCode = "DE",
                    ApplyToB2B = false,
                    ApplyToB2C = true,
                    TaxBehavior = "inclusive",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },

                // B2B Channel - No tax
                new ChannelTaxRule
                {
                    Id = Guid.NewGuid(),
                    ChannelId = channels[0].Id,
                    Name = "B2B Exempt",
                    TaxRate = 0m,
                    ApplyToB2B = true,
                    ApplyToB2C = false,
                    TaxBehavior = "exclusive",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            await context.ChannelTaxRules.AddRangeAsync(taxRules);
            await context.SaveChangesAsync();
        }
    }
}
```

---

## 6. Migration Strategy

### 6.1 EF Core Migration Plan

```bash
# Step 1: Add Channel entities
dotnet ef migrations add AddChannelEntities

# Step 2: Add Channel relationships to existing entities
dotnet ef migrations add AddChannelForeignKeys

# Step 3: Seed initial channels
dotnet ef migrations add SeedChannels
```

### 6.2 Data Migration Considerations

```sql
-- Step 1: Create default "Direct Web" channel for existing orders
INSERT INTO "Channels" ("Id", "Name", "Type", "IsActive", "CreatedAt", "UpdatedAt")
VALUES (DEFAULT_CHANNEL_ID, 'Direct Web', 'web', true, NOW(), NOW());

-- Step 2: Populate ChannelId in existing orders
UPDATE "Orders"
SET "ChannelId" = DEFAULT_CHANNEL_ID
WHERE "ChannelId" IS NULL;

-- Step 3: Create ChannelProduct entries for all existing products
INSERT INTO "ChannelProducts" ("ChannelId", "ProductId", "IsActive", "CreatedAt", "UpdatedAt")
SELECT DEFAULT_CHANNEL_ID, "Id", true, NOW(), NOW()
FROM "Products";

-- Step 4: Create ChannelVendor entries for all vendors
INSERT INTO "ChannelVendors" ("ChannelId", "VendorId", "IsActive", "CreatedAt")
SELECT DEFAULT_CHANNEL_ID, "Id", true, NOW()
FROM "Vendors";
```

---

## 7. Authentication & Authorization Changes

### 7.1 Context Service

New service to extract channel context from JWT and enforce access:

```csharp
public interface IChannelContextService
{
    Task<Guid?> GetCurrentChannelIdAsync();
    Task<Channel?> GetCurrentChannelAsync();
    Task<bool> IsChannelAccessAllowedAsync(Guid channelId);
    Task ValidateChannelAccessAsync(Guid channelId);
}
```

### 7.2 Authorization Policy

Add to `Program.cs`:

```csharp
builder.Services.AddAuthorization(options =>
{
    // Policy for channel-specific operations
    options.AddPolicy("ChannelAccess", policy =>
        policy.Requirements.Add(new ChannelAccessRequirement()));
});

builder.Services.AddScoped<IAuthorizationHandler, ChannelAccessHandler>();
```

### 7.3 Authorization Middleware

```csharp
// In relevant controllers
[Authorize]
[ServiceFilter(typeof(ChannelContextFilter))]
public class OrdersController : ControllerBase
{
    // Only vendor can see their channel's orders
    // Admin can see all channels
}
```

---

## 8. API Endpoint Changes Summary

### 8.1 New Endpoints

```
POST   /api/channels                        - Create channel
GET    /api/channels                        - List all channels
GET    /api/channels/{id}                   - Get channel details
PUT    /api/channels/{id}                   - Update channel
DELETE /api/channels/{id}                   - Delete channel

POST   /api/channels/{channelId}/products   - Add product to channel
GET    /api/channels/{channelId}/products   - List products on channel
PUT    /api/channels/{channelId}/products/{productId} - Update channel product
DELETE /api/channels/{channelId}/products/{productId} - Remove product from channel

POST   /api/channels/{channelId}/vendors    - Add vendor to channel
GET    /api/channels/{channelId}/vendors    - List vendors on channel
DELETE /api/channels/{channelId}/vendors/{vendorId}   - Remove vendor from channel

GET    /api/vendors/{vendorId}/channels     - List channels vendor is on

🆕 NEW: Tax Rule Endpoints
POST   /api/channels/{channelId}/tax-rules  - Create tax rule
GET    /api/channels/{channelId}/tax-rules  - List tax rules for channel
GET    /api/channels/{channelId}/tax-rules/{ruleId}  - Get specific tax rule
PUT    /api/channels/{channelId}/tax-rules/{ruleId}  - Update tax rule
DELETE /api/channels/{channelId}/tax-rules/{ruleId}  - Delete tax rule
```

### 8.2 Modified Endpoints

```
POST   /api/orders          - MODIFIED: Requires channelId, now calculates and returns tax breakdown
GET    /api/orders          - MODIFIED: Add channelId filter, returns tax info
GET    /api/orders/{id}     - MODIFIED: Include channel info, tax breakdown

POST   /api/products        - MODIFIED: Add basePrice field
PUT    /api/products/{id}   - MODIFIED: Update basePrice

GET    /api/analytics/revenue  - MODIFIED: Add channelId parameter, add currency conversion
```

---

## 9. Configuration Changes

### 9.1 `appsettings.json` Updates

```json
{
  "ChannelSettings": {
    "DefaultChannelId": "550e8400-e29b-41d4-a716-446655440000",
    "EnableMultiChannelOrders": true,
    "SyncChannelInventory": true
  }
}
```

### 9.2 `Program.cs` Service Registration

```csharp
// Add Channel services
builder.Services.AddScoped<IChannelService, ChannelService>();
builder.Services.AddScoped<IChannelContextService, ChannelContextService>();
builder.Services.AddScoped<ChannelContextFilter>();

// Add Channel middleware
app.UseMiddleware<ChannelContextMiddleware>();
```

---

## 10. Testing Considerations

### 10.1 Unit Tests Needed

- `ChannelService` - CRUD operations
- `ChannelContextService` - Context extraction
- Channel access validation
- Channel product pricing logic
- Channel vendor associations

### 10.2 Integration Tests Needed

- Order creation with channel
- Channel inventory sync
- Multi-channel vendor dashboards
- Channel-specific product visibility
- Authorization per channel

### 10.3 E2E Tests Needed

- Create order on channel → Verify channel scope
- Switch channels → Verify product/inventory differences
- Remove vendor from channel → Verify order history preserved
- Delete channel → Verify data integrity

---

## 11. Breaking Changes & Deprecations

### 11.1 Breaking Changes

1. **Order Creation** - `channelId` becomes required
2. **Product Pricing** - Need to decide: use basePrice or channel price
3. **Analytics** - Previous vendor-only breakdown now includes channel dimension



---

## 12. Implementation Priority & Checklist

### Phase 1: Core Infrastructure
- [ ] Create Channel, ChannelProduct, ChannelVendor entities
- [ ] Create EF migrations
- [ ] Create IChannelService interface & implementation
- [ ] Create DTOs
- [ ] Create ChannelsController

### Phase 2: Integration
- [ ] Add ChannelId to Order & OrderItem
- [ ] Add BasePrice to Product
- [ ] Update ProductsController
- [ ] Update OrdersController
- [ ] Create data migration for existing orders

### Phase 3: Authorization & Context
- [ ] Implement IChannelContextService
- [ ] Add ChannelContext middleware
- [ ] Add authorization policies
- [ ] Secure all channel-related endpoints

### Phase 4: Analytics & Reporting
- [ ] Update AnalyticsController for channel breakdown
- [ ] Add vendor-channel reporting
- [ ] Add channel performance metrics

### Phase 5: Testing & Documentation
- [ ] Unit tests for services
- [ ] Integration tests
- [ ] E2E tests
- [ ] API documentation update

---

## 13. Potential Issues & Mitigations

| Issue | Impact | Mitigation |
|-------|--------|-----------|
| Existing orders have no channel | High | Create default "Direct Web" channel, backfill all orders |
| Multiple channels with same product | Medium | Use ChannelProduct table for overrides (price, description) |
| Vendor deletion cascades issues | High | Soft delete or prevent deletion if active on channels |
| Channel-specific inventory | High | Design inventory system to support channel stock levels |
| Third-party sync complexity | Medium | ExternalId fields allow mapping to 3rd party systems |
| Performance with channel filtering | High | Add indexes on ChannelId, ChannelVendor, ChannelProduct |

---

## 14. Additional Considerations

### 14.1 Inventory Management
- Should each channel have separate stock levels?
- Should orders on different channels affect the same inventory?
- Need to design inventory sync strategy

### 14.2 Pricing Strategy
- Base price vs channel-specific price
- Should variants also support channel pricing?
- Recommend: BasePrice on Product, optional override in ChannelProduct

### 14.3 Synchronization
- How to sync orders from external channels (Shopify, Amazon)?
- Use ExternalOrderId and ExternalProductId for mapping
- Consider webhook handlers for channel updates

### 14.4 Reporting & Analytics
- Need channel-level dashboards
- Vendor should only see their products/orders on channels they're active on
- Admin sees everything

---

## 15. Tax Calculation Logic & Implementation Guide

### 15.1 Tax Calculation Algorithm

When creating an order, the system should:

1. **Determine applicable tax rule** for the channel based on:
   - Channel's country/region code
   - Order type (B2B vs B2C - determined from customer data)
   - Product category (if applicable)
   - Order amount threshold (minimum order amount)
   - Tax rule active dates (StartDate/EndDate)

2. **Calculate tax amount**:
   ```
   if TaxBehavior == "exclusive":
       TaxAmount = SubtotalAmount * TaxRate
       TotalAmount = SubtotalAmount + TaxAmount + ShippingAmount
   else if TaxBehavior == "inclusive":
       // Price already includes tax - no additional calculation
       TaxAmount = 0  // or calculate backward if needed for display
       TotalAmount = SubtotalAmount + ShippingAmount
   ```

3. **Store tax information** in Order for audit/compliance:
   - Applied tax rule name
   - Applied tax rate
   - Tax behavior (inclusive/exclusive)
   - All line item prices

### 15.2 Tax Rule Priority (if multiple rules match)

When multiple tax rules could apply:
1. **Most specific first** (category-specific rules before general)
2. **Most recent** (by StartDate)
3. **Highest tax rate** (if equally specific)
4. **Active status** (IsActive = true only)

### 15.3 Example Tax Scenarios

#### Scenario 1: US B2C Order (7% Sales Tax - Exclusive)
```
Channel: Direct Web (US, USD)
Customer: B2C
Subtotal: $100
Applicable Tax Rule: "US Sales Tax" (7%, exclusive)

Calculation:
TaxAmount = $100 * 0.07 = $7
ShippingAmount = $10
TotalAmount = $100 + $7 + $10 = $117
```

#### Scenario 2: Germany B2C Order (19% VAT - Inclusive)
```
Channel: Amazon EU (DE, EUR)
Customer: B2C
Subtotal: €100 (already includes 19% VAT)
Applicable Tax Rule: "Germany VAT" (19%, inclusive)

Calculation:
TaxAmount = 0  (price already includes tax)
ShippingAmount = €5
TotalAmount = €100 + €5 = €105

// If need to show tax breakdown for display:
DisplayTaxAmount = €100 * (0.19 / 1.19) = €16.03
DisplayTaxableAmount = €100 - €16.03 = €83.97
```

#### Scenario 3: B2B Order (No Tax)
```
Channel: Direct Web (US, USD)
Customer: B2B
Subtotal: $1,000
Applicable Tax Rule: "B2B Exempt" (0%, exclusive)

Calculation:
TaxAmount = $1,000 * 0 = $0
ShippingAmount = $25
TotalAmount = $1,000 + $0 + $25 = $1,025
```

### 15.4 Service Implementation Pseudocode

```csharp
public async Task<(decimal taxAmount, decimal taxRate, string? ruleName)> CalculateTaxAsync(
    Guid channelId,
    decimal orderAmount,
    Guid? categoryId = null,
    bool isB2B = false)
{
    // 1. Get channel info
    var channel = await _dbContext.Channels.FindAsync(channelId);

    // 2. Get all active tax rules for this channel
    var applicableTaxRules = await _dbContext.ChannelTaxRules
        .Where(r => r.ChannelId == channelId && r.IsActive)
        .Where(r => r.StartDate == null || r.StartDate <= DateTime.UtcNow)
        .Where(r => r.EndDate == null || r.EndDate >= DateTime.UtcNow)
        .Where(r => (isB2B && r.ApplyToB2B) || (!isB2B && r.ApplyToB2C))
        .Where(r => r.MinimumOrderAmount == null || orderAmount >= r.MinimumOrderAmount)
        .ToListAsync();

    // 3. Find most specific rule
    ChannelTaxRule? selectedRule = null;

    // Check category-specific rules first
    if (categoryId.HasValue)
    {
        selectedRule = applicableTaxRules
            .Where(r => r.CategoryId == categoryId)
            .OrderByDescending(r => r.StartDate)
            .FirstOrDefault();
    }

    // Fall back to general rules
    if (selectedRule == null)
    {
        selectedRule = applicableTaxRules
            .Where(r => r.CategoryId == null)
            .OrderByDescending(r => r.StartDate)
            .FirstOrDefault();
    }

    // 4. Return default channel tax if no rule found
    if (selectedRule == null)
    {
        return (
            taxAmount: orderAmount * channel.DefaultTaxRate,
            taxRate: channel.DefaultTaxRate,
            ruleName: null
        );
    }

    // 5. Calculate tax based on rule
    decimal taxAmount;
    if (selectedRule.TaxBehavior == "exclusive")
    {
        taxAmount = orderAmount * selectedRule.TaxRate;
    }
    else
    {
        // Inclusive - show 0 or calculate backward
        taxAmount = 0;
    }

    return (taxAmount, selectedRule.TaxRate, selectedRule.Name);
}
```

### 15.5 Compliance Considerations

- **Store all tax calculations** in Order for audit trail
- **Keep tax rules versioned** - never delete, mark inactive
- **Log tax calculations** for compliance reporting
- **Document tax jurisdiction** (country/region) for each order
- **Support tax audits** with complete tax breakdown per order item
- **Handle tax exemptions** gracefully (B2B, tax-exempt customers)
- **Currency compliance** - ensure correct currency per channel

### 15.6 Common Tax Rules Configuration

| Region | Tax Type | Standard Rate | Reduced Rate | B2B | Behavior |
|--------|----------|---------------|--------------|-----|----------|
| US | Sales Tax | 6-10% | varies | exempt | exclusive |
| Canada | HST/GST | 5-15% | varies | partial | exclusive |
| EU | VAT | 15-27% | 5-12% | exempt | inclusive |
| UK | VAT | 20% | 0-5% | exempt | inclusive |
| Australia | GST | 10% | 0% | conditional | inclusive |
| Japan | Consumption Tax | 10% | 8% | exempt | exclusive |

---

