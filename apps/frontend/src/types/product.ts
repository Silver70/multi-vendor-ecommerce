export type Product = {
  id: string
  vendorId: string
  categoryId: string
  name: string
  description: string
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
}

export type ProductDetails = {
  id: string
  name: string
  description: string
  categoryName: string
  vendorName: string
  variants: ProductVariant[]
  imageUrls: string[]
}

