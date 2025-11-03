# Frontend Codebase Architecture Analysis

## Overview
The frontend is built with **TanStack Start** (React 19), using **TanStack Router** for routing, **React Query** for state management, and **shadcn/ui** for components. The architecture emphasizes modularity, type safety, and clear separation of concerns.

---

## 1. PROJECT STRUCTURE

### Root Directory Layout
```
/apps/frontend/
├── src/
│   ├── components/          # UI components (shadcn + custom)
│   ├── context/             # React Context (Auth)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Libraries & utilities
│   ├── middleware/          # Route middleware & guards
│   ├── routes/              # File-based routes (TanStack Router)
│   ├── store/               # State management (empty, no Zustand yet)
│   ├── styles/              # Global CSS & Tailwind
│   ├── types/               # TypeScript types & interfaces
│   ├── utils/               # Utility functions
│   ├── router.tsx           # Router configuration
│   └── routeTree.gen.ts     # Generated route tree
├── package.json
├── vite.config.ts
├── tailwind.config.mjs
├── tsconfig.json
├── components.json          # shadcn/ui configuration
└── .env                      # Environment variables
```

---

## 2. LIBRARY STRUCTURE (src/lib)

### Overview
The `lib` directory is organized by domain, with a clear separation between:
- **Server Functions** (`createServerFn`) - API calls
- **Query Options** - React Query configuration
- **Mutation Hooks** - Custom hooks for mutations

### Directory Structure
```
src/lib/
├── queries/                 # React Query organization
│   ├── products.ts          # Products & attributes
│   ├── variants.ts          # Product variants
│   ├── orders.ts            # Orders
│   ├── customers.ts         # Customers
│   ├── addresses.ts         # Addresses
│   ├── categories.ts        # Categories
│   ├── vendors.ts           # Vendors
│   └── index.ts             # Barrel export with documentation
├── utils/
│   ├── category-hierarchy.ts # Category tree building
│   └── variant-grouping.ts   # Variant grouping logic
├── utils.ts                 # Helper functions (cn, formatCurrency, formatDate)
├── *Fn.ts                   # Legacy function files (being phased out)
└── API_BASE_URL = "http://localhost:5176"
```

### Query Organization Pattern
Each query file follows this structure:

```typescript
// 1. DTOs & Interfaces
export interface PagedResult<T> { ... }
export interface CreateProductDto { ... }
export interface UpdateProductDto { ... }

// 2. Server Functions (using createServerFn)
export const getProducts = createServerFn({ method: "GET" }).handler(...)
export const getProduct = createServerFn({ method: "GET" }).inputValidator(...).handler(...)
export const createProduct = createServerFn({ method: "POST" }).inputValidator(...).handler(...)

// 3. Query Options (for useQuery)
export const productQueries = {
  all: () => ["products"] as const,
  lists: () => [...productQueries.all(), "list"] as const,
  detail: (id: string) => [...productQueries.all(), "detail", id] as const,
  
  getAll: () => queryOptions({
    queryKey: productQueries.lists(),
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
  }),
  
  getById: (id: string) => queryOptions({
    queryKey: productQueries.detail(id),
    queryFn: () => getProduct({ data: id }),
    enabled: !!id,
  }),
}

// 4. Mutation Hooks
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCompositeProductDto) => {
      return await createProduct({ data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
    },
  });
}
```

### Query Key Hierarchy
```
Products:
  - ["products"]              // Root key
  - ["products", "list"]      // All products list
  - ["products", "detail", id]      // Single product
  - ["products", "slug", slug]      // Product by slug

Orders:
  - ["orders"]
  - ["orders", "list"]
  - ["orders", "detail", id]

Customers:
  - ["customers"]
  - ["customers", "list"]
  - ["customers", "detail", id]
  - ["customers", "by-email", email]

Addresses:
  - ["addresses"]
  - ["addresses", "list"]
  - ["addresses", "detail", id]
  - ["addresses", "customer", customerId]

Product Variants:
  - ["productVariants"]
  - ["productVariants", "all"]
  - ["productVariants", "list"]
  - ["productVariants", "detail", id]
```

---

## 3. COMPONENT ORGANIZATION

### Directory Structure
```
src/components/
├── ui/                      # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── sidebar.tsx
│   └── ... (55+ UI components)
├── admin/                   # Admin-specific components
│   ├── badges/
│   ├── forms/
│   └── selectors/
├── analytics/               # Analytics feature components
│   ├── OverviewTab.tsx
│   ├── RevenueTab.tsx
│   ├── OrdersTab.tsx
│   └── ... (other analytics tabs)
├── app-sidebar.tsx          # Main sidebar with navigation
├── data-table.tsx           # Generic data table component
├── login-form.tsx
├── register-form.tsx
├── nav-main.tsx             # Sidebar navigation
├── nav-user.tsx
├── theme-provider.tsx
├── theme-toggle.tsx
├── CreateVendorModal.tsx    # Feature modals
├── CreateCategoryModal.tsx
├── CreateCustomerModal.tsx
└── ... (other feature components)
```

### Component Patterns

#### 1. Functional Components with React Hooks
All components are functional and use React hooks:
```typescript
export function MyComponent() {
  const { data, isLoading } = useQuery(someQueries.getAll());
  const mutation = useSomeMutation();
  const [state, setState] = useState("");
  
  return <div>...</div>;
}
```

#### 2. Form Components with React Hook Form
```typescript
export function CreateVendorModal({ open, onOpenChange }: Props) {
  const { register, handleSubmit, reset, formState } = useForm<VendorFormData>();
  
  const onSubmit = handleSubmit(async (data) => {
    mutation.mutate(data, {
      onSuccess: () => reset(),
    });
  });
  
  return (
    <Dialog>
      <form onSubmit={onSubmit}>
        <Input {...register("name", { required: true })} />
        {formState.errors.name && <p>{formState.errors.name.message}</p>}
      </form>
    </Dialog>
  );
}
```

#### 3. Data Tables with TanStack Table
```typescript
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button onClick={() => column.toggleSorting()}>
        Product Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  // ... more columns
];

const { data } = useQuery(productQueries.getAll());
<DataTable columns={columns} data={data?.items || []} />
```

#### 4. Modal/Dialog Pattern
```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
      <Button type="submit">Create</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### shadcn/ui Usage
- **Style**: "new-york"
- **Icon Library**: lucide-react
- **CSS Variables**: Enabled (for dark mode support)
- **Components Used**:
  - Form: Input, Textarea, Label, Select, Checkbox
  - Layout: Card, Separator, Sidebar
  - Dialog: Dialog, Drawer, Sheet
  - Navigation: Breadcrumb, Tabs, DropdownMenu
  - Display: Table, Badge, Avatar, Tooltip
  - Feedback: Alert, AlertDialog, Toast (via Sonner)

---

## 4. ROUTES STRUCTURE

### TanStack Router Setup
File-based routing with TanStack Router v1.132+

```
src/routes/
├── __root.tsx               # Root layout
├── index.tsx                # Home page
├── auth/
│   ├── login.tsx
│   ├── register.tsx
│   └── unauthorized.tsx
└── dashboard/
    ├── route.tsx            # Dashboard layout
    ├── overview.tsx         # Dashboard overview
    ├── analytics/
    │   └── index.tsx
    ├── customers/
    │   └── index.tsx
    ├── inventory/
    │   ├── category/
    │   │   └── index.tsx
    │   ├── products/
    │   │   ├── index.tsx
    │   │   ├── create.tsx
    │   │   └── $productId/
    │   │       ├── index.tsx
    │   │       └── edit.tsx
    │   └── vendors/
    │       └── index.tsx
    └── orders/
        ├── index.tsx
        ├── create.tsx
        └── $orderId.tsx
```

### Route Pattern
```typescript
export const Route = createFileRoute("/dashboard/products")({
  // Prefetch data on route load
  loader: ({ context }) => {
    const { queryClient } = context;
    queryClient.prefetchQuery(productQueries.getAll());
  },
  // Auth middleware
  beforeLoad: requireAuth,
  // Component
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data } = useQuery(productQueries.getAll());
  
  return <div>...</div>;
}
```

### Router Configuration (router.tsx)
```typescript
export function getRouter() {
  const queryClient = new QueryClient();
  
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });
  
  setupRouterSsrQueryIntegration({ router, queryClient });
  
  return router;
}
```

---

## 5. HOOKS & CUSTOM UTILITIES

### Directory Structure
```
src/hooks/
├── use-mobile.tsx           # Media query hook
├── useAuthenticatedFetch.ts # Clerk JWT fetch hook
├── useS3Upload.ts           # S3 file upload hook
└── (No Zustand hooks yet)
```

### Key Hooks

#### useAuthenticatedFetch (src/hooks/useAuthenticatedFetch.ts)
```typescript
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();
  
  return async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed`);
    }
    
    return await response.json();
  };
}
```

#### useS3Upload
Used for file uploads to S3 in product creation

#### useAuth (from context)
```typescript
const { user, clerkUser, isSignedIn, loading, fetchUser, getToken } = useAuth();
```

### Utility Functions (src/lib/utils.ts)
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
```

---

## 6. AUTHENTICATION & CONTEXT

### Architecture
- **Auth Provider**: Clerk (via @clerk/tanstack-react-start)
- **Context**: Custom AuthContext wraps Clerk auth

### AuthContext (src/context/AuthContext.tsx)
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: clerkLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUser = async () => {
    if (!isSignedIn || !clerkLoaded) {
      setUser(null);
      setLoading(false);
      return;
    }
    
    // Get Clerk JWT token
    const token = await getToken({ template: "neon" });
    
    // Fetch user from backend using token
    const res = await fetch(`${BaseUrl}/api/User/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      const userData = await res.json();
      setUser(userData);
    }
  };
  
  useEffect(() => {
    if (clerkLoaded) {
      fetchUser();
    }
  }, [isSignedIn, clerkLoaded, clerkUser?.id]);
  
  const value = {
    user,              // Backend user data
    clerkUser,         // Clerk user object
    isSignedIn,
    loading: !clerkLoaded || loading,
    fetchUser,
    getToken,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```

### Middleware (src/middleware/auth.ts)
```typescript
export async function requireAuth() {
  // Component handles actual auth check
  // TanStack Router + Clerk use component-level auth
  return {};
}

export async function requireGuest() {
  return {};
}

export function requireRole(allowedRoles: string[]) {
  return async () => ({ allowedRoles });
}
```

---

## 7. TYPES & INTERFACES

### Directory Structure
```
src/types/
├── product.ts               # Product types
└── productVariant.ts        # Variant types
```

### Type Pattern Example (src/types/product.ts)
```typescript
export type Product = {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendorName: string;
  categoryName: string;
  imageUrl?: string;
};

export type ProductVariant = {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
};

export type ProductDetails = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  vendorId?: string;
  categoryName: string;
  vendorName: string;
  isActive: boolean;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  imageUrls: string[];
};
```

---

## 8. STYLING & THEMING

### Tailwind Configuration (tailwind.config.mjs)
```javascript
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [require("tailwindcss-animate")],
  theme: {
    extend: {
      colors: {
        // CSS variables from app.css
        background, foreground, card, primary, secondary,
        muted, accent, destructive, border, input, ring,
        sidebar, chart
      },
    },
  },
};
```

### Color Scheme
- Uses OKLCH color space for better perceptual uniformity
- CSS custom properties for dynamic theming
- Dark mode support via `darkMode: ["class"]`

### Global Styles (src/styles/app.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* CSS custom properties defined here */
  :root {
    --background: oklch(0.9816 0.0017 247.8390);
    --foreground: oklch(0.1649 0.0352 281.8285);
    /* ... more colors ... */
  }
}
```

---

## 9. STATE MANAGEMENT

### Current Approach
- **React Query**: For server state (data fetching, caching)
- **React Hooks**: For local component state (useState, useReducer)
- **Context API**: For auth context only
- **No Zustand yet**: The project structure exists (`src/store/`) but is empty

### React Query Integration
```typescript
// In routes
const { queryClient } = context; // From router context
queryClient.prefetchQuery(productQueries.getAll()); // Prefetch on route load

// In components
const { data, isLoading, error } = useQuery(productQueries.getAll());
const mutation = useCreateProduct(); // Returns useMutation hook

// Cache invalidation
queryClient.invalidateQueries({ queryKey: productQueries.lists() });
```

### Local State Pattern
```typescript
function MyComponent() {
  // Form state
  const { register, watch, setValue } = useForm<FormData>();
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Complex nested state (kept in useState, not extracted to Zustand)
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
}
```

---

## 10. API INTEGRATION PATTERNS

### Server Functions Pattern
```typescript
// API calls wrapped in createServerFn
const getProducts = createServerFn({ method: "GET" }).handler(async () => {
  const response = await axios.get<PagedResult<Product>>(
    `${API_BASE_URL}/api/Products`,
    { params: { pageSize: 100 } }
  );
  return response.data;
});

// With input validation
const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get(`${API_BASE_URL}/api/Products/${data}`);
    return response.data;
  });

// With complex input validation
const createProduct = createServerFn({ method: "POST" })
  .inputValidator((d: CreateProductDto) => d)
  .handler(async ({ data }) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/Products/composite`,
      data
    );
    return response.data;
  });
```

### API Base URL
- Defined per query file: `const API_BASE_URL = "http://localhost:5176";`
- Centralized in hooks: `import.meta.env.VITE_API_BASE_URL`
- Configured in vite.config.ts with proxy for local development

### Error Handling
```typescript
// In mutations
createProductMutation.mutate(data, {
  onSuccess: () => {
    toast.success("Created successfully");
    queryClient.invalidateQueries({ queryKey: productQueries.lists() });
  },
  onError: (err) => {
    const message = err instanceof Error ? err.message : "Failed";
    toast.error(message);
  },
});

// In components
if (error) return <div>Error: {error.message}</div>;
if (isLoading) return <div>Loading...</div>;
```

### Toast Notifications
Using Sonner toast library:
```typescript
import { toast } from "sonner";

toast.success("Operation successful");
toast.error("Operation failed");
toast.loading("Processing...");
```

---

## 11. FILE NAMING CONVENTIONS

### Component Files
- **UI Components**: `lowercase-kebab-case.tsx` (e.g., `button.tsx`, `dialog.tsx`)
- **Feature Components**: `PascalCase.tsx` (e.g., `CreateVendorModal.tsx`, `ProductVariantSidebar.tsx`)
- **Layout Components**: `lowercase-kebab-case.tsx` (e.g., `app-sidebar.tsx`, `nav-main.tsx`)

### Query/API Files
- **Main queries**: `domain.ts` (e.g., `products.ts`, `orders.ts`)
- **Query builders**: Export as `productQueries`, `orderQueries`, etc.
- **Legacy helper files**: `*Fn.ts` (being phased out)

### Route Files
- **Index routes**: `index.tsx` (e.g., `/dashboard/products/index.tsx`)
- **Dynamic routes**: `$paramName.tsx` (e.g., `$productId.tsx`)
- **Nested layouts**: `route.tsx` (e.g., `/dashboard/route.tsx`)
- **Feature routes**: Use directory structure (e.g., `/dashboard/inventory/products/`)

### Hook Files
- **Custom hooks**: `use*.ts` (e.g., `useAuthenticatedFetch.ts`, `useS3Upload.ts`)
- **Utility hooks**: `*.tsx` (e.g., `use-mobile.tsx`)

---

## 12. EXISTING FEATURE EXAMPLES

### Feature: Products
**Files**:
- Query: `/lib/queries/products.ts`
- Page: `/routes/dashboard/inventory/products/index.tsx`
- Create: `/routes/dashboard/inventory/products/create.tsx`
- Detail: `/routes/dashboard/inventory/products/$productId/index.tsx`
- Edit: `/routes/dashboard/inventory/products/$productId/edit.tsx`

**Pattern**:
- List view with DataTable and search/filter
- Create form with image upload to S3
- Complex variants with attributes
- Composite product creation

### Feature: Orders
**Files**:
- Query: `/lib/queries/orders.ts`
- Page: `/routes/dashboard/orders/index.tsx`
- Create: `/routes/dashboard/orders/create.tsx`
- Detail: `/routes/dashboard/orders/$orderId.tsx`

**Pattern**:
- Order list with status filtering
- Status update dialog
- Order cancellation with confirmation
- Customer and address information

### Feature: Customers
**Files**:
- Query: `/lib/queries/customers.ts`
- Page: `/routes/dashboard/customers/index.tsx`

**Pattern**:
- Customer list with search
- Modal-based creation/update
- Address association

---

## 13. PACKAGE.JSON DEPENDENCIES

### Key Frameworks & Libraries
```json
{
  "@tanstack/react-router": "^1.132.47",
  "@tanstack/react-start": "^1.132.52",
  "@tanstack/react-query": "^5.66.0",
  "@tanstack/react-table": "^8.21.3",
  
  "@clerk/tanstack-react-start": "^0.25.3",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-hook-form": "^7.65.0",
  
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.545.0",
  "sonner": "^2.0.7",
  "zustand": "^5.0.8",  // Installed but not used yet
  
  "axios": "^1.12.2",
  "date-fns": "^4.1.0",
  "clsx": "^2.1.1",
  "recharts": "^2.15.4",
  "vaul": "^1.1.2",
}
```

---

## 14. ENVIRONMENT SETUP

### .env Configuration
```
VITE_API_BASE_URL=http://localhost:5176
VITE_CLERK_PUBLISHABLE_KEY=<key>
```

### Vite Config (vite.config.ts)
```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5176",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart(),
    viteReact(),
  ],
});
```

---

## 15. KEY ARCHITECTURAL DECISIONS

### 1. No Global State Library Yet
- Zustand is installed but not used
- React Query handles server state
- Local component state with React hooks
- Context API for auth

### 2. Query-First Architecture
- All data fetching goes through React Query
- Server functions wrap API calls
- Reusable query builders with proper cache keys
- Automatic cache invalidation on mutations

### 3. Type Safety First
- TypeScript everywhere
- DTOs defined per domain
- Type exports from query files
- Component prop types

### 4. Composition Over Configuration
- Components are simple and composable
- Modal/dialog logic lives in components
- Form logic managed with React Hook Form
- Table columns defined inline

### 5. File-Based Routing
- One route = one file
- Layouts co-located with routes
- Loader functions for prefetching
- Middleware support for auth

### 6. shadcn/ui for Components
- 55+ pre-built UI components
- Customizable via CSS variables
- Dark mode support built-in
- Lucide icons throughout

---

## 16. PATTERNS TO FOLLOW FOR CHANNELS IMPLEMENTATION

### 1. Query Pattern
```typescript
// src/lib/queries/channels.ts
import { createServerFn } from "@tanstack/react-start";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

export const getChannels = createServerFn({ method: "GET" }).handler(async () => {
  // API call
});

export const channelQueries = {
  all: () => ["channels"] as const,
  lists: () => [...channelQueries.all(), "list"] as const,
  
  getAll: () => queryOptions({
    queryKey: channelQueries.lists(),
    queryFn: () => getChannels(),
    staleTime: 5 * 60 * 1000,
  }),
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelQueries.lists() });
    },
  });
};
```

### 2. Route Pattern
```typescript
// src/routes/dashboard/channels/index.tsx
export const Route = createFileRoute("/dashboard/channels")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(channelQueries.getAll());
  },
  beforeLoad: requireAuth,
  component: RouteComponent,
});

function RouteComponent() {
  const { data: channelsResponse } = useQuery(channelQueries.getAll());
  const channels = channelsResponse?.items || [];
  
  return <DataTable columns={columns} data={channels} />;
}
```

### 3. Component Pattern
```typescript
// src/components/CreateChannelModal.tsx
export function CreateChannelModal({ open, onOpenChange }: Props) {
  const { register, handleSubmit } = useForm<ChannelFormData>();
  const createChannelMutation = useCreateChannel();
  
  const onSubmit = handleSubmit((data) => {
    createChannelMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Channel created");
        onOpenChange(false);
      },
    });
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Type Pattern
```typescript
// src/types/channel.ts or in lib/queries/channels.ts
export type Channel = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface CreateChannelDto {
  name: string;
  description?: string;
  isActive?: boolean;
}
```

---

## 17. TESTING & DEBUGGING

### Available DevTools
```typescript
// src/routes/__root.tsx includes
<ReactQueryDevtools /> // React Query DevTools
<TanStackRouterDevtools /> // Router DevTools
```

### Browser Console
- Check Redux DevTools (when Zustand is used)
- Check Network tab for API calls
- Check Application > Cookies for Clerk auth

---

## 18. PERFORMANCE OPTIMIZATIONS

### Data Prefetching
```typescript
loader: ({ context }) => {
  context.queryClient.prefetchQuery(productQueries.getAll());
}
```

### Query Stale Time
```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
```

### Pagination
```typescript
// API returns PagedResult<T>
params: { pageSize: 100, pageNumber: 1 }
```

### Image Optimization
- S3 upload for product images
- Lazy loading with img tags
- Thumbnails for listings

---

## SUMMARY

The frontend follows a **modern, type-safe React architecture** with:
- **TanStack ecosystem** for routing, state, and queries
- **shadcn/ui** for consistent, accessible components
- **Tailwind CSS** for styling with dark mode
- **Clerk** for authentication
- **Domain-driven organization** with clear separation of concerns
- **Query-first approach** to data fetching
- **Composition-based** component design

For the **Channels implementation**, follow the established patterns in the existing features (Products, Orders) and maintain this architectural consistency.
