namespace EcommerceApi.DTOs.Address
{
    public class AddressDto
    {
        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Line1 { get; set; } = string.Empty;
        public string? Line2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public string Country { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? CustomerName { get; set; }
    }
}
