import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import axios from "axios";
import { PagedResult } from "./productFn";

const API_BASE_URL = "http://localhost:5176";

export interface Vendor {
  id: string;
  name: string;
  contactEmail?: string;
  website?: string;
}

// Get all vendors with pagination
export const getVendors = createServerFn({ method: "GET" }).handler(
  async () => {
    const response = await axios.get<PagedResult<Vendor>>(
      `${API_BASE_URL}/api/Vendors`
    );
    return response.data;
  }
);

export const getVendorsQueryOptions = queryOptions({
  queryKey: ["vendors"],
  queryFn: () => getVendors(),
});
