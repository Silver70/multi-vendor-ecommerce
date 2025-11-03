using EcommerceApi.DTOs.Vendor;

namespace EcommerceApi.DTOs.Channel
{
    public class ChannelVendorDto
    {
        public Guid Id { get; set; }
        public Guid ChannelId { get; set; }
        public Guid VendorId { get; set; }
        public bool IsActive { get; set; }
        public string? ExternalVendorId { get; set; }
        public VendorDto? Vendor { get; set; }
    }
}
