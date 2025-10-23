namespace EcommerceApi.DTOs.Customer
{
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public Guid? CreatedByUserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public bool IsFromWebsite { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatedByUserName { get; set; }
    }
}
