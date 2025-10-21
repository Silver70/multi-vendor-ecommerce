import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";
import { PagedResult } from "./productFn";

const API_BASE_URL = "http://localhost:5176";

export interface Category {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  parentName?: string;
}

// Get all categories with pagination
export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Category>>(
      `${API_BASE_URL}/api/Categories`
    );
    return response.data;
  }
);

export const getCategoriesQueryOptions = queryOptions({
  queryKey: ["categories"],
  queryFn: () => getCategories(),
});
