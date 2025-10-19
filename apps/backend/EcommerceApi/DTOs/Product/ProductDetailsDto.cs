
namespace EcommerceApi.DTOs.Product
{
 public class ProductDetailsDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string Slug { get; set; } = "";
    public string Description { get; set; } = "";
    public string CategoryName { get; set; } = "";
    public string VendorName { get; set; } = "";
    public List<VariantDto> Variants { get; set; } = new();
    public List<string> ImageUrls { get; set; } = new();
}

public class VariantDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = "";
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public string? Attributes { get; set; }
}

}
