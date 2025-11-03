using EcommerceApi.DTOs.Channel;

namespace EcommerceApi.Services
{
    public interface IChannelService
    {
        // Channel CRUD
        Task<ChannelDto> CreateChannelAsync(CreateChannelDto dto);
        Task<ChannelDto?> GetChannelByIdAsync(Guid id);
        Task<List<ChannelDto>> GetAllChannelsAsync();
        Task<ChannelDto?> UpdateChannelAsync(Guid id, UpdateChannelDto dto);
        Task<bool> DeleteChannelAsync(Guid id);

        // Channel Products
        Task<ChannelProductDto> AddProductToChannelAsync(Guid channelId, CreateChannelProductDto dto);
        Task<List<ChannelProductDto>> GetChannelProductsAsync(Guid channelId);
        Task<ChannelProductDto?> UpdateChannelProductAsync(Guid channelProductId, UpdateChannelProductDto dto);
        Task<bool> RemoveProductFromChannelAsync(Guid channelProductId);

        // Channel Vendors
        Task<ChannelVendorDto> AddVendorToChannelAsync(Guid channelId, CreateChannelVendorDto dto);
        Task<List<ChannelVendorDto>> GetChannelVendorsAsync(Guid channelId);
        Task<bool> RemoveVendorFromChannelAsync(Guid channelVendorId);
        Task<List<ChannelVendorDto>> GetVendorChannelsAsync(Guid vendorId);

        // Pricing
        Task<decimal> GetChannelProductPriceAsync(Guid channelId, Guid productId);

        // Tax Rules
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
}
