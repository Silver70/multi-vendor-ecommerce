namespace EcommerceApi.DTOs.Analytics
{
    public class RevenueSummaryDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal PendingRevenue { get; set; }
        public decimal CompletedRevenue { get; set; }
        public decimal RefundedAmount { get; set; }
        public int TotalOrders { get; set; }
        public decimal AverageOrderValue { get; set; }
        public DateTime? Period { get; set; } // For date-based aggregation
    }

    public class RevenueBreakdownDto
    {
        public string? Category { get; set; }
        public string? CategoryType { get; set; } // "Status", "Vendor", "Category", "PaymentMethod"
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
        public decimal AverageOrderValue { get; set; }
    }

    public class RevenueTrendDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
        public decimal AverageOrderValue { get; set; }
    }
}
