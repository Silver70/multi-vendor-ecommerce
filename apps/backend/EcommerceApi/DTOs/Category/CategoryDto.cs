namespace EcommerceApi.DTOs.Category
{
    public class CategoryDto
    {
        public Guid Id { get; set; }
        public Guid? ParentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ParentName { get; set; }
        public int ProductCount { get; set; } = 0;
    }
}
