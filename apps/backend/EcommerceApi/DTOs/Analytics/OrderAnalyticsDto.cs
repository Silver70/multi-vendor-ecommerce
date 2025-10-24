namespace EcommerceApi.DTOs.Analytics
{
    public class OrderSummaryDto
    {
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int PaidOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public int CancelledOrders { get; set; }
        public decimal AverageOrderValue { get; set; }
        public decimal TotalOrderValue { get; set; }
    }

    public class OrderStatusBreakdownDto
    {
        public string? Status { get; set; }
        public int Count { get; set; }
        public decimal Percentage { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class OrderConversionFunnelDto
    {
        public string? Stage { get; set; } // "Pending", "Paid", "Shipped", "Delivered"
        public int Count { get; set; }
        public decimal Percentage { get; set; }
        public decimal ConversionRateFromPrevious { get; set; } // % of previous stage
    }

    public class OrderTrendDto
    {
        public DateTime Date { get; set; }
        public int OrderCount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class OrderCancellationMetricsDto
    {
        public int TotalCancellations { get; set; }
        public decimal CancellationRate { get; set; }
        public decimal CancelledAmount { get; set; }
        public int CancellationsToday { get; set; }
        public int CancellationsThisWeek { get; set; }
        public int CancellationsThisMonth { get; set; }
    }

    public class GeographicOrderMetricsDto
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public int OrderCount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AverageOrderValue { get; set; }
    }
}
