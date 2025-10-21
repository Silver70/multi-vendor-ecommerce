export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  createdAt: string;
  productName?: string;
};
