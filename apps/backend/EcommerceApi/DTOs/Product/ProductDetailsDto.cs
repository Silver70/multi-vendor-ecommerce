
namespace EcommerceApi.DTOs.Product
{
 public class ProductDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Description { get; set; } = "";
    public Guid CategoryId { get; set; }
    public Guid? VendorId { get; set; }
    public string CategoryName { get; set; } = "";
    public string VendorName { get; set; } = "";
    public bool IsActive { get; set; }
    public List<ProductAttributeOutputDto> Attributes { get; set; } = new();
    public List<VariantDto> Variants { get; set; } = new();
    public List<string> ImageUrls { get; set; } = new();
}

public class VariantDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
}

}
