namespace EcommerceApi.DTOs.Analytics
{
    /// <summary>
    /// 🆕 NEW: DTO for vendor-channel revenue breakdown
    /// </summary>
    public class VendorChannelRevenueDto
    {
        /// <summary>
        /// Vendor name
        /// </summary>
        public string VendorName { get; set; } = string.Empty;

        /// <summary>
        /// Channel name
        /// </summary>
        public string ChannelName { get; set; } = string.Empty;

        /// <summary>
        /// Total revenue from this vendor on this channel
        /// </summary>
        public decimal Revenue { get; set; }

        /// <summary>
        /// Number of orders from this vendor on this channel
        /// </summary>
        public int OrderCount { get; set; }

        /// <summary>
        /// Number of items sold from this vendor on this channel
        /// </summary>
        public int ItemCount { get; set; }

        /// <summary>
        /// Average order value for this vendor on this channel
        /// </summary>
        public decimal AverageOrderValue => OrderCount > 0 ? Revenue / OrderCount : 0;
    }
}
