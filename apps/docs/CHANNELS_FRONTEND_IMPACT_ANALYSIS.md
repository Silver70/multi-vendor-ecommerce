# Channels Entity Introduction - Frontend Impact Analysis

## Executive Summary

Introducing multi-channel support with regional and tax awareness requires significant frontend changes. The frontend must support:

- Channel selection and context
- Regional/currency localization per channel
- Dynamic tax calculation and display
- Channel-specific pricing and product availability
- Enhanced order checkout with tax breakdown

This document outlines all components, pages, and features that need modification or creation.

---

## 1. Core Architecture Changes

### 1.1 Global State Management (Zustand)

#### Zustand Store Structure

**Channel Store:**

```typescript
interface ChannelState {
  channels: Channel[];
  selectedChannel: Channel | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchChannels: () => Promise<void>;
  selectChannel: (channelId: string) => void;
  setSelectedChannel: (channel: Channel) => void;
  clearError: () => void;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  description?: string;
  countryCode: string;
  regionCode?: string;
  currencyCode: string;
  isB2B: boolean;
  defaultTaxRate: number;
  taxBehavior: "inclusive" | "exclusive";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useChannelStore = create<ChannelState>((set) => ({
  channels: [],
  selectedChannel: null,
  loading: false,
  error: null,

  fetchChannels: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/channels");
      const data = await response.json();
      set({ channels: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  selectChannel: (channelId: string) => {
    set((state) => ({
      selectedChannel: state.channels.find((c) => c.id === channelId) || null,
    }));
    localStorage.setItem("selectedChannelId", channelId);
  },

  setSelectedChannel: (channel: Channel) => {
    set({ selectedChannel: channel });
    localStorage.setItem("selectedChannelId", channel.id);
  },

  clearError: () => set({ error: null }),
}));
```

**Tax Store:**

```typescript
interface TaxCalculation {
  taxAmount: number;
  taxRate: number;
  ruleName?: string;
}

interface TaxState {
  taxRules: Map<string, ChannelTaxRule[]>; // channelId -> rules
  calculatedTax: TaxCalculation | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTaxRules: (channelId: string) => Promise<void>;
  calculateTax: (
    channelId: string,
    amount: number,
    categoryId?: string,
    isB2B?: boolean
  ) => Promise<void>;
  createTaxRule: (
    channelId: string,
    rule: CreateChannelTaxRuleDto
  ) => Promise<void>;
  updateTaxRule: (
    ruleId: string,
    updates: UpdateChannelTaxRuleDto
  ) => Promise<void>;
  deleteTaxRule: (ruleId: string) => Promise<void>;
  clearError: () => void;
}

interface ChannelTaxRule {
  id: string;
  channelId: string;
  name: string;
  description?: string;
  taxRate: number;
  categoryId?: string;
  applicableCountryCode?: string;
  applicableRegionCode?: string;
  applyToB2B: boolean;
  applyToB2C: boolean;
  minimumOrderAmount?: number;
  taxBehavior: "inclusive" | "exclusive";
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export const useTaxStore = create<TaxState>((set) => ({
  taxRules: new Map(),
  calculatedTax: null,
  loading: false,
  error: null,

  fetchTaxRules: async (channelId: string) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/channels/${channelId}/tax-rules`);
      const rules = await response.json();
      set((state) => ({
        taxRules: new Map(state.taxRules).set(channelId, rules),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  calculateTax: async (
    channelId: string,
    amount: number,
    categoryId?: string,
    isB2B?: boolean
  ) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        ...(categoryId && { categoryId }),
        ...(typeof isB2B !== "undefined" && { isB2B: isB2B.toString() }),
      });
      const response = await fetch(
        `/api/channels/${channelId}/calculate-tax?${params}`
      );
      const tax = await response.json();
      set({ calculatedTax: tax, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createTaxRule: async (channelId: string, rule: CreateChannelTaxRuleDto) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/channels/${channelId}/tax-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      const newRule = await response.json();
      set((state) => ({
        taxRules: new Map(state.taxRules).set(channelId, [
          ...(state.taxRules.get(channelId) || []),
          newRule,
        ]),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateTaxRule: async (ruleId: string, updates: UpdateChannelTaxRuleDto) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/channels/tax-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const updated = await response.json();
      set((state) => ({
        taxRules: new Map([...state.taxRules]).forEach((rules, channelId) => {
          const idx = rules.findIndex((r) => r.id === ruleId);
          if (idx !== -1) rules[idx] = updated;
        }),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  deleteTaxRule: async (ruleId: string) => {
    set({ loading: true });
    try {
      await fetch(`/api/channels/tax-rules/${ruleId}`, { method: "DELETE" });
      set((state) => ({
        taxRules: new Map(
          [...state.taxRules].map(([channelId, rules]) => [
            channelId,
            rules.filter((r) => r.id !== ruleId),
          ])
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
```

**Cart Store Updates:**

```typescript
interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  channelId: string;
  channelCurrencyCode: string;
}

interface CartState {
  items: CartItem[];
  channelId: string | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (
    productId: string,
    variantId: string,
    quantity: number
  ) => void;
  setChannel: (channelId: string) => void;
  setTax: (taxAmount: number) => void;
  setShipping: (amount: number) => void;
  clearCart: () => void;
  calculateTotal: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  channelId: null,
  subtotal: 0,
  taxAmount: 0,
  shippingAmount: 0,
  total: 0,

  addItem: (item: CartItem) => {
    set((state) => {
      const items = [...state.items, item];
      return { items };
    });
    get().calculateTotal();
  },

  removeItem: (productId: string, variantId: string) => {
    set((state) => ({
      items: state.items.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId)
      ),
    }));
    get().calculateTotal();
  },

  updateQuantity: (productId: string, variantId: string, quantity: number) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      ),
    }));
    get().calculateTotal();
  },

  setChannel: (channelId: string) => set({ channelId, items: [] }),

  setTax: (taxAmount: number) => {
    set({ taxAmount });
    get().calculateTotal();
  },

  setShipping: (amount: number) => {
    set({ shippingAmount: amount });
    get().calculateTotal();
  },

  clearCart: () =>
    set({
      items: [],
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      total: 0,
    }),

  calculateTotal: () => {
    const state = get();
    const subtotal = state.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const total = subtotal + state.taxAmount + state.shippingAmount;
    set({ subtotal, total });
  },
}));
```

### 1.2 Store Initialization

With Zustand, no provider wrapper is needed. Stores are singleton instances that can be imported directly into components.

**App.tsx Setup:**

```typescript
import { useChannelStore } from '@/store';
import { useEffect } from 'react';

function App() {
  const fetchChannels = useChannelStore((state) => state.fetchChannels);

  useEffect(() => {
    // Initialize: fetch all channels on app load
    fetchChannels();
  }, [fetchChannels]);

  return (
    <div className="app">
      {/* Rest of app */}
    </div>
  );
}
```

**No need for ChannelProvider wrapper** - Zustand handles state globally without context overhead.

**Optional: Create a custom hook for common use cases**

```typescript
// hooks/useChannelContext.ts
import { useChannelStore } from "@/store";

export function useChannelContext() {
  return {
    selectedChannel: useChannelStore((state) => state.selectedChannel),
    channels: useChannelStore((state) => state.channels),
    selectChannel: useChannelStore((state) => state.selectChannel),
    loading: useChannelStore((state) => state.loading),
    error: useChannelStore((state) => state.error),
  };
}
```

### 1.3 Internationalization (i18n) Enhancement

**New i18n namespaces:**

- `channels` - Channel UI strings
- `tax` - Tax-related messages
- `currency` - Currency formatting
- `regions` - Region/country names

**Currency Formatter Hook:**

```typescript
export const useCurrencyFormatter = () => {
  const { selectedChannel } = useChannel();

  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat(
      getLocaleFromCountry(selectedChannel.countryCode),
      {
        style: "currency",
        currency: selectedChannel.currencyCode,
      }
    ).format(amount);
  };

  return { formatPrice };
};
```

---

## 2. Layout & Navigation Changes

### 2.1 Header/Navigation Updates

**Channel Selector Component (New)**

```typescript
// Location: components/Navigation/ChannelSelector.tsx
// Features:
// - Dropdown showing available channels
// - Country flag icon
// - Currency code badge
// - Is B2B indicator
// - Persist selection to localStorage
```

**Placement in Header:**

- Primary: Navbar right side (before user profile)
- Mobile: Hamburger menu → "Select Channel" section
- Sticky position to always be accessible

### 2.2 New Pages

#### Channel Management Page (Admin Only)

**Route:** `/admin/channels`

**Features:**

- [ ] Channel CRUD form
- [ ] Table listing all channels with:
  - Name, Type, Country, Currency
  - Active/Inactive status
  - Number of products available
  - Number of vendors
  - Actions: Edit, Delete, View Details
- [ ] Create New Channel button
- [ ] Filter by country, active status
- [ ] Search by name

#### Channel Settings Page (Admin Only)

**Route:** `/admin/channels/{channelId}/settings`

**Features:**

- [ ] Channel configuration form:
  - Name, Type, Description
  - Country Code (dropdown with flags)
  - Region Code (conditional dropdown)
  - Currency Code (dropdown)
  - Tax ID field
  - Default Tax Rate slider
  - Tax Behavior toggle (inclusive/exclusive)
  - B2B toggle
  - Active/Inactive toggle
- [ ] Tax Rules Management:
  - Add/Edit/Delete tax rules
  - Inline tax rule form with:
    - Rule name, description
    - Tax rate percentage
    - Category filter (optional)
    - Country/Region applicability
    - B2B/B2C checkboxes
    - Min order amount
    - Date range pickers (start/end dates)
    - Tax behavior selector

#### Tax Rules Page (Admin Only)

**Route:** `/admin/channels/{channelId}/tax-rules`

**Features:**

- [ ] Table view of all tax rules for channel
- [ ] Filter by active, category, country
- [ ] Sort by tax rate, date created
- [ ] Bulk activate/deactivate
- [ ] Quick edit inline
- [ ] Delete confirmation modal

---

## 3. Product Pages Changes

### 3.1 Product Listing Page

**Updates:**

- [ ] Add channel filter toggle (show products available on selected channel)
- [ ] Show channel-specific price if different from base price
- [ ] Show "Not available in this channel" badge for unavailable products
- [ ] Currency changes based on selected channel
- [ ] Show product availability per channel (on hover or expand)

**Product Card Changes:**

```typescript
interface ProductCardProps {
  product: Product;
  channelSpecificPrice?: number; // From ChannelProduct
  isAvailableInChannel: boolean;
  channelName?: string; // Channel-specific name override
}
```

### 3.2 Product Detail Page

**New Sections:**

- [ ] **Channel Availability**: Tab showing:
  - Which channels this product is available on
  - Channel-specific pricing
  - Channel-specific name/description
  - Availability status per channel

- [ ] **Pricing Section**: Enhanced to show:
  - Base price
  - Channel-specific price (if override exists)
  - Price badge showing "Channel Price" if different
  - Price comparison across channels (admin view only)

- [ ] **Tax Information** (if not inclusive):
  - "Estimated Tax" section for current channel
  - Tax breakdown with rule name
  - "Tax included in price" label (if inclusive)

---

## 4. Shopping Cart & Checkout Changes

### 4.1 Shopping Cart Page

**Channel Context Display:**

- [ ] Header showing: "You're shopping in [Channel Name] - [Currency Code] - Tax: [Behavior]"
- [ ] Change channel button (with warning if items in cart)
- [ ] Info box: "Changing channels will clear your cart"

**Cart Item Updates:**

```typescript
interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // Channel-specific price
  channelId: string; // NEW: Track which channel
  channelCurrencyCode: string; // NEW: For display
}
```

**Cart Summary Changes:**

```
Subtotal:           $100.00
├─ Shipping:        $10.00
├─ Tax:             $7.70 (7.7% - Sales Tax)
└─ Total:           $117.70
```

- [ ] Breakdown shows:
  - Subtotal
  - Shipping (if applicable)
  - **Tax** (new) with rule name tooltip
  - **Total**

- [ ] Tax calculation happens on:
  - Item added to cart
  - Item quantity changed
  - Shipping method changed
  - Zip code entered

### 4.2 Checkout Page - Multi-Step Flow

#### Step 1: Channel Confirmation

- [ ] Display selected channel with:
  - Channel name, country flag, currency
  - Tax behavior notice
  - "Change Channel" option

#### Step 2: Shipping Address

- [ ] Address form with:
  - Country selector (locked to channel country or allow selection)
  - Region/State selector (populated based on country)
  - **Real-time tax recalculation** as address changes
  - Tax notice: "Taxes will be calculated based on shipping address"

#### Step 3: Shipping Method

- [ ] Shipping method selector showing:
  - Method name
  - Price in channel currency
  - Estimated delivery time
  - **Recalculate tax** when selection changes

#### Step 4: Order Review

- [ ] Order summary with:
  - Channel name and currency
  - All items with channel-specific prices
  - Subtotal
  - Shipping cost
  - **Tax Breakdown**:
    ```
    Estimated Tax: $7.70
    Tax Rule: "US Sales Tax"
    Tax Rate: 7.7%
    Tax Behavior: Added to total (exclusive)
    ```
  - **Grand Total**
  - Compliance notice for EU channels (GDPR, VAT number display)

#### Step 5: Payment

- [ ] Payment processor integration:
  - [ ] Send currency code to payment gateway
  - [ ] Send total in correct currency
  - [ ] Handle currency conversion if needed

### 4.3 Order Confirmation Page

**Order Details Display:**

```
Order #12345 - [Channel Name]

Items:
├─ Product Name (Channel-Specific Name if different)
│  └─ $25.00 x 2 = $50.00

Pricing Breakdown:
├─ Subtotal:        $100.00
├─ Shipping:        $10.00
├─ Tax (Sales Tax): $7.70 (7.7%)
└─ Total:           $117.70

Channel Information:
├─ Country: United States
├─ Currency: USD
└─ Tax ID: (if applicable)
```

- [ ] Show applied tax rule name and rate
- [ ] Tax behavior confirmation
- [ ] Download invoice (with tax details)

---

## 5. Vendor Dashboard Changes

### 5.1 Vendor Channel Management

**New Page: Vendor Channels**
**Route:** `/vendor/channels`

**Features:**

- [ ] Table showing channels vendor is active on:
  - Channel name, country, currency
  - Status (active/inactive on channel)
  - Number of products available
  - Total sales this period
  - Actions: View Channel, Manage Products, Edit Settings

- [ ] "Request Access" button for unavailable channels
- [ ] Channel-specific settings:
  - External vendor ID (for integrations)
  - Active/Inactive toggle

### 5.2 Vendor Product Management

**Updates to Existing Product Management:**

- [ ] **Channel Availability Tab**:
  - [ ] Multi-select dropdown to add/remove channels
  - [ ] For each channel:
    - [ ] Channel-specific name override field
    - [ ] Channel-specific description override field
    - [ ] Channel-specific price override field
    - [ ] Availability toggle (include/exclude from channel)
    - [ ] External product ID for 3rd-party sync

- [ ] **Bulk Channel Actions**:
  - [ ] "Add to multiple channels" button
  - [ ] "Set channel prices" bulk editor
  - [ ] "Remove from channels" bulk action

### 5.3 Vendor Analytics/Dashboard

**Channel Performance Cards:**

- [ ] For each channel vendor is on:
  - [ ] Sales count this month
  - [ ] Revenue in channel currency
  - [ ] Top products on this channel
  - [ ] Customer count

**Channel Comparison Chart:**

- [ ] Revenue by channel
- [ ] Orders by channel
- [ ] Currency conversion to base currency for comparison

**Channel Orders Filter:**

- [ ] Multi-select channel filter on orders list
- [ ] View channel-specific order details with:
  - [ ] Channel name and tax applied
  - [ ] Prices in channel currency

---

## 6. Admin Dashboard Changes

### 6.1 Channel Management Section

**New Admin Dashboard Tab: Channels**
**Route:** `/admin/dashboard/channels`

**Overview Cards:**

- [ ] Total channels count
- [ ] Active channels count
- [ ] Countries covered
- [ ] Currencies supported
- [ ] Revenue by channel (with currency conversion)

**Channel List with Actions:**

- [ ] View detailed channel info
- [ ] Quick stats: products, vendors, orders, revenue
- [ ] Edit channel settings
- [ ] Manage tax rules
- [ ] Toggle active/inactive
- [ ] Delete with confirmation

### 6.2 Tax Management Section

**New Admin Page: Tax Configuration**
**Route:** `/admin/tax-management`

**Features:**

- [ ] Tax rules by channel (grouped tabs)
- [ ] For each rule:
  - [ ] Rule name, description
  - [ ] Tax rate percentage
  - [ ] Applicability (category, country, region, B2B/B2C)
  - [ ] Validity dates (startDate, endDate)
  - [ ] Active/Inactive status
  - [ ] Edit, Delete, Clone buttons

- [ ] **Tax Template Presets**:
  - [ ] Pre-configured templates for common tax scenarios:
    - US Sales Tax (7%, exclusive)
    - Canadian HST (13%, exclusive)
    - EU VAT (19%, inclusive)
    - UK VAT (20%, inclusive)
  - [ ] One-click apply to new channels

### 6.3 Analytics Updates

**Channel Revenue Analytics:**

- [ ] Revenue breakdown by channel
- [ ] Revenue by channel + country
- [ ] Currency-aware comparisons (with conversion option)
- [ ] Tax collected by channel
- [ ] Tax compliance reporting

**Tax Analytics:**

- [ ] Total tax collected by channel
- [ ] Average tax rate by region
- [ ] Orders by tax behavior type (inclusive/exclusive)
- [ ] Tax exemptions (B2B orders)

---

## 7. Customer Account Pages

### 7.1 Order History

**Updates:**

- [ ] Show channel information for each order:
  - [ ] Channel name with country flag
  - [ ] Currency used
  - [ ] Prices displayed in order currency (not current channel)

- [ ] Tax information visible:
  - [ ] "Tax Included" or "Tax: $X.XX"
  - [ ] Tax rule applied (on hover/expand)

- [ ] Filter by channel (if customer has ordered from multiple channels)

### 7.2 Customer Preferences

**New Section: Preferred Channel**

- [ ] Radio button or dropdown to select preferred channel
- [ ] "Remember my preference" checkbox
- [ ] Info text: "This channel will be pre-selected on your next visit"

---

## 8. Mobile Responsive Design

### 8.1 Mobile Navigation Changes

- [ ] Channel selector in hamburger menu
- [ ] Prominent placement in mobile header
- [ ] Slide-out panel for channel selection with:
  - [ ] Country flags
  - [ ] Currency code
  - [ ] Is B2B indicator
  - [ ] Search/filter

### 8.2 Mobile Checkout Adaptations

- [ ] **Simplified cart summary** (collapsible):

  ```
  Subtotal: $100
  + Tax: $7.70
  + Shipping: $10
  = Total: $117.70
  ```

- [ ] **Single-column checkout form** (no side-by-side)
- [ ] **Large tax warning banner** if inclusive tax behavior
- [ ] **Tap-to-expand** tax details

### 8.3 Mobile Admin Interface

- [ ] Simplified channel management forms
- [ ] Collapsible sections for tax rules
- [ ] Mobile-friendly table with horizontal scroll
- [ ] Touch-friendly buttons and inputs

---

## 9. Forms & Input Components

### 9.1 New Form Components

#### CountrySelector Component

```typescript
interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  showFlags?: boolean;
  disabled?: boolean;
}
// Displays countries with flags, searchable dropdown
```

#### RegionSelector Component

```typescript
interface RegionSelectorProps {
  countryCode: string;
  value?: string;
  onChange: (regionCode: string) => void;
}
// Dynamically populated based on country selection
```

#### CurrencySelector Component

```typescript
interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  showSymbol?: boolean;
}
```

#### TaxBehaviorToggle Component

```typescript
interface TaxBehaviorToggleProps {
  value: "inclusive" | "exclusive";
  onChange: (value: "inclusive" | "exclusive") => void;
  showLabel?: boolean;
}
// Shows: "Price includes tax" vs "Tax added to price"
```

#### TaxRuleForm Component

```typescript
interface TaxRuleFormProps {
  initialValue?: ChannelTaxRule;
  channelId: string;
  onSubmit: (rule: CreateChannelTaxRuleDto) => void;
}
// Complete form for creating/editing tax rules
```

### 9.2 Utility Components

#### TaxBreakdown Component

```typescript
interface TaxBreakdownProps {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxRuleName?: string;
  shippingAmount?: number;
  total: number;
  taxBehavior: "inclusive" | "exclusive";
  currency: string;
}
```

#### CurrencyDisplay Component

```typescript
interface CurrencyDisplayProps {
  amount: number;
  currencyCode: string;
  showSymbol?: boolean;
  showCode?: boolean;
}
// Formats amount with currency symbol and code
```

#### ChannelBadge Component

```typescript
interface ChannelBadgeProps {
  channel: Channel;
  showCurrency?: boolean;
  showCountry?: boolean;
  size?: "sm" | "md" | "lg";
}
// Displays channel name with country flag and currency
```

---

## 10. API Integration Changes

### 10.1 New API Endpoints to Consume

```typescript
// Channels
GET    /api/channels
GET    /api/channels/{id}
POST   /api/channels (admin)
PUT    /api/channels/{id} (admin)
DELETE /api/channels/{id} (admin)

// Tax Rules
GET    /api/channels/{channelId}/tax-rules
POST   /api/channels/{channelId}/tax-rules (admin)
PUT    /api/channels/{channelId}/tax-rules/{ruleId} (admin)
DELETE /api/channels/{channelId}/tax-rules/{ruleId} (admin)

// Orders (modified)
POST   /api/orders (now requires channelId)
GET    /api/orders (can filter by channelId)
GET    /api/orders/{id} (returns tax breakdown)

// Products (modified)
GET    /api/products (can filter by channelId)
GET    /api/products/{id} (includes channel variants)
```

### 10.2 Zustand Store Integration

Since we're using Zustand, API calls are integrated directly into the stores. No additional API hooks needed - just use the store actions.

**Pattern: Store Actions Handle API Calls**

```typescript
// Instead of separate API hooks, use store actions:

// Fetch channels (called from store action)
const { fetchChannels, channels, loading } = useChannelStore((state) => ({
  fetchChannels: state.fetchChannels,
  channels: state.channels,
  loading: state.loading,
}));

// Fetch tax rules
const { fetchTaxRules, taxRules } = useTaxStore((state) => ({
  fetchTaxRules: state.fetchTaxRules,
  taxRules: state.taxRules,
}));

// Calculate tax
const {
  calculateTax,
  calculatedTax,
  loading: taxLoading,
} = useTaxStore((state) => ({
  calculateTax: state.calculateTax,
  calculatedTax: state.calculatedTax,
  loading: state.loading,
}));
```

**Custom Hooks for Common Operations (Optional)**

```typescript
// hooks/useChannelData.ts
import { useChannelStore } from "@/store";
import { useEffect } from "react";

export function useChannelData() {
  const { fetchChannels, channels, loading, error } = useChannelStore(
    (state) => ({
      fetchChannels: state.fetchChannels,
      channels: state.channels,
      loading: state.loading,
      error: state.error,
    })
  );

  useEffect(() => {
    if (channels.length === 0) {
      fetchChannels();
    }
  }, [channels.length, fetchChannels]);

  return { channels, loading, error };
}

// hooks/useTaxCalculation.ts
import { useTaxStore } from "@/store";

export function useTaxCalculation(
  channelId: string,
  amount: number,
  options?: { categoryId?: string; isB2B?: boolean }
) {
  const { calculateTax, calculatedTax, loading } = useTaxStore((state) => ({
    calculateTax: state.calculateTax,
    calculatedTax: state.calculatedTax,
    loading: state.loading,
  }));

  const handleCalculate = async () => {
    await calculateTax(channelId, amount, options?.categoryId, options?.isB2B);
  };

  return { calculatedTax, loading, calculateTax: handleCalculate };
}
```

---

## 11. State Management Updates

### 11.1 Zustand Store Files Structure

**Directory:** `src/store/`

**File: `src/store/channelStore.ts`**

```typescript
// Exported useChannelStore with:
// - channels: Channel[]
// - selectedChannel: Channel | null
// - loading, error
// - fetchChannels(), selectChannel(), setSelectedChannel(), clearError()
```

**File: `src/store/taxStore.ts`**

```typescript
// Exported useTaxStore with:
// - taxRules: Map<string, ChannelTaxRule[]>
// - calculatedTax: TaxCalculation | null
// - loading, error
// - fetchTaxRules(), calculateTax(), createTaxRule(), updateTaxRule(), deleteTaxRule()
```

**File: `src/store/cartStore.ts`**

```typescript
// Exported useCartStore with:
// - items: CartItem[] (now includes channelId)
// - channelId: string | null
// - subtotal, taxAmount, shippingAmount, total
// - addItem(), removeItem(), updateQuantity(), setChannel(), setTax(), setShipping(), clearCart()
```

**File: `src/store/index.ts`**

```typescript
// Re-export all stores for convenience
export { useChannelStore } from "./channelStore";
export { useTaxStore } from "./taxStore";
export { useCartStore } from "./cartStore";
```

### Hook Usage Examples

```typescript
// In components:
import { useChannelStore, useTaxStore, useCartStore } from "@/store";

function MyComponent() {
  // Channel store
  const selectedChannel = useChannelStore((state) => state.selectedChannel);
  const selectChannel = useChannelStore((state) => state.selectChannel);

  // Tax store
  const calculatedTax = useTaxStore((state) => state.calculatedTax);
  const calculateTax = useTaxStore((state) => state.calculateTax);

  // Cart store
  const cartTotal = useCartStore((state) => state.total);
  const addItem = useCartStore((state) => state.addItem);

  // Selector optimization (only subscribe to what you need)
  const cart = useCartStore(
    (state) => ({
      items: state.items,
      total: state.total,
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b) // shallow comparison
  );
}
```

### 11.2 LocalStorage Schema

```typescript
// Persist channel preference
localStorage.setItem('selectedChannelId', channelId);
localStorage.setItem('channelPreference', {
  channelId: string;
  timestamp: number;
  countryCode: string;
  currencyCode: string;
});
```

---

## 12. Utilities & Helpers

### 12.1 New Utility Functions

```typescript
// Currency utilities
export const formatPrice = (
  amount: number,
  currencyCode: string,
  locale?: string
): string

export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number>

// Tax utilities
export const calculateTotalWithTax = (
  subtotal: number,
  taxRate: number,
  taxBehavior: 'inclusive' | 'exclusive'
): { taxAmount: number; total: number }

export const isB2B = (customer: Customer): boolean

// Channel utilities
export const getCountryName = (countryCode: string): string

export const getCountryFlag = (countryCode: string): string

export const getRegionName = (countryCode: string, regionCode: string): string

export const getTaxBehaviorLabel = (behavior: 'inclusive' | 'exclusive'): string
```

### 12.2 Constants & Enums

```typescript
export const COUNTRY_FLAGS = {
  US: "🇺🇸",
  CA: "🇨🇦",
  DE: "🇩🇪",
  // ... etc
};

export const TAX_BEHAVIOR_LABELS = {
  inclusive: "Tax included in price",
  exclusive: "Tax added to price",
};

export const CHANNEL_TYPES = [
  "web",
  "shopify",
  "woocommerce",
  "amazon",
  "ebay",
  // ... etc
];
```

---

## 13. Styling & Theme Changes

### 13.1 New CSS Classes/Tailwind Utilities

```css
/* Channel badge styling */
.channel-badge {
  /* country flag + name + currency */
}
.channel-badge--primary {
  /* highlighted selection */
}
.channel-badge--small {
  /* for product cards */
}

/* Tax information styling */
.tax-notice {
  /* info boxes about tax behavior */
}
.tax-notice--inclusive {
  /* "tax included" style */
}
.tax-notice--exclusive {
  /* "tax added" style */
}

.tax-breakdown {
  /* pricing table with tax */
}
.tax-rate-percentage {
  /* shows percentage */
}

/* Pricing display */
.price--highlighted {
  /* channel-specific override */
}
.price--currency {
  /* with currency symbol */
}

/* Forms */
.country-selector {
  /* dropdown with flags */
}
.currency-selector {
  /* currency dropdown */
}
```

### 13.2 Color/Icon Updates

**New Icons Needed:**

- [ ] `FlagIcon` - Country flags
- [ ] `CurrencyIcon` - Currency symbols
- [ ] `GlobeIcon` - Global/channel indicator
- [ ] `TaxIcon` - Tax information
- [ ] `SettingsIcon` - Configuration (already exists)

---

## 14. Error Handling & Validation

### 14.1 Error Scenarios

**Frontend Validation:**

- [ ] Validate channel selection required
- [ ] Validate address country matches channel (if restricted)
- [ ] Validate currency conversion available
- [ ] Validate tax rule exists and is active

**API Error Handling:**

- [ ] "Channel not available" error
- [ ] "Tax calculation failed" error
- [ ] "Insufficient inventory for channel" error
- [ ] "Product not available in this channel" error
- [ ] "Currency conversion unavailable" error

### 14.2 User Warnings

- [ ] "Changing channels will clear your cart" confirmation
- [ ] "Tax is included in price" warning (for inclusive channels)
- [ ] "Tax will be added at checkout" info (for exclusive channels)
- [ ] "This product is not available in [Channel]" message
- [ ] "Your address is outside this channel's service area" error

---

## 15. Testing Scenarios

### 15.1 Unit Tests Needed

- [ ] Channel selection and context switching
- [ ] Tax calculation logic (inclusive/exclusive)
- [ ] Currency formatting
- [ ] Cart item validation per channel
- [ ] Order total calculation with tax

### 15.2 Integration Tests Needed

- [ ] Select channel → Load products → Add to cart → Checkout flow
- [ ] Tax calculation with multiple rule matches
- [ ] Address change triggers tax recalculation
- [ ] Channel-specific pricing applied correctly
- [ ] Currency conversion in analytics

### 15.3 E2E Tests Needed

- [ ] Complete US checkout (exclusive tax)
- [ ] Complete EU checkout (inclusive tax)
- [ ] B2B order (no tax)
- [ ] Multi-channel vendor dashboard
- [ ] Admin channel management flow
- [ ] Tax rule creation and application

---

## 16. Browser & Device Support

### 16.1 Localization Considerations

- [ ] Support for country names in multiple languages
- [ ] Currency formatting per locale
- [ ] Right-to-left (RTL) language support if applicable
- [ ] Date format per region

### 16.2 Performance Considerations

- [ ] Cache channel list (static reference data)
- [ ] Cache tax rules per channel
- [ ] Debounce tax recalculation (while typing address)
- [ ] Lazy load country/region dropdowns
- [ ] Memoize currency conversion results

---

## 17. Documentation & Help

### 17.1 User Documentation

- [ ] How to select a channel
- [ ] What does "tax included" vs "tax added" mean?
- [ ] Why is the price showing differently per channel?
- [ ] How are taxes calculated?
- [ ] Why did the tax change?

### 17.2 Admin Documentation

- [ ] Channel configuration guide
- [ ] Tax rule setup guide
- [ ] Regional/tax compliance checklist
- [ ] Currency handling guide
- [ ] Analytics by channel guide

### 17.3 Code Documentation

- [ ] ChannelProvider setup guide
- [ ] useChannel hook usage examples
- [ ] Tax calculation algorithm explanation
- [ ] API integration examples
- [ ] Custom component prop documentation

---

## 18. Implementation Priority & Checklist

### Phase 1: Core Infrastructure (Week 1)

- [ ] Set up ChannelProvider and context
- [ ] Create Redux/state slices
- [ ] Set up API hooks for channels and tax
- [ ] Create Channel and Currency utility functions
- [ ] Create ChannelBadge and CurrencyDisplay components

### Phase 2: Channel Selection & Context (Week 1-2)

- [ ] Create ChannelSelector component
- [ ] Add to header navigation
- [ ] Implement channel persistence (localStorage)
- [ ] Create channel selection flow
- [ ] Add mobile channel selector

### Phase 3: Product Changes (Week 2)

- [ ] Update product cards to show channel pricing
- [ ] Update product detail page with channel variants
- [ ] Add channel availability indicators
- [ ] Update product filters to support channels

### Phase 4: Cart & Checkout (Week 2-3)

- [ ] Update cart to track channel context
- [ ] Add tax breakdown to cart summary
- [ ] Create multi-step checkout with tax calculation
- [ ] Add address-based tax recalculation
- [ ] Create order confirmation with tax details

### Phase 5: Admin Interfaces (Week 3-4)

- [ ] Create channel management pages
- [ ] Create tax rule management pages
- [ ] Update analytics dashboard
- [ ] Add channel/tax admin components

### Phase 6: Vendor Changes (Week 4)

- [ ] Create vendor channel management page
- [ ] Add channel availability to product management
- [ ] Update vendor dashboard with channel filters
- [ ] Add channel-specific pricing management

### Phase 7: Testing & Polish (Week 5)

- [ ] Unit tests for tax calculation
- [ ] Integration tests for checkout flow
- [ ] E2E tests for complete user journeys
- [ ] Performance testing and optimization
- [ ] Mobile responsiveness testing

### Phase 8: Localization & Deployment (Week 5-6)

- [ ] i18n string extraction and translation
- [ ] Browser compatibility testing
- [ ] Accessibility (a11y) audit
- [ ] Documentation updates
- [ ] Deploy to staging and QA
- [ ] Deploy to production with feature flags

---

## 19. Potential Issues & Mitigations

| Issue                             | Impact | Mitigation                                                           |
| --------------------------------- | ------ | -------------------------------------------------------------------- |
| Tax calculation complexity        | High   | Create utility functions, extensive testing, clear documentation     |
| Currency conversion delays        | Medium | Cache rates, fallback to last known rate, show disclaimer            |
| Channel switching clears cart     | Medium | Confirm before clearing, show "cart saved" message, offer restore    |
| Different prices confuse users    | Medium | Highlight channel price overrides, explain "channel special" clearly |
| Mobile tax breakdown cramped      | Medium | Collapsible sections, horizontal scroll tables, simpler summary      |
| Admin tax rule management complex | High   | Provide presets, step-by-step wizard, preview before save            |
| Performance with many channels    | Medium | Pagination, lazy loading, selective data fetching                    |
| Country/region selector UX        | Medium | Searchable dropdowns, flag icons, group by continent                 |

---

## 20. Additional Considerations

### 20.1 Accessibility (WCAG 2.1)

- [ ] All form inputs have proper labels
- [ ] Currency formatting readable by screen readers
- [ ] Country/region selectors keyboard navigable
- [ ] Tax information clearly announced
- [ ] Color not sole indicator of inclusive vs exclusive tax
- [ ] Touch targets minimum 44x44px on mobile

### 20.2 Security

- [ ] Currency code is trusted data from backend
- [ ] Tax calculations verified server-side before payment
- [ ] No client-side price manipulation possible
- [ ] PII not stored in localStorage (only preferences)
- [ ] API calls use proper authentication/authorization

### 20.3 SEO Considerations

- [ ] Open Graph meta tags include currency
- [ ] URL structure supports channel context (/en-US/, /fr-CA/, etc.)
- [ ] Hreflang tags for multi-region content
- [ ] Structured data for prices in correct currency

### 20.4 Analytics & Tracking

- [ ] Track channel selection events
- [ ] Track channel-specific conversions
- [ ] Track tax impact on cart abandonment
- [ ] Track currency preference by user
- [ ] Segment analytics by channel
