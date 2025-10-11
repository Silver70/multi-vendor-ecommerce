using System.ComponentModel.DataAnnotations; 

namespace EcommerceApi.Models 
{
    public class Category
    {
       public Guid Id { get; set; }

        public Guid? ParentId { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        // Navigation
        public Category? Parent { get; set; }
        public ICollection<Category>? Subcategories { get; set; }
        public ICollection<Product>? Products { get; set; }
    }
}