using Microsoft.EntityFrameworkCore;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.Channel;

namespace EcommerceApi.Services
{
    public class ChannelService : IChannelService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ChannelService> _logger;

        public ChannelService(AppDbContext context, ILogger<ChannelService> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Channel CRUD

        public async Task<ChannelDto> CreateChannelAsync(CreateChannelDto dto)
        {
            var channel = new Channel
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Type = dto.Type,
                Description = dto.Description,
                IsActive = dto.IsActive,
                ExternalId = dto.ExternalId,
                CountryCode = dto.CountryCode,
                RegionCode = dto.RegionCode,
                CurrencyCode = dto.CurrencyCode,
                IsB2B = dto.IsB2B,
                TaxIdentificationNumber = dto.TaxIdentificationNumber,
                DefaultTaxRate = dto.DefaultTaxRate,
                TaxBehavior = dto.TaxBehavior,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Channels.Add(channel);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Channel created: {channel.Id} ({channel.Name})");
            return MapToDto(channel);
        }

        public async Task<ChannelDto?> GetChannelByIdAsync(Guid id)
        {
            var channel = await _context.Channels
                .Include(c => c.ChannelVendors)
                .Include(c => c.ChannelProducts)
                .Include(c => c.TaxRules)
                .FirstOrDefaultAsync(c => c.Id == id);

            return channel == null ? null : MapToDto(channel);
        }

        public async Task<List<ChannelDto>> GetAllChannelsAsync()
        {
            var channels = await _context.Channels
                .Include(c => c.ChannelVendors)
                .Include(c => c.ChannelProducts)
                .Include(c => c.TaxRules)
                .ToListAsync();

            return channels.Select(MapToDto).ToList();
        }

        public async Task<ChannelDto?> UpdateChannelAsync(Guid id, UpdateChannelDto dto)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null)
            {
                _logger.LogWarning($"Channel not found: {id}");
                return null;
            }

            // Update only provided fields
            if (!string.IsNullOrEmpty(dto.Name))
                channel.Name = dto.Name;
            if (dto.Description != null)
                channel.Description = dto.Description;
            if (dto.IsActive.HasValue)
                channel.IsActive = dto.IsActive.Value;
            if (!string.IsNullOrEmpty(dto.ExternalId))
                channel.ExternalId = dto.ExternalId;
            if (!string.IsNullOrEmpty(dto.CountryCode))
                channel.CountryCode = dto.CountryCode;
            if (dto.RegionCode != null)
                channel.RegionCode = dto.RegionCode;
            if (!string.IsNullOrEmpty(dto.CurrencyCode))
                channel.CurrencyCode = dto.CurrencyCode;
            if (dto.IsB2B.HasValue)
                channel.IsB2B = dto.IsB2B.Value;
            if (!string.IsNullOrEmpty(dto.TaxIdentificationNumber))
                channel.TaxIdentificationNumber = dto.TaxIdentificationNumber;
            if (dto.DefaultTaxRate.HasValue)
                channel.DefaultTaxRate = dto.DefaultTaxRate.Value;
            if (!string.IsNullOrEmpty(dto.TaxBehavior))
                channel.TaxBehavior = dto.TaxBehavior;

            channel.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Channel updated: {id}");
            return MapToDto(channel);
        }

        public async Task<bool> DeleteChannelAsync(Guid id)
        {
            var channel = await _context.Channels.FindAsync(id);
            if (channel == null)
            {
                _logger.LogWarning($"Channel not found: {id}");
                return false;
            }

            // Check if channel has orders - don't delete if it does
            var orderCount = await _context.Orders.CountAsync(o => o.ChannelId == id);
            if (orderCount > 0)
            {
                _logger.LogWarning($"Cannot delete channel {id}: has {orderCount} orders");
                throw new InvalidOperationException($"Cannot delete channel with existing orders");
            }

            _context.Channels.Remove(channel);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Channel deleted: {id}");
            return true;
        }

        #endregion

        #region Channel Products

        public async Task<ChannelProductDto> AddProductToChannelAsync(Guid channelId, CreateChannelProductDto dto)
        {
            // Verify channel exists
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                throw new ArgumentException($"Channel {channelId} not found");

            // Verify product exists
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null)
                throw new ArgumentException($"Product {dto.ProductId} not found");

            var channelProduct = new ChannelProduct
            {
                Id = Guid.NewGuid(),
                ChannelId = channelId,
                ProductId = dto.ProductId,
                ChannelName = dto.ChannelName,
                ChannelDescription = dto.ChannelDescription,
                ChannelPrice = dto.ChannelPrice,
                IsActive = dto.IsActive,
                ExternalProductId = dto.ExternalProductId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ChannelProducts.Add(channelProduct);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Product {dto.ProductId} added to channel {channelId}");
            return MapChannelProductToDto(channelProduct);
        }

        public async Task<List<ChannelProductDto>> GetChannelProductsAsync(Guid channelId)
        {
            var products = await _context.ChannelProducts
                .Include(cp => cp.Product)
                .Where(cp => cp.ChannelId == channelId)
                .ToListAsync();

            return products.Select(MapChannelProductToDto).ToList();
        }

        public async Task<ChannelProductDto?> UpdateChannelProductAsync(Guid channelProductId, UpdateChannelProductDto dto)
        {
            var channelProduct = await _context.ChannelProducts
                .Include(cp => cp.Product)
                .FirstOrDefaultAsync(cp => cp.Id == channelProductId);

            if (channelProduct == null)
            {
                _logger.LogWarning($"ChannelProduct not found: {channelProductId}");
                return null;
            }

            if (!string.IsNullOrEmpty(dto.ChannelName))
                channelProduct.ChannelName = dto.ChannelName;
            if (dto.ChannelDescription != null)
                channelProduct.ChannelDescription = dto.ChannelDescription;
            if (dto.ChannelPrice.HasValue)
                channelProduct.ChannelPrice = dto.ChannelPrice;
            if (dto.IsActive.HasValue)
                channelProduct.IsActive = dto.IsActive.Value;
            if (!string.IsNullOrEmpty(dto.ExternalProductId))
                channelProduct.ExternalProductId = dto.ExternalProductId;

            channelProduct.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"ChannelProduct updated: {channelProductId}");
            return MapChannelProductToDto(channelProduct);
        }

        public async Task<bool> RemoveProductFromChannelAsync(Guid channelProductId)
        {
            var channelProduct = await _context.ChannelProducts.FindAsync(channelProductId);
            if (channelProduct == null)
            {
                _logger.LogWarning($"ChannelProduct not found: {channelProductId}");
                return false;
            }

            _context.ChannelProducts.Remove(channelProduct);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Product removed from channel: {channelProductId}");
            return true;
        }

        #endregion

        #region Channel Vendors

        public async Task<ChannelVendorDto> AddVendorToChannelAsync(Guid channelId, CreateChannelVendorDto dto)
        {
            // Verify channel exists
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                throw new ArgumentException($"Channel {channelId} not found");

            // Verify vendor exists
            var vendor = await _context.Vendors.FindAsync(dto.VendorId);
            if (vendor == null)
                throw new ArgumentException($"Vendor {dto.VendorId} not found");

            // Check for duplicate
            var existing = await _context.ChannelVendors
                .FirstOrDefaultAsync(cv => cv.ChannelId == channelId && cv.VendorId == dto.VendorId);
            if (existing != null)
                throw new InvalidOperationException($"Vendor already exists on this channel");

            var channelVendor = new ChannelVendor
            {
                Id = Guid.NewGuid(),
                ChannelId = channelId,
                VendorId = dto.VendorId,
                IsActive = dto.IsActive,
                ExternalVendorId = dto.ExternalVendorId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ChannelVendors.Add(channelVendor);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Vendor {dto.VendorId} added to channel {channelId}");
            return MapChannelVendorToDto(channelVendor);
        }

        public async Task<List<ChannelVendorDto>> GetChannelVendorsAsync(Guid channelId)
        {
            var vendors = await _context.ChannelVendors
                .Include(cv => cv.Vendor)
                .Where(cv => cv.ChannelId == channelId)
                .ToListAsync();

            return vendors.Select(MapChannelVendorToDto).ToList();
        }

        public async Task<bool> RemoveVendorFromChannelAsync(Guid channelVendorId)
        {
            var channelVendor = await _context.ChannelVendors.FindAsync(channelVendorId);
            if (channelVendor == null)
            {
                _logger.LogWarning($"ChannelVendor not found: {channelVendorId}");
                return false;
            }

            _context.ChannelVendors.Remove(channelVendor);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Vendor removed from channel: {channelVendorId}");
            return true;
        }

        public async Task<List<ChannelVendorDto>> GetVendorChannelsAsync(Guid vendorId)
        {
            var channels = await _context.ChannelVendors
                .Include(cv => cv.Channel)
                .Where(cv => cv.VendorId == vendorId)
                .ToListAsync();

            return channels.Select(MapChannelVendorToDto).ToList();
        }

        #endregion

        #region Pricing

        public async Task<decimal> GetChannelProductPriceAsync(Guid channelId, Guid productId)
        {
            // Check for channel-specific price override
            var channelProduct = await _context.ChannelProducts
                .FirstOrDefaultAsync(cp => cp.ChannelId == channelId && cp.ProductId == productId);

            if (channelProduct?.ChannelPrice.HasValue == true)
                return channelProduct.ChannelPrice.Value;

            // Fall back to product base price
            var product = await _context.Products.FindAsync(productId);
            return product?.BasePrice ?? 0;
        }

        #endregion

        #region Tax Rules

        public async Task<ChannelTaxRuleDto> CreateTaxRuleAsync(Guid channelId, CreateChannelTaxRuleDto dto)
        {
            // Verify channel exists
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                throw new ArgumentException($"Channel {channelId} not found");

            var taxRule = new ChannelTaxRule
            {
                Id = Guid.NewGuid(),
                ChannelId = channelId,
                Name = dto.Name,
                Description = dto.Description,
                TaxRate = dto.TaxRate,
                CategoryId = dto.CategoryId,
                ApplicableCountryCode = dto.ApplicableCountryCode,
                ApplicableRegionCode = dto.ApplicableRegionCode,
                ApplyToB2B = dto.ApplyToB2B,
                ApplyToB2C = dto.ApplyToB2C,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                TaxBehavior = dto.TaxBehavior,
                IsActive = dto.IsActive,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ChannelTaxRules.Add(taxRule);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Tax rule created: {taxRule.Id} for channel {channelId}");
            return MapTaxRuleToDto(taxRule);
        }

        public async Task<ChannelTaxRuleDto?> GetTaxRuleByIdAsync(Guid ruleId)
        {
            var rule = await _context.ChannelTaxRules
                .Include(r => r.Category)
                .FirstOrDefaultAsync(r => r.Id == ruleId);

            return rule == null ? null : MapTaxRuleToDto(rule);
        }

        public async Task<List<ChannelTaxRuleDto>> GetChannelTaxRulesAsync(Guid channelId)
        {
            var rules = await _context.ChannelTaxRules
                .Include(r => r.Category)
                .Where(r => r.ChannelId == channelId)
                .OrderByDescending(r => r.StartDate)
                .ToListAsync();

            return rules.Select(MapTaxRuleToDto).ToList();
        }

        public async Task<ChannelTaxRuleDto?> UpdateTaxRuleAsync(Guid ruleId, UpdateChannelTaxRuleDto dto)
        {
            var rule = await _context.ChannelTaxRules.FindAsync(ruleId);
            if (rule == null)
            {
                _logger.LogWarning($"Tax rule not found: {ruleId}");
                return null;
            }

            if (!string.IsNullOrEmpty(dto.Name))
                rule.Name = dto.Name;
            if (dto.Description != null)
                rule.Description = dto.Description;
            if (dto.TaxRate.HasValue)
                rule.TaxRate = dto.TaxRate.Value;
            if (dto.CategoryId.HasValue)
                rule.CategoryId = dto.CategoryId.Value;
            if (!string.IsNullOrEmpty(dto.ApplicableCountryCode))
                rule.ApplicableCountryCode = dto.ApplicableCountryCode;
            if (!string.IsNullOrEmpty(dto.ApplicableRegionCode))
                rule.ApplicableRegionCode = dto.ApplicableRegionCode;
            if (dto.ApplyToB2B.HasValue)
                rule.ApplyToB2B = dto.ApplyToB2B.Value;
            if (dto.ApplyToB2C.HasValue)
                rule.ApplyToB2C = dto.ApplyToB2C.Value;
            if (dto.MinimumOrderAmount.HasValue)
                rule.MinimumOrderAmount = dto.MinimumOrderAmount.Value;
            if (!string.IsNullOrEmpty(dto.TaxBehavior))
                rule.TaxBehavior = dto.TaxBehavior;
            if (dto.IsActive.HasValue)
                rule.IsActive = dto.IsActive.Value;
            if (dto.StartDate.HasValue)
                rule.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue)
                rule.EndDate = dto.EndDate.Value;

            rule.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Tax rule updated: {ruleId}");
            return MapTaxRuleToDto(rule);
        }

        public async Task<bool> DeleteTaxRuleAsync(Guid ruleId, Guid channelId)
        {
            var rule = await _context.ChannelTaxRules.FindAsync(ruleId);
            if (rule == null || rule.ChannelId != channelId)
            {
                _logger.LogWarning($"Tax rule not found: {ruleId}");
                return false;
            }

            _context.ChannelTaxRules.Remove(rule);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Tax rule deleted: {ruleId}");
            return true;
        }

        #endregion

        #region Tax Calculation

        public async Task<(decimal taxAmount, decimal taxRate, string? ruleName)> CalculateTaxAsync(
            Guid channelId,
            decimal orderAmount,
            Guid? categoryId = null,
            bool isB2B = false)
        {
            var channel = await _context.Channels.FindAsync(channelId);
            if (channel == null)
                throw new ArgumentException($"Channel {channelId} not found");

            // Get all active tax rules for this channel
            var now = DateTime.UtcNow;
            var applicableTaxRules = await _context.ChannelTaxRules
                .Where(r => r.ChannelId == channelId && r.IsActive)
                .Where(r => r.StartDate == null || r.StartDate <= now)
                .Where(r => r.EndDate == null || r.EndDate >= now)
                .Where(r => (isB2B && r.ApplyToB2B) || (!isB2B && r.ApplyToB2C))
                .Where(r => r.MinimumOrderAmount == null || orderAmount >= r.MinimumOrderAmount)
                .ToListAsync();

            // Find most specific rule (category-specific first)
            ChannelTaxRule? selectedRule = null;

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

            // Return default channel tax if no rule found
            if (selectedRule == null)
            {
                var taxAmount = orderAmount * channel.DefaultTaxRate;
                return (taxAmount, channel.DefaultTaxRate, null);
            }

            // Calculate tax based on rule
            decimal calculatedTaxAmount;
            if (selectedRule.TaxBehavior == "exclusive")
            {
                calculatedTaxAmount = orderAmount * selectedRule.TaxRate;
            }
            else
            {
                // Inclusive - show 0 or calculate backward if needed
                calculatedTaxAmount = 0;
            }

            return (calculatedTaxAmount, selectedRule.TaxRate, selectedRule.Name);
        }

        #endregion

        #region Helpers

        private ChannelDto MapToDto(Channel channel)
        {
            return new ChannelDto
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

        private ChannelProductDto MapChannelProductToDto(ChannelProduct cp)
        {
            return new ChannelProductDto
            {
                Id = cp.Id,
                ChannelId = cp.ChannelId,
                ProductId = cp.ProductId,
                ChannelName = cp.ChannelName,
                ChannelPrice = cp.ChannelPrice,
                IsActive = cp.IsActive,
                ExternalProductId = cp.ExternalProductId,
                Product = cp.Product != null ? new DTOs.Product.ProductDto
                {
                    Id = cp.Product.Id,
                    Name = cp.Product.Name,
                    Description = cp.Product.Description,
                    BasePrice = cp.Product.BasePrice,
                    IsActive = cp.Product.IsActive,
                    Slug = cp.Product.Slug,
                    CategoryId = cp.Product.CategoryId,
                    VendorId = cp.Product.VendorId
                } : null
            };
        }

        private ChannelVendorDto MapChannelVendorToDto(ChannelVendor cv)
        {
            return new ChannelVendorDto
            {
                Id = cv.Id,
                ChannelId = cv.ChannelId,
                VendorId = cv.VendorId,
                IsActive = cv.IsActive,
                ExternalVendorId = cv.ExternalVendorId,
                Vendor = cv.Vendor != null ? new DTOs.Vendor.VendorDto
                {
                    Id = cv.Vendor.Id,
                    Name = cv.Vendor.Name,
                    ContactEmail = cv.Vendor.ContactEmail,
                    Website = cv.Vendor.Website
                } : null
            };
        }

        private ChannelTaxRuleDto MapTaxRuleToDto(ChannelTaxRule rule)
        {
            return new ChannelTaxRuleDto
            {
                Id = rule.Id,
                ChannelId = rule.ChannelId,
                Name = rule.Name,
                Description = rule.Description,
                TaxRate = rule.TaxRate,
                CategoryId = rule.CategoryId,
                ApplicableCountryCode = rule.ApplicableCountryCode,
                ApplicableRegionCode = rule.ApplicableRegionCode,
                ApplyToB2B = rule.ApplyToB2B,
                ApplyToB2C = rule.ApplyToB2C,
                MinimumOrderAmount = rule.MinimumOrderAmount,
                TaxBehavior = rule.TaxBehavior,
                IsActive = rule.IsActive,
                StartDate = rule.StartDate,
                EndDate = rule.EndDate,
                CreatedAt = rule.CreatedAt,
                UpdatedAt = rule.UpdatedAt
            };
        }

        #endregion
    }
}
