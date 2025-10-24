# Analytics API Endpoints Documentation

## Overview
The Analytics API provides comprehensive business intelligence endpoints for the e-commerce platform. All endpoints are under `/api/analytics/` and return JSON responses with various metrics and KPIs.

## Base URL
```
/api/analytics/
```

---

## 1. Revenue Analytics

### Get Revenue Summary
**Endpoint:** `GET /api/analytics/revenue/summary`

**Query Parameters:**
- `fromDate` (DateTime?, optional) - Start date for analysis
- `toDate` (DateTime?, optional) - End date for analysis

**Response:**
```json
{
  "totalRevenue": 50000,
  "pendingRevenue": 5000,
  "completedRevenue": 45000,
  "refundedAmount": 500,
  "totalOrders": 100,
  "averageOrderValue": 500
}
```

---

### Get Revenue by Status
**Endpoint:** `GET /api/analytics/revenue/by-status`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "category": "paid",
    "categoryType": "Status",
    "revenue": 45000,
    "orderCount": 90,
    "averageOrderValue": 500
  },
  {
    "category": "pending",
    "categoryType": "Status",
    "revenue": 5000,
    "orderCount": 10,
    "averageOrderValue": 500
  }
]
```

---

### Get Revenue by Vendor
**Endpoint:** `GET /api/analytics/revenue/by-vendor`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "category": "Vendor A",
    "categoryType": "Vendor",
    "revenue": 30000,
    "orderCount": 60,
    "averageOrderValue": 500
  },
  {
    "category": "Vendor B",
    "categoryType": "Vendor",
    "revenue": 20000,
    "orderCount": 40,
    "averageOrderValue": 500
  }
]
```

---

### Get Revenue by Category
**Endpoint:** `GET /api/analytics/revenue/by-category`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "category": "Electronics",
    "categoryType": "Category",
    "revenue": 35000,
    "orderCount": 70,
    "averageOrderValue": 500
  },
  {
    "category": "Clothing",
    "categoryType": "Category",
    "revenue": 15000,
    "orderCount": 30,
    "averageOrderValue": 500
  }
]
```

---

### Get Revenue by Payment Method
**Endpoint:** `GET /api/analytics/revenue/by-payment-method`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "category": "card",
    "categoryType": "PaymentMethod",
    "revenue": 45000,
    "orderCount": 90,
    "averageOrderValue": 500
  },
  {
    "category": "wallet",
    "categoryType": "PaymentMethod",
    "revenue": 5000,
    "orderCount": 10,
    "averageOrderValue": 500
  }
]
```

---

### Get Revenue Trends
**Endpoint:** `GET /api/analytics/revenue/trends`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)
- `period` (string, optional, default: "daily") - Options: "daily", "weekly", "monthly"

**Response:**
```json
[
  {
    "date": "2024-10-20",
    "revenue": 5000,
    "orderCount": 10,
    "averageOrderValue": 500
  },
  {
    "date": "2024-10-21",
    "revenue": 6000,
    "orderCount": 12,
    "averageOrderValue": 500
  }
]
```

---

## 2. Order Analytics

### Get Order Summary
**Endpoint:** `GET /api/analytics/orders/summary`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
{
  "totalOrders": 100,
  "pendingOrders": 10,
  "paidOrders": 50,
  "shippedOrders": 30,
  "deliveredOrders": 8,
  "cancelledOrders": 2,
  "averageOrderValue": 500,
  "totalOrderValue": 50000
}
```

---

### Get Order Status Breakdown
**Endpoint:** `GET /api/analytics/orders/status-breakdown`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "status": "paid",
    "count": 50,
    "percentage": 50.0,
    "totalAmount": 25000
  },
  {
    "status": "pending",
    "count": 10,
    "percentage": 10.0,
    "totalAmount": 5000
  }
]
```

---

### Get Order Conversion Funnel
**Endpoint:** `GET /api/analytics/orders/conversion-funnel`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "stage": "Pending",
    "count": 100,
    "percentage": 100.0,
    "conversionRateFromPrevious": 100.0
  },
  {
    "stage": "Paid",
    "count": 90,
    "percentage": 90.0,
    "conversionRateFromPrevious": 90.0
  },
  {
    "stage": "Shipped",
    "count": 60,
    "percentage": 60.0,
    "conversionRateFromPrevious": 66.67
  },
  {
    "stage": "Delivered",
    "count": 58,
    "percentage": 58.0,
    "conversionRateFromPrevious": 96.67
  }
]
```

---

### Get Order Cancellation Metrics
**Endpoint:** `GET /api/analytics/orders/cancellation-metrics`

**Query Parameters:** None

**Response:**
```json
{
  "totalCancellations": 2,
  "cancellationRate": 2.0,
  "cancelledAmount": 1000,
  "cancellationsToday": 0,
  "cancellationsThisWeek": 1,
  "cancellationsThisMonth": 2
}
```

---

### Get Geographic Order Metrics
**Endpoint:** `GET /api/analytics/orders/geographic`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "city": "New York",
    "country": "USA",
    "orderCount": 40,
    "totalAmount": 20000,
    "averageOrderValue": 500
  },
  {
    "city": "Los Angeles",
    "country": "USA",
    "orderCount": 30,
    "totalAmount": 15000,
    "averageOrderValue": 500
  }
]
```

---

### Get Order Trends
**Endpoint:** `GET /api/analytics/orders/trends`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)
- `period` (string, optional, default: "daily") - Options: "daily", "weekly", "monthly"

**Response:**
```json
[
  {
    "date": "2024-10-20",
    "orderCount": 10,
    "totalAmount": 5000
  },
  {
    "date": "2024-10-21",
    "orderCount": 12,
    "totalAmount": 6000
  }
]
```

---

## 3. Customer Analytics

### Get Customer Summary
**Endpoint:** `GET /api/analytics/customers/summary`

**Query Parameters:** None

**Response:**
```json
{
  "totalCustomers": 500,
  "websiteCustomers": 400,
  "adminCreatedCustomers": 100,
  "activeCustomers": 350,
  "newCustomersToday": 5,
  "newCustomersThisWeek": 30,
  "newCustomersThisMonth": 100,
  "averageCustomerValue": 142.86
}
```

---

### Get Customer Acquisition
**Endpoint:** `GET /api/analytics/customers/acquisition`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)
- `period` (string, optional, default: "daily") - Options: "daily", "weekly", "monthly"

**Response:**
```json
[
  {
    "date": "2024-10-20",
    "totalNewCustomers": 10,
    "websiteCustomers": 8,
    "adminCreatedCustomers": 2
  },
  {
    "date": "2024-10-21",
    "totalNewCustomers": 12,
    "websiteCustomers": 9,
    "adminCreatedCustomers": 3
  }
]
```

---

### Get Repeat Customer Metrics
**Endpoint:** `GET /api/analytics/customers/repeat`

**Query Parameters:** None

**Response:**
```json
{
  "totalCustomers": 500,
  "oneTimeCustomers": 300,
  "repeatCustomers": 200,
  "repeatCustomerRate": 40.0,
  "averageOrdersPerRepeatCustomer": 2.5
}
```

---

### Get Customer Lifetime Value
**Endpoint:** `GET /api/analytics/customers/lifetime-value`

**Query Parameters:**
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 50)

**Response:**
```json
[
  {
    "customerId": "uuid",
    "customerName": "John Doe",
    "email": "john@example.com",
    "totalSpent": 5000,
    "orderCount": 10,
    "averageOrderValue": 500,
    "firstOrderDate": "2024-01-15",
    "lastOrderDate": "2024-10-20"
  }
]
```

---

### Get Geographic Customer Metrics
**Endpoint:** `GET /api/analytics/customers/geographic`

**Query Parameters:** None

**Response:**
```json
[
  {
    "city": "New York",
    "country": "USA",
    "customerCount": 100,
    "totalSpent": 50000,
    "averageCustomerValue": 500
  }
]
```

---

### Get Customer Source Metrics
**Endpoint:** `GET /api/analytics/customers/source`

**Query Parameters:** None

**Response:**
```json
[
  {
    "source": "website",
    "customerCount": 400,
    "percentage": 80.0,
    "totalSpent": 200000,
    "averageValue": 500
  },
  {
    "source": "admin",
    "customerCount": 100,
    "percentage": 20.0,
    "totalSpent": 50000,
    "averageValue": 500
  }
]
```

---

## 4. Product & Inventory Analytics

### Get Product Performance
**Endpoint:** `GET /api/analytics/products/performance`

**Query Parameters:**
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 50)
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "productId": "uuid",
    "productName": "Product A",
    "category": "Electronics",
    "vendor": "Vendor 1",
    "unitsSold": 100,
    "totalRevenue": 50000,
    "averagePrice": 500,
    "averageRating": 4.5,
    "reviewCount": 50
  }
]
```

---

### Get Category Sales Metrics
**Endpoint:** `GET /api/analytics/categories/sales`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "categoryId": "uuid",
    "categoryName": "Electronics",
    "productCount": 50,
    "unitsSold": 500,
    "totalRevenue": 250000,
    "percentage": 50.0
  }
]
```

---

### Get Inventory Levels
**Endpoint:** `GET /api/analytics/inventory/levels`

**Query Parameters:**
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 50)

**Response:**
```json
[
  {
    "variantId": "uuid",
    "sku": "SKU-001",
    "productName": "Product A",
    "currentStock": 50,
    "price": 500,
    "stockValue": 25000,
    "recentSales": 10,
    "turnoverRate": 0.2,
    "stockStatus": "Optimal"
  }
]
```

---

### Get Low Stock Alerts
**Endpoint:** `GET /api/analytics/inventory/low-stock`

**Query Parameters:**
- `threshold` (int, optional, default: 10)

**Response:**
```json
[
  {
    "variantId": "uuid",
    "sku": "SKU-002",
    "productName": "Product B",
    "currentStock": 5,
    "recentSalesPerDay": 2,
    "daysUntilStockout": 2
  }
]
```

---

### Get Vendor Performance
**Endpoint:** `GET /api/analytics/vendors/performance`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "vendorId": "uuid",
    "vendorName": "Vendor 1",
    "productCount": 50,
    "totalRevenue": 100000,
    "totalOrders": 50,
    "averageRating": 4.5,
    "revenuePercentage": 33.33
  }
]
```

---

## 5. Payment Analytics

### Get Payment Summary
**Endpoint:** `GET /api/analytics/payments/summary`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
{
  "totalPayments": 100,
  "completedPayments": 90,
  "pendingPayments": 5,
  "failedPayments": 3,
  "refundedPayments": 2,
  "totalProcessed": 45000,
  "successRate": 90.0,
  "failureRate": 3.0
}
```

---

### Get Payments by Method
**Endpoint:** `GET /api/analytics/payments/by-method`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)

**Response:**
```json
[
  {
    "paymentMethod": "card",
    "transactionCount": 80,
    "totalAmount": 40000,
    "percentage": 88.89,
    "successRate": 92.5
  },
  {
    "paymentMethod": "wallet",
    "transactionCount": 10,
    "totalAmount": 5000,
    "percentage": 11.11,
    "successRate": 80.0
  }
]
```

---

### Get Refund Metrics
**Endpoint:** `GET /api/analytics/payments/refund-metrics`

**Query Parameters:** None

**Response:**
```json
{
  "totalRefunds": 2,
  "totalRefundedAmount": 1000,
  "refundRate": 2.0,
  "averageRefundAmount": 500,
  "refundsToday": 0,
  "refundsThisWeek": 1,
  "refundsThisMonth": 2
}
```

---

### Get Payment Trends
**Endpoint:** `GET /api/analytics/payments/trends`

**Query Parameters:**
- `fromDate` (DateTime?, optional)
- `toDate` (DateTime?, optional)
- `period` (string, optional, default: "daily") - Options: "daily", "weekly", "monthly"

**Response:**
```json
[
  {
    "date": "2024-10-20",
    "completedAmount": 5000,
    "completedCount": 9,
    "failedAmount": 500,
    "failedCount": 1
  }
]
```

---

## 6. Review Analytics

### Get Review Summary
**Endpoint:** `GET /api/analytics/reviews/summary`

**Query Parameters:** None

**Response:**
```json
{
  "totalReviews": 500,
  "averageRating": 4.2,
  "productsWithReviews": 200,
  "productsWithoutReviews": 50,
  "reviewCoverage": 80.0
}
```

---

### Get Rating Distribution
**Endpoint:** `GET /api/analytics/reviews/rating-distribution`

**Query Parameters:** None

**Response:**
```json
[
  {
    "stars": 1,
    "count": 20,
    "percentage": 4.0
  },
  {
    "stars": 2,
    "count": 30,
    "percentage": 6.0
  },
  {
    "stars": 3,
    "count": 100,
    "percentage": 20.0
  },
  {
    "stars": 4,
    "count": 200,
    "percentage": 40.0
  },
  {
    "stars": 5,
    "count": 150,
    "percentage": 30.0
  }
]
```

---

### Get Product Ratings
**Endpoint:** `GET /api/analytics/reviews/product-ratings`

**Query Parameters:**
- `pageNumber` (int, optional, default: 1)
- `pageSize` (int, optional, default: 50)

**Response:**
```json
[
  {
    "productId": "uuid",
    "productName": "Product A",
    "averageRating": 4.5,
    "reviewCount": 50,
    "oneStarCount": 2,
    "twoStarCount": 3,
    "threeStarCount": 10,
    "fourStarCount": 20,
    "fiveStarCount": 15
  }
]
```

---

### Get Top Rated Products
**Endpoint:** `GET /api/analytics/reviews/top-rated`

**Query Parameters:**
- `limit` (int, optional, default: 10)
- `minReviews` (int, optional, default: 1)

**Response:**
```json
[
  {
    "productId": "uuid",
    "productName": "Product A",
    "category": "Electronics",
    "averageRating": 4.8,
    "reviewCount": 50
  }
]
```

---

### Get Low Rated Products
**Endpoint:** `GET /api/analytics/reviews/low-rated`

**Query Parameters:**
- `limit` (int, optional, default: 10)
- `minReviews` (int, optional, default: 1)

**Response:**
```json
[
  {
    "productId": "uuid",
    "productName": "Product B",
    "category": "Clothing",
    "averageRating": 2.2,
    "reviewCount": 30
  }
]
```

---

## Common Response Codes

- **200 OK** - Request successful
- **400 Bad Request** - Invalid parameters
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

---

## Implementation Notes

1. **Date Filtering**: All endpoints with date parameters use `fromDate` and `toDate` (inclusive)
2. **Pagination**: Endpoints with pagination use `pageNumber` and `pageSize` parameters
3. **Time Periods**: Trend endpoints support "daily", "weekly", and "monthly" aggregation
4. **Performance**: Some calculations are done in-memory; consider implementing caching for large datasets
5. **Timezone**: All dates are in UTC (DateTime.UtcNow)

---

## Frontend Usage Examples

### Get Daily Revenue Trends
```
GET /api/analytics/revenue/trends?period=daily&fromDate=2024-10-01&toDate=2024-10-31
```

### Get Top 20 Products
```
GET /api/analytics/products/performance?pageSize=20
```

### Get Customers by Location
```
GET /api/analytics/customers/geographic
```

### Monitor Inventory Health
```
GET /api/analytics/inventory/low-stock?threshold=15
```

---

## Future Enhancements

- [ ] Add data caching for improved performance
- [ ] Implement date range presets (today, this week, this month, last 30 days)
- [ ] Add export functionality (CSV, PDF)
- [ ] Implement predictive analytics (forecasting)
- [ ] Add real-time alerts for critical metrics
- [ ] Support for custom date range comparisons (YoY, MoM)
- [ ] Add cohort analysis for customer segmentation
- [ ] Implement role-based access control for analytics
