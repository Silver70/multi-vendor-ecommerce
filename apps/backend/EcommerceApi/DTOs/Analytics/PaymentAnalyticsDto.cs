namespace EcommerceApi.DTOs.Analytics
{
    public class PaymentSummaryDto
    {
        public int TotalPayments { get; set; }
        public int CompletedPayments { get; set; }
        public int PendingPayments { get; set; }
        public int FailedPayments { get; set; }
        public int RefundedPayments { get; set; }
        public decimal TotalProcessed { get; set; }
        public decimal SuccessRate { get; set; }
        public decimal FailureRate { get; set; }
    }

    public class PaymentMethodBreakdownDto
    {
        public string? PaymentMethod { get; set; }
        public int TransactionCount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal Percentage { get; set; }
        public decimal SuccessRate { get; set; }
    }

    public class PaymentStatusBreakdownDto
    {
        public string? Status { get; set; }
        public int Count { get; set; }
        public decimal Amount { get; set; }
        public decimal Percentage { get; set; }
    }

    public class PaymentTrendDto
    {
        public DateTime Date { get; set; }
        public decimal CompletedAmount { get; set; }
        public int CompletedCount { get; set; }
        public decimal FailedAmount { get; set; }
        public int FailedCount { get; set; }
    }

    public class RefundMetricsDto
    {
        public int TotalRefunds { get; set; }
        public decimal TotalRefundedAmount { get; set; }
        public decimal RefundRate { get; set; }
        public decimal AverageRefundAmount { get; set; }
        public int RefundsToday { get; set; }
        public int RefundsThisWeek { get; set; }
        public int RefundsThisMonth { get; set; }
    }
}
