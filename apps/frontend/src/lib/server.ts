import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { Product } from "~/types/product";

import axios from "axios";

const API_BASE_URL = "http://localhost:5176";

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const getProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Product>>(`${API_BASE_URL}/api/Products`);
    return response.data;
  }
);

export const getProductsQueryOptions = queryOptions({
  queryKey: ["products"],
  queryFn: () => getProducts(),
});
