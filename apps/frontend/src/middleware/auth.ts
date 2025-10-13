import { redirect } from "@tanstack/react-router";

/**
 * Authentication middleware for protected routes
 *
 * This middleware checks if the user is authenticated by verifying
 * the JWT cookie with the backend /api/auth/me endpoint.
 *
 * Usage in route files:
 * ```tsx
 * export const Route = createFileRoute('/protected-route')({
 *   beforeLoad: requireAuth,
 *   component: ProtectedComponent,
 * })
 * ```
 */
export async function requireAuth({
  location,
}: {
  location: { href: string };
}) {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include", // Important: include the JWT cookie
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // User is not authenticated, redirect to login
      throw redirect({
        to: "/login",
        search: {
          // Store the intended destination to redirect after login
          redirect: location.href,
        },
      });
    }

    // Return user data to be available in the route context
    const user = await response.json();
    return { user };
  } catch (error) {
    // If fetch fails or redirect is thrown, handle appropriately
    if (error && typeof error === "object" && "to" in error) {
      throw error; // Re-throw redirect
    }

    // For other errors (network issues, etc.), redirect to login
    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  }
}

/**
 * Middleware for routes that should only be accessible to guests (unauthenticated users)
 * e.g., login and register pages
 *
 * Usage in route files:
 * ```tsx
 * export const Route = createFileRoute('/login')({
 *   beforeLoad: requireGuest,
 *   component: LoginComponent,
 * })
 * ```
 */
export async function requireGuest() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // User is authenticated, redirect to home
      throw redirect({
        to: "/",
      });
    }

    return {};
  } catch (error) {
    // If fetch fails or redirect is thrown, handle appropriately
    if (error && typeof error === "object" && "to" in error) {
      throw error; // Re-throw redirect
    }

    // For other errors, allow access (assume guest)
    return {};
  }
}

/**
 * Role-based authorization middleware factory
 *
 * Usage in route files:
 * ```tsx
 * export const Route = createFileRoute('/admin/dashboard')({
 *   beforeLoad: requireRole(['admin', 'superadmin']),
 *   component: AdminDashboard,
 * })
 * ```
 */
export function requireRole(allowedRoles: string[]) {
  return async ({ location }: { location: { href: string } }) => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // User is not authenticated
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        });
      }

      const user = await response.json();

      // Check if user has required role
      // Note: Adjust this based on your actual user object structure
      // You might need to update the backend to include role in the response
      if (user.role && allowedRoles.includes(user.role)) {
        return { user };
      }

      // User doesn't have required role, redirect to unauthorized page
      throw redirect({
        to: "/unauthorized",
      });
    } catch (error) {
      if (error && typeof error === "object" && "to" in error) {
        throw error; // Re-throw redirect
      }

      // For other errors, redirect to login
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  };
}

/**
 * Optional authentication middleware
 * Attempts to fetch user data but doesn't redirect if not authenticated
 * Useful for pages that have different content for authenticated vs guest users
 *
 * Usage in route files:
 * ```tsx
 * export const Route = createFileRoute('/home')({
 *   beforeLoad: optionalAuth,
 *   component: HomeComponent,
 * })
 * ```
 */
export async function optionalAuth() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const user = await response.json();
      return { user };
    }

    return { user: null };
  } catch (error) {
    // If fetch fails, return null user
    return { user: null };
  }
}
