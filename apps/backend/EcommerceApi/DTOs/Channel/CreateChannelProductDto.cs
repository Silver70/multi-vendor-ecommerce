using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class CreateChannelProductDto
    {
        [Required]
        public Guid ProductId { get; set; }

        [MaxLength(200)]
        public string? ChannelName { get; set; }

        public string? ChannelDescription { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? ChannelPrice { get; set; }

        public bool IsActive { get; set; } = true;

        public string? ExternalProductId { get; set; }
    }
}
