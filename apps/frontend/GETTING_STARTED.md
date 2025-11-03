# Frontend Channels - Getting Started Guide

## For New Developers

Welcome! This guide will help you get up to speed with the multi-channel implementation.

## 5-Minute Overview

The frontend has been extended to support multiple sales channels (e.g., Direct Web, Shopify, Amazon). Here's what you need to know:

### Core Concepts

**Channel** - A sales context (Direct Web, Shopify, etc.)
- Has: Name, Currency, Country, Tax Configuration
- Can have: Products, Vendors, Custom Pricing, Tax Rules

**Tax** - Calculated per order based on channel rules
- Exclusive: Added on top of price
- Inclusive: Already in the price

**Currency** - Each channel operates in one currency
- Formatted based on country locale
- Converted for display when needed

### What's Available

✅ **Types** - Full TypeScript definitions
✅ **Queries** - React Query hooks for all operations
✅ **Components** - Reusable UI elements
✅ **Utilities** - Tax and currency functions
✅ **Documentation** - Comprehensive guides

## Installation & Setup

### 1. Review Type System

```bash
# Check available types
cat apps/frontend/src/types/channel.ts
```

Key types:
- `Channel` - Main channel entity
- `ChannelTaxRule` - Tax configuration
- `TaxBehavior` - "inclusive" | "exclusive"

### 2. Check Query Hooks

```bash
# See available hooks
cat apps/frontend/src/lib/queries/channels.ts
```

Three main hook families:
- `channelQueries` - Get channels
- `channelTaxRuleQueries` - Tax management
- `channelProductQueries` - Product availability

### 3. Explore Components

```bash
# View component implementations
ls -la apps/frontend/src/components/channel/
```

Main components:
- `ChannelSelectorComponent` - User selects channel
- `ChannelBadge` - Display channel info
- `TaxBreakdown` - Show tax details
- `CurrencyDisplay` - Format prices

### 4. Test Utilities

```typescript
// In your browser console:
import { formatPrice } from '~/lib/utils/currency';
console.log(formatPrice(99.99, 'USD'));
// Output: "$99.99"

import { calculateOrderTotal } from '~/lib/utils/tax';
console.log(calculateOrderTotal(100, 0.07, 'exclusive', 10));
// Output: { subtotal: 100, taxAmount: 7, shippingAmount: 10, total: 117 }
```

## Your First Task

### Task 1: Add Channel Selector to Header

1. **Open** `src/routes/__root.tsx` or your main layout

2. **Import** the component:
```typescript
import { ChannelSelectorComponent, useInitializeChannel } from "~/components/channel";
```

3. **Add to layout**:
```typescript
export default function RootLayout() {
  const defaultChannel = useInitializeChannel();
  const [selectedChannel, setSelectedChannel] = defaultChannel;

  return (
    <header>
      <ChannelSelectorComponent
        selectedChannelId={selectedChannel?.id}
        onChannelChange={(channel) => {
          setSelectedChannel(channel);
          // The component already saves to localStorage
        }}
      />
    </header>
  );
}
```

Done! Users can now select channels.

### Task 2: Show Prices with Currency

1. **Open** product card component

2. **Import** utilities:
```typescript
import { CurrencyDisplay } from "~/components/channel";
import { formatPriceByCountry } from "~/lib/utils/currency";
```

3. **Use in component**:
```typescript
<CurrencyDisplay
  amount={product.price}
  currencyCode={selectedChannel.currencyCode}
  countryCode={selectedChannel.countryCode}
/>
```

### Task 3: Add Tax to Checkout

1. **Get tax info** in checkout:
```typescript
import { useQuery } from "@tanstack/react-query";
import { channelTaxRuleQueries } from "~/lib/queries/channels";

const { data: taxInfo } = useQuery(
  channelTaxRuleQueries.calculateTax(selectedChannel.id, cartTotal)
);
```

2. **Display breakdown**:
```typescript
import { TaxBreakdown } from "~/components/channel";

<TaxBreakdown
  subtotal={cartTotal}
  taxAmount={taxInfo.taxAmount}
  taxRate={taxInfo.taxRate}
  total={cartTotal + taxInfo.taxAmount}
  taxBehavior={selectedChannel.taxBehavior}
  currencyCode={selectedChannel.currencyCode}
/>
```

3. **Include in order**:
```typescript
const orderData = {
  customerId: customerId,
  channelId: selectedChannel.id, // Add this!
  addressId: addressId,
  items: cartItems,
};
```

## Common Patterns

### Get Current Channel Anywhere

```typescript
function useSelectedChannel() {
  const channelId = localStorage.getItem("selectedChannelId") || "";
  return useQuery(channelQueries.getById(channelId));
}
```

### Format All Prices Same Way

```typescript
function formatPrice(amount: number) {
  const channel = useSelectedChannel();
  return formatPriceByCountry(amount, channel.currencyCode, channel.countryCode);
}
```

### Check Product Availability

```typescript
function isAvailable(product, channelProducts) {
  const cp = channelProducts?.find(p => p.productId === product.id);
  return cp?.isActive ?? false;
}
```

### Conditional Rendering by Tax Behavior

```typescript
{selectedChannel?.taxBehavior === 'inclusive' && (
  <Alert>Tax is included in prices</Alert>
)}

{selectedChannel?.taxBehavior === 'exclusive' && (
  <Alert>Tax will be added at checkout</Alert>
)}
```

## File Navigation

### When You Need...

**To add a new channel operation:**
→ Edit `lib/queries/channels.ts`

**To create channel UI:**
→ Add to `components/channel/` folder

**To use tax calculations:**
→ Import from `lib/utils/tax.ts`

**To format prices:**
→ Import from `lib/utils/currency.ts`

**To understand types:**
→ Read `types/channel.ts`

## Testing Your Changes

### Quick Test in Browser

```typescript
// Open DevTools Console

// Load all channels
await fetch('http://localhost:5176/api/channels')
  .then(r => r.json())
  .then(channels => console.log(channels))

// Calculate tax
await fetch('http://localhost:5176/api/channels/YOUR_ID/calculate-tax?amount=100')
  .then(r => r.json())
  .then(tax => console.log(tax))
```

### Test Utility Functions

```typescript
// In React component or console
import * as tax from '~/lib/utils/tax';
import * as currency from '~/lib/utils/currency';

tax.calculateOrderTotal(100, 0.07, 'exclusive', 10);
currency.formatPriceByCountry(99.99, 'USD', 'US');
```

## Troubleshooting

### "Channel is undefined"

Check:
```typescript
// Make sure you're calling useQuery correctly
const { data: channel } = useQuery(channelQueries.getById(channelId));

// Or get from localStorage
const channelId = localStorage.getItem("selectedChannelId");
if (!channelId) {
  // User hasn't selected a channel yet
}
```

### "formatPrice is not a function"

Check import:
```typescript
// Wrong
import { formatPrice } from "~/components/channel";

// Correct
import { formatPrice } from "~/lib/utils/currency";
```

### Tax not calculating

Check:
```typescript
// Make sure channelId is valid
console.log(channelId);

// Make sure amount is > 0
console.log(cartTotal);

// Check React Query enabled
const query = channelTaxRuleQueries.calculateTax(channelId, amount);
console.log(query); // Should show enabled: true
```

### Currency showing wrong format

Check:
```typescript
// Make sure countryCode is 2-letter ISO code
console.log(selectedChannel.countryCode); // Should be "US", "DE", etc.

// Check currency code is valid
const valid = isValidCurrency(currencyCode);
```

## Next Steps

1. **Review** `CHANNELS_FRONTEND_IMPLEMENTATION.md` for detailed guide
2. **Check** `CHANNELS_QUICK_REFERENCE.md` for examples
3. **Implement** admin pages (channels, tax rules)
4. **Add** to existing features (products, orders, etc.)
5. **Test** with different channels
6. **Document** your changes

## Learning Resources

📖 **Start Here:**
- `CHANNELS_QUICK_REFERENCE.md` - Copy-paste examples

📚 **Deep Dive:**
- `CHANNELS_FRONTEND_IMPLEMENTATION.md` - Step-by-step guide
- `CHANNELS_ARCHITECTURE.md` - System design

🔍 **API Reference:**
- Backend: `CHANNELS_ENTITY_IMPACT_ANALYSIS.md`

🧪 **Code Examples:**
- Existing components in `components/channel/`
- Existing queries in `lib/queries/`

## Tips & Tricks

### Use Keyboard Shortcuts

```typescript
// Quick import
import { CurrencyDisplay } from "~/components/channel"; // Auto-complete available

// Quick type check
const channel: Channel = ...;
```

### Browser DevTools

```typescript
// React Query DevTools (if installed)
// Shows all queries and mutations in real-time

// Console shortcuts
// Format a price in console:
formatPrice(99, 'USD')
```

### Hot Reload

The dev server supports hot reload - edit a file and see changes instantly:
```bash
cd apps/frontend
npm run dev
```

## Common Mistakes to Avoid

❌ **Don't:**
```typescript
// Using wrong import path
import { formatPrice } from "~/components/channel";
```

✅ **Do:**
```typescript
// Use correct import path
import { formatPrice } from "~/lib/utils/currency";
```

---

❌ **Don't:**
```typescript
// Forgetting to include channelId in order
const order = { customerId, addressId, items };
```

✅ **Do:**
```typescript
// Always include channelId
const order = { customerId, addressId, items, channelId };
```

---

❌ **Don't:**
```typescript
// Hardcoding tax percentage
const tax = 0.07;
```

✅ **Do:**
```typescript
// Use channel's tax configuration
const tax = selectedChannel.defaultTaxRate;
// Or calculate dynamically
const { data: taxInfo } = useQuery(channelTaxRuleQueries.calculateTax(...));
```

## Getting Help

### If You're Stuck:

1. Check the **quick reference**: `CHANNELS_QUICK_REFERENCE.md`
2. Look for **examples** in the guide: `CHANNELS_FRONTEND_IMPLEMENTATION.md`
3. Review **component code** in `src/components/channel/`
4. Check **types** in `src/types/channel.ts`
5. Read **backend docs**: `CHANNELS_ENTITY_IMPACT_ANALYSIS.md`

### Questions About:

**Types** → Read `src/types/channel.ts`
**Queries** → Check `src/lib/queries/channels.ts`
**Components** → Look at `src/components/channel/`
**Utilities** → Read `src/lib/utils/tax.ts` or `currency.ts`
**Integration** → See `CHANNELS_FRONTEND_IMPLEMENTATION.md`

## Your Progress

Track your implementation:

- [ ] Understand core concepts (5 min)
- [ ] Review type system (5 min)
- [ ] Check available components (5 min)
- [ ] Add channel selector to header (15 min)
- [ ] Display prices with currency (15 min)
- [ ] Add tax calculation to checkout (20 min)
- [ ] Test full flow (15 min)
- [ ] Create admin pages (2-3 hours)
- [ ] Integrate everywhere (varies)

**Total: 4-5 hours for basic integration**

---

**Welcome to the team!** You now have everything needed to work with the channels system. Happy coding! 🚀

Questions? Check the docs. Something missing? It's probably in the implementation guide!
