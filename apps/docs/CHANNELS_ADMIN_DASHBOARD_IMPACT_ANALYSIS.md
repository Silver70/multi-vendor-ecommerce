# Channels Entity Introduction - Admin Dashboard Frontend Impact Analysis

## Executive Summary

Introducing multi-channel support with regional and tax awareness requires admin dashboard UI changes to:
- Manage channels and their configuration (country, currency, tax settings)
- Create and maintain tax rules per channel
- Configure channel-specific vendor and product settings
- Monitor channel performance and analytics
- Handle multi-channel admin operations

This document outlines all admin dashboard components, pages, and features needed for channel and tax management.

---

## 1. Core Architecture Changes

### 1.1 Global State Management (Zustand)

#### Admin-Specific Zustand Stores

**Channel Admin Store:**
```typescript
interface ChannelAdminState {
  channels: Channel[];
  selectedChannel: Channel | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchChannels: () => Promise<void>;
  fetchChannelById: (id: string) => Promise<void>;
  createChannel: (channel: CreateChannelDto) => Promise<void>;
  updateChannel: (id: string, updates: UpdateChannelDto) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  setSelectedChannel: (channel: Channel) => void;
  clearError: () => void;
}

export const useChannelAdminStore = create<ChannelAdminState>((set) => ({
  // Implementation with admin-specific actions
}));
```

**Tax Rules Admin Store:**
```typescript
interface TaxRulesAdminState {
  taxRules: Map<string, ChannelTaxRule[]>; // channelId -> rules
  loading: boolean;
  error: string | null;

  // Actions
  fetchTaxRulesByChannel: (channelId: string) => Promise<void>;
  createTaxRule: (channelId: string, rule: CreateChannelTaxRuleDto) => Promise<void>;
  updateTaxRule: (ruleId: string, updates: UpdateChannelTaxRuleDto) => Promise<void>;
  deleteTaxRule: (ruleId: string) => Promise<void>;
  bulkToggleTaxRules: (ruleIds: string[], active: boolean) => Promise<void>;
  clearError: () => void;
}

export const useTaxRulesAdminStore = create<TaxRulesAdminState>((set) => ({
  // Implementation with tax rule management
}));
```

### 1.2 Store Initialization

**App.tsx Setup:**
```typescript
import { useChannelAdminStore, useTaxRulesAdminStore } from '@/store';
import { useEffect } from 'react';

function AdminApp() {
  const fetchChannels = useChannelAdminStore((state) => state.fetchChannels);

  useEffect(() => {
    // Initialize: fetch all channels on admin load
    fetchChannels();
  }, [fetchChannels]);

  return (
    <div className="admin-app">
      {/* Admin layout and routes */}
    </div>
  );
}
```

### 1.3 Admin-Specific Hooks

```typescript
// hooks/useChannelAdmin.ts
import { useChannelAdminStore } from '@/store';

export function useChannelAdmin() {
  return {
    channels: useChannelAdminStore((state) => state.channels),
    selectedChannel: useChannelAdminStore((state) => state.selectedChannel),
    createChannel: useChannelAdminStore((state) => state.createChannel),
    updateChannel: useChannelAdminStore((state) => state.updateChannel),
    deleteChannel: useChannelAdminStore((state) => state.deleteChannel),
    loading: useChannelAdminStore((state) => state.loading),
    error: useChannelAdminStore((state) => state.error),
  };
}

// hooks/useTaxRulesAdmin.ts
import { useTaxRulesAdminStore } from '@/store';

export function useTaxRulesAdmin(channelId: string) {
  const store = useTaxRulesAdminStore();

  return {
    taxRules: store.taxRules.get(channelId) || [],
    createTaxRule: (rule: CreateChannelTaxRuleDto) =>
      store.createTaxRule(channelId, rule),
    updateTaxRule: store.updateTaxRule,
    deleteTaxRule: store.deleteTaxRule,
    bulkToggleTaxRules: store.bulkToggleTaxRules,
    loading: store.loading,
    error: store.error,
  };
}
```

---

## 2. Admin Dashboard Layout & Navigation

### 2.1 Admin Sidebar Updates

**New Menu Items:**
```
Admin Dashboard
├── Channels
│   ├── All Channels
│   ├── Channel Settings
│   └── Tax Management
├── Orders (existing)
├── Products (existing)
├── Vendors (existing)
└── Analytics (enhanced)
```

**Navigation Structure:**
```
/admin/dashboard (main)
├── /admin/channels (list all channels)
├── /admin/channels/{channelId} (channel details)
├── /admin/channels/{channelId}/settings (edit channel)
├── /admin/channels/{channelId}/tax-rules (manage tax rules)
├── /admin/tax-management (tax overview across all channels)
└── /admin/analytics/channels (channel analytics)
```

### 2.2 Admin Header Updates

**Channel Context Indicator:**
```typescript
// components/Admin/ChannelContextIndicator.tsx
// Shows current context if viewing channel-specific data
// Format: "Channel: [Name] - [Country] - [Currency]"
```

---

## 3. Channel Management Pages

### 3.1 Channel List Page

**Route:** `/admin/channels`

**Features:**
- [ ] Table view of all channels with columns:
  - Name (clickable to details)
  - Type (web, shopify, amazon, etc.)
  - Country + Flag
  - Currency Code
  - Is B2B (badge)
  - Active/Inactive toggle
  - Number of products
  - Number of vendors
  - Number of orders (this month)
  - Revenue (this month)
  - Actions dropdown (Edit, View, Delete)

- [ ] Filters:
  - By country/region
  - By channel type
  - By active/inactive status
  - Search by name

- [ ] Actions:
  - [ ] "Create New Channel" button (primary)
  - [ ] Bulk actions (activate/deactivate multiple)
  - [ ] Export channel list (CSV)

**Data Table Columns:**
```typescript
interface ChannelListRow {
  id: string;
  name: string;
  type: string;
  countryCode: string;
  regionCode?: string;
  currencyCode: string;
  isB2B: boolean;
  isActive: boolean;
  productCount: number;
  vendorCount: number;
  monthlyOrders: number;
  monthlyRevenue: number;
}
```

### 3.2 Channel Create Page

**Route:** `/admin/channels/create`

**Form Fields:**
- [ ] Channel name (required, max 100 chars)
- [ ] Channel type (dropdown: web, shopify, woocommerce, amazon, ebay)
- [ ] Description (optional, max 500 chars)
- [ ] Country code (required, searchable dropdown with flags)
- [ ] Region code (conditional, appears based on country)
- [ ] Currency code (required, dropdown with currency symbols)
- [ ] Is B2B toggle (default: false)
- [ ] Tax ID (optional, for compliance)
- [ ] Default tax rate (decimal input, 0-100%)
- [ ] Tax behavior (toggle: inclusive/exclusive)
- [ ] Active toggle (default: true)
- [ ] External ID (optional, for 3rd-party integrations)

**Form Validations:**
- Country code must be valid ISO 3166-1 alpha-2
- Currency code must be valid ISO 4217
- Tax rate must be 0-1 (shown as percentage)
- Name must be unique
- Type must be from predefined list

**Actions:**
- [ ] Save button
- [ ] Save & Create Tax Rules button
- [ ] Cancel button

### 3.3 Channel Edit Page

**Route:** `/admin/channels/{channelId}`

**Sections:**
1. **Basic Information** (edit all fields from create page)
2. **Tax Configuration** (edit default tax rate, behavior)
3. **Status & Metadata**
   - [ ] Active/Inactive toggle
   - [ ] External ID
   - [ ] Created date (read-only)
   - [ ] Last updated (read-only)
4. **Quick Stats**
   - [ ] Total products
   - [ ] Active vendors
   - [ ] Total orders
   - [ ] Total revenue (all time)
5. **Related Data**
   - [ ] Quick link to tax rules
   - [ ] Quick link to products in this channel
   - [ ] Quick link to vendors in this channel

**Tabs:**
- [ ] General (above fields)
- [ ] Tax Rules (navigate to tax rules page)
- [ ] Products (products available on this channel)
- [ ] Vendors (vendors active on this channel)

**Actions:**
- [ ] Save changes
- [ ] Delete channel (with confirmation modal)
- [ ] Duplicate channel
- [ ] Cancel

### 3.4 Delete Channel Modal

**Confirmation Dialog:**
```
Header: "Delete Channel?"
Message: "This action cannot be undone.
Are you sure you want to delete [Channel Name]?

Warning: This channel has:
- XX products
- XX vendors
- XX orders

Orders will not be deleted, but channel reference will be removed."

Actions: [Cancel] [Delete]
```

---

## 4. Tax Rules Management

### 4.1 Tax Rules List Page

**Route:** `/admin/channels/{channelId}/tax-rules`

**Layout:**
- [ ] Channel header showing context
- [ ] "Add Tax Rule" button (primary)
- [ ] Tax rules table

**Table Columns:**
- Name (clickable to edit)
- Description (truncated)
- Tax Rate (as percentage)
- Category (if applicable)
- Country (ISO code + flag)
- Region (if applicable)
- Applies To (B2B/B2C badges)
- Tax Behavior (inclusive/exclusive badge)
- Active toggle
- Valid From - To (dates)
- Actions (Edit, Delete, Clone)

**Filters:**
- [ ] By active/inactive
- [ ] By tax behavior (inclusive/exclusive)
- [ ] By country/region
- [ ] By applicability (B2B, B2C)
- [ ] Search by name

**Features:**
- [ ] Bulk actions (activate/deactivate multiple rules)
- [ ] Sort by: name, rate, created date
- [ ] Pagination
- [ ] Export as CSV

### 4.2 Tax Rule Create/Edit Modal

**Modal Form:**
```typescript
interface TaxRuleForm {
  name: string;                      // required
  description?: string;
  taxRate: number;                   // required, 0-100
  categoryId?: string;               // optional product category filter
  applicableCountryCode?: string;    // optional country (inherits channel if not set)
  applicableRegionCode?: string;     // optional region
  applyToB2B: boolean;               // required
  applyToB2C: boolean;               // required
  minimumOrderAmount?: number;       // optional
  taxBehavior: 'inclusive' | 'exclusive'; // required
  isActive: boolean;                 // required
  startDate?: string;                // optional ISO date
  endDate?: string;                  // optional ISO date
}
```

**Form Layout:**

**Section 1: Basic Information**
- [ ] Tax rule name (required, max 100 chars)
- [ ] Description (optional, max 500 chars)
- [ ] Tax rate percentage (required, 0-100%)
- [ ] Active toggle (default: true)

**Section 2: Applicability**
- [ ] Apply to B2B customers (checkbox)
- [ ] Apply to B2C customers (checkbox)
- [ ] Product category (dropdown, optional)
- [ ] Country code (optional, inherits channel country if not set)
- [ ] Region code (optional, conditional based on country)
- [ ] Minimum order amount (optional, decimal)

**Section 3: Tax Configuration**
- [ ] Tax behavior (radio: inclusive/exclusive)
  - Shows example: "Price $100" → "Includes $17 tax" vs "Add $17 tax"
- [ ] Help text explaining inclusive vs exclusive

**Section 4: Validity Period**
- [ ] Start date (optional, date picker)
- [ ] End date (optional, date picker)
- [ ] Help text: "Leave empty for rules that never expire"

**Form Actions:**
- [ ] Save button
- [ ] Save & Create Another button
- [ ] Cancel button

**Validations:**
- At least one of B2B/B2C must be checked
- Tax rate must be 0-1 (100%)
- End date must be after start date
- Name must be unique per channel
- Country code must be valid

### 4.3 Tax Rule Clone Modal

**Pre-filled form:**
- Copy all fields from source rule
- Clear startDate/endDate
- Clear name and suggest: "[Original Name] - Copy"
- Allow editing before saving

---

## 5. Product Management Updates (Admin)

### 5.1 Product List Page Updates

**New Column:**
- [ ] "Channels" column showing:
  - Count of channels product is available on
  - Preview badges for top 3 channels
  - Expandable to see all channels

**New Filter:**
- [ ] Filter by channel (multi-select)
- [ ] Filter by: available in specific channel, unavailable in all, etc.

**New Action:**
- [ ] "Manage Channel Availability" bulk action

### 5.2 Product Edit Page - Channel Tab

**Route:** `/admin/products/{productId}/channels`

**Layout:**
- [ ] List of all channels
- [ ] For each channel:
  - [ ] Channel name + country flag
  - [ ] Availability toggle (include/exclude from channel)
  - [ ] Channel-specific pricing:
    - Base price: $100 (read-only, from product)
    - Channel price override (optional, empty = use base)
    - Override indicator badge if different
  - [ ] Channel-specific name (optional override)
  - [ ] Channel-specific description (optional override)
  - [ ] External product ID (optional, for 3rd-party integrations)
  - [ ] Edit button → modal or expandable

**Modal/Form for Channel Product:**
```typescript
interface ChannelProductForm {
  channelId: string;
  productId: string;
  isActive: boolean;
  channelName?: string;        // optional override
  channelDescription?: string; // optional override
  channelPrice?: number;       // optional override
  externalProductId?: string;  // optional
}
```

**Bulk Actions:**
- [ ] "Add to multiple channels" button
  - Modal: select channels, set override settings
- [ ] "Remove from channels" button
  - Modal: select channels to remove from
- [ ] "Update prices across channels" button
  - Modal: apply price override to selected channels

---

## 6. Vendor Management Updates (Admin)

### 6.1 Vendor List Page Updates

**New Column:**
- [ ] "Channels" showing count of channels vendor is active on

### 6.2 Vendor Edit Page - Channels Tab

**Route:** `/admin/vendors/{vendorId}/channels`

**Layout:**
- [ ] Table showing:
  - Channel name + country + currency
  - Active toggle (vendor's availability on this channel)
  - Product count on this channel
  - Revenue on this channel
  - External vendor ID (for 3rd-party integrations)
  - Edit button

**Modal for Channel Vendor Settings:**
```typescript
interface ChannelVendorForm {
  channelId: string;
  vendorId: string;
  isActive: boolean;
  externalVendorId?: string;
}
```

---

## 7. Admin Dashboard & Analytics

### 7.1 Main Admin Dashboard

**New Dashboard Cards:**

**Channels Overview Section:**
- [ ] Total active channels (card with count)
- [ ] Total inactive channels (card with count)
- [ ] Countries covered (card with count)
- [ ] Currencies supported (card with list)

**Recent Activity:**
- [ ] List of recently created/updated channels
- [ ] List of recently created/updated tax rules

**Quick Actions:**
- [ ] Create new channel (button)
- [ ] Create new tax rule (button, requires channel selection)
- [ ] View all channels (button)
- [ ] View tax management (button)

### 7.2 Channels Analytics Page

**Route:** `/admin/analytics/channels`

**Metrics Cards:**
- [ ] Total orders by channel (comparison)
- [ ] Revenue by channel (in base currency with conversion)
- [ ] Revenue by channel in their native currency
- [ ] Orders by country (map visualization if available)
- [ ] Channel comparison table

**Charts:**
- [ ] Revenue by channel (bar chart)
- [ ] Orders by channel (bar chart)
- [ ] Tax collected by channel (bar chart)
- [ ] Revenue trend by channel (line chart over time)

**Table: Channel Performance**
- Columns: Channel, Orders, Revenue (base currency), Revenue (native), Tax Collected, Avg Order Value
- Sortable, filterable
- Export option

### 7.3 Tax Analytics Page

**Route:** `/admin/analytics/tax`

**Metrics:**
- [ ] Total tax collected (all channels)
- [ ] Tax by channel (breakdown)
- [ ] Tax by country/region
- [ ] Average tax rate
- [ ] Orders by tax behavior (inclusive/exclusive pie chart)
- [ ] B2B vs B2C orders (no tax vs taxed breakdown)

**Table: Tax Compliance Report**
- Columns: Channel, Country, Tax Rule, Total Tax Collected, Number of Orders, Avg Tax Rate
- Filter by date range
- Export option (for compliance/audit)

---

## 8. Forms & Input Components

### 8.1 New Form Components

#### CountrySelector Component
```typescript
interface CountrySelectorProps {
  value: string;
  onChange: (countryCode: string) => void;
  showFlags?: boolean;
  disabled?: boolean;
  onlyAvailable?: string[]; // limit to specific countries
}
// Displays countries with flags, searchable dropdown
// Shows region selector for countries with regions
```

#### RegionSelector Component
```typescript
interface RegionSelectorProps {
  countryCode: string;
  value?: string;
  onChange: (regionCode: string) => void;
  disabled?: boolean;
}
// Dynamically populated based on country selection
```

#### CurrencySelector Component
```typescript
interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  showSymbol?: boolean;
  disabled?: boolean;
}
```

#### TaxBehaviorToggle Component
```typescript
interface TaxBehaviorToggleProps {
  value: 'inclusive' | 'exclusive';
  onChange: (value: 'inclusive' | 'exclusive') => void;
  showExample?: boolean;
}
// Shows: "Price includes tax" vs "Tax added to price"
// Optional example with price breakdown
```

#### ChannelTypeSelector Component
```typescript
interface ChannelTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
  disabled?: boolean;
}
// Dropdown with predefined channel types
```

#### TaxPercentageInput Component
```typescript
interface TaxPercentageInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}
// Input that accepts 0-100, stores as decimal 0-1
```

### 8.2 Utility Components

#### ChannelBadge Component
```typescript
interface ChannelBadgeProps {
  channel: Channel;
  showCurrency?: boolean;
  showCountry?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
// Displays channel name with country flag and currency
```

#### TaxBehaviorBadge Component
```typescript
interface TaxBehaviorBadgeProps {
  behavior: 'inclusive' | 'exclusive';
  showLabel?: boolean;
}
// Visual indicator of inclusive/exclusive tax
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

#### TaxRateDisplay Component
```typescript
interface TaxRateDisplayProps {
  rate: number;
  format?: 'decimal' | 'percentage';
}
// Displays tax rate as percentage with % symbol
```

---

## 9. API Integration

### 9.1 Admin API Endpoints Used

```typescript
// Channels
GET    /api/channels
GET    /api/channels/{id}
POST   /api/channels
PUT    /api/channels/{id}
DELETE /api/channels/{id}

// Tax Rules
GET    /api/channels/{channelId}/tax-rules
GET    /api/channels/{channelId}/tax-rules/{ruleId}
POST   /api/channels/{channelId}/tax-rules
PUT    /api/channels/{channelId}/tax-rules/{ruleId}
DELETE /api/channels/{channelId}/tax-rules/{ruleId}

// Products by Channel
GET    /api/channels/{channelId}/products
POST   /api/channels/{channelId}/products
PUT    /api/channels/{channelId}/products/{productId}
DELETE /api/channels/{channelId}/products/{productId}

// Vendors by Channel
GET    /api/channels/{channelId}/vendors
POST   /api/channels/{channelId}/vendors
DELETE /api/channels/{channelId}/vendors/{vendorId}

// Analytics
GET    /api/analytics/channels
GET    /api/analytics/tax
GET    /api/analytics/channels/{channelId}
```

### 9.2 Zustand Store Integration

API calls are integrated directly into stores:

```typescript
// Admin hooks use store actions:
const { fetchChannels, createChannel, updateChannel } = useChannelAdminStore(
  (state) => ({
    fetchChannels: state.fetchChannels,
    createChannel: state.createChannel,
    updateChannel: state.updateChannel,
  })
);

// Tax rule operations:
const { fetchTaxRulesByChannel, createTaxRule } = useTaxRulesAdminStore(
  (state) => ({
    fetchTaxRulesByChannel: state.fetchTaxRulesByChannel,
    createTaxRule: state.createTaxRule,
  })
);
```

---

## 10. State Management Updates

### 10.1 Zustand Store Files

**Directory:** `src/store/admin/`

**File: `src/store/admin/channelAdminStore.ts`**
- Channel CRUD operations
- Loading/error states
- Selected channel context
- Bulk operations

**File: `src/store/admin/taxRulesAdminStore.ts`**
- Tax rules per channel
- Create/Update/Delete tax rules
- Bulk tax rule operations
- Loading/error states

**File: `src/store/admin/index.ts`**
```typescript
export { useChannelAdminStore } from './channelAdminStore';
export { useTaxRulesAdminStore } from './taxRulesAdminStore';
```

### 10.2 LocalStorage Schema

```typescript
// Admin-specific preferences
localStorage.setItem('adminChannelPreferences', {
  lastViewedChannelId?: string;
  taxRuleFilters?: {
    active?: boolean;
    behavior?: 'inclusive' | 'exclusive';
    country?: string;
  };
  tablePreferences?: {
    channelsPerPage: number;
    taxRulesPerPage: number;
  };
});
```

---

## 11. Utilities & Helpers

### 11.1 Admin Utility Functions

```typescript
// Currency utilities
export const formatCurrency = (
  amount: number,
  currencyCode: string
): string

export const formatTaxPercentage = (rate: number): string

export const parseTaxPercentageInput = (input: string): number

// Validation utilities
export const validateChannelName = (name: string): boolean

export const validateCurrencyCode = (code: string): boolean

export const validateCountryCode = (code: string): boolean

export const validateTaxRate = (rate: number): boolean

// Formatting utilities
export const getCountryName = (countryCode: string): string

export const getCountryFlag = (countryCode: string): string

export const getRegionName = (countryCode: string, regionCode: string): string

export const getCurrencySymbol = (currencyCode: string): string

export const getTaxBehaviorLabel = (behavior: 'inclusive' | 'exclusive'): string

// Admin-specific helpers
export const formatChannelDisplay = (channel: Channel): string
// Returns: "Channel Name - Country - Currency"

export const getTaxRuleSummary = (rule: ChannelTaxRule): string
// Returns readable summary of tax rule applicability
```

### 11.2 Constants & Enums

```typescript
export const CHANNEL_TYPES = [
  'web',
  'shopify',
  'woocommerce',
  'amazon',
  'ebay',
  'custom',
];

export const COUNTRY_FLAGS = {
  US: '🇺🇸',
  CA: '🇨🇦',
  DE: '🇩🇪',
  FR: '🇫🇷',
  UK: '🇬🇧',
  // ... etc
};

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  // ... etc
};

export const TAX_BEHAVIOR_LABELS = {
  inclusive: 'Tax included in price',
  exclusive: 'Tax added to price',
};

export const COMMON_TAX_RATES = {
  US_SALES_TAX: 0.07,
  CANADIAN_HST: 0.13,
  EU_VAT: 0.19,
  UK_VAT: 0.20,
};
```

---

## 12. Styling & Theme

### 12.1 New CSS Classes (Tailwind)

```css
/* Channel styling */
.channel-badge { /* name + country flag + currency */ }
.channel-badge--small { /* compact version */ }
.channel-badge--large { /* expanded version */ }

.channel-type-badge { /* web, shopify, amazon, etc */ }

/* Tax styling */
.tax-inclusive { /* green indicator */ }
.tax-exclusive { /* orange indicator */ }

.tax-rate-display { /* percentage with % */ }

.tax-rule-summary { /* text describing rule */ }

/* Form styling */
.country-selector { /* dropdown with flags */ }
.currency-selector { /* currency dropdown */ }
.tax-percentage-input { /* percentage input field */ }

/* Table styling */
.admin-table-header { /* admin-specific header */ }
.channel-row { /* channel table row */ }
.tax-rule-row { /* tax rule table row */ }

/* Alert styling */
.tax-compliance-notice { /* regulatory notices */ }
.channel-context-alert { /* current channel context */ }
```

### 12.2 Icons Needed

- [ ] `GlobeIcon` - Global/channel indicator
- [ ] `FlagIcon` - Country flags
- [ ] `CurrencyIcon` - Currency symbols
- [ ] `TaxIcon` - Tax information
- [ ] `SettingsIcon` - Configuration (existing)
- [ ] `AnalyticsIcon` - Analytics/reporting (existing)
- [ ] `CheckIcon` - Active/enabled (existing)
- [ ] `XIcon` - Inactive/disabled (existing)
- [ ] `EditIcon` - Edit action (existing)
- [ ] `TrashIcon` - Delete action (existing)
- [ ] `CopyIcon` - Clone action (existing)

---

## 13. Error Handling & Validation

### 13.1 Validation Errors

**Frontend Validation:**
- [ ] Channel name is required and unique
- [ ] Country code must be valid
- [ ] Currency code must be valid
- [ ] Tax rate must be 0-100
- [ ] At least one of B2B/B2C must be checked for tax rules
- [ ] End date must be after start date

**API Error Handling:**
- [ ] "Channel not found" error
- [ ] "Tax rule not found" error
- [ ] "Channel already exists" conflict
- [ ] "Cannot delete channel with active orders" warning
- [ ] "Currency conversion unavailable" error
- [ ] Invalid country/region code error

### 13.2 User Warnings/Confirmations

**Confirmations:**
- [ ] "Delete channel?" - Shows impact (orders, products, vendors)
- [ ] "Delete tax rule?" - Confirms action
- [ ] "Duplicate channel?" - Confirms with new name prompt
- [ ] "Change channel currency?" - Warning about orders

**Warning Toasts:**
- [ ] "Channel created successfully"
- [ ] "Tax rule updated"
- [ ] "Changes saved"
- [ ] "Action completed with X warnings"

**Info Messages:**
- [ ] "Tax behavior explains how tax is displayed to customers"
- [ ] "Inclusive tax is already included in prices"
- [ ] "Exclusive tax will be added at checkout"
- [ ] "This tax rule will expire on [date]"

---

## 14. Testing Scenarios

### 14.1 Admin Unit Tests

- [ ] Tax percentage input parsing (0-100 to 0-1)
- [ ] Tax rate validation
- [ ] Country/region dependency
- [ ] Tax rule applicability logic
- [ ] Channel uniqueness validation
- [ ] Currency code validation

### 14.2 Admin Integration Tests

- [ ] Create channel → fetch channels shows new one
- [ ] Create tax rule → appears in list
- [ ] Update channel → changes reflected
- [ ] Delete channel → confirmation modal
- [ ] Tax rule date range validation
- [ ] Bulk toggle tax rules active/inactive

### 14.3 Admin E2E Tests

- [ ] Complete channel creation flow
- [ ] Add tax rule to channel
- [ ] Edit tax rule date range
- [ ] Delete tax rule with confirmation
- [ ] View channel analytics
- [ ] Export tax compliance report

---

## 15. Browser & Device Support

### 15.1 Responsive Design

**Desktop:** Full layout with all features
**Tablet:** Simplified forms, collapsible sections, horizontal scroll for tables
**Mobile:** Not required for admin (admin staff typically uses desktop)

### 15.2 Performance Considerations

- [ ] Cache channel list (refresh on edit)
- [ ] Lazy load tax rules per channel
- [ ] Paginate large datasets
- [ ] Debounce form inputs
- [ ] Memoize complex components
- [ ] Optimize table rendering (virtualization for large lists)

---

## 16. Documentation & Help

### 16.1 Admin Documentation

- [ ] Channel configuration guide
- [ ] Tax rule setup guide
- [ ] Step-by-step: Create multi-country channel
- [ ] Tax compliance checklist per region
- [ ] Currency handling guide
- [ ] How to set channel-specific pricing

### 16.2 In-App Help

- [ ] Tooltips on form fields
- [ ] Help icons with explanations
- [ ] Sample tax rule configurations
- [ ] Example channel setups for different scenarios
- [ ] Links to docs from error messages

### 16.3 Code Documentation

- [ ] Store action documentation
- [ ] Component prop documentation
- [ ] API integration examples
- [ ] Custom hook usage examples
- [ ] Utility function documentation

---

## 17. Implementation Priority & Checklist

### Phase 1: Core Infrastructure (Week 1)
- [ ] Set up Zustand admin stores (channels, tax rules)
- [ ] Create admin custom hooks
- [ ] Create utility functions (validation, formatting)
- [ ] Create admin layout/navigation updates

### Phase 2: Channel Management (Week 1-2)
- [ ] Create ChannelList page
- [ ] Create ChannelCreate form
- [ ] Create ChannelEdit page
- [ ] Create basic components (CountrySelector, CurrencySelector, etc.)

### Phase 3: Tax Rules Management (Week 2)
- [ ] Create TaxRulesList page
- [ ] Create TaxRuleForm (create/edit modal)
- [ ] Create TaxBehaviorToggle component
- [ ] Add tax rules tab to channel edit

### Phase 4: Product & Vendor Integration (Week 2-3)
- [ ] Add channel tab to product edit
- [ ] Add channel availability toggles
- [ ] Add channel-specific pricing overrides
- [ ] Add channel tab to vendor edit

### Phase 5: Analytics & Reporting (Week 3)
- [ ] Create channels analytics page
- [ ] Create tax analytics page
- [ ] Add dashboard cards for channels
- [ ] Create analytics charts and tables

### Phase 6: Polish & Testing (Week 4)
- [ ] Form validations and error handling
- [ ] Responsive design (tablet)
- [ ] Admin-specific unit tests
- [ ] Integration tests for main flows
- [ ] E2E tests for critical paths

### Phase 7: Documentation & Deployment (Week 4-5)
- [ ] Admin documentation
- [ ] In-app help and tooltips
- [ ] Code documentation
- [ ] Deploy to staging and test
- [ ] Deploy to production

---

## 18. Potential Issues & Mitigations

| Issue | Impact | Mitigation |
|-------|--------|-----------|
| Tax rule complexity | High | Clear UI with examples, validation feedback, preset templates |
| Country/region selector UX | Medium | Searchable dropdowns, grouped by continent, flag icons |
| Bulk operations performance | Medium | Pagination, async operations with progress indicators |
| Admin form errors | High | Real-time validation, clear error messages, inline help |
| Channel currency change risks | High | Warning modal, prevent if orders exist, document impact |
| Tax rule conflicts (multiple matching) | Medium | Document rule priority, preview which rule applies |
| Data consistency across stores | Medium | Proper error handling, optimistic updates with rollback |

---

## 19. Additional Considerations

### 19.1 Accessibility (WCAG 2.1)

- [ ] All form inputs have proper labels
- [ ] Error messages clearly associated with fields
- [ ] Color not sole indicator of status (inclusive/exclusive tax)
- [ ] Keyboard navigation for all forms and tables
- [ ] Screen reader announcements for modals
- [ ] Proper heading hierarchy
- [ ] Touch targets minimum 44x44px

### 19.2 Security

- [ ] CSRF protection on form submissions
- [ ] Rate limiting on API calls
- [ ] Input sanitization for text fields
- [ ] Authorization checks (admin only)
- [ ] Audit logging for channel/tax rule changes
- [ ] No sensitive data in localStorage (only channel preferences)

### 19.3 Audit & Compliance

- [ ] Track all channel/tax rule changes (created by, timestamp)
- [ ] Maintain tax rule version history
- [ ] Export capability for compliance reporting
- [ ] Tax calculation audit trail
- [ ] Regulatory notice display (GDPR for EU channels, etc.)

### 19.4 Admin UX Best Practices

- [ ] Breadcrumb navigation for nested pages
- [ ] Consistent form layouts and patterns
- [ ] Undo/redo for critical operations (where feasible)
- [ ] Bulk operations with progress indicators
- [ ] Helpful empty states with action prompts
- [ ] Successful operation confirmations
- [ ] Contextual help and examples
