# Frontend Channels Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                              │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Navigation/Header                                         │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ ChannelSelectorComponent                           │   │
│  │ │ (Dropdown with channel list + selection handler)   │   │
│  │ └────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Product Page                                              │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ ProductCard (uses CurrencyDisplay)                 │   │
│  │ │ - Shows channel-specific price                     │   │
│  │ │ - Displays availability in channel                 │   │
│  │ │ - Uses ChannelBadge for info                       │   │
│  │ └────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Checkout/Cart                                             │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ CheckoutForm                                       │   │
│  │ │ - Confirm channel selection                        │   │
│  │ │ - Calculate tax (using channel tax rules)          │   │
│  │ │ - Display TaxBreakdown component                   │   │
│  │ │ - Include channelId in order creation              │   │
│  │ └────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Admin Pages                                               │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ ChannelManagement                                  │   │
│  │ │ - List channels (ChannelCard)                      │   │
│  │ │ - Create/Edit/Delete channels                      │   │
│  │ └────────────────────────────────────────────────────┘   │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ TaxRuleManagement                                  │   │
│  │ │ - Manage tax rules per channel                     │   │
│  │ │ - Create/Edit/Delete rules                         │   │
│  │ └────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Vendor Dashboard                                          │
│  │ ┌────────────────────────────────────────────────────┐   │
│  │ │ VendorChannels (CompactChannelSelector)            │   │
│  │ │ - Filter orders by channel                         │   │
│  │ │ - Manage product channel availability              │   │
│  │ │ - View channel-specific metrics                    │   │
│  │ └────────────────────────────────────────────────────┘   │
│  └──────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              REACT QUERY + COMPONENTS                           │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────────────────────────┐
│  │ Components (~/components/channel/)                       │
│  │ ├─ ChannelSelector.tsx                                   │
│  │ ├─ ChannelBadge.tsx                                      │
│  │ ├─ TaxBreakdown.tsx                                      │
│  │ ├─ CurrencyDisplay.tsx                                   │
│  │ └─ index.ts                                              │
│  └──────────────────────────────────────────────────────────┘
│                         ↓
│  ┌──────────────────────────────────────────────────────────┐
│  │ Query Hooks (~/lib/queries/channels.ts)                  │
│  │                                                          │
│  │  channelQueries           channelTaxRuleQueries          │
│  │  ├─ getAll()              ├─ getByChannelId()           │
│  │  ├─ getById()             ├─ calculateTax()             │
│  │  ├─ useCreate...          └─ useCreate/Update/Delete    │
│  │  ├─ useUpdate...                                        │
│  │  └─ useDelete...          channelProductQueries         │
│  │                           ├─ getByChannelId()           │
│  │  channelVendorQueries     └─ useAdd/Remove...           │
│  │  ├─ getByChannelId()                                    │
│  │  ├─ getByVendorId()       All following React Query     │
│  │  └─ useAdd/Remove...      patterns with caching         │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘
│                         ↓
│  ┌──────────────────────────────────────────────────────────┐
│  │ Utilities (~/lib/utils/)                                 │
│  │ ├─ tax.ts                                                │
│  │ │  ├─ calculateTotalWithTax()                            │
│  │ │  ├─ calculateOrderTotal()                              │
│  │ │  ├─ doesTaxRuleApply()                                 │
│  │ │  └─ 10+ more functions                                 │
│  │ │                                                        │
│  │ └─ currency.ts                                           │
│  │    ├─ formatPrice()                                      │
│  │    ├─ formatPriceByCountry()                             │
│  │    ├─ getCountryFlag()                                   │
│  │    └─ 15+ more functions                                 │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘
│                         ↓
│  ┌──────────────────────────────────────────────────────────┐
│  │ Types (~/types/channel.ts)                               │
│  │ ├─ Channel                                               │
│  │ ├─ ChannelTaxRule                                        │
│  │ ├─ ChannelProduct                                        │
│  │ ├─ ChannelVendor                                         │
│  │ ├─ TaxBehavior                                           │
│  │ └─ All DTOs (Create/Update...)                           │
│  │                                                          │
│  └──────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│            TANSTACK START SERVER FUNCTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│
│  Endpoint Groups:
│  ├─ /api/channels/*                (list, get, create, update, delete)
│  ├─ /api/channels/{id}/tax-rules/* (list, get, create, update, delete, calculate)
│  ├─ /api/channels/{id}/products/*  (list, add, update, remove)
│  └─ /api/channels/{id}/vendors/*   (list, add, remove)
│
│  All use axios for HTTP requests with error handling
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND API ENDPOINTS                              │
├─────────────────────────────────────────────────────────────────┤
│
│  Base URL: http://localhost:5176
│
│  Channels
│  ├─ GET    /api/channels
│  ├─ GET    /api/channels/{id}
│  ├─ POST   /api/channels
│  ├─ PUT    /api/channels/{id}
│  └─ DELETE /api/channels/{id}
│
│  Tax Rules
│  ├─ GET    /api/channels/{channelId}/tax-rules
│  ├─ GET    /api/channels/{channelId}/calculate-tax?amount=100
│  ├─ POST   /api/channels/{channelId}/tax-rules
│  ├─ PUT    /api/channels/{channelId}/tax-rules/{ruleId}
│  └─ DELETE /api/channels/{channelId}/tax-rules/{ruleId}
│
│  Products
│  ├─ GET    /api/channels/{channelId}/products
│  ├─ POST   /api/channels/{channelId}/products
│  ├─ PUT    /api/channels/products/{channelProductId}
│  └─ DELETE /api/channels/products/{channelProductId}
│
│  Vendors
│  ├─ GET    /api/channels/{channelId}/vendors
│  ├─ GET    /api/vendors/{vendorId}/channels
│  ├─ POST   /api/channels/{channelId}/vendors
│  └─ DELETE /api/channels/vendors/{channelVendorId}
│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           .NET BACKEND (EF Core + SQL Server)                   │
├─────────────────────────────────────────────────────────────────┤
│
│  Entities
│  ├─ Channel
│  ├─ ChannelTaxRule
│  ├─ ChannelProduct
│  ├─ ChannelVendor
│  ├─ Order (with ChannelId)
│  ├─ OrderItem (with ChannelId)
│  └─ Product (with BasePrice)
│
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├─ Header
│  └─ ChannelSelectorComponent
│     └─ useQuery(channelQueries.getAll())
│
├─ ProductPage
│  ├─ useQuery(productQueries.getAll())
│  ├─ useQuery(channelProductQueries.getByChannelId(channelId))
│  │
│  └─ ProductCard (map)
│     ├─ ChannelBadge
│     └─ CurrencyDisplay
│
├─ CheckoutPage
│  ├─ useQuery(channelTaxRuleQueries.calculateTax())
│  │
│  └─ CheckoutForm
│     ├─ TaxBreakdown
│     └─ OrderSubmission (with channelId)
│
├─ AdminChannelsPage
│  ├─ useQuery(channelQueries.getAll())
│  │
│  └─ ChannelCard (map)
│     └─ Edit/Delete buttons
│
└─ AdminTaxRulesPage
   ├─ useQuery(channelTaxRuleQueries.getByChannelId())
   │
   └─ TaxRuleForm
      └─ Create/Edit/Delete
```

## State Management Flow

```
┌─ localStorage ──────────┐
│ selectedChannelId: "..." │
└────────────┬─────────────┘
             │
             ↓
    useInitializeChannel()
             │
             ↓
    ┌────────────────────┐
    │ selectedChannel    │
    │ (React.useState)   │
    └────────────┬───────┘
                 │
                 ↓
    ChannelSelectorComponent
    onChannelChange(channel)
             │
             ↓
    ┌─────────────────────────────────────┐
    │ React Query Cache                   │
    │                                     │
    │ channelQueries.getAll()             │
    │ channelProducts.getByChannelId()    │
    │ channelTaxRules.calculateTax()      │
    │ (with 5 min cache)                  │
    │                                     │
    └─────────────────────────────────────┘
                 │
                 ↓
    Component re-renders with new data
```

## Tax Calculation Flow

```
User selects address / Checkout form changes
         │
         ↓
  calculateTaxAmount event triggered
         │
         ↓
  useQuery(channelTaxRuleQueries.calculateTax(
    channelId,
    cartTotal,
    categoryId?,
    isB2B?
  ))
         │
         ↓
  Backend API: GET /api/channels/{id}/calculate-tax?amount=...
         │
         ↓
  ChannelService.CalculateTaxAsync()
  ├─ Find applicable tax rules
  ├─ Filter by country/region
  ├─ Filter by B2B/B2C
  ├─ Filter by date range
  ├─ Filter by min order amount
  └─ Return highest priority rule
         │
         ↓
  TaxCalculation { taxAmount, taxRate, ruleName }
         │
         ↓
  Frontend utility: calculateOrderTotal()
  ├─ If exclusive: taxAmount = subtotal * rate
  ├─ If inclusive: taxAmount = 0 (already in price)
  └─ Return { subtotal, taxAmount, total }
         │
         ↓
  <TaxBreakdown /> displays result
```

## Cache Invalidation Strategy

```
CREATE Channel
    ↓
useMutation onSuccess
    ↓
queryClient.invalidateQueries(channelQueries.lists())
    ↓
All queries with key ['channels', 'list'] refetch
    ↓
UI re-renders with new channel list

---

UPDATE Channel Tax Rule
    ↓
useMutation onSuccess
    ↓
queryClient.invalidateQueries(channelTaxRuleQueries.lists(channelId))
    ↓
All tax rule queries for that channel refetch
    ↓
UI re-renders with updated rules

---

ADD Product to Channel
    ↓
useMutation onSuccess
    ↓
queryClient.invalidateQueries(channelProductQueries.lists(channelId))
    ↓
Channel products query refetches
    ↓
Product availability updated in UI
```

## Utility Function Categories

```
Tax Utilities (lib/utils/tax.ts)
├─ Calculation
│  ├─ calculateTotalWithTax()
│  ├─ calculateOrderTotal()
│  └─ calculateTaxAmount()
│
├─ Formatting
│  ├─ formatTaxRate()
│  └─ getTaxBehaviorLabel()
│
└─ Logic
   ├─ doesTaxRuleApply()
   ├─ isTaxInclusive()
   └─ hasRegionalFilter()

Currency Utilities (lib/utils/currency.ts)
├─ Formatting
│  ├─ formatPrice()
│  ├─ formatPriceByCountry()
│  └─ formatCurrency()
│
├─ Lookup
│  ├─ getCountryName()
│  ├─ getCountryFlag()
│  ├─ getCurrencySymbol()
│  └─ getLocaleFromCountry()
│
├─ Data
│  ├─ getCommonCountries()
│  └─ getCommonCurrencies()
│
└─ Conversion
   ├─ parseCurrency()
   ├─ convertCurrency()
   └─ roundCurrency()
```

## Local Storage Schema

```
Key: selectedChannelId
Value: "550e8400-e29b-41d4-a716-446655440000"

Purpose: Persist user's channel selection across sessions
Usage: useInitializeChannel() reads this on app load
Clear: When user logs out (not automatic)
```

## Error Handling Strategy

```
API Error
    ↓
axios error interceptor
    ↓
Handled in server function
    ↓
Returns error to mutation/query
    ↓
Component checks error state
    ├─ Display toast.error()
    ├─ Show error alert
    └─ Fallback UI
```

## Testing Structure

```
__tests__/
├─ utils/
│  ├─ tax.test.ts
│  │  ├─ calculateTotalWithTax scenarios
│  │  ├─ Inclusive tax tests
│  │  ├─ Exclusive tax tests
│  │  └─ Edge cases
│  │
│  └─ currency.test.ts
│     ├─ formatPrice tests
│     ├─ Country code tests
│     └─ Currency conversion tests
│
├─ components/
│  ├─ ChannelSelector.test.tsx
│  ├─ TaxBreakdown.test.tsx
│  └─ CurrencyDisplay.test.tsx
│
└─ hooks/
   └─ channels.test.tsx
      ├─ Query hook tests
      └─ Mutation hook tests
```

---

**This architecture ensures:**
✅ Clear separation of concerns
✅ Easy testing
✅ Scalability
✅ Type safety
✅ Performance optimization
✅ Maintainability
