using EcommerceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EcommerceApi.Data
{
    public static class DatabaseSeeder
    {
        // Existing user ID in the database
        private static readonly Guid ExistingUserId = Guid.Parse("019a0cf2-ed9d-7b64-b6b5-8b70f3f2c9da");
        private static readonly Guid TestCustomerId = Guid.Parse("019a0782-46b2-7003-9f92-f7cd06b6c4ee");

        public static async Task SeedDatabaseAsync(AppDbContext context)
        {
            // Check if database already has data
            if (await context.Categories.AnyAsync())
            {
                Console.WriteLine("Database already contains data. Skipping seeding.");
                return;
            }

            Console.WriteLine("Starting async database seeding...");

            // Seed Customer linked to existing user
            await SeedTestCustomerAsync(context);

            // Seed Categories
            await SeedCategoriesAsync(context);

            // Seed Vendors
            await SeedVendorsAsync(context);

            // Seed Global Attributes
            await SeedGlobalAttributesAsync(context);

            // Seed Products with Variants (using new normalized structure)
            await SeedProductsAsync(context);

            // Seed Addresses (now linked to Customer instead of User)
            await SeedAddressesAsync(context);

            // Seed Orders with Items and Payments (now linked to Customer)
            await SeedOrdersAsync(context);

            // Seed Reviews
            await SeedReviewsAsync(context);

            Console.WriteLine("Async database seeding completed successfully!");
        }

        private static async Task SeedTestCustomerAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Test Customer linked to existing user...");

            // Check if user exists
            var userExists = await context.Users.AnyAsync(u => u.Id == ExistingUserId);
            if (!userExists)
            {
                Console.WriteLine($"WARNING: User with ID {ExistingUserId} not found in database. Skipping customer seeding.");
                return;
            }

            // Check if customer already exists for this user
            var customerExists = await context.Customers.AnyAsync(c => c.UserId == ExistingUserId);
            if (customerExists)
            {
                Console.WriteLine($"Customer already exists for user {ExistingUserId}. Skipping customer creation.");
                return;
            }

            // Create test customer linked to the existing user
            var testCustomer = new Customer
            {
                Id = TestCustomerId,
                UserId = ExistingUserId,
                FullName = "John Doe",
                Phone = "+1-555-0100",
                DateOfBirth = new DateTime(1990, 5, 15, 0, 0, 0, DateTimeKind.Utc)
            };

            context.Customers.Add(testCustomer);
            await context.SaveChangesAsync();

            Console.WriteLine($"Added test customer linked to user {ExistingUserId}.");
        }

        private static async Task SeedCategoriesAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Categories...");

            var categories = new List<Category>
            {
                new Category { Id = Guid.NewGuid(), Name = "Electronics", Slug = "electronics" },
                new Category { Id = Guid.NewGuid(), Name = "Clothing", Slug = "clothing" },
                new Category { Id = Guid.NewGuid(), Name = "Home & Garden", Slug = "home-garden" },
                new Category { Id = Guid.NewGuid(), Name = "Sports & Outdoors", Slug = "sports-outdoors" },
                new Category { Id = Guid.NewGuid(), Name = "Books", Slug = "books" },
                new Category { Id = Guid.NewGuid(), Name = "Toys & Games", Slug = "toys-games" },
                new Category { Id = Guid.NewGuid(), Name = "Beauty & Personal Care", Slug = "beauty-personal-care" },
                new Category { Id = Guid.NewGuid(), Name = "Automotive", Slug = "automotive" },
                new Category { Id = Guid.NewGuid(), Name = "Food & Beverages", Slug = "food-beverages" },
                new Category { Id = Guid.NewGuid(), Name = "Health & Wellness", Slug = "health-wellness" }
            };

            context.Categories.AddRange(categories);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {categories.Count} categories.");
        }

        private static async Task SeedVendorsAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Vendors...");

            var vendors = new List<Vendor>
            {
                new Vendor { Id = Guid.NewGuid(), Name = "TechWorld Electronics", ContactEmail = "contact@techworld.com", Website = "https://techworld.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "Fashion Hub", ContactEmail = "info@fashionhub.com", Website = "https://fashionhub.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "HomeStyle Living", ContactEmail = "sales@homestyle.com", Website = "https://homestyle.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "Active Sports Co", ContactEmail = "support@activesports.com", Website = "https://activesports.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "BookWorm Publishers", ContactEmail = "hello@bookworm.com", Website = "https://bookworm.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "PlayTime Toys", ContactEmail = "service@playtime.com", Website = "https://playtime.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "GlowBeauty", ContactEmail = "care@glowbeauty.com", Website = "https://glowbeauty.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "AutoParts Pro", ContactEmail = "parts@autopartspro.com", Website = "https://autopartspro.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "Organic Market", ContactEmail = "contact@organicmarket.com", Website = "https://organicmarket.com" },
                new Vendor { Id = Guid.NewGuid(), Name = "Wellness Express", ContactEmail = "info@wellnessexpress.com", Website = "https://wellnessexpress.com" }
            };

            context.Vendors.AddRange(vendors);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {vendors.Count} vendors.");
        }

        private static async Task SeedGlobalAttributesAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Global Attributes...");

            var attributes = new List<ProductAttribute>();

            // Color attribute
            var colorAttr = new ProductAttribute
            {
                Id = Guid.NewGuid(),
                Name = "Color",
                Values = new List<ProductAttributeValue>
                {
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Black" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "White" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Silver" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Blue" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Red" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Purple" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Green" }
                }
            };
            attributes.Add(colorAttr);

            // Size attribute
            var sizeAttr = new ProductAttribute
            {
                Id = Guid.NewGuid(),
                Name = "Size",
                Values = new List<ProductAttributeValue>
                {
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "S" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "M" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "L" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "XL" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "32" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "34" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "36" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "Queen" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "King" }
                }
            };
            attributes.Add(sizeAttr);

            // Storage attribute
            var storageAttr = new ProductAttribute
            {
                Id = Guid.NewGuid(),
                Name = "Storage",
                Values = new List<ProductAttributeValue>
                {
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "256GB" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "512GB" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "1TB" }
                }
            };
            attributes.Add(storageAttr);

            // RAM attribute
            var ramAttr = new ProductAttribute
            {
                Id = Guid.NewGuid(),
                Name = "RAM",
                Values = new List<ProductAttributeValue>
                {
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "8GB" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "16GB" },
                    new ProductAttributeValue { Id = Guid.NewGuid(), Value = "32GB" }
                }
            };
            attributes.Add(ramAttr);

            context.ProductAttributes.AddRange(attributes);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {attributes.Count} global attributes.");
        }

        private static async Task SeedProductsAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Products with Variants using new schema...");

            var categories = await context.Categories.ToListAsync();
            var vendors = await context.Vendors.ToListAsync();

            // Helper method to get attribute value ID
            async Task<Guid> GetAttributeValueId(string attributeName, string value)
            {
                var attr = await context.ProductAttributes
                    .Include(a => a.Values)
                    .FirstOrDefaultAsync(a => a.Name == attributeName);

                if (attr == null)
                {
                    // Create custom attribute
                    attr = new ProductAttribute
                    {
                        Id = Guid.NewGuid(),
                        Name = attributeName,
                        Values = new List<ProductAttributeValue>()
                    };
                    context.ProductAttributes.Add(attr);
                    await context.SaveChangesAsync();
                }

                var attrValue = attr.Values.FirstOrDefault(v => v.Value == value);
                if (attrValue == null)
                {
                    attrValue = new ProductAttributeValue
                    {
                        Id = Guid.NewGuid(),
                        AttributeId = attr.Id,
                        Value = value
                    };
                    context.ProductAttributeValues.Add(attrValue);
                    await context.SaveChangesAsync();
                }

                return attrValue.Id;
            }

            var products = new List<Product>();
            var variants = new List<ProductVariant>();

            // Electronics Products
            var laptop = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Professional Laptop Pro 15",
                Slug = "professional-laptop-pro-15-techworld-electronics",
                Description = "High-performance laptop with 16GB RAM, 512GB SSD, and powerful processor for professionals and gamers.",
                CategoryId = categories.First(c => c.Name == "Electronics").Id,
                VendorId = vendors.First(v => v.Name == "TechWorld Electronics").Id,
                IsActive = true
            };
            products.Add(laptop);

            var laptopVariant1 = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = laptop.Id,
                Sku = "LAPTOP-15-SILVER-16GB-512GB",
                Price = 1299.99m,
                Stock = 25,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Silver") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("RAM", "16GB") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Storage", "512GB") }
                }
            };
            variants.Add(laptopVariant1);

            var laptopVariant2 = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = laptop.Id,
                Sku = "LAPTOP-15-BLACK-16GB-512GB",
                Price = 1299.99m,
                Stock = 30,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Black") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("RAM", "16GB") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Storage", "512GB") }
                }
            };
            variants.Add(laptopVariant2);

            var laptopVariant3 = new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = laptop.Id,
                Sku = "LAPTOP-15-SILVER-16GB-1TB",
                Price = 1499.99m,
                Stock = 15,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Silver") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("RAM", "16GB") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Storage", "1TB") }
                }
            };
            variants.Add(laptopVariant3);

            var headphones = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Wireless Noise-Cancelling Headphones",
                Slug = "wireless-noise-cancelling-headphones-techworld-electronics",
                Description = "Premium wireless headphones with active noise cancellation, 30-hour battery life, and studio-quality sound.",
                CategoryId = categories.First(c => c.Name == "Electronics").Id,
                VendorId = vendors.First(v => v.Name == "TechWorld Electronics").Id,
                IsActive = true
            };
            products.Add(headphones);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = headphones.Id,
                Sku = "HP-WNC-BLACK",
                Price = 349.99m,
                Stock = 50,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Black") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = headphones.Id,
                Sku = "HP-WNC-WHITE",
                Price = 349.99m,
                Stock = 40,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "White") }
                }
            });

            // Clothing Products
            var jeans = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Classic Slim Fit Jeans",
                Slug = "classic-slim-fit-jeans-fashion-hub",
                Description = "Comfortable and stylish slim-fit denim jeans, perfect for everyday wear. Made from premium cotton blend.",
                CategoryId = categories.First(c => c.Name == "Clothing").Id,
                VendorId = vendors.First(v => v.Name == "Fashion Hub").Id,
                IsActive = true
            };
            products.Add(jeans);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = jeans.Id,
                Sku = "JEANS-BLUE-32",
                Price = 79.99m,
                Stock = 60,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Blue") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "32") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = jeans.Id,
                Sku = "JEANS-BLUE-34",
                Price = 79.99m,
                Stock = 55,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Blue") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "34") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = jeans.Id,
                Sku = "JEANS-BLACK-32",
                Price = 79.99m,
                Stock = 45,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Black") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "32") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = jeans.Id,
                Sku = "JEANS-BLACK-34",
                Price = 79.99m,
                Stock = 50,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Black") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "34") }
                }
            });

            var tshirt = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Premium Cotton T-Shirt",
                Slug = "premium-cotton-t-shirt-fashion-hub",
                Description = "Soft, breathable 100% organic cotton t-shirt available in multiple colors. Perfect for casual wear.",
                CategoryId = categories.First(c => c.Name == "Clothing").Id,
                VendorId = vendors.First(v => v.Name == "Fashion Hub").Id,
                IsActive = true
            };
            products.Add(tshirt);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = tshirt.Id,
                Sku = "TSHIRT-WHITE-M",
                Price = 29.99m,
                Stock = 100,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "White") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "M") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = tshirt.Id,
                Sku = "TSHIRT-WHITE-L",
                Price = 29.99m,
                Stock = 90,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "White") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "L") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = tshirt.Id,
                Sku = "TSHIRT-BLACK-M",
                Price = 29.99m,
                Stock = 85,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Black") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "M") }
                }
            });

            // Home & Garden Products
            var coffeemaker = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Programmable Coffee Maker",
                Slug = "programmable-coffee-maker-homestyle-living",
                Description = "12-cup programmable coffee maker with auto-shutoff and brew strength control. Wake up to fresh coffee every morning.",
                CategoryId = categories.First(c => c.Name == "Home & Garden").Id,
                VendorId = vendors.First(v => v.Name == "HomeStyle Living").Id,
                IsActive = true
            };
            products.Add(coffeemaker);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = coffeemaker.Id,
                Sku = "CM-PROG-12CUP",
                Price = 89.99m,
                Stock = 35,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Capacity", "12 cups") }
                }
            });

            var bedSheets = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Luxury Bamboo Bed Sheets Set",
                Slug = "luxury-bamboo-bed-sheets-set-homestyle-living",
                Description = "Ultra-soft bamboo bed sheets set including fitted sheet, flat sheet, and pillowcases. Hypoallergenic and breathable.",
                CategoryId = categories.First(c => c.Name == "Home & Garden").Id,
                VendorId = vendors.First(v => v.Name == "HomeStyle Living").Id,
                IsActive = true
            };
            products.Add(bedSheets);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = bedSheets.Id,
                Sku = "SHEETS-QUEEN-WHITE",
                Price = 119.99m,
                Stock = 40,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "Queen") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "White") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = bedSheets.Id,
                Sku = "SHEETS-KING-WHITE",
                Price = 139.99m,
                Stock = 30,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Size", "King") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "White") }
                }
            });

            // Sports & Outdoors Products
            var yogaMat = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Eco-Friendly Yoga Mat",
                Slug = "eco-friendly-yoga-mat-active-sports-co",
                Description = "Non-slip, eco-friendly yoga mat made from natural rubber. Includes carrying strap. Perfect for yoga, pilates, and fitness.",
                CategoryId = categories.First(c => c.Name == "Sports & Outdoors").Id,
                VendorId = vendors.First(v => v.Name == "Active Sports Co").Id,
                IsActive = true
            };
            products.Add(yogaMat);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = yogaMat.Id,
                Sku = "YOGA-MAT-PURPLE",
                Price = 49.99m,
                Stock = 70,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Purple") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Thickness", "6mm") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = yogaMat.Id,
                Sku = "YOGA-MAT-BLUE",
                Price = 49.99m,
                Stock = 65,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Color", "Blue") },
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Thickness", "6mm") }
                }
            });

            var dumbbells = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Adjustable Dumbbells Set",
                Slug = "adjustable-dumbbells-set-active-sports-co",
                Description = "Space-saving adjustable dumbbells with quick-change weight system. Replaces 15 sets of weights.",
                CategoryId = categories.First(c => c.Name == "Sports & Outdoors").Id,
                VendorId = vendors.First(v => v.Name == "Active Sports Co").Id,
                IsActive = true
            };
            products.Add(dumbbells);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = dumbbells.Id,
                Sku = "DUMBELL-ADJ-50LB",
                Price = 299.99m,
                Stock = 20,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Max Weight", "50lbs") }
                }
            });

            // Books
            var cookbook = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Modern Cooking Essentials",
                Slug = "modern-cooking-essentials-bookworm-publishers",
                Description = "Complete guide to modern cooking techniques with 200+ recipes. Hardcover edition with beautiful photography.",
                CategoryId = categories.First(c => c.Name == "Books").Id,
                VendorId = vendors.First(v => v.Name == "BookWorm Publishers").Id,
                IsActive = true
            };
            products.Add(cookbook);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = cookbook.Id,
                Sku = "BOOK-COOK-HC",
                Price = 34.99m,
                Stock = 80,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Format", "Hardcover") }
                }
            });

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = cookbook.Id,
                Sku = "BOOK-COOK-PB",
                Price = 24.99m,
                Stock = 100,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Format", "Paperback") }
                }
            });

            // Toys & Games
            var boardGame = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Strategic Empire Board Game",
                Slug = "strategic-empire-board-game-playtime-toys",
                Description = "Award-winning strategy board game for 2-4 players. Build your empire and outwit your opponents. Ages 12+.",
                CategoryId = categories.First(c => c.Name == "Toys & Games").Id,
                VendorId = vendors.First(v => v.Name == "PlayTime Toys").Id,
                IsActive = true
            };
            products.Add(boardGame);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = boardGame.Id,
                Sku = "GAME-EMPIRE-STD",
                Price = 59.99m,
                Stock = 45,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Players", "2-4") }
                }
            });

            // Beauty & Personal Care
            var skincare = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Vitamin C Serum",
                Slug = "vitamin-c-serum-glowbeauty",
                Description = "Anti-aging vitamin C serum with hyaluronic acid. Brightens skin and reduces fine lines. Dermatologist tested.",
                CategoryId = categories.First(c => c.Name == "Beauty & Personal Care").Id,
                VendorId = vendors.First(v => v.Name == "GlowBeauty").Id,
                IsActive = true
            };
            products.Add(skincare);

            variants.Add(new ProductVariant
            {
                Id = Guid.NewGuid(),
                ProductId = skincare.Id,
                Sku = "SERUM-VITC-30ML",
                Price = 39.99m,
                Stock = 90,
                VariantAttributes = new List<VariantAttributeValue>
                {
                    new VariantAttributeValue { Id = Guid.NewGuid(), AttributeValueId = await GetAttributeValueId("Volume", "30ml") }
                }
            });

            context.Products.AddRange(products);
            context.ProductVariants.AddRange(variants);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {products.Count} products with {variants.Count} variants.");
        }

        private static async Task SeedAddressesAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Addresses...");

            var addresses = new List<Address>
            {
                new Address
                {
                    Id = Guid.NewGuid(),
                    CustomerId = TestCustomerId,
                    FullName = "John Doe",
                    Line1 = "123 Main Street",
                    Line2 = "Apt 4B",
                    City = "New York",
                    PostalCode = "10001",
                    Country = "United States",
                    Phone = "+1-555-0123"
                },
                new Address
                {
                    Id = Guid.NewGuid(),
                    CustomerId = TestCustomerId,
                    FullName = "John Doe",
                    Line1 = "456 Oak Avenue",
                    City = "Los Angeles",
                    PostalCode = "90001",
                    Country = "United States",
                    Phone = "+1-555-0124"
                },
                new Address
                {
                    Id = Guid.NewGuid(),
                    CustomerId = TestCustomerId,
                    FullName = "Jane Doe",
                    Line1 = "789 Pine Road",
                    Line2 = "Suite 200",
                    City = "Chicago",
                    PostalCode = "60601",
                    Country = "United States",
                    Phone = "+1-555-0125"
                }
            };

            context.Addresses.AddRange(addresses);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {addresses.Count} addresses.");
        }

        private static async Task SeedOrdersAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Orders with Items and Payments...");

            var addresses = await context.Addresses.ToListAsync();
            var variants = await context.ProductVariants.ToListAsync();

            var orders = new List<Order>();
            var orderItems = new List<OrderItem>();
            var payments = new List<Payment>();

            // Order 1: Completed order with laptop and headphones
            var order1 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = TestCustomerId,
                AddressId = addresses[0].Id,
                Status = "delivered",
                TotalAmount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            var laptopVariant = variants.First(v => v.Sku == "LAPTOP-15-SILVER-16GB-512GB");
            var headphonesVariant = variants.First(v => v.Sku == "HP-WNC-BLACK");

            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order1.Id, VariantId = laptopVariant.Id, Quantity = 1, Price = laptopVariant.Price });
            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order1.Id, VariantId = headphonesVariant.Id, Quantity = 1, Price = headphonesVariant.Price });
            order1.TotalAmount = laptopVariant.Price + headphonesVariant.Price;

            payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order1.Id,
                Method = "card",
                Status = "completed",
                TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
                Amount = order1.TotalAmount,
                CreatedAt = order1.CreatedAt
            });

            orders.Add(order1);

            // Order 2: Shipped order with clothing items
            var order2 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = TestCustomerId,
                AddressId = addresses[1].Id,
                Status = "shipped",
                TotalAmount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            };

            var jeansVariant = variants.First(v => v.Sku == "JEANS-BLUE-32");
            var tshirtVariant = variants.First(v => v.Sku == "TSHIRT-WHITE-M");

            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order2.Id, VariantId = jeansVariant.Id, Quantity = 2, Price = jeansVariant.Price });
            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order2.Id, VariantId = tshirtVariant.Id, Quantity = 3, Price = tshirtVariant.Price });
            order2.TotalAmount = (jeansVariant.Price * 2) + (tshirtVariant.Price * 3);

            payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order2.Id,
                Method = "paypal",
                Status = "completed",
                TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
                Amount = order2.TotalAmount,
                CreatedAt = order2.CreatedAt
            });

            orders.Add(order2);

            // Order 3: Paid order awaiting shipment
            var order3 = new Order
            {
                Id = Guid.NewGuid(),
                CustomerId = TestCustomerId,
                AddressId = addresses[2].Id,
                Status = "paid",
                TotalAmount = 0,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            };

            var yogaMatVariant = variants.First(v => v.Sku == "YOGA-MAT-PURPLE");
            var dumbbellVariant = variants.First(v => v.Sku == "DUMBELL-ADJ-50LB");

            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order3.Id, VariantId = yogaMatVariant.Id, Quantity = 1, Price = yogaMatVariant.Price });
            orderItems.Add(new OrderItem { Id = Guid.NewGuid(), OrderId = order3.Id, VariantId = dumbbellVariant.Id, Quantity = 1, Price = dumbbellVariant.Price });
            order3.TotalAmount = yogaMatVariant.Price + dumbbellVariant.Price;

            payments.Add(new Payment
            {
                Id = Guid.NewGuid(),
                OrderId = order3.Id,
                Method = "card",
                Status = "completed",
                TransactionId = "txn_" + Guid.NewGuid().ToString("N")[..16],
                Amount = order3.TotalAmount,
                CreatedAt = order3.CreatedAt
            });

            orders.Add(order3);

            context.Orders.AddRange(orders);
            context.OrderItems.AddRange(orderItems);
            context.Payments.AddRange(payments);
            await context.SaveChangesAsync();

            Console.WriteLine($"Added {orders.Count} orders with {orderItems.Count} order items and {payments.Count} payments.");
        }

        private static async Task SeedReviewsAsync(AppDbContext context)
        {
            Console.WriteLine("Seeding Reviews...");

            var products = await context.Products.Take(5).ToListAsync();
            var reviews = new List<Review>();

            var reviewComments = new Dictionary<int, string[]>
            {
                { 5, new[] { "Absolutely fantastic! Exceeded all my expectations.", "Best purchase I've made this year!", "Outstanding quality and fast shipping." } },
                { 4, new[] { "Great product, very satisfied with the purchase.", "Good quality, would buy again.", "Exactly as described, very happy." } },
                { 3, new[] { "It's okay, nothing special.", "Average product, does the job.", "Decent but could be better." } }
            };

            foreach (var product in products)
            {
                var numReviews = Random.Shared.Next(1, 3);
                for (int i = 0; i < numReviews; i++)
                {
                    var rating = Random.Shared.Next(3, 6);
                    var commentOptions = reviewComments[rating];
                    var comment = commentOptions[Random.Shared.Next(commentOptions.Length)];

                    reviews.Add(new Review
                    {
                        Id = Guid.NewGuid(),
                        UserId = ExistingUserId,
                        ProductId = product.Id,
                        Rating = rating,
                        Comment = comment,
                        CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 60))
                    });
                }
            }

            context.Reviews.AddRange(reviews);
            await context.SaveChangesAsync();
            Console.WriteLine($"Added {reviews.Count} reviews.");
        }
    }
}
