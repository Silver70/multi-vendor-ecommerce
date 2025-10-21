// using EcommerceApi.Models;
// using Microsoft.EntityFrameworkCore;

// namespace EcommerceApi.Data
// {
//     public static class DatabaseSeeder
//     {
//         private static readonly Guid TestUserId = Guid.Parse("0199e3ab-532e-7fb8-8d7b-fafe934975ed");

//         public static void SeedDatabase(AppDbContext context)
//         {
//             // Check if database already has data
//             if (context.Categories.Any())
//             {
//                 Console.WriteLine("Database already contains data. Skipping seeding.");
//                 return;
//             }

//             Console.WriteLine("Starting database seeding...");

//             // Seed Categories
//             SeedCategories(context);
//             context.SaveChanges();

//             // Seed Vendors
//             SeedVendors(context);
//             context.SaveChanges();

//             // Seed Products with Variants
//             SeedProducts(context);
//             context.SaveChanges();

//             // Seed Addresses
//             SeedAddresses(context);
//             context.SaveChanges();

//             // Seed Orders with Items and Payments
//             SeedOrders(context);
//             context.SaveChanges();

//             // Seed Reviews
//             SeedReviews(context);
//             context.SaveChanges();

//             Console.WriteLine("Database seeding completed successfully!");
//         }

//         public static async Task SeedDatabaseAsync(AppDbContext context)
//         {
//             // Check if database already has data
//             if (await context.Categories.AnyAsync())
//             {
//                 Console.WriteLine("Database already contains data. Skipping seeding.");
//                 return;
//             }

//             Console.WriteLine("Starting async database seeding...");

//             // Seed Categories
//             SeedCategories(context);
//             await context.SaveChangesAsync();

//             // Seed Vendors
//             SeedVendors(context);
//             await context.SaveChangesAsync();

//             // Seed Products with Variants
//             SeedProducts(context);
//             await context.SaveChangesAsync();

//             // Seed Addresses
//             SeedAddresses(context);
//             await context.SaveChangesAsync();

//             // Seed Orders with Items and Payments
//             SeedOrders(context);
//             await context.SaveChangesAsync();

//             // Seed Reviews
//             SeedReviews(context);
//             await context.SaveChangesAsync();

//             Console.WriteLine("Async database seeding completed successfully!");
//         }

//         private static void SeedCategories(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Categories...");

//             var categories = new List<Category>
//             {
//                 new Category { Id = Guid.NewGuid(), Name = "Electronics", Slug = "electronics" },
//                 new Category { Id = Guid.NewGuid(), Name = "Clothing", Slug = "clothing" },
//                 new Category { Id = Guid.NewGuid(), Name = "Home & Garden", Slug = "home-garden" },
//                 new Category { Id = Guid.NewGuid(), Name = "Sports & Outdoors", Slug = "sports-outdoors" },
//                 new Category { Id = Guid.NewGuid(), Name = "Books", Slug = "books" },
//                 new Category { Id = Guid.NewGuid(), Name = "Toys & Games", Slug = "toys-games" },
//                 new Category { Id = Guid.NewGuid(), Name = "Beauty & Personal Care", Slug = "beauty-personal-care" },
//                 new Category { Id = Guid.NewGuid(), Name = "Automotive", Slug = "automotive" },
//                 new Category { Id = Guid.NewGuid(), Name = "Food & Beverages", Slug = "food-beverages" },
//                 new Category { Id = Guid.NewGuid(), Name = "Health & Wellness", Slug = "health-wellness" }
//             };

//             context.Categories.AddRange(categories);
//             Console.WriteLine($"Added {categories.Count} categories.");
//         }

//         private static void SeedVendors(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Vendors...");

//             var vendors = new List<Vendor>
//             {
//                 new Vendor { Id = Guid.NewGuid(), Name = "TechWorld Electronics", ContactEmail = "contact@techworld.com", Website = "https://techworld.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "Fashion Hub", ContactEmail = "info@fashionhub.com", Website = "https://fashionhub.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "HomeStyle Living", ContactEmail = "sales@homestyle.com", Website = "https://homestyle.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "Active Sports Co", ContactEmail = "support@activesports.com", Website = "https://activesports.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "BookWorm Publishers", ContactEmail = "hello@bookworm.com", Website = "https://bookworm.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "PlayTime Toys", ContactEmail = "service@playtime.com", Website = "https://playtime.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "GlowBeauty", ContactEmail = "care@glowbeauty.com", Website = "https://glowbeauty.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "AutoParts Pro", ContactEmail = "parts@autopartspro.com", Website = "https://autopartspro.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "Organic Market", ContactEmail = "contact@organicmarket.com", Website = "https://organicmarket.com" },
//                 new Vendor { Id = Guid.NewGuid(), Name = "Wellness Express", ContactEmail = "info@wellnessexpress.com", Website = "https://wellnessexpress.com" }
//             };

//             context.Vendors.AddRange(vendors);
//             Console.WriteLine($"Added {vendors.Count} vendors.");
//         }

//         private static void SeedProducts(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Products with Variants...");

//             var categories = context.Categories.ToList();
//             var vendors = context.Vendors.ToList();

//             var products = new List<Product>();
//             var variants = new List<ProductVariant>();

//             // Electronics Products
//             var laptop = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Professional Laptop Pro 15",
//                 Description = "High-performance laptop with 16GB RAM, 512GB SSD, and powerful processor for professionals and gamers.",
//                 CategoryId = categories.First(c => c.Name == "Electronics").Id,
//                 VendorId = vendors.First(v => v.Name == "TechWorld Electronics").Id,
//                 IsActive = true
//             };
//             products.Add(laptop);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = laptop.Id, Sku = "LAPTOP-15-SILVER", Price = 1299.99m, Stock = 25, Attributes = "{\"color\":\"Silver\",\"ram\":\"16GB\",\"storage\":\"512GB\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = laptop.Id, Sku = "LAPTOP-15-BLACK", Price = 1299.99m, Stock = 30, Attributes = "{\"color\":\"Black\",\"ram\":\"16GB\",\"storage\":\"512GB\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = laptop.Id, Sku = "LAPTOP-15-SILVER-1TB", Price = 1499.99m, Stock = 15, Attributes = "{\"color\":\"Silver\",\"ram\":\"16GB\",\"storage\":\"1TB\"}" }
//             });

//             var headphones = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Wireless Noise-Cancelling Headphones",
//                 Description = "Premium wireless headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.",
//                 CategoryId = categories.First(c => c.Name == "Electronics").Id,
//                 VendorId = vendors.First(v => v.Name == "TechWorld Electronics").Id,
//                 IsActive = true
//             };
//             products.Add(headphones);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = headphones.Id, Sku = "HP-WNC-BLACK", Price = 349.99m, Stock = 50, Attributes = "{\"color\":\"Black\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = headphones.Id, Sku = "HP-WNC-WHITE", Price = 349.99m, Stock = 40, Attributes = "{\"color\":\"White\"}" }
//             });

//             // Clothing Products
//             var jeans = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Classic Slim Fit Jeans",
//                 Description = "Comfortable and stylish slim-fit denim jeans, perfect for everyday wear. Made from premium cotton blend.",
//                 CategoryId = categories.First(c => c.Name == "Clothing").Id,
//                 VendorId = vendors.First(v => v.Name == "Fashion Hub").Id,
//                 IsActive = true
//             };
//             products.Add(jeans);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = jeans.Id, Sku = "JEANS-BLUE-32", Price = 79.99m, Stock = 60, Attributes = "{\"color\":\"Blue\",\"size\":\"32\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = jeans.Id, Sku = "JEANS-BLUE-34", Price = 79.99m, Stock = 55, Attributes = "{\"color\":\"Blue\",\"size\":\"34\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = jeans.Id, Sku = "JEANS-BLACK-32", Price = 79.99m, Stock = 45, Attributes = "{\"color\":\"Black\",\"size\":\"32\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = jeans.Id, Sku = "JEANS-BLACK-34", Price = 79.99m, Stock = 50, Attributes = "{\"color\":\"Black\",\"size\":\"34\"}" }
//             });

//             var tshirt = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Premium Cotton T-Shirt",
//                 Description = "Soft, breathable 100% organic cotton t-shirt available in multiple colors. Perfect for casual wear.",
//                 CategoryId = categories.First(c => c.Name == "Clothing").Id,
//                 VendorId = vendors.First(v => v.Name == "Fashion Hub").Id,
//                 IsActive = true
//             };
//             products.Add(tshirt);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = tshirt.Id, Sku = "TSHIRT-WHITE-M", Price = 29.99m, Stock = 100, Attributes = "{\"color\":\"White\",\"size\":\"M\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = tshirt.Id, Sku = "TSHIRT-WHITE-L", Price = 29.99m, Stock = 90, Attributes = "{\"color\":\"White\",\"size\":\"L\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = tshirt.Id, Sku = "TSHIRT-BLACK-M", Price = 29.99m, Stock = 85, Attributes = "{\"color\":\"Black\",\"size\":\"M\"}" }
//             });

//             // Home & Garden Products
//             var coffeemaker = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Programmable Coffee Maker",
//                 Description = "12-cup programmable coffee maker with auto-shutoff and brew strength control. Wake up to fresh coffee every morning.",
//                 CategoryId = categories.First(c => c.Name == "Home & Garden").Id,
//                 VendorId = vendors.First(v => v.Name == "HomeStyle Living").Id,
//                 IsActive = true
//             };
//             products.Add(coffeemaker);
//             variants.Add(new ProductVariant { Id = Guid.NewGuid(), ProductId = coffeemaker.Id, Sku = "CM-PROG-12CUP", Price = 89.99m, Stock = 35, Attributes = "{\"capacity\":\"12 cups\"}" });

//             var bedSheets = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Luxury Bamboo Bed Sheets Set",
//                 Description = "Ultra-soft bamboo bed sheets set including fitted sheet, flat sheet, and pillowcases. Hypoallergenic and breathable.",
//                 CategoryId = categories.First(c => c.Name == "Home & Garden").Id,
//                 VendorId = vendors.First(v => v.Name == "HomeStyle Living").Id,
//                 IsActive = true
//             };
//             products.Add(bedSheets);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = bedSheets.Id, Sku = "SHEETS-QUEEN-WHITE", Price = 119.99m, Stock = 40, Attributes = "{\"size\":\"Queen\",\"color\":\"White\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = bedSheets.Id, Sku = "SHEETS-KING-WHITE", Price = 139.99m, Stock = 30, Attributes = "{\"size\":\"King\",\"color\":\"White\"}" }
//             });

//             // Sports & Outdoors Products
//             var yogaMat = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Eco-Friendly Yoga Mat",
//                 Description = "Non-slip, eco-friendly yoga mat made from natural rubber. Includes carrying strap. Perfect for yoga, pilates, and fitness.",
//                 CategoryId = categories.First(c => c.Name == "Sports & Outdoors").Id,
//                 VendorId = vendors.First(v => v.Name == "Active Sports Co").Id,
//                 IsActive = true
//             };
//             products.Add(yogaMat);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = yogaMat.Id, Sku = "YOGA-MAT-PURPLE", Price = 49.99m, Stock = 70, Attributes = "{\"color\":\"Purple\",\"thickness\":\"6mm\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = yogaMat.Id, Sku = "YOGA-MAT-BLUE", Price = 49.99m, Stock = 65, Attributes = "{\"color\":\"Blue\",\"thickness\":\"6mm\"}" }
//             });

//             var dumbells = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Adjustable Dumbbells Set",
//                 Description = "Space-saving adjustable dumbbells with quick-change weight system. Replaces 15 sets of weights.",
//                 CategoryId = categories.First(c => c.Name == "Sports & Outdoors").Id,
//                 VendorId = vendors.First(v => v.Name == "Active Sports Co").Id,
//                 IsActive = true
//             };
//             products.Add(dumbells);
//             variants.Add(new ProductVariant { Id = Guid.NewGuid(), ProductId = dumbells.Id, Sku = "DUMBELL-ADJ-50LB", Price = 299.99m, Stock = 20, Attributes = "{\"maxWeight\":\"50lbs\"}" });

//             // Books
//             var cookbook = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Modern Cooking Essentials",
//                 Description = "Complete guide to modern cooking techniques with 200+ recipes. Hardcover edition with beautiful photography.",
//                 CategoryId = categories.First(c => c.Name == "Books").Id,
//                 VendorId = vendors.First(v => v.Name == "BookWorm Publishers").Id,
//                 IsActive = true
//             };
//             products.Add(cookbook);
//             variants.AddRange(new[]
//             {
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = cookbook.Id, Sku = "BOOK-COOK-HC", Price = 34.99m, Stock = 80, Attributes = "{\"format\":\"Hardcover\"}" },
//                 new ProductVariant { Id = Guid.NewGuid(), ProductId = cookbook.Id, Sku = "BOOK-COOK-PB", Price = 24.99m, Stock = 100, Attributes = "{\"format\":\"Paperback\"}" }
//             });

//             // Toys & Games
//             var boardGame = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Strategic Empire Board Game",
//                 Description = "Award-winning strategy board game for 2-4 players. Build your empire and outwit your opponents. Ages 12+.",
//                 CategoryId = categories.First(c => c.Name == "Toys & Games").Id,
//                 VendorId = vendors.First(v => v.Name == "PlayTime Toys").Id,
//                 IsActive = true
//             };
//             products.Add(boardGame);
//             variants.Add(new ProductVariant { Id = Guid.NewGuid(), ProductId = boardGame.Id, Sku = "GAME-EMPIRE-STD", Price = 59.99m, Stock = 45, Attributes = "{\"players\":\"2-4\",\"ageRange\":\"12+\"}" });

//             // Beauty & Personal Care
//             var skincare = new Product
//             {
//                 Id = Guid.NewGuid(),
//                 Name = "Vitamin C Serum",
//                 Description = "Anti-aging vitamin C serum with hyaluronic acid. Brightens skin and reduces fine lines. Dermatologist tested.",
//                 CategoryId = categories.First(c => c.Name == "Beauty & Personal Care").Id,
//                 VendorId = vendors.First(v => v.Name == "GlowBeauty").Id,
//                 IsActive = true
//             };
//             products.Add(skincare);
//             variants.Add(new ProductVariant { Id = Guid.NewGuid(), ProductId = skincare.Id, Sku = "SERUM-VITC-30ML", Price = 39.99m, Stock = 90, Attributes = "{\"volume\":\"30ml\"}" });

//             context.Products.AddRange(products);
//             context.ProductVariants.AddRange(variants);
//             Console.WriteLine($"Added {products.Count} products with {variants.Count} variants.");
//         }

//         private static void SeedAddresses(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Addresses...");

//             var addresses = new List<Address>
//             {
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "123 Main Street",
//                     Line2 = "Apt 4B",
//                     City = "New York",
//                     PostalCode = "10001",
//                     Country = "United States",
//                     Phone = "+1-555-0123"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "456 Oak Avenue",
//                     City = "Los Angeles",
//                     PostalCode = "90001",
//                     Country = "United States",
//                     Phone = "+1-555-0124"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "Jane Doe",
//                     Line1 = "789 Pine Road",
//                     Line2 = "Suite 200",
//                     City = "Chicago",
//                     PostalCode = "60601",
//                     Country = "United States",
//                     Phone = "+1-555-0125"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "321 Elm Street",
//                     City = "Houston",
//                     PostalCode = "77001",
//                     Country = "United States",
//                     Phone = "+1-555-0126"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "654 Maple Drive",
//                     City = "Phoenix",
//                     PostalCode = "85001",
//                     Country = "United States",
//                     Phone = "+1-555-0127"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "Sarah Doe",
//                     Line1 = "987 Cedar Lane",
//                     Line2 = "Building C",
//                     City = "Philadelphia",
//                     PostalCode = "19101",
//                     Country = "United States",
//                     Phone = "+1-555-0128"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "147 Birch Boulevard",
//                     City = "San Antonio",
//                     PostalCode = "78201",
//                     Country = "United States",
//                     Phone = "+1-555-0129"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "Michael Doe",
//                     Line1 = "258 Willow Way",
//                     City = "San Diego",
//                     PostalCode = "92101",
//                     Country = "United States",
//                     Phone = "+1-555-0130"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "John Doe",
//                     Line1 = "369 Spruce Street",
//                     Line2 = "Floor 3",
//                     City = "Dallas",
//                     PostalCode = "75201",
//                     Country = "United States",
//                     Phone = "+1-555-0131"
//                 },
//                 new Address
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     FullName = "Emily Doe",
//                     Line1 = "741 Ash Avenue",
//                     City = "San Jose",
//                     PostalCode = "95101",
//                     Country = "United States",
//                     Phone = "+1-555-0132"
//                 }
//             };

//             context.Addresses.AddRange(addresses);
//             Console.WriteLine($"Added {addresses.Count} addresses.");
//         }

//         private static void SeedOrders(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Orders with Items and Payments...");

//             var addresses = context.Addresses.ToList();
//             var variants = context.ProductVariants.ToList();

//             var orders = new List<Order>();
//             var orderItems = new List<OrderItem>();
//             var payments = new List<Payment>();

//             // Order 1: Completed order with laptop and headphones
//             var order1 = new Order
//             {
//                 Id = Guid.NewGuid(),
//                 UserId = TestUserId,
//                 AddressId = addresses[0].Id,
//                 Status = "delivered",
//                 TotalAmount = 0, // Will calculate
//                 CreatedAt = DateTime.UtcNow.AddDays(-30)
//             };

//             var laptopVariant = variants.First(v => v.Sku == "LAPTOP-15-SILVER");
//             var headphonesVariant = variants.First(v => v.Sku == "HP-WNC-BLACK");

//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order1.Id, VariantId = laptopVariant.Id, Quantity = 1, Price = laptopVariant.Price });
//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order1.Id, VariantId = headphonesVariant.Id, Quantity = 1, Price = headphonesVariant.Price });
//             order1.TotalAmount = laptopVariant.Price + headphonesVariant.Price;

//             payments.Add(new Payment
//             {
//                 Id = Guid.NewGuid(),
//                 OrderId = order1.Id,
//                 Method = "card",
//                 Status = "completed",
//                 TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
//                 Amount = order1.TotalAmount,
//                 CreatedAt = order1.CreatedAt
//             });

//             orders.Add(order1);

//             // Order 2: Shipped order with clothing items
//             var order2 = new Order
//             {
//                 Id = Guid.NewGuid(),
//                 UserId = TestUserId,
//                 AddressId = addresses[1].Id,
//                 Status = "shipped",
//                 TotalAmount = 0,
//                 CreatedAt = DateTime.UtcNow.AddDays(-10)
//             };

//             var jeansVariant = variants.First(v => v.Sku == "JEANS-BLUE-32");
//             var tshirtVariant = variants.First(v => v.Sku == "TSHIRT-WHITE-M");

//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order2.Id, VariantId = jeansVariant.Id, Quantity = 2, Price = jeansVariant.Price });
//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order2.Id, VariantId = tshirtVariant.Id, Quantity = 3, Price = tshirtVariant.Price });
//             order2.TotalAmount = (jeansVariant.Price * 2) + (tshirtVariant.Price * 3);

//             payments.Add(new Payment
//             {
//                 Id = Guid.NewGuid(),
//                 OrderId = order2.Id,
//                 Method = "paypal",
//                 Status = "completed",
//                 TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
//                 Amount = order2.TotalAmount,
//                 CreatedAt = order2.CreatedAt
//             });

//             orders.Add(order2);

//             // Order 3: Paid order awaiting shipment
//             var order3 = new Order
//             {
//                 Id = Guid.NewGuid(),
//                 UserId = TestUserId,
//                 AddressId = addresses[2].Id,
//                 Status = "paid",
//                 TotalAmount = 0,
//                 CreatedAt = DateTime.UtcNow.AddDays(-5)
//             };

//             var yogaMatVariant = variants.First(v => v.Sku == "YOGA-MAT-PURPLE");
//             var dumbbellVariant = variants.First(v => v.Sku == "DUMBELL-ADJ-50LB");

//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order3.Id, VariantId = yogaMatVariant.Id, Quantity = 1, Price = yogaMatVariant.Price });
//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order3.Id, VariantId = dumbbellVariant.Id, Quantity = 1, Price = dumbbellVariant.Price });
//             order3.TotalAmount = yogaMatVariant.Price + dumbbellVariant.Price;

//             payments.Add(new Payment
//             {
//                 Id = Guid.NewGuid(),
//                 OrderId = order3.Id,
//                 Method = "card",
//                 Status = "completed",
//                 TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
//                 Amount = order3.TotalAmount,
//                 CreatedAt = order3.CreatedAt
//             });

//             orders.Add(order3);

//             // Order 4: Pending order
//             var order4 = new Order
//             {
//                 Id = Guid.NewGuid(),
//                 UserId = TestUserId,
//                 AddressId = addresses[3].Id,
//                 Status = "pending",
//                 TotalAmount = 0,
//                 CreatedAt = DateTime.UtcNow.AddDays(-2)
//             };

//             var coffeeMakerVariant = variants.First(v => v.Sku == "CM-PROG-12CUP");
//             var bedSheetsVariant = variants.First(v => v.Sku == "SHEETS-QUEEN-WHITE");

//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order4.Id, VariantId = coffeeMakerVariant.Id, Quantity = 1, Price = coffeeMakerVariant.Price });
//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order4.Id, VariantId = bedSheetsVariant.Id, Quantity = 1, Price = bedSheetsVariant.Price });
//             order4.TotalAmount = coffeeMakerVariant.Price + bedSheetsVariant.Price;

//             payments.Add(new Payment
//             {
//                 Id = Guid.NewGuid(),
//                 OrderId = order4.Id,
//                 Method = "card",
//                 Status = "pending",
//                 Amount = order4.TotalAmount,
//                 CreatedAt = order4.CreatedAt
//             });

//             orders.Add(order4);

//             // Order 5: Cancelled order
//             var order5 = new Order
//             {
//                 Id = Guid.NewGuid(),
//                 UserId = TestUserId,
//                 AddressId = addresses[4].Id,
//                 Status = "cancelled",
//                 TotalAmount = 0,
//                 CreatedAt = DateTime.UtcNow.AddDays(-15)
//             };

//             var cookbookVariant = variants.First(v => v.Sku == "BOOK-COOK-HC");

//             orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order5.Id, VariantId = cookbookVariant.Id, Quantity = 2, Price = cookbookVariant.Price });
//             order5.TotalAmount = cookbookVariant.Price * 2;

//             payments.Add(new Payment
//             {
//                 Id = Guid.NewGuid(),
//                 OrderId = order5.Id,
//                 Method = "card",
//                 Status = "refunded",
//                 TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
//                 Amount = order5.TotalAmount,
//                 CreatedAt = order5.CreatedAt
//             });

//             orders.Add(order5);

//             // Order 6-12: Additional orders with various products
//             for (int i = 6; i <= 12; i++)
//             {
//                 var order = new Order
//                 {
//                     Id = Guid.NewGuid(),
//                     UserId = TestUserId,
//                     AddressId = addresses[i % addresses.Count].Id,
//                     Status = i % 3 == 0 ? "delivered" : (i % 3 == 1 ? "shipped" : "paid"),
//                     TotalAmount = 0,
//                     CreatedAt = DateTime.UtcNow.AddDays(-i * 3)
//                 };

//                 // Add 1-3 random items to each order
//                 var randomVariants = variants.OrderBy(x => Guid.NewGuid()).Take(Random.Shared.Next(1, 4)).ToList();
//                 foreach (var variant in randomVariants)
//                 {
//                     var quantity = Random.Shared.Next(1, 3);
//                     orderItems.Add(new OrderItem
//                     {
//                         Id = Guid.NewGuid(),
//                         OrderId = order.Id,
//                         VariantId = variant.Id,
//                         Quantity = quantity,
//                         Price = variant.Price
//                     });
//                     order.TotalAmount += variant.Price * quantity;
//                 }

//                 payments.Add(new Payment
//                 {
//                     Id = Guid.NewGuid(),
//                     OrderId = order.Id,
//                     Method = i % 2 == 0 ? "card" : "paypal",
//                     Status = order.Status == "pending" ? "pending" : "completed",
//                     TransactionId = order.Status == "pending" ? null : "txn_" + Guid.NewGuid().ToString("N")[..16],
//                     Amount = order.TotalAmount,
//                     CreatedAt = order.CreatedAt
//                 });

//                 orders.Add(order);
//             }

//             context.Orders.AddRange(orders);
//             context.OrderItems.AddRange(orderItems);
//             context.Payments.AddRange(payments);

//             Console.WriteLine($"Added {orders.Count} orders with {orderItems.Count} order items and {payments.Count} payments.");
//         }

//         private static void SeedReviews(AppDbContext context)
//         {
//             Console.WriteLine("Seeding Reviews...");

//             var products = context.Products.ToList();
//             var reviews = new List<Review>();

//             var reviewComments = new Dictionary<int, string[]>
//             {
//                 { 5, new[] { "Absolutely fantastic! Exceeded all my expectations.", "Best purchase I've made this year!", "Outstanding quality and fast shipping.", "Highly recommend to everyone!", "Perfect in every way!" } },
//                 { 4, new[] { "Great product, very satisfied with the purchase.", "Good quality, would buy again.", "Exactly as described, very happy.", "Nice product, minor issues but overall good.", "Solid purchase, meets expectations." } },
//                 { 3, new[] { "It's okay, nothing special.", "Average product, does the job.", "Decent but could be better.", "Not bad, not great either.", "Satisfactory, as expected." } },
//                 { 2, new[] { "Disappointed with the quality.", "Not what I expected, below average.", "Had some issues, not very satisfied.", "Could be much better.", "Subpar quality for the price." } },
//                 { 1, new[] { "Terrible product, waste of money.", "Very disappointed, do not recommend.", "Poor quality, returned it.", "Not worth it at all.", "Complete waste of time and money." } }
//             };

//             // Add reviews for first 10 products
//             foreach (var product in products.Take(10))
//             {
//                 var numReviews = Random.Shared.Next(1, 4); // 1-3 reviews per product
//                 for (int i = 0; i < numReviews; i++)
//                 {
//                     var rating = Random.Shared.Next(3, 6); // Ratings between 3-5 (mostly positive)
//                     var commentOptions = reviewComments[rating];
//                     var comment = commentOptions[Random.Shared.Next(commentOptions.Length)];

//                     reviews.Add(new Review
//                     {
//                         Id = Guid.NewGuid(),
//                         UserId = TestUserId,
//                         ProductId = product.Id,
//                         Rating = rating,
//                         Comment = comment,
//                         CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60))
//                     });
//                 }
//             }

//             context.Reviews.AddRange(reviews);
//             Console.WriteLine($"Added {reviews.Count} reviews.");
//         }
//     }
// }
