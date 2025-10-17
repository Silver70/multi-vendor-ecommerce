using System.ComponentModel.DataAnnotations;

namespace EcommerceApi.DTOs.Common
{
    public class PaginationParams
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;

        [Range(1, int.MaxValue)]
        public int PageNumber { get; set; } = 1;

        [Range(1, MaxPageSize)]
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }

        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = false;
    }
}
