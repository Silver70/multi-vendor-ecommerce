namespace EcommerceApi.DTOs.Customer
{
    public class CustomerDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? UserEmail { get; set; }
        public string? UserName { get; set; }
    }
}
