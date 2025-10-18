export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number;
  stock: number;
  attributes?: string;
  createdAt: string;
  productName?: string;
};
