using EcommerceApi.DTOs.Common;

namespace EcommerceApi.DTOs.Category
{
    public class CategoryFilterParams : PaginationParams
    {
        public string? Name { get; set; }
        public Guid? ParentId { get; set; }
        public bool? HasParent { get; set; }
    }
}
