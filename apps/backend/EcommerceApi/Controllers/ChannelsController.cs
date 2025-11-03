using Microsoft.AspNetCore.Mvc;
using EcommerceApi.Services;
using EcommerceApi.DTOs.Channel;

namespace EcommerceApi.Controllers
{
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

        #region Channel CRUD

        /// <summary>
        /// Get all channels
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ChannelDto>>> GetChannels()
        {
            var channels = await _channelService.GetAllChannelsAsync();
            return Ok(channels);
        }

        /// <summary>
        /// Get channel by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ChannelDto>> GetChannel(Guid id)
        {
            var channel = await _channelService.GetChannelByIdAsync(id);
            if (channel == null)
                return NotFound(new { message = $"Channel {id} not found" });

            return Ok(channel);
        }

        /// <summary>
        /// Create a new channel
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ChannelDto>> CreateChannel([FromBody] CreateChannelDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var channel = await _channelService.CreateChannelAsync(dto);
            return CreatedAtAction(nameof(GetChannel), new { id = channel.Id }, channel);
        }

        /// <summary>
        /// Update channel
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ChannelDto>> UpdateChannel(Guid id, [FromBody] UpdateChannelDto dto)
        {
            var channel = await _channelService.UpdateChannelAsync(id, dto);
            if (channel == null)
                return NotFound(new { message = $"Channel {id} not found" });

            return Ok(channel);
        }

        /// <summary>
        /// Delete channel
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChannel(Guid id)
        {
            try
            {
                var success = await _channelService.DeleteChannelAsync(id);
                if (!success)
                    return NotFound(new { message = $"Channel {id} not found" });

                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        #endregion

        #region Channel Products

        /// <summary>
        /// Add product to channel
        /// </summary>
        [HttpPost("{channelId}/products")]
        public async Task<ActionResult<ChannelProductDto>> AddProductToChannel(
            Guid channelId,
            [FromBody] CreateChannelProductDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var channelProduct = await _channelService.AddProductToChannelAsync(channelId, dto);
                return CreatedAtAction(nameof(GetChannelProducts), new { channelId }, channelProduct);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all products on a channel
        /// </summary>
        [HttpGet("{channelId}/products")]
        public async Task<ActionResult<List<ChannelProductDto>>> GetChannelProducts(Guid channelId)
        {
            var products = await _channelService.GetChannelProductsAsync(channelId);
            return Ok(products);
        }

        /// <summary>
        /// Update channel product
        /// </summary>
        [HttpPut("products/{channelProductId}")]
        public async Task<ActionResult<ChannelProductDto>> UpdateChannelProduct(
            Guid channelProductId,
            [FromBody] UpdateChannelProductDto dto)
        {
            var channelProduct = await _channelService.UpdateChannelProductAsync(channelProductId, dto);
            if (channelProduct == null)
                return NotFound(new { message = $"Channel product {channelProductId} not found" });

            return Ok(channelProduct);
        }

        /// <summary>
        /// Remove product from channel
        /// </summary>
        [HttpDelete("products/{channelProductId}")]
        public async Task<IActionResult> RemoveProductFromChannel(Guid channelProductId)
        {
            var success = await _channelService.RemoveProductFromChannelAsync(channelProductId);
            if (!success)
                return NotFound(new { message = $"Channel product {channelProductId} not found" });

            return NoContent();
        }

        #endregion

        #region Channel Vendors

        /// <summary>
        /// Add vendor to channel
        /// </summary>
        [HttpPost("{channelId}/vendors")]
        public async Task<ActionResult<ChannelVendorDto>> AddVendorToChannel(
            Guid channelId,
            [FromBody] CreateChannelVendorDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var channelVendor = await _channelService.AddVendorToChannelAsync(channelId, dto);
                return CreatedAtAction(nameof(GetChannelVendors), new { channelId }, channelVendor);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all vendors on a channel
        /// </summary>
        [HttpGet("{channelId}/vendors")]
        public async Task<ActionResult<List<ChannelVendorDto>>> GetChannelVendors(Guid channelId)
        {
            var vendors = await _channelService.GetChannelVendorsAsync(channelId);
            return Ok(vendors);
        }

        /// <summary>
        /// Remove vendor from channel
        /// </summary>
        [HttpDelete("vendors/{channelVendorId}")]
        public async Task<IActionResult> RemoveVendorFromChannel(Guid channelVendorId)
        {
            var success = await _channelService.RemoveVendorFromChannelAsync(channelVendorId);
            if (!success)
                return NotFound(new { message = $"Channel vendor {channelVendorId} not found" });

            return NoContent();
        }

        #endregion

        #region Tax Rules

        /// <summary>
        /// Create tax rule for channel
        /// </summary>
        [HttpPost("{channelId}/tax-rules")]
        public async Task<ActionResult<ChannelTaxRuleDto>> CreateTaxRule(
            Guid channelId,
            [FromBody] CreateChannelTaxRuleDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var taxRule = await _channelService.CreateTaxRuleAsync(channelId, dto);
                return CreatedAtAction(nameof(GetTaxRule), new { channelId, ruleId = taxRule.Id }, taxRule);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all tax rules for channel
        /// </summary>
        [HttpGet("{channelId}/tax-rules")]
        public async Task<ActionResult<List<ChannelTaxRuleDto>>> GetChannelTaxRules(Guid channelId)
        {
            var rules = await _channelService.GetChannelTaxRulesAsync(channelId);
            return Ok(rules);
        }

        /// <summary>
        /// Get specific tax rule
        /// </summary>
        [HttpGet("{channelId}/tax-rules/{ruleId}")]
        public async Task<ActionResult<ChannelTaxRuleDto>> GetTaxRule(Guid channelId, Guid ruleId)
        {
            var rule = await _channelService.GetTaxRuleByIdAsync(ruleId);
            if (rule == null || rule.ChannelId != channelId)
                return NotFound(new { message = $"Tax rule {ruleId} not found" });

            return Ok(rule);
        }

        /// <summary>
        /// Update tax rule
        /// </summary>
        [HttpPut("{channelId}/tax-rules/{ruleId}")]
        public async Task<ActionResult<ChannelTaxRuleDto>> UpdateTaxRule(
            Guid channelId,
            Guid ruleId,
            [FromBody] UpdateChannelTaxRuleDto dto)
        {
            var rule = await _channelService.UpdateTaxRuleAsync(ruleId, dto);
            if (rule == null || rule.ChannelId != channelId)
                return NotFound(new { message = $"Tax rule {ruleId} not found" });

            return Ok(rule);
        }

        /// <summary>
        /// Delete tax rule
        /// </summary>
        [HttpDelete("{channelId}/tax-rules/{ruleId}")]
        public async Task<IActionResult> DeleteTaxRule(Guid channelId, Guid ruleId)
        {
            var success = await _channelService.DeleteTaxRuleAsync(ruleId, channelId);
            if (!success)
                return NotFound(new { message = $"Tax rule {ruleId} not found" });

            return NoContent();
        }

        #endregion
    }
}
