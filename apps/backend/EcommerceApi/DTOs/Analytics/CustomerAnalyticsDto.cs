namespace EcommerceApi.DTOs.Analytics
{
    public class CustomerSummaryDto
    {
        public int TotalCustomers { get; set; }
        public int WebsiteCustomers { get; set; }
        public int AdminCreatedCustomers { get; set; }
        public int ActiveCustomers { get; set; } // Customers with orders
        public int NewCustomersToday { get; set; }
        public int NewCustomersThisWeek { get; set; }
        public int NewCustomersThisMonth { get; set; }
        public decimal AverageCustomerValue { get; set; }
    }

    public class CustomerAcquisitionDto
    {
        public DateTime Date { get; set; }
        public int TotalNewCustomers { get; set; }
        public int WebsiteCustomers { get; set; }
        public int AdminCreatedCustomers { get; set; }
    }

    public class RepeatCustomerMetricsDto
    {
        public int TotalCustomers { get; set; }
        public int OneTimeCustomers { get; set; }
        public int RepeatCustomers { get; set; }
        public decimal RepeatCustomerRate { get; set; }
        public decimal AverageOrdersPerRepeatCustomer { get; set; }
    }

    public class CustomerLifetimeValueDto
    {
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? Email { get; set; }
        public decimal TotalSpent { get; set; }
        public int OrderCount { get; set; }
        public decimal AverageOrderValue { get; set; }
        public DateTime? FirstOrderDate { get; set; }
        public DateTime? LastOrderDate { get; set; }
    }

    public class GeographicCustomerMetricsDto
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public int CustomerCount { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal AverageCustomerValue { get; set; }
    }

    public class CustomerSourceMetricsDto
    {
        public string? Source { get; set; } // "website" or "admin"
        public int CustomerCount { get; set; }
        public decimal Percentage { get; set; }
        public decimal TotalSpent { get; set; }
        public decimal AverageValue { get; set; }
    }
}
