import { useAuth } from "@clerk/tanstack-react-start";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5176";

/**
 * Hook for making authenticated API requests with Clerk JWT
 *
 * Usage:
 * ```tsx
 * const authFetch = useAuthenticatedFetch();
 *
 * // GET request
 * const data = await authFetch('/api/products');
 *
 * // POST request
 * const newProduct = await authFetch('/api/products', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'Product' }),
 * });
 * ```
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return async (endpoint: string, options: RequestInit = {}) => {
    // Get Clerk JWT token
    const token = await getToken();

    if (!token) {
      throw new Error("No authentication token available");
    }

    // Merge headers with Authorization header
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    // Return parsed JSON
    return await response.json();
  };
}

// Example component using the hook:
//
// function ProductList() {
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const authFetch = useAuthenticatedFetch();
//
//   useEffect(() => {
//     const loadProducts = async () => {
//       try {
//         const data = await authFetch('/api/products');
//         setProducts(data);
//       } catch (error) {
//         console.error('Failed to load products:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//
//     loadProducts();
//   }, []);
//
//   // ... render products
// }
