export type Product = {
  id: string
  vendorId: string
  categoryId: string
  name: string
  description: string
  slug: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  vendorName: string
  categoryName: string
}

export type ProductVariant = {
  id: string
  sku: string
  price: number
  stock: number
  attributes?: Record<string, string>
}

export type ProductDetails = {
  id: string
  name: string
  slug: string
  description: string
  categoryName: string
  vendorName: string
  variants: ProductVariant[]
  imageUrls: string[]
}

