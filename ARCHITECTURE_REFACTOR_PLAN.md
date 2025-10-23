# E-Commerce Backend Architecture Refactor Plan

## Vision
Transform the system from a **B2C customer self-service platform** to a **B2B store owner management system** where:
- Store owners/admins manage customers and orders
- Customers are independent entities (not linked to User authentication)
- Customers can come from multiple sources: website orders, manual admin entry, or other channels
- One admin can manage multiple customers

---

## Current Architecture Problems

```
❌ User (authenticated via Clerk) → Must have ONE Customer profile
❌ Customers treated like end-users, not independent entities
❌ No support for anonymous customers from websites
❌ No ability for admins to create multiple customers
❌ Orders linked to User indirectly through Customer
```

---

## Desired Architecture

```
✓ User (authenticated via Clerk) = Store Owner/Admin with a Role
✓ Customer = Independent entity (from website, manually created, or other channels)
✓ One User can manage MANY Customers
✓ Customers are NOT users - they're records in the system
✓ Orders belong to Customers, not Users
✓ Multiple order sources supported (anonymous website, manual admin entry, other channels)
```

---

## Changes Required

### 1. Update Customer Model

**Current:**
```csharp
public class Customer
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }      // ← One-to-one link to User
    public string FullName { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }

    public User? User { get; set; }
    public ICollection<Address> Addresses { get; set; }
    public ICollection<Order> Orders { get; set; }
}
```

**New:**
```csharp
public class Customer
{
    public Guid Id { get; set; }

    // ← OPTIONAL: Who created this customer (admin/owner)
    public Guid? CreatedByUserId { get; set; }
    public User? CreatedByUser { get; set; }

    // Core customer data (independent from User table)
    public string FullName { get; set; }
    public string? Email { get; set; }              // ← NEW: For identification
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }

    // Metadata
    public bool IsFromWebsite { get; set; }        // ← NEW: Track order source
    public DateTime CreatedAt { get; set; }        // ← NEW: Track creation time

    // Relations
    public ICollection<Address> Addresses { get; set; }
    public ICollection<Order> Orders { get; set; }
}
```

**Rationale:**
- Remove `UserId` required foreign key (make it optional `CreatedByUserId`)
- Add `Email` for customer identification and contact
- Add `IsFromWebsite` to distinguish customer sources
- Add `CreatedAt` for audit tracking
- Customer no longer tied to User authentication

---

### 2. Update User Model

**Current:**
```csharp
public class User
{
    public Guid Id { get; set; }
    public string ClerkId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }

    public Customer? Customer { get; set; }        // ← Remove this
}
```

**New:**
```csharp
public class User
{
    public Guid Id { get; set; }
    public string ClerkId { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }

    // ← NEW: Customers created by this admin
    public ICollection<Customer> CreatedCustomers { get; set; }
}
```

**Rationale:**
- Remove `Customer` one-to-one navigation
- Add `CreatedCustomers` to track customers created by this admin
- User is now purely an authentication/authorization entity

---

### 3. Update Database Relationships (AppDbContext.cs)

**Current:**
```csharp
// User -> Customer (one-to-one, optional)
modelBuilder.Entity<User>()
    .HasOne(u => u.Customer)
    .WithOne(c => c.User)
    .HasForeignKey<Customer>(c => c.UserId)
    .OnDelete(DeleteBehavior.SetNull);
```

**New:**
```csharp
// User -> Customer (one-to-many for CreatedBy relationship)
modelBuilder.Entity<User>()
    .HasMany(u => u.CreatedCustomers)
    .WithOne(c => c.CreatedByUser)
    .HasForeignKey(c => c.CreatedByUserId)
    .OnDelete(DeleteBehavior.SetNull);
```

**Rationale:**
- Change from one-to-one to one-to-many
- Allow multiple customers per admin
- Use SetNull so deleting an admin doesn't delete customers

---

## Implementation Phases

### Phase 1: Database Migration

**Files to Create:**
- New EF Core migration to:
  - Remove `UserId` as required field from Customer
  - Add `CreatedByUserId` (nullable GUID)
  - Add `Email` (string, nullable)
  - Add `IsFromWebsite` (bool, default false)
  - Add `CreatedAt` (DateTime)
  - Remove one-to-one constraint between User and Customer
  - Add one-to-many relationship via CreatedByUserId

**Migration Steps:**
1. Add new columns to Customer table
2. Create foreign key index on CreatedByUserId
3. Migrate existing data (set CreatedByUserId to null for seed data)
4. Remove old UserId foreign key constraint
5. Update model configuration in AppDbContext

---

### Phase 2: Update Service Layer

**File: CustomerService.cs**

**Methods to Delete:**
- `GetCustomerByUserIdAsync()` - No longer relevant

**Methods to Update:**
- `CreateCustomerAsync()` - Remove duplicate check, add `createdByUserId` parameter
- `CreateOrGetCustomerAsync()` - Add email-based lookup

**Methods to Add:**
- `GetCustomerByEmailAsync(string email)` - Find existing customer from storefront
- `GetCustomersByAdminAsync(Guid adminUserId)` - List all customers for an admin
- `GetAllCustomersAsync()` - For admin dashboard

**Service Implementation Details:**

```csharp
// Get customer by email (for storefront orders)
public async Task<Customer?> GetCustomerByEmailAsync(string email)
{
    return await _context.Customers
        .Include(c => c.User)
        .Include(c => c.Addresses)
        .FirstOrDefaultAsync(c => c.Email == email);
}

// Create customer - allow duplicates, track creator
public async Task<Customer> CreateCustomerAsync(
    CreateCustomerDto createDto,
    Guid? createdByUserId = null)
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
        createdByUserId ?? new Guid("00000000-0000-0000-0000-000000000000"),
        customer.IsFromWebsite
    );

    return customer;
}

// Get customers created by specific admin
public async Task<List<Customer>> GetCustomersByAdminAsync(Guid adminUserId)
{
    return await _context.Customers
        .Where(c => c.CreatedByUserId == adminUserId)
        .Include(c => c.Addresses)
        .Include(c => c.Orders)
        .ToListAsync();
}

// Get all website customers (no admin creator)
public async Task<List<Customer>> GetWebsiteCustomersAsync()
{
    return await _context.Customers
        .Where(c => c.IsFromWebsite)
        .Include(c => c.Addresses)
        .Include(c => c.Orders)
        .ToListAsync();
}
```

---

### Phase 3: Update DTOs

**UpdateCustomerDto.cs - Add email:**
```csharp
public class UpdateCustomerDto
{
    public string FullName { get; set; }
    public string? Email { get; set; }          // ← NEW
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
}
```

**CustomerDto.cs - Add metadata:**
```csharp
public class CustomerDto
{
    public string Id { get; set; }
    public string? CreatedByUserId { get; set; }
    public string FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? DateOfBirth { get; set; }
    public bool IsFromWebsite { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByUserName { get; set; }   // For display
}
```

**New DTO for storefront:**
```csharp
public class CreateOrderFromWebsiteDto
{
    public string FullName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public string AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
    public string? PostalCode { get; set; }

    public List<OrderItemInput> Items { get; set; }
}
```

---

### Phase 4: Update Controllers

**CustomersController.cs**

**Changes:**
- Add authorization attributes to admin-only endpoints
- Remove `GetCustomerByUserId()` endpoint
- Add new endpoints for admin operations
- Keep `GetAllCustomers()` but restrict to authorized users

**New Endpoints:**

```csharp
// ✓ AUTHORIZED: Create customer (admin only)
[Authorize(Roles = "admin")]
[HttpPost]
public async Task<ActionResult<CustomerDto>> CreateCustomer(
    [FromBody] CreateCustomerDto createDto)
{
    var adminUserId = Guid.Parse(User.FindFirst("sub")?.Value);
    var customer = await _customerService.CreateCustomerAsync(createDto, adminUserId);
    return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, MapToDto(customer));
}

// ✓ AUTHORIZED: Get all customers (admin only)
[Authorize(Roles = "admin")]
[HttpGet]
public async Task<ActionResult<List<CustomerDto>>> GetAllCustomers()
{
    var adminUserId = Guid.Parse(User.FindFirst("sub")?.Value);
    var customers = await _customerService.GetCustomersByAdminAsync(adminUserId);
    return Ok(customers.Select(MapToDto).ToList());
}

// ✓ AUTHORIZED: Get specific customer (admin only)
[Authorize(Roles = "admin")]
[HttpGet("{id}")]
public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
{
    var customer = await _customerService.GetCustomerByIdAsync(id);
    if (customer == null)
        return NotFound();

    // TODO: Add authorization check - can this admin access this customer?
    return Ok(MapToDto(customer));
}

// ✓ AUTHORIZED: Update customer (admin only)
[Authorize(Roles = "admin")]
[HttpPut("{id}")]
public async Task<ActionResult<CustomerDto>> UpdateCustomer(
    Guid id,
    [FromBody] UpdateCustomerDto updateDto)
{
    var customer = await _customerService.UpdateCustomerAsync(id, updateDto);
    return Ok(MapToDto(customer));
}

// ✗ ANONYMOUS: Create order from storefront
[AllowAnonymous]
[HttpPost("from-website/create-order")]
public async Task<ActionResult<OrderDto>> CreateOrderFromWebsite(
    [FromBody] CreateOrderFromWebsiteDto createOrderDto)
{
    // Find or create customer
    var customer = await _customerService.GetCustomerByEmailAsync(createOrderDto.Email);

    if (customer == null)
    {
        customer = await _customerService.CreateCustomerAsync(
            new CreateCustomerDto
            {
                FullName = createOrderDto.FullName,
                Email = createOrderDto.Email,
                Phone = createOrderDto.Phone
            },
            createdByUserId: null  // Indicates from website
        );
    }

    // Create address and order...
    // (Order creation logic)

    return Created($"/api/orders/{orderId}", MapToDto(order));
}
```

---

### Phase 5: Update Frontend (Optional for now)

**Changes needed in order creation page:**
- If admin is logged in: Show list of customers (only theirs)
- If creating customer: Show it's admin-created, not from website
- Remove requirement to link to User

---

## Migration Path (for existing data)

**For existing customers in database:**

1. Set `CreatedByUserId = NULL` for all existing customers
2. Set `IsFromWebsite = false` for existing customers (they were admin-created before)
3. Backfill `Email` from User table if relationship exists
4. Set `CreatedAt = NOW()` for all existing customers

**SQL Migration Example:**
```sql
-- Add new columns
ALTER TABLE "Customers" ADD COLUMN "CreatedByUserId" UUID NULL;
ALTER TABLE "Customers" ADD COLUMN "Email" VARCHAR(255) NULL;
ALTER TABLE "Customers" ADD COLUMN "IsFromWebsite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Customers" ADD COLUMN "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW();

-- For existing data: backfill from User table
UPDATE "Customers" c
SET "Email" = u."Email"
FROM "Users" u
WHERE c."UserId" = u."Id" AND c."Email" IS NULL;

-- Drop old one-to-one relationship
ALTER TABLE "Customers" DROP CONSTRAINT "FK_Customers_Users_UserId";
ALTER TABLE "Customers" DROP COLUMN "UserId";

-- Add new foreign key for CreatedBy
ALTER TABLE "Customers"
ADD CONSTRAINT "FK_Customers_Users_CreatedByUserId"
FOREIGN KEY ("CreatedByUserId") REFERENCES "Users"("Id")
ON DELETE SET NULL;
```

---

## Benefits of This Architecture

| Benefit | Impact |
|---------|--------|
| **Multiple customers per admin** | Admins can manage 100+ customers |
| **Anonymous orders** | Website can accept orders without auth |
| **Source tracking** | Know which orders came from website vs manual entry |
| **Scalable** | Easy to add more order sources (API, integrations, etc) |
| **Flexible customer creation** | Admin entry, website forms, imports, APIs |
| **Clear separation of concerns** | User = authentication, Customer = order entity |
| **Audit trail** | Track who created each customer and when |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Data migration loss** | Export existing data, test migration on copy first |
| **Customer duplication** | Add unique constraint on (Email, IsFromWebsite) if needed |
| **Orders orphaned if admin deleted** | Use ON DELETE SET NULL, allow orphaned customers |
| **Frontend assumes one customer per user** | Update order creation page to use new endpoint |

---

## Timeline Estimate

- **Phase 1 (Database):** 1-2 hours
- **Phase 2 (Services):** 1-2 hours
- **Phase 3 (DTOs):** 30 minutes
- **Phase 4 (Controllers):** 1-2 hours
- **Phase 5 (Frontend):** 2-3 hours
- **Testing & Bug Fixes:** 2-3 hours

**Total: 8-13 hours of work**

---

## Next Steps

1. ✅ Review and approve this plan
2. Create EF Core migration
3. Update Customer and User models
4. Update database configuration
5. Update CustomerService
6. Update DTOs
7. Update CustomersController
8. Test migration and endpoints
9. Update frontend order creation page
10. Deploy and monitor

---

## Questions to Resolve

- [ ] Should admins only see customers they created, or all customers?
- [ ] Should there be a "default admin" who can see all customers?
- [ ] Do you want role-based access control beyond just "admin"?
- [ ] Should customers be soft-deleted or hard-deleted?
- [ ] Do you need customer groups/segments?
- [ ] Should there be a customer approval workflow?

