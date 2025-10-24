# Frontend State Management & Forms Refactoring Plan

## Overview

This document outlines the phased approach to improving the frontend codebase by adopting React Hook Form and organizing React Query queries. This is a low-risk, incremental refactoring that will reduce code complexity and improve maintainability.

---

## Phase 1: React Hook Form Adoption (Week 1)

**Objective:** Reduce form state management complexity by 70%
**Timeline:** 3-4 days
**Risk:** Low (incremental, per-form adoption)

### Why React Hook Form?

- ✅ Reduces useState calls from ~15 per form to ~1
- ✅ Built-in validation, error handling, and state management
- ✅ Drop-in replacement - no need to refactor entire app
- ✅ Better TypeScript support
- ✅ Small bundle size (~10KB)
- ✅ Works seamlessly with existing React Query setup

### Target Forms (Priority Order)

1. **Product Edit Form** (`/src/routes/dashboard/inventory/products/$productId/edit.tsx`)
   - Most complex form in the app
   - Highest pain point with current state
   - ~20 useState calls to consolidate
   - Estimated effort: 2-3 hours

2. **Product Create Form** (`/src/routes/dashboard/inventory/products/create.tsx`)
   - Similar structure to edit form
   - Reuse patterns learned from edit
   - Estimated effort: 1-2 hours

3. **Order Create Form** (`/src/routes/dashboard/orders/create.tsx`)
   - Complex form with custom components (CustomerSearchSelect, AddressSelect, ProductVariantSearch)
   - ~4 useState calls to consolidate (selectedCustomer, selectedAddress, orderItems, form submission)
   - Manual validation logic that can be streamlined with React Hook Form
   - Custom order item state management can be simplified
   - Estimated effort: 1.5-2 hours

4. **Other Forms** (Future priority)
   - Category management forms
   - Vendor management forms
   - User/auth forms
   - Customer management forms
   - Address management forms
   - Order status update forms

### Implementation Pattern

```typescript
// Before (Current)
const [productName, setProductName] = useState("");
const [description, setDescription] = useState("");
const [categoryId, setCategoryId] = useState("");
const [vendorId, setVendorId] = useState("");
// ... 15+ more useState calls

// After (React Hook Form)
const {
  register,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm({
  defaultValues: {
    productName: product?.name,
    description: product?.description,
    categoryId: product?.categoryId,
    vendorId: product?.vendorId,
    // ...
  },
});
```

### Key Features to Leverage

- **register()** - Connect form fields
- **handleSubmit()** - Form submission handler
- **watch()** - Real-time field values (for variants generation, etc.)
- **formState** - Built-in validation and error handling
- **setValue()** - Programmatic field updates (for loading product data)
- **reset()** - Clear form after successful submission

### Special Note: Order Create Form
The order create form is unique because it handles multiple entities (customer, address, order items) that aren't traditional form fields. The refactoring approach:
- Use `useForm` to manage overall form state and validation
- Keep `selectedCustomer` and `selectedAddress` as controlled component state (since they're returned from API calls)
- Use form to manage `orderItems` array (map to hidden fields or manage via form context)
- The custom components (CustomerSearchSelect, AddressSelect, ProductVariantSearch) will remain, but their state management will integrate better with React Hook Form

### Testing Checklist for Each Form

- [ ] Form initializes with correct default values
- [ ] Form fields update correctly
- [ ] Validation works (required fields, formats)
- [ ] Error messages display properly
- [ ] Form submission sends correct data structure
- [ ] Form resets after successful submission
- [ ] Dynamic fields work (variant generation, attribute values, etc.)

---

## Phase 2: React Query Organization (Week 2)

**Objective:** Centralize and organize all API calls
**Timeline:** 2-3 days
**Risk:** Low (organizational, no logic changes)

### Current Structure Issues

- Queries scattered across multiple files
- Inconsistent naming conventions
- No clear separation of concerns
- Difficult to find and reuse queries

### Target Structure

```
src/lib/queries/
├── products.ts
├── categories.ts
├── vendors.ts
├── attributes.ts
├── orders.ts
├── users.ts
└── index.ts (re-exports)
```

### Products Query File Example (`src/lib/queries/products.ts`)

```typescript
import { queryOptions, useMutation } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Product, ProductDetails } from "~/types/product";

// Server functions (API calls)
export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const response = await axios.get<ProductDetails>(
      `${API_BASE_URL}/api/Products/${data}`
    );
    return response.data;
  });

// Query options with caching strategy
export const productQueries = {
  all: () => ["products"] as const,
  lists: () => [...productQueries.all(), "list"] as const,
  detail: (id: string) => [...productQueries.all(), "detail", id] as const,

  // Individual query options
  getAll: () =>
    queryOptions({
      queryKey: productQueries.lists(),
      queryFn: () => getProducts(),
    }),

  getById: (id: string) =>
    queryOptions({
      queryKey: productQueries.detail(id),
      queryFn: () => getProduct({ data: id }),
      enabled: !!id,
    }),
};

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompositeProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueries.lists() });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompositeProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productQueries.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: productQueries.lists(),
      });
    },
  });
};
```

### Organization Benefits

- **Cache management:** Consistent invalidation strategies
- **Reusability:** Import queries from anywhere
- **Maintainability:** Single source of truth for API calls
- **Performance:** Easier to add prefetching and lazy loading
- **Testing:** Easier to mock queries

### Implementation Steps

1. Create `/src/lib/queries/` directory
2. Create separate files for each domain (products, categories, vendors, etc.)
3. Move existing query definitions to appropriate files
4. Create query builder pattern for complex queries
5. Update all imports across the app
6. Add query prefetching in route loaders

### Query Files to Create

- [ ] `products.ts` - Product CRUD and composite product operations
- [ ] `categories.ts` - Category queries
- [ ] `vendors.ts` - Vendor queries
- [ ] `attributes.ts` - Global attributes queries
- [ ] `orders.ts` - Order queries
- [ ] `analytics.ts` - Analytics queries
- [ ] `index.ts` - Re-exports for cleaner imports

---

## Phase 3: Evaluation & Further Optimization (Week 3+)

**Objective:** Assess if additional state management is needed
**Timeline:** Ongoing
**Risk:** Low

### Metrics to Track

- Number of useState calls remaining
- Prop drilling depth
- Code duplication percentage
- Component re-render frequency

### Decision Points

- **If prop drilling < 3 levels:** Context API is sufficient
- **If prop drilling ≥ 3 levels OR state in many components:** Consider Zustand
- **If you have auth/user/theme state:** Small Zustand store is perfect

### Optimization Ideas (If Needed)

1. **Extract reusable filter logic** into custom hooks
2. **Create compound components** to reduce prop drilling
3. **Use composition patterns** instead of extensive props
4. **Consider small Zustand store** for truly global state (auth, user prefs, theme)

---

## Implementation Checklist

### Phase 1: React Hook Form

- [ ] Install dependencies: `npm install react-hook-form`
- [ ] Refactor Product Edit Form
  - [ ] Create form using useForm hook
  - [ ] Connect fields with register()
  - [ ] Move validation logic to form schema (optional: use Zod)
  - [ ] Update submission logic
  - [ ] Test form thoroughly
- [ ] Refactor Product Create Form
  - [ ] Repeat above steps
  - [ ] Test creation and validation
- [ ] Refactor Order Create Form
  - [ ] Consolidate customer/address/items state with useForm
  - [ ] Integrate custom components (CustomerSearchSelect, AddressSelect, ProductVariantSearch)
  - [ ] Simplify validation logic
  - [ ] Test order creation workflow
- [ ] Refactor other forms (as time permits)
- [ ] Update documentation with new pattern

### Phase 2: React Query Organization

- [ ] Create `/src/lib/queries/` directory structure
- [ ] Create `products.ts` with query builder
- [ ] Create `categories.ts`
- [ ] Create `vendors.ts`
- [ ] Create `attributes.ts`
- [ ] Create `orders.ts` - Order queries and mutations
- [ ] Create `customers.ts` - Customer search and queries
- [ ] Create `addresses.ts` - Address queries
- [ ] Create `index.ts` with re-exports
- [ ] Update all imports across the app
  - [ ] Product pages
  - [ ] Category pages
  - [ ] Vendor pages
  - [ ] Order pages (create, detail, list)
  - [ ] Customer pages
  - [ ] Dashboard pages
- [ ] Add route-level prefetching
- [ ] Test all queries work correctly

### Phase 3: Testing & Optimization

- [ ] Unit tests for forms (optional but recommended)
- [ ] Integration tests for forms with queries
- [ ] Performance testing (check re-renders)
- [ ] Code review and cleanup
- [ ] Documentation update

---

## Progress Tracking

### Week 1 - React Hook Form

- [ ] Product Edit Form refactored
- [ ] Product Create Form refactored
- [ ] Order Create Form refactored
- [ ] All form tests passing
- [ ] Estimated lines saved: ~800

### Week 2 - Query Organization

- [ ] All query files created
- [ ] All imports updated
- [ ] Prefetching added
- [ ] Performance verified

### Week 3 - Evaluation & Optimization

- [ ] Metrics collected
- [ ] Decision made on further refactoring
- [ ] Implementation plan updated if needed

---

## Files to Modify

### React Hook Form (Phase 1)

1. `/src/routes/dashboard/inventory/products/$productId/edit.tsx`
2. `/src/routes/dashboard/inventory/products/create.tsx`
3. `/src/routes/dashboard/orders/create.tsx` - Order creation form
4. Other form pages (future)

### Query Organization (Phase 2)

1. Create `/src/lib/queries/products.ts`
2. Create `/src/lib/queries/categories.ts`
3. Create `/src/lib/queries/vendors.ts`
4. Create `/src/lib/queries/attributes.ts`
5. Create `/src/lib/queries/orders.ts`
6. Create `/src/lib/queries/customers.ts`
7. Create `/src/lib/queries/addresses.ts`
8. Create `/src/lib/queries/index.ts`
9. Update imports in:
   - `/src/routes/dashboard/inventory/products/`
   - `/src/routes/dashboard/orders/`
   - `/src/routes/dashboard/inventory/categories/` (if exists)
   - `/src/routes/dashboard/inventory/vendors/` (if exists)
   - All other pages using queries

---

## Resources & References

### React Hook Form

- Docs: https://react-hook-form.com/
- Form validation patterns: https://react-hook-form.com/form-builder
- TypeScript integration: https://react-hook-form.com/ts

### React Query

- Docs: https://tanstack.com/query/latest
- Query design pattern: https://tanstack.com/query/latest/docs/react/important-defaults
- Caching: https://tanstack.com/query/latest/docs/react/caching

### Best Practices

- Keep forms as close to usage as possible
- Use React Query for all server state
- Use React Hook Form for form state
- Only add global state when truly global

---

## Rollback Plan

If issues arise:

1. Git history is preserved - revert to previous version
2. Each form refactoring is independent - can roll back one form
3. Query changes are non-breaking - can revert import structure

---

## Next Steps

1. **Start with Product Edit Form** - Get familiar with React Hook Form patterns
2. **Create test file** - Test the form thoroughly before moving to other forms
3. **Document patterns** - Create a style guide for new forms
4. **Plan Phase 2** - Once Phase 1 is complete, tackle query organization

---

## Notes & Decisions

### Decision: Use React Hook Form (Not Formik)

- **Why:** Lighter weight, better hooks integration, better TypeScript support
- **Rejected Alternatives:**
  - Formik (heavier, class component era)
  - Plain useState (current approach, too verbose)

### Decision: Query Organization (Not Simplified)

- **Why:** Future-proofs the codebase, makes caching explicit, easier to scale
- **Rejected Alternatives:**
  - Keep current scattered approach (maintenance nightmare)
  - Over-engineer with GraphQL (overkill for REST API)

### Decision: Defer Zustand (For Now)

- **Why:** React Hook Form + organized queries solves 90% of pain points
- **Revisit:** After Phase 2 if prop drilling becomes significant issue
- **Trigger:** If > 5 levels of prop drilling or > 10 components need same state

---

**Last Updated:** 2025-10-24
**Next Review:** After Phase 1 completion
