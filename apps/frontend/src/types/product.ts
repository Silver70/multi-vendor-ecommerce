export type Product = {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  price: number
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock"
}
