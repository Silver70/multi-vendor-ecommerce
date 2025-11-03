using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Channel
{
    public class CreateChannelVendorDto
    {
        [Required]
        public Guid VendorId { get; set; }

        public bool IsActive { get; set; } = true;

        public string? ExternalVendorId { get; set; }
    }
}
