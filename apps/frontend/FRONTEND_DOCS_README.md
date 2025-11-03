# Frontend Documentation

This folder contains comprehensive documentation about the frontend codebase architecture and implementation patterns.

## Documents

### 1. ARCHITECTURE.md
**A complete architectural reference for the frontend codebase.**

- Project structure and directory organization
- Library structure with query patterns
- Component organization and patterns
- Routes and TanStack Router setup
- Hooks and custom utilities
- Authentication and Clerk integration
- Type definitions and interfaces
- Styling with Tailwind CSS
- State management approach (React Query + Hooks)
- API integration patterns
- File naming conventions
- Existing feature examples (Products, Orders, Customers)
- Package dependencies
- Environment setup
- Key architectural decisions
- Performance optimizations

**Use this when you need to understand:**
- How the project is organized
- What technologies are being used
- How data flows through the application
- Where to find specific types of code
- What patterns to follow for new features

**Length:** 1,023 lines, ~27KB

### 2. CHANNELS_IMPLEMENTATION_GUIDE.md
**A step-by-step guide for implementing the Channels feature.**

This guide shows exactly how to implement a new feature following all established patterns in the codebase.

**Includes:**
- Quick-start checklist
- Complete code examples for:
  - Query file with server functions and hooks
  - Route pages with data tables
  - Modal components for CRUD operations
  - Type definitions
- Implementation step-by-step
- Query key hierarchy
- Common patterns reference
- Testing procedures
- Troubleshooting guide
- Resource references to existing examples

**Use this when you:**
- Are implementing the Channels feature
- Want to understand how to implement similar features
- Need code examples following project patterns
- Want to understand the complete feature workflow

**Length:** 1,085 lines, ~30KB

## Quick Navigation

### Understanding the Architecture
1. Start with **ARCHITECTURE.md** Section 1 (Project Structure)
2. Read Section 2 (Library Structure) to understand query organization
3. Review Section 3 (Component Organization) for UI patterns
4. Check Section 16 (Patterns for Channels) for implementation guidance

### Implementing a New Feature
1. Open **CHANNELS_IMPLEMENTATION_GUIDE.md**
2. Follow the step-by-step guide
3. Copy code examples and adapt them
4. Refer back to **ARCHITECTURE.md** for detailed pattern explanations

### Finding Something Specific

**Where are X files?**
- Components: See ARCHITECTURE.md Section 3 (Directory Layout)
- Queries: See ARCHITECTURE.md Section 2 (Query Files)
- Types: See ARCHITECTURE.md Section 7
- Routes: See ARCHITECTURE.md Section 4
- Utilities: See ARCHITECTURE.md Section 2, 5, 6

**How do I implement X?**
- A new page: See CHANNELS_IMPLEMENTATION_GUIDE.md Step 3
- A new API call: See CHANNELS_IMPLEMENTATION_GUIDE.md Step 1
- A new modal: See CHANNELS_IMPLEMENTATION_GUIDE.md Step 4
- A form: See ARCHITECTURE.md Section 3 (Form Components)
- A data table: See ARCHITECTURE.md Section 3 (Data Tables)

**What patterns do we use for X?**
- Component patterns: ARCHITECTURE.md Section 3
- Query patterns: ARCHITECTURE.md Section 2, 10
- Routing patterns: ARCHITECTURE.md Section 4
- State management: ARCHITECTURE.md Section 9
- Error handling: ARCHITECTURE.md Section 10
- Styling: ARCHITECTURE.md Section 8

## Technology Stack at a Glance

- **Framework:** React 19
- **Full-Stack:** TanStack Start
- **Routing:** TanStack Router (file-based)
- **Data Fetching:** React Query (server state)
- **Form Handling:** React Hook Form
- **Tables:** TanStack Table (React Table)
- **UI Components:** shadcn/ui (55+ components)
- **Styling:** Tailwind CSS with CSS variables
- **Icons:** Lucide React
- **Notifications:** Sonner
- **Authentication:** Clerk
- **HTTP Client:** Axios
- **Global State:** None currently (Zustand installed but not used)

## Key Architectural Decisions

1. **Query-First Architecture** - All data flows through React Query
2. **No Global State Library** - Using React Hooks and Context API
3. **Type Safety First** - TypeScript everywhere with proper DTOs
4. **Composition Over Configuration** - Simple, composable components
5. **File-Based Routing** - One file = one route
6. **shadcn/ui for Components** - Pre-built, accessible components
7. **Domain-Driven Organization** - Code organized by domain/feature

## Common File Locations

```
src/
├── lib/queries/DOMAIN.ts          # All API logic for a domain
├── routes/dashboard/FEATURE/      # Feature routes
├── components/FEATURENAME*.tsx    # Feature components
├── components/ui/                 # shadcn/ui components
├── types/TYPE.ts                  # Domain types
├── middleware/auth.ts             # Auth guards
└── context/AuthContext.tsx        # Auth provider
```

## Development Workflow

1. **For a new feature:**
   - Create query file: `src/lib/queries/FEATURE.ts`
   - Create route: `src/routes/dashboard/FEATURE/index.tsx`
   - Create modals/components: `src/components/FEATURE*.tsx`
   - Update navigation: `src/components/app-sidebar.tsx`
   - Export from index: `src/lib/queries/index.ts`

2. **For a new page:**
   - Create route file: `src/routes/dashboard/PATH/index.tsx`
   - Import and use queries from `~/lib/queries`
   - Use shadcn/ui components from `~/components/ui`
   - Follow DataTable pattern from existing pages

3. **For a new API integration:**
   - Add to appropriate query file
   - Create server function with `createServerFn`
   - Add query builder to exports
   - Create mutation hook if needed
   - Update barrel export in `src/lib/queries/index.ts`

## Important Patterns

### Query Organization
```typescript
// 1. DTOs (type definitions)
// 2. Server Functions (createServerFn)
// 3. Query Builders (queryOptions)
// 4. Mutation Hooks (useMutation)
// 5. Exports
```

### Component Pattern
```typescript
// Import queries
// Import UI components
// Define types
// Create component with useQuery/useMutation
// Return JSX
```

### Route Pattern
```typescript
export const Route = createFileRoute('/path')({
  loader: ({ context }) => { /* prefetch data */ },
  beforeLoad: requireAuth,
  component: RouteComponent,
});
```

## Resources

- **Existing Examples:** See ARCHITECTURE.md Section 12
  - Products: `/lib/queries/products.ts`, `/routes/dashboard/inventory/products/`
  - Orders: `/lib/queries/orders.ts`, `/routes/dashboard/orders/`
  - Customers: `/lib/queries/customers.ts`, `/routes/dashboard/customers/`

- **Component Examples:** See `src/components/`
  - Modals: `CreateVendorModal.tsx`, `CreateCategoryModal.tsx`
  - Data Tables: `src/routes/dashboard/*/index.tsx`
  - Forms: Any of the modal components

- **UI Components:** `src/components/ui/` (shadcn/ui)

## Next Steps

1. **Read ARCHITECTURE.md** for a complete understanding of the codebase
2. **Follow CHANNELS_IMPLEMENTATION_GUIDE.md** to implement the Channels feature
3. **Reference existing features** (Products, Orders) for patterns and examples
4. **Check src/routes/** to see real-world page implementations

## Questions?

For specific patterns or implementations:
1. Check ARCHITECTURE.md for pattern explanations
2. Look at existing features in src/routes/ and src/lib/queries/
3. Check src/components/ for component examples
4. Refer to CHANNELS_IMPLEMENTATION_GUIDE.md for step-by-step help

---

**Last Updated:** November 3, 2024
**Covers:** Frontend version with React 19, TanStack Start, shadcn/ui
