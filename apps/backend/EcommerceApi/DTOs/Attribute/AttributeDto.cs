namespace EcommerceApi.DTOs.Attribute
{
    public class AttributeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<AttributeValueDto> Values { get; set; } = new();
    }

    public class AttributeValueDto
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
