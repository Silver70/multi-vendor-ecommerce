# Analytics API - Quick Reference Guide

## Base URL
```
/api/analytics/
```

## Quick Endpoint List

### Revenue (6 endpoints)
```
GET /revenue/summary                  → Revenue overview
GET /revenue/by-status               → Sales by order status
GET /revenue/by-vendor               → Sales by vendor
GET /revenue/by-category             → Sales by category
GET /revenue/by-payment-method       → Sales by payment type
GET /revenue/trends                  → Revenue over time
```

### Orders (6 endpoints)
```
GET /orders/summary                  → Order overview
GET /orders/status-breakdown         → Distribution of orders
GET /orders/conversion-funnel        → Funnel analysis
GET /orders/cancellation-metrics     → Cancellation stats
GET /orders/geographic               → Orders by location
GET /orders/trends                   → Orders over time
```

### Customers (6 endpoints)
```
GET /customers/summary               → Customer overview
GET /customers/acquisition           → New customer trends
GET /customers/repeat                → Repeat buyer metrics
GET /customers/lifetime-value        → Customer value analysis
GET /customers/geographic            → Customers by location
GET /customers/source                → Acquisition source
```

### Products & Inventory (5 endpoints)
```
GET /products/performance            → Product sales metrics
GET /categories/sales                → Category performance
GET /inventory/levels                → Stock levels
GET /inventory/low-stock             → Stock alerts
GET /vendors/performance             → Vendor metrics
```

### Payments (4 endpoints)
```
GET /payments/summary                → Payment overview
GET /payments/by-method              → By payment type
GET /payments/refund-metrics         → Refund statistics
GET /payments/trends                 → Payments over time
```

### Reviews (5 endpoints)
```
GET /reviews/summary                 → Review overview
GET /reviews/rating-distribution     → Star ratings
GET /reviews/product-ratings         → Per-product ratings
GET /reviews/top-rated               → Best products
GET /reviews/low-rated               → Worst products
```

---

## Common Query Parameters

### Date Filtering
```
?fromDate=2024-10-01&toDate=2024-10-31
```

### Time Period Aggregation
```
?period=daily        # Options: daily, weekly, monthly
```

### Pagination
```
?pageNumber=1&pageSize=50
```

### Thresholds & Limits
```
?threshold=10        # For low stock alerts
?limit=10            # For top/bottom lists
?minReviews=5        # Minimum reviews for filtering
```

---

## Response Examples

### Revenue Summary
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

### Order Summary
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

### Customer Summary
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

### Product Performance
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

## Frontend Usage

### Chart Data
```javascript
// Daily revenue trend
const revenue = await fetch('/api/analytics/revenue/trends?period=daily')
  .then(r => r.json());
// Use revenue.map(r => r.revenue) for chart data

// Order conversion funnel
const funnel = await fetch('/api/analytics/orders/conversion-funnel')
  .then(r => r.json());
// Use funnel.map(f => f.percentage) for visualization
```

### Dashboard Cards
```javascript
// Revenue card
const summary = await fetch('/api/analytics/revenue/summary')
  .then(r => r.json());
// Display summary.totalRevenue, summary.averageOrderValue, etc.

// Customer card
const customers = await fetch('/api/analytics/customers/summary')
  .then(r => r.json());
// Display customers.totalCustomers, customers.newCustomersThisMonth, etc.
```

### Tables
```javascript
// Top products
const products = await fetch('/api/analytics/products/performance?pageSize=10')
  .then(r => r.json());
// Render as table with columns: productName, unitsSold, totalRevenue, averageRating

// Customer lifetime value
const clv = await fetch('/api/analytics/customers/lifetime-value?pageSize=20')
  .then(r => r.json());
// Render as table with columns: customerName, totalSpent, orderCount, lastOrderDate
```

### Alerts
```javascript
// Low stock alerts
const alerts = await fetch('/api/analytics/inventory/low-stock?threshold=10')
  .then(r => r.json());
// Show as alert list: SKU, productName, daysUntilStockout

// Refund alerts
const refunds = await fetch('/api/analytics/payments/refund-metrics')
  .then(r => r.json());
// Monitor refunds.refundRate and refunds.totalRefundedAmount
```

---

## Status Codes

```
200 OK               Request successful
400 Bad Request      Invalid parameters
404 Not Found        Resource not found
500 Server Error     Something went wrong
```

---

## Trend Period Examples

### Daily Revenue
```
GET /api/analytics/revenue/trends?period=daily&fromDate=2024-10-01&toDate=2024-10-31
Returns: Array of 31 objects (one per day)
```

### Weekly Customer Acquisition
```
GET /api/analytics/customers/acquisition?period=weekly
Returns: Array of weekly acquisition data
```

### Monthly Payment Trends
```
GET /api/analytics/payments/trends?period=monthly
Returns: Array of monthly payment data
```

---

## Performance Tips

1. **Cache Results:** Cache summary endpoints for 5-15 minutes
2. **Pagination:** Always use pagination for large datasets
3. **Date Ranges:** Avoid querying very large date ranges at once
4. **Combine Queries:** Batch multiple requests when possible

---

## Common Use Cases

### "How is my business performing?"
```
GET /api/analytics/revenue/summary
GET /api/analytics/orders/summary
GET /api/analytics/customers/summary
```

### "Where are my sales coming from?"
```
GET /api/analytics/revenue/by-vendor
GET /api/analytics/revenue/by-category
GET /api/analytics/customers/source
```

### "What products are selling well?"
```
GET /api/analytics/products/performance?pageSize=20
GET /api/analytics/reviews/top-rated?limit=10
```

### "What products need attention?"
```
GET /api/analytics/inventory/low-stock
GET /api/analytics/reviews/low-rated?limit=10
```

### "Are customers satisfied?"
```
GET /api/analytics/reviews/summary
GET /api/analytics/reviews/rating-distribution
GET /api/analytics/customers/repeat
```

### "What's happening with payments?"
```
GET /api/analytics/payments/summary
GET /api/analytics/payments/by-method
GET /api/analytics/payments/refund-metrics
```

---

## Date Format
All dates use ISO 8601 format: `YYYY-MM-DD`

Examples:
```
?fromDate=2024-10-01
?toDate=2024-10-31
```

---

## Pagination Example
```
Page 1:  GET /api/analytics/products/performance?pageNumber=1&pageSize=50
Page 2:  GET /api/analytics/products/performance?pageNumber=2&pageSize=50
Page 3:  GET /api/analytics/products/performance?pageNumber=3&pageSize=50
```

---

## Error Response Format
```json
{
  "message": "Error description"
}
```

---

## Implementation Checklist

- [ ] Test all 32 endpoints
- [ ] Integrate revenue endpoints into dashboard
- [ ] Integrate order endpoints into dashboard
- [ ] Integrate customer endpoints into dashboard
- [ ] Integrate product endpoints into dashboard
- [ ] Integrate payment endpoints into dashboard
- [ ] Integrate review endpoints into dashboard
- [ ] Implement caching strategy
- [ ] Add error handling/fallbacks
- [ ] Set up real-time metric updates
- [ ] Create alert system for low inventory

---

## Quick Links
- Full Documentation: `/ANALYTICS_API_ENDPOINTS.md`
- Implementation Details: `/ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- Controller: `/apps/backend/EcommerceApi/Controllers/AnalyticsController.cs`
- DTOs: `/apps/backend/EcommerceApi/DTOs/Analytics/`

