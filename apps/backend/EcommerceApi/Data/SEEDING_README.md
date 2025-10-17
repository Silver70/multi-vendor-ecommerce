# Database Seeding Guide

This document explains how to use the database seeding functionality to populate your database with test data.

## Overview

The `DatabaseSeeder` class provides two methods for seeding the database:
- `SeedDatabase()` - Synchronous seeding
- `SeedDatabaseAsync()` - Asynchronous seeding (recommended)

## Configuration

Seeding is controlled by the `SeedDatabase` configuration value in `appsettings.Development.json`.

### To Enable Seeding

1. Open `appsettings.Development.json`
2. Set `"SeedDatabase": true`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "SeedDatabase": true
}
```

### To Disable Seeding

Set `"SeedDatabase": false` (default)

## What Gets Seeded

The seeder creates realistic test data for the following tables:

### 1. Categories (10 records)
- Electronics
- Clothing
- Home & Garden
- Sports & Outdoors
- Books
- Toys & Games
- Beauty & Personal Care
- Automotive
- Food & Beverages
- Health & Wellness

### 2. Vendors (10 records)
Realistic vendor companies with contact emails and websites:
- TechWorld Electronics
- Fashion Hub
- HomeStyle Living
- Active Sports Co
- And more...

### 3. Products (12 products)
Each with realistic names, descriptions, and multiple variants:
- Professional Laptop Pro 15 (3 variants)
- Wireless Noise-Cancelling Headphones (2 variants)
- Classic Slim Fit Jeans (4 variants)
- Premium Cotton T-Shirt (3 variants)
- And more...

### 4. Product Variants (30+ variants)
Each variant includes:
- Unique SKU
- Price
- Stock quantity
- Attributes (JSON format: color, size, etc.)

### 5. Addresses (10 records)
All associated with user ID: `0199e3ab-532e-7fb8-8d7b-fafe934975ed`
- Realistic US addresses across different cities
- Includes full name, phone, postal code

### 6. Orders (12 records)
Various order statuses:
- `delivered` - Completed orders
- `shipped` - In transit
- `paid` - Ready to ship
- `pending` - Awaiting payment
- `cancelled` - Cancelled orders

Each order includes:
- 1-3 product variants
- Associated address
- Calculated total amount
- Created at different dates (last 90 days)

### 7. Order Items (25+ records)
Links orders to product variants with:
- Quantity
- Price snapshot

### 8. Payments (12 records)
One payment per order with:
- Payment method (card/paypal)
- Status (pending/completed/refunded)
- Transaction ID
- Amount

### 9. Reviews (15+ records)
Product reviews with:
- Ratings (1-5 stars, mostly 3-5)
- Realistic comments
- User ID: `0199e3ab-532e-7fb8-8d7b-fafe934975ed`

## Important Notes

### User ID Requirement

**All seeded data uses the test user ID: `0199e3ab-532e-7fb8-8d7b-fafe934975ed`**

This user MUST exist in your database before seeding. Since users are managed by Clerk, ensure this user is registered through your authentication system first.

### Seeding Behavior

- **Idempotent**: The seeder checks if data exists before running. If any categories exist, it skips seeding.
- **Development Only**: Seeding only runs when `ASPNETCORE_ENVIRONMENT=Development`
- **Manual Control**: Must be explicitly enabled via configuration
- **No Images**: Image URLs are left null/empty as requested

### Data Relationships

All foreign key relationships are properly maintained:
- Products → Categories
- Products → Vendors (optional)
- ProductVariants → Products
- Addresses → User
- Orders → User + Address
- OrderItems → Orders + ProductVariants
- Payments → Orders
- Reviews → User + Products

## How to Use

### First-Time Setup

1. **Ensure test user exists**
   ```
   User ID: 0199e3ab-532e-7fb8-8d7b-fafe934975ed
   ```
   Register this user through Clerk first.

2. **Enable seeding**
   Set `"SeedDatabase": true` in `appsettings.Development.json`

3. **Run the application**
   ```bash
   dotnet run
   ```

4. **Check console output**
   You should see:
   ```
   Starting async database seeding...
   Seeding Categories...
   Added 10 categories.
   Seeding Vendors...
   Added 10 vendors.
   ...
   Async database seeding completed successfully!
   ```

5. **Disable seeding** (optional)
   Set `"SeedDatabase": false` to prevent re-seeding on next run

### Re-seeding

If you need to re-seed:

1. Clear existing data (or drop/recreate database)
2. Run migrations if needed
3. Enable seeding in configuration
4. Run the application

## Testing the Seeded Data

### Sample API Calls

Once seeded, you can test with:

```bash
# Get all products
GET /api/products

# Get product variants
GET /api/products/{productId}/variants

# Get user addresses
GET /api/addresses

# Get user orders
GET /api/orders

# Get product reviews
GET /api/products/{productId}/reviews
```

### Expected Data Counts

After seeding, you should have:
- 10 Categories
- 10 Vendors
- 12 Products
- 30+ Product Variants
- 10 Addresses
- 12 Orders
- 25+ Order Items
- 12 Payments
- 15+ Reviews

## Troubleshooting

### "Database already contains data"

This is normal! The seeder is designed to run only once. If you see this message and want to re-seed:
1. Clear your database
2. Run migrations
3. Try again

### Foreign Key Errors

Make sure the test user (`0199e3ab-532e-7fb8-8d7b-fafe934975ed`) exists in the Users table before seeding.

### Connection Issues

Verify your connection string in `appsettings.json` is correct and the database is accessible.

## Code Location

- **Seeder Class**: `/Data/DatabaseSeeder.cs`
- **Program Integration**: `/Program.cs` (lines 62-82)
- **Configuration**: `/appsettings.Development.json`

## Example Product Data

### Sample Product: Professional Laptop Pro 15

```json
{
  "id": "guid",
  "name": "Professional Laptop Pro 15",
  "description": "High-performance laptop with 16GB RAM...",
  "categoryId": "electronics-guid",
  "vendorId": "techworld-guid",
  "isActive": true,
  "variants": [
    {
      "sku": "LAPTOP-15-SILVER",
      "price": 1299.99,
      "stock": 25,
      "attributes": "{\"color\":\"Silver\",\"ram\":\"16GB\",\"storage\":\"512GB\"}"
    }
  ]
}
```

## Sample Order Flow

1. User browses products
2. Adds items to cart (ProductVariants)
3. Selects delivery Address
4. Creates Order with OrderItems
5. Makes Payment
6. Order status progresses: pending → paid → shipped → delivered
7. User can leave a Review

All of these steps are represented in the seeded data!
