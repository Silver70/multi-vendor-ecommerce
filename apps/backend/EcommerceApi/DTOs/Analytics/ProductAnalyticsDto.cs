namespace EcommerceApi.DTOs.Analytics
{
    public class ProductPerformanceDto
    {
        public Guid ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Category { get; set; }
        public string? Vendor { get; set; }
        public int UnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AveragePrice { get; set; }
        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }

    public class CategorySalesMetricsDto
    {
        public Guid CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public int ProductCount { get; set; }
        public int UnitsSold { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal Percentage { get; set; }
    }

    public class InventoryMetricsDto
    {
        public Guid VariantId { get; set; }
        public string? Sku { get; set; }
        public string? ProductName { get; set; }
        public int CurrentStock { get; set; }
        public decimal Price { get; set; }
        public decimal StockValue { get; set; }
        public int RecentSales { get; set; } // Last 30 days
        public decimal TurnoverRate { get; set; } // Times stock sold in period
        public string? StockStatus { get; set; } // "Low", "Optimal", "Excess"
    }

    public class LowStockAlertDto
    {
        public Guid VariantId { get; set; }
        public string? Sku { get; set; }
        public string? ProductName { get; set; }
        public int CurrentStock { get; set; }
        public int RecentSalesPerDay { get; set; }
        public int DaysUntilStockout { get; set; } // Estimated
    }

    public class StockTurnoverDto
    {
        public Guid VariantId { get; set; }
        public string? Sku { get; set; }
        public string? ProductName { get; set; }
        public int UnitsSoldInPeriod { get; set; }
        public decimal AverageStock { get; set; }
        public decimal TurnoverRate { get; set; }
        public int DaysInInventory { get; set; }
    }

    public class VendorPerformanceDto
    {
        public Guid VendorId { get; set; }
        public string? VendorName { get; set; }
        public int ProductCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public decimal AverageRating { get; set; }
        public decimal RevenuePercentage { get; set; }
    }

    public class ProductInventoryMovementDto
    {
        public DateTime Date { get; set; }
        public Guid VariantId { get; set; }
        public string? Sku { get; set; }
        public int QuantityChange { get; set; }
        public string? Reason { get; set; }
        public int StockAfter { get; set; }
    }
}
