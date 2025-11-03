# Frontend Channels - Quick Reference

Fast lookup guide for common tasks and patterns.

## Imports Cheat Sheet

```typescript
// Types
import { Channel, ChannelTaxRule, TaxBehavior } from "~/types/channel";

// Query Hooks
import {
  channelQueries,
  channelTaxRuleQueries,
  channelProductQueries,
  channelVendorQueries,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useCreateChannelTaxRule,
} from "~/lib/queries/channels";

// Components
import {
  ChannelSelectorComponent,
  CompactChannelSelector,
  ChannelBadge,
  ChannelCard,
  TaxBreakdown,
  TaxBreakdownCompact,
  CurrencyDisplay,
  PriceWithCurrency,
} from "~/components/channel";

// Utilities
import {
  calculateTotalWithTax,
  calculateOrderTotal,
  formatTaxRate,
  getTaxBehaviorLabel,
  doesTaxRuleApply,
} from "~/lib/utils/tax";

import {
  formatPrice,
  formatPriceByCountry,
  getCountryFlag,
  getCountryName,
  getCurrencySymbol,
} from "~/lib/utils/currency";
```

## Common Tasks

### 1. Load All Channels

```typescript
const { data: channels, isLoading } = useQuery(channelQueries.getAll());
```

### 2. Load Single Channel

```typescript
const { data: channel } = useQuery(channelQueries.getById(channelId));
```

### 3. Create a Channel

```typescript
const mutation = useCreateChannel();

await mutation.mutateAsync({
  name: "US Direct",
  type: "web",
  countryCode: "US",
  currencyCode: "USD",
  defaultTaxRate: 0.07,
  taxBehavior: "exclusive",
  isB2B: false,
  isActive: true,
});
```

### 4. Update a Channel

```typescript
const mutation = useUpdateChannel(channelId);

await mutation.mutateAsync({
  name: "Updated Name",
  defaultTaxRate: 0.08,
  isActive: true,
});
```

### 5. Load Tax Rules for Channel

```typescript
const { data: rules } = useQuery(
  channelTaxRuleQueries.getByChannelId(channelId)
);
```

### 6. Calculate Tax

```typescript
const { data: taxInfo } = useQuery(
  channelTaxRuleQueries.calculateTax(
    channelId,
    cartTotal, // amount in cents or dollars
    categoryId, // optional
    isB2B // optional
  )
);

// taxInfo = { taxAmount, taxRate, ruleName }
```

### 7. Create Tax Rule

```typescript
const mutation = useCreateChannelTaxRule(channelId);

await mutation.mutateAsync({
  name: "US Sales Tax",
  taxRate: 0.07,
  applicableCountryCode: "US",
  applyToB2B: false,
  applyToB2C: true,
  taxBehavior: "exclusive",
  isActive: true,
});
```

### 8. Get Products on Channel

```typescript
const { data: channelProducts } = useQuery(
  channelProductQueries.getByChannelId(channelId)
);

// Get channel-specific price for product
const channelProduct = channelProducts?.find(cp => cp.productId === productId);
const displayPrice = channelProduct?.channelPrice || basePrice;
```

### 9. Add Product to Channel

```typescript
const mutation = useAddProductToChannel(channelId);

await mutation.mutateAsync({
  productId: productId,
  channelPrice: 99.99, // optional override
  channelName: "Special Name", // optional
  isActive: true,
});
```

### 10. Get Vendor Channels

```typescript
const { data: vendorChannels } = useQuery(
  channelVendorQueries.getByVendorId(vendorId)
);
```

## Component Usage

### Channel Selector in Header

```typescript
import { ChannelSelectorComponent } from "~/components/channel";

<ChannelSelectorComponent
  selectedChannelId={selectedId}
  onChannelChange={(channel) => {
    setSelectedChannel(channel);
    localStorage.setItem("selectedChannelId", channel.id);
  }}
/>
```

### Display Channel Badge

```typescript
import { ChannelBadge } from "~/components/channel";

<ChannelBadge
  channel={channel}
  showCurrency
  showCountry
  showFlag
  size="md"
/>
```

### Show Channel Card (Admin)

```typescript
import { ChannelCard } from "~/components/channel";

<ChannelCard
  channel={channel}
  className="w-full"
/>
```

### Display Price with Currency

```typescript
import { CurrencyDisplay } from "~/components/channel";

<CurrencyDisplay
  amount={99.99}
  currencyCode="USD"
  countryCode="US"
  showSymbol
  variant="default"
/>
```

### Show Tax Breakdown

```typescript
import { TaxBreakdown } from "~/components/channel";

<TaxBreakdown
  subtotal={100}
  taxAmount={7}
  taxRate={0.07}
  taxRuleName="US Sales Tax"
  shippingAmount={10}
  total={117}
  taxBehavior="exclusive"
  currencyCode="USD"
  countryCode="US"
/>
```

## Tax Calculation

### Basic Tax Calculation

```typescript
import { calculateTotalWithTax } from "~/lib/utils/tax";

const { taxAmount, total } = calculateTotalWithTax(
  100, // subtotal
  0.07, // tax rate (7%)
  "exclusive" // tax behavior
);
// taxAmount = 7, total = 107
```

### Full Order Breakdown

```typescript
import { calculateOrderTotal } from "~/lib/utils/tax";

const breakdown = calculateOrderTotal(
  100, // subtotal
  0.07, // tax rate
  "exclusive", // tax behavior
  10 // shipping amount
);
// Returns: { subtotal: 100, taxAmount: 7, shippingAmount: 10, total: 117 }
```

### Check if Rule Applies

```typescript
import { doesTaxRuleApply } from "~/lib/utils/tax";

const applies = doesTaxRuleApply(
  taxRule,
  isB2B, // customer type
  orderAmount, // order amount
  new Date() // current date
);
```

## Currency Formatting

### Format Price

```typescript
import { formatPrice } from "~/lib/utils/currency";

const formatted = formatPrice(99.99, "USD", "en-US");
// Output: "$99.99"
```

### Format by Country

```typescript
import { formatPriceByCountry } from "~/lib/utils/currency";

const formatted = formatPriceByCountry(99.99, "EUR", "DE");
// Output: "99,99 €" (German format)
```

### Get Country Flag

```typescript
import { getCountryFlag } from "~/lib/utils/currency";

const flag = getCountryFlag("US");
// Output: "🇺🇸"
```

### Get Currency Symbol

```typescript
import { getCurrencySymbol } from "~/lib/utils/currency";

const symbol = getCurrencySymbol("GBP");
// Output: "£"
```

## Patterns

### Initialize Channel on App Load

```typescript
import { useInitializeChannel } from "~/components/channel";
import { useEffect, useState } from "react";

function App() {
  const defaultChannel = useInitializeChannel();
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);

  useEffect(() => {
    if (defaultChannel) {
      setSelectedChannel(defaultChannel);
    }
  }, [defaultChannel]);

  return (
    // Pass selectedChannel to child components
  );
}
```

### Context for Selected Channel

Use the saved value from localStorage:

```typescript
function useSelectedChannel() {
  const channelId = localStorage.getItem("selectedChannelId") || "";
  const { data: channel } = useQuery(channelQueries.getById(channelId));
  return channel;
}
```

### Handle Channel Switch with Cart

```typescript
function ChannelSwitcher() {
  const [cartItems] = useCart();

  const handleChannelChange = (channel) => {
    if (cartItems.length > 0) {
      const confirmed = window.confirm(
        "Changing channels will clear your cart. Continue?"
      );
      if (!confirmed) return;
    }

    setSelectedChannel(channel);
    clearCart();
    localStorage.setItem("selectedChannelId", channel.id);
  };

  return <ChannelSelectorComponent onChannelChange={handleChannelChange} />;
}
```

### Get Price (Channel Override or Base)

```typescript
function getDisplayPrice(product, channelProduct) {
  if (channelProduct && channelProduct.channelPrice) {
    return channelProduct.channelPrice;
  }
  return product.basePrice;
}
```

### Check Product Availability in Channel

```typescript
function isProductAvailable(channelProducts, productId) {
  const cp = channelProducts?.find(cp => cp.productId === productId);
  return cp?.isActive ?? false;
}
```

## Error Handling

### Query Error

```typescript
const { data, error, isError } = useQuery(channelQueries.getAll());

if (isError) {
  return <div>Error loading channels: {error.message}</div>;
}
```

### Mutation Error

```typescript
const mutation = useCreateChannel();

const handleCreate = async (data) => {
  try {
    await mutation.mutateAsync(data);
    toast.success("Channel created!");
  } catch (error) {
    toast.error(`Failed: ${error.message}`);
  }
};
```

## Useful Constants

```typescript
// Tax behaviors
const TAX_BEHAVIORS = ["inclusive", "exclusive"] as const;

// Get all country codes
import { getCommonCountries } from "~/lib/utils/currency";
const countries = getCommonCountries();

// Get all currencies
import { getCommonCurrencies } from "~/lib/utils/currency";
const currencies = getCommonCurrencies();

// Tax rate percentage
const taxPercent = `${(0.07 * 100).toFixed(1)}%`; // "7.0%"
```

## Real-World Example: Product Card

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelProductQueries } from "~/lib/queries/channels";
import { CurrencyDisplay, ChannelBadge } from "~/components/channel";

function ProductCard({ product, selectedChannel }) {
  const { data: channelProducts } = useQuery(
    channelProductQueries.getByChannelId(selectedChannel.id)
  );

  const channelProduct = channelProducts?.find(
    cp => cp.productId === product.id
  );

  if (!channelProduct?.isActive) {
    return (
      <div className="opacity-50">
        <h3>{product.name}</h3>
        <p className="text-red-500">Not available in {selectedChannel.name}</p>
      </div>
    );
  }

  const displayPrice = channelProduct.channelPrice || product.basePrice;
  const displayName = channelProduct.channelName || product.name;

  return (
    <div className="border rounded p-4">
      <ChannelBadge channel={selectedChannel} size="sm" />
      <h3>{displayName}</h3>
      <CurrencyDisplay
        amount={displayPrice}
        currencyCode={selectedChannel.currencyCode}
        countryCode={selectedChannel.countryCode}
      />
      <button>Add to Cart</button>
    </div>
  );
}
```

## Real-World Example: Checkout Summary

```typescript
import { useQuery } from "@tanstack/react-query";
import { channelTaxRuleQueries } from "~/lib/queries/channels";
import { TaxBreakdown } from "~/components/channel";

function CheckoutSummary({ cartTotal, selectedChannel, shippingCost }) {
  const { data: taxInfo } = useQuery(
    channelTaxRuleQueries.calculateTax(selectedChannel.id, cartTotal)
  );

  if (!taxInfo) return <div>Calculating tax...</div>;

  return (
    <TaxBreakdown
      subtotal={cartTotal}
      taxAmount={taxInfo.taxAmount}
      taxRate={taxInfo.taxRate}
      taxRuleName={taxInfo.ruleName}
      shippingAmount={shippingCost}
      total={cartTotal + taxInfo.taxAmount + shippingCost}
      taxBehavior={selectedChannel.taxBehavior}
      currencyCode={selectedChannel.currencyCode}
      countryCode={selectedChannel.countryCode}
    />
  );
}
```

---

**Quick Help**: Use Ctrl+F to search for specific functions or tasks above.
