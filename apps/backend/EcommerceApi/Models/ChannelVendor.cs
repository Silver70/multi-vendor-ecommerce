using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.Models
{
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
}
