namespace EcommerceApi.DTOs.Vendor
{
    public class VendorDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactEmail { get; set; }
        public string? Website { get; set; }
    }
}
