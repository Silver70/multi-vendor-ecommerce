# Frontend Channels Implementation Guide

This guide outlines all frontend changes required for multi-channel support. The implementation follows existing patterns using React Query, TanStack Start, and shadcn/ui.

## Quick Start

### 1. Types & Queries (✅ COMPLETED)

All types and queries have been created and follow the existing patterns:

**Files Created:**
- `src/types/channel.ts` - All channel-related TypeScript types and interfaces
- `src/lib/queries/channels.ts` - Server functions and React Query hooks

**Key Exports from channels.ts:**
```typescript
// Server Functions
getChannels(), getChannel(id), createChannel(), updateChannel(), deleteChannel()
getChannelTaxRules(), getChannelTaxRule(), createChannelTaxRule(), etc.
getChannelProducts(), addProductToChannel(), removeProductFromChannel()
getChannelVendors(), addVendorToChannel(), removeVendorFromChannel()

// Query Options (for useQuery)
channelQueries.getAll(), channelQueries.getById(id)
channelTaxRuleQueries.getByChannelId(), calculateTax()
channelProductQueries.getByChannelId()
channelVendorQueries.getByChannelId(), getByVendorId()

// Mutation Hooks
useCreateChannel(), useUpdateChannel(), useDeleteChannel()
useCreateChannelTaxRule(), useUpdateChannelTaxRule(), useDeleteChannelTaxRule()
useAddProductToChannel(), useUpdateChannelProduct(), useRemoveProductFromChannel()
useAddVendorToChannel(), useRemoveVendorFromChannel()
```

### 2. Utilities (✅ COMPLETED)

**Tax Utilities** (`src/lib/utils/tax.ts`)
```typescript
calculateTotalWithTax(subtotal, taxRate, taxBehavior)
calculateTaxAmount(subtotal, taxRate, taxBehavior)
calculateOrderTotal(subtotal, taxRate, taxBehavior, shippingAmount)
isTaxInclusive(taxBehavior)
getTaxBehaviorLabel(taxBehavior)
getTaxBehaviorDescription(taxBehavior)
formatTaxRate(rate)
doesTaxRuleApply(rule, isB2B, orderAmount, currentDate)
```

**Currency Utilities** (`src/lib/utils/currency.ts`)
```typescript
getLocaleFromCountry(countryCode)
getCountryFlag(countryCode)
getCountryName(countryCode)
getCurrencySymbol(currencyCode)
formatPrice(amount, currencyCode, locale)
formatPriceByCountry(amount, currencyCode, countryCode)
formatCurrency(amount, currencyCode, showSymbol)
parseCurrency(currencyString)
convertCurrency(amount, fromCurrency, toCurrency)
getCommonCurrencies(), getCommonCountries()
isValidCurrency(currencyCode)
```

### 3. Components (✅ COMPLETED)

**Files Created:**
- `src/components/channel/ChannelSelector.tsx` - Channel selection dropdown & utilities
- `src/components/channel/ChannelBadge.tsx` - Channel display components
- `src/components/channel/TaxBreakdown.tsx` - Tax information display
- `src/components/channel/CurrencyDisplay.tsx` - Currency formatting display
- `src/components/channel/index.ts` - Barrel export

**Usage Examples:**

```typescript
// In any component
import { ChannelSelectorComponent, ChannelBadge, TaxBreakdown, CurrencyDisplay } from "~/components/channel";

// Use channel selector in navigation
<ChannelSelectorComponent
  selectedChannelId={channelId}
  onChannelChange={(channel) => handleChannelChange(channel)}
/>

// Display channel info
<ChannelBadge channel={channel} showCurrency showCountry />

// Show tax breakdown
<TaxBreakdown
  subtotal={100}
  taxAmount={7}
  taxRate={0.07}
  total={107}
  taxBehavior="exclusive"
  currencyCode="USD"
/>

// Format prices with currency
<CurrencyDisplay
  amount={99.99}
  currencyCode="USD"
  countryCode="US"
/>
```

## Implementation Steps

### Phase 1: Integration with Existing Pages

#### 1.1 Add Channel Context to App

**File: `src/routes/__root.tsx` or main layout**

```typescript
import { useInitializeChannel } from "~/components/channel";
import { useQuery } from "@tanstack/react-query";
import { channelQueries } from "~/lib/queries/channels";

function RootLayout() {
  // Initialize selected channel from localStorage on app load
  const selectedChannel = useInitializeChannel();

  return (
    <div>
      {/* Your header/navigation */}
      {/* Add ChannelSelectorComponent here */}
      {/* Rest of layout */}
    </div>
  );
}
```

#### 1.2 Update Products Page

**File: `src/routes/products.tsx` or similar**

```typescript
import { useQuery } from "@tanstack/react-query";
import { productQueries } from "~/lib/queries/products";
import { channelProductQueries } from "~/lib/queries/channels";
import { CurrencyDisplay, ChannelBadge } from "~/components/channel";

export function ProductsPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string>();

  const { data: products } = useQuery(productQueries.getAll());
  const { data: channelProducts } = useQuery(
    channelProductQueries.getByChannelId(selectedChannelId)
  );

  // For each product, check if it's available in selected channel
  // Use channel-specific price if available

  return (
    <div>
      {products?.map((product) => {
        const channelProduct = channelProducts?.find(
          (cp) => cp.productId === product.id
        );
        const displayPrice = channelProduct?.channelPrice || product.basePrice;

        return (
          <div key={product.id}>
            <h3>{channelProduct?.channelName || product.name}</h3>
            <CurrencyDisplay
              amount={displayPrice}
              currencyCode={selectedChannel.currencyCode}
            />
            {!channelProduct?.isActive && (
              <Badge>Not available in this channel</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### 1.3 Update Orders/Checkout

**File: Order creation logic**

When creating an order, include the channelId:

```typescript
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "~/lib/queries/orders";
import { channelTaxRuleQueries } from "~/lib/queries/channels";

export function CheckoutForm() {
  const selectedChannel = // ... get from state/context
  const { data: taxInfo } = useQuery(
    channelTaxRuleQueries.calculateTax(
      selectedChannel.id,
      cartTotal,
      // ... categoryId, isB2B if applicable
    )
  );

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return createOrder({
        ...orderData,
        channelId: selectedChannel.id,
      });
    },
  });

  // Order will now include:
  // - channelId
  // - taxAmount (calculated)
  // - taxRate (applied)
  // - currencyCode (from channel)
  // - appliedTaxRuleName
}
```

### Phase 2: Admin Pages

#### 2.1 Create Channel Management Page

**File: `src/routes/admin/channels.tsx`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelQueries } from "~/lib/queries/channels";
import { ChannelCard } from "~/components/channel";
import { DataTable } from "~/components/ui/data-table"; // existing component

export function AdminChannelsPage() {
  const { data: channels } = useQuery(channelQueries.getAll());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1>Channel Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Channel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels?.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onEdit={() => handleEdit(channel)}
            onDelete={() => handleDelete(channel.id)}
          />
        ))}
      </div>

      {isCreateModalOpen && (
        <CreateChannelModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
```

#### 2.2 Create Tax Rules Management Page

**File: `src/routes/admin/channels/$channelId/tax-rules.tsx`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelTaxRuleQueries } from "~/lib/queries/channels";
import { TaxRuleForm } from "~/components/channel/TaxRuleForm"; // to be created
import { DataTable } from "~/components/ui/data-table";

export function TaxRulesPage({ params }: { params: { channelId: string } }) {
  const { data: rules } = useQuery(
    channelTaxRuleQueries.getByChannelId(params.channelId)
  );

  const columns = [
    { header: "Rule Name", accessorKey: "name" },
    { header: "Tax Rate", cell: (row) => `${(row.taxRate * 100).toFixed(1)}%` },
    { header: "Countries", cell: (row) => row.applicableCountryCode || "All" },
    { header: "Active", cell: (row) => row.isActive ? "✓" : "✗" },
    { header: "Actions", cell: (row) => <ActionButtons row={row} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1>Tax Rules for Channel</h1>
        <Button>Create Rule</Button>
      </div>

      <DataTable columns={columns} data={rules || []} />
    </div>
  );
}
```

### Phase 3: Shopping Experience

#### 3.1 Update Cart Component

**File: `src/components/Cart.tsx` (if exists) or cart logic**

```typescript
interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // This should be channel-specific
  channelId: string; // NEW
  channelCurrencyCode: string; // NEW
}

// When adding to cart:
const addToCart = (product, variant, channelId, channel) => {
  const cartItem = {
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    price: channelProduct?.channelPrice || product.basePrice,
    channelId: channelId,
    channelCurrencyCode: channel.currencyCode,
  };
  // ... add to cart
};
```

#### 3.2 Update Checkout with Tax Display

**File: Checkout component**

```typescript
import { TaxBreakdown } from "~/components/channel";
import { calculateOrderTotal } from "~/lib/utils/tax";

export function CheckoutSummary() {
  const selectedChannel = // ... get channel
  const cartTotal = // ... calculate from cart items
  const { data: taxCalc } = useQuery(
    channelTaxRuleQueries.calculateTax(selectedChannel.id, cartTotal)
  );

  const breakdown = calculateOrderTotal(
    cartTotal,
    taxCalc.taxRate,
    selectedChannel.taxBehavior,
    shippingCost
  );

  return (
    <TaxBreakdown
      subtotal={breakdown.subtotal}
      taxAmount={breakdown.taxAmount}
      taxRate={taxCalc.taxRate}
      taxRuleName={taxCalc.ruleName}
      shippingAmount={breakdown.shippingAmount}
      total={breakdown.total}
      taxBehavior={selectedChannel.taxBehavior}
      currencyCode={selectedChannel.currencyCode}
      countryCode={selectedChannel.countryCode}
    />
  );
}
```

### Phase 4: Vendor Dashboard

#### 4.1 Update Vendor Orders Page

Add channel filtering:

```typescript
export function VendorOrdersPage() {
  const [selectedChannelId, setSelectedChannelId] = useState<string>();

  const { data: channels } = useQuery(channelVendorQueries.getByVendorId(vendorId));
  const { data: orders } = useQuery(
    orderQueries.getByVendorAndChannel(vendorId, selectedChannelId)
  );

  return (
    <div>
      <div className="mb-4">
        <h2>Filter by Channel</h2>
        <ChannelSelector
          channels={channels?.map(cv => cv.channel) || []}
          selectedId={selectedChannelId}
          onSelect={setSelectedChannelId}
        />
      </div>

      {/* Display orders with channel info */}
      {orders?.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

## API Integration Checklist

### Channels API
- [ ] GET `/api/channels` - List all channels
- [ ] GET `/api/channels/{id}` - Get channel details
- [ ] POST `/api/channels` - Create channel (admin)
- [ ] PUT `/api/channels/{id}` - Update channel (admin)
- [ ] DELETE `/api/channels/{id}` - Delete channel (admin)

### Tax Rules API
- [ ] GET `/api/channels/{channelId}/tax-rules` - List tax rules
- [ ] GET `/api/channels/{channelId}/calculate-tax` - Calculate tax
- [ ] POST `/api/channels/{channelId}/tax-rules` - Create rule (admin)
- [ ] PUT `/api/channels/{channelId}/tax-rules/{ruleId}` - Update rule (admin)
- [ ] DELETE `/api/channels/{channelId}/tax-rules/{ruleId}` - Delete rule (admin)

### Channel Products API
- [ ] GET `/api/channels/{channelId}/products` - List products on channel
- [ ] POST `/api/channels/{channelId}/products` - Add product to channel
- [ ] PUT `/api/channels/products/{channelProductId}` - Update channel product
- [ ] DELETE `/api/channels/products/{channelProductId}` - Remove product

### Channel Vendors API
- [ ] GET `/api/channels/{channelId}/vendors` - List vendors on channel
- [ ] POST `/api/channels/{channelId}/vendors` - Add vendor to channel
- [ ] DELETE `/api/channels/vendors/{channelVendorId}` - Remove vendor
- [ ] GET `/api/vendors/{vendorId}/channels` - List channels for vendor

### Modified Existing APIs
- [ ] POST `/api/orders` - Now requires `channelId`, returns tax breakdown
- [ ] GET `/api/orders` - Add `channelId` filter parameter
- [ ] GET `/api/orders/{id}` - Returns channel info and tax details

## Component Creation Guide

### Creating Custom Components

Follow this pattern for new channel components:

```typescript
// File: src/components/channel/MyComponent.tsx

import { Channel } from "~/types/channel";
import { CurrencyDisplay } from "./CurrencyDisplay";
import { TaxBreakdown } from "./TaxBreakdown";

interface MyComponentProps {
  channel: Channel;
  // ... other props
}

export function MyComponent({ channel, ...props }: MyComponentProps) {
  // Component logic

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Using in Pages/Routes

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelQueries } from "~/lib/queries/channels";
import { MyComponent } from "~/components/channel";

export function MyPage() {
  const { data: channels } = useQuery(channelQueries.getAll());
  const selectedChannel = channels?.[0];

  if (!selectedChannel) return <div>Loading...</div>;

  return <MyComponent channel={selectedChannel} />;
}
```

## Testing Checklist

### Unit Tests
- [ ] `tax.ts` utilities with various scenarios
- [ ] `currency.ts` formatting and conversion
- [ ] Channel selection state management
- [ ] Tax calculation logic (inclusive/exclusive)

### Integration Tests
- [ ] Select channel → Load products → Add to cart flow
- [ ] Tax calculation with different rules
- [ ] Address/region change triggers tax recalculation
- [ ] Channel-specific pricing applied correctly

### E2E Tests
- [ ] Complete US checkout (exclusive tax)
- [ ] Complete EU checkout (inclusive tax)
- [ ] B2B order (no tax)
- [ ] Admin channel management flow
- [ ] Vendor multi-channel dashboard

## Common Patterns

### Accessing Selected Channel in Components

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelQueries } from "~/lib/queries/channels";

function MyComponent() {
  const channelId = localStorage.getItem("selectedChannelId") || "";
  const { data: channel } = useQuery(channelQueries.getById(channelId));

  // Use channel data
}
```

### Calculating Totals with Tax

```typescript
import { calculateOrderTotal } from "~/lib/utils/tax";

const breakdown = calculateOrderTotal(
  subtotal, // number
  taxRate,  // decimal (0.07 for 7%)
  taxBehavior, // "inclusive" | "exclusive"
  shippingAmount // optional number
);

// Returns: { subtotal, taxAmount, shippingAmount, total }
```

### Formatting Prices

```typescript
import { formatPriceByCountry } from "~/lib/utils/currency";

const formatted = formatPriceByCountry(99.99, "USD", "US");
// Output: "$99.99"
```

## Troubleshooting

### Channel not persisting across page reloads
- Check that `localStorage.setItem("selectedChannelId", channelId)` is being called
- Verify channel ID format matches backend

### Tax calculation returning 0
- Ensure `taxRate` is decimal (0.07, not 7)
- Check that tax rule is marked `isActive: true`
- Verify date range and filters match order parameters

### Currency formatting incorrect
- Verify currency code is valid ISO 4217 code
- Check locale string is correct
- Try fallback: use `formatPrice` with `"en-US"` locale

### Channel selector not showing options
- Check API endpoint is returning channels
- Verify `getChannels()` server function is working
- Look for network errors in browser console

## Next Steps

1. **Create admin pages** for channel and tax rule management
2. **Integrate with existing checkout** flow
3. **Add vendor channel management**
4. **Create analytics pages** with channel breakdown
5. **Add localization** for country/currency labels
6. **Write comprehensive tests**
7. **Deploy to staging** for QA testing

## Files Created

✅ `src/types/channel.ts` - Channel types and DTOs
✅ `src/lib/queries/channels.ts` - Server functions and query hooks
✅ `src/lib/utils/tax.ts` - Tax calculation utilities
✅ `src/lib/utils/currency.ts` - Currency formatting utilities
✅ `src/components/channel/ChannelSelector.tsx` - Channel selection component
✅ `src/components/channel/ChannelBadge.tsx` - Channel display components
✅ `src/components/channel/TaxBreakdown.tsx` - Tax display component
✅ `src/components/channel/CurrencyDisplay.tsx` - Currency display component
✅ `src/components/channel/index.ts` - Barrel exports

## Files to Create Next

- `src/components/channel/TaxRuleForm.tsx` - Form for creating/editing tax rules
- `src/components/channel/ChannelForm.tsx` - Form for creating/editing channels
- `src/routes/admin/channels.tsx` - Channel management page
- `src/routes/admin/channels/$channelId/index.tsx` - Channel details page
- `src/routes/admin/channels/$channelId/tax-rules.tsx` - Tax rules management page
