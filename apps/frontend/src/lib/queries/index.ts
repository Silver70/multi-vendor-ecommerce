/**
 * React Query Organization
 *
 * This directory contains all React Query server functions, query options, and mutation hooks
 * organized by domain. Each file handles a specific resource (products, orders, customers, etc.)
 *
 * Structure:
 * - Server Functions: Data fetching operations using createServerFn
 * - Query Options: Reusable query configurations with caching strategies
 * - Mutation Hooks: Custom hooks for mutations with cache invalidation
 *
 * Usage:
 *
 * // Using query options with useQuery
 * import { productQueries } from '~/lib/queries'
 * const { data } = useQuery(productQueries.getAll())
 *
 * // Using mutation hooks
 * import { useCreateProduct } from '~/lib/queries'
 * const createMutation = useCreateProduct()
 * createMutation.mutate(productData)
 *
 * // Backward compatible imports from legacy files
 * import { getProductsQueryOptions, getProductQueryOptions } from '~/lib/queries'
 */

// ============================================================================
// Products & Attributes
// ============================================================================

export {
  // Server Functions
  getProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createCompositeProduct,
  updateCompositeProduct,
  getGlobalAttributes,
  // Query Builders
  productQueries,
  attributeQueries,
  // Mutations
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  // Legacy Exports
  getProductsQueryOptions,
  getProductQueryOptions,
  getProductBySlugQueryOptions,
  getGlobalAttributesQueryOptions,
  // Types
  type PagedResult,
  type CreateProductDto,
  type UpdateProductDto,
  type ProductAttributeInput,
  type VariantInput,
  type ProductInfoDto,
  type CreateCompositeProductDto,
  type ProductAttributeOutput,
  type VariantOutput,
  type CompositeProductResponse,
  type GlobalAttribute,
  type GlobalAttributeValue,
} from "./products";

// ============================================================================
// Product Variants
// ============================================================================

export {
  // Server Functions
  getAllProductVariants,
  getProductVariants,
  getProductVariant,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  // Query Builders
  variantQueries,
  // Mutations
  useCreateProductVariant,
  useUpdateProductVariant,
  useDeleteProductVariant,
  // Legacy Exports
  getAllProductVariantsQueryOptions,
  getProductVariantsQueryOptions,
  getProductVariantQueryOptions,
  // Types
  type CreateProductVariantDto,
  type UpdateProductVariantDto,
  type ProductVariantFilterParams,
} from "./variants";

// ============================================================================
// Orders
// ============================================================================

export {
  // Server Functions
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  // Query Builders
  orderQueries,
  // Mutations
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  // Legacy Exports
  getOrdersQueryOptions,
  getOrderQueryOptions,
  // Types
  type Order,
  type CreateOrderDto,
  type UpdateOrderDto,
  type CreateOrderItemDto,
  type OrderItemInfo,
  type AddressInfo,
  type PaymentInfo,
} from "./orders";

// ============================================================================
// Customers
// ============================================================================

export {
  // Server Functions
  getCustomers,
  getCustomer,
  getCustomerByEmail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  // Query Builders
  customerQueries,
  // Mutations
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  // Legacy Exports
  getCustomersQueryOptions,
  getCustomerQueryOptions,
  getCustomerByEmailQueryOptions,
  // Types
  type CustomerDto,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from "./customers";

// ============================================================================
// Addresses
// ============================================================================

export {
  // Server Functions
  getAddresses,
  getCustomerAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  // Query Builders
  addressQueries,
  // Mutations
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  // Legacy Exports
  getAddressesQueryOptions,
  getAddressQueryOptions,
  getCustomerAddressesQueryOptions,
  // Types
  type AddressDto,
  type CreateAddressDto,
  type UpdateAddressDto,
} from "./addresses";

// ============================================================================
// Categories
// ============================================================================

export {
  // Server Functions
  getCategories,
  // Query Builders
  categoryQueries,
  // Legacy Exports
  getCategoriesQueryOptions,
  // Types
  type Category,
} from "./categories";

// ============================================================================
// Vendors
// ============================================================================

export {
  // Server Functions
  getVendors,
  // Query Builders
  vendorQueries,
  // Legacy Exports
  getVendorsQueryOptions,
  // Types
  type Vendor,
} from "./vendors";

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example 1: Using query builders with useQuery
 *
 * import { useQuery } from '@tanstack/react-query'
 * import { productQueries } from '~/lib/queries'
 *
 * export function ProductList() {
 *   const { data, isLoading } = useQuery(productQueries.getAll())
 *   return <div>...</div>
 * }
 */

/**
 * Example 2: Using mutation hooks
 *
 * import { useCreateProduct } from '~/lib/queries'
 *
 * export function CreateProductForm() {
 *   const createMutation = useCreateProduct()
 *
 *   const onSubmit = (data) => {
 *     createMutation.mutate(data)
 *   }
 *
 *   return <form onSubmit={onSubmit}>...</form>
 * }
 */

/**
 * Example 3: Using legacy imports (for gradual migration)
 *
 * import { getProductsQueryOptions } from '~/lib/queries'
 *
 * const { data } = useQuery(getProductsQueryOptions)
 */

/**
 * Query Key Hierarchy
 *
 * Products:
 * - ["products"]              // all products list key
 * - ["products", "list"]      // all products list
 * - ["products", "detail", id]      // single product
 * - ["products", "slug", slug]      // product by slug
 *
 * Orders:
 * - ["orders"]                // all orders list key
 * - ["orders", "list"]        // all orders list
 * - ["orders", "detail", id]  // single order
 *
 * Customers:
 * - ["customers"]             // all customers list key
 * - ["customers", "list"]     // all customers list
 * - ["customers", "detail", id]    // single customer
 * - ["customers", "by-email", email] // customer by email
 *
 * Addresses:
 * - ["addresses"]             // all addresses list key
 * - ["addresses", "list"]     // all addresses list
 * - ["addresses", "detail", id]     // single address
 * - ["addresses", "customer", customerId] // addresses for customer
 *
 * Variants:
 * - ["productVariants"]       // all variants list key
 * - ["productVariants", "all"] // all variants (no pagination)
 * - ["productVariants", "list"] // variant list (paginated)
 * - ["productVariants", "detail", id] // single variant
 * - ["productVariants", filters] // filtered variants
 *
 * Categories:
 * - ["categories"]            // all categories list key
 * - ["categories", "list"]    // all categories list
 *
 * Vendors:
 * - ["vendors"]               // all vendors list key
 * - ["vendors", "list"]       // all vendors list
 *
 * Global Attributes:
 * - ["globalAttributes"]      // all global attributes
 */
