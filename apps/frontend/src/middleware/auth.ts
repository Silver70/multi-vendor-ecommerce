import { redirect } from "@tanstack/react-router";

/**
 * Route protection with Clerk
 * Note: For Clerk, we rely on the component-level auth state
 * The middleware just passes through and lets the component check auth
 * Actual protection happens in the component via the AuthContext
 */
export async function requireAuth({
  location,
}: {
  location: { href: string };
}) {
  // For client-side routing with Clerk, we don't do checks here
  // The component will handle redirects based on Clerk's auth state
  // This is because Clerk manages sessions via HTTP-only cookies
  // and we can't reliably check them in route middleware

  console.log(`[MIDDLEWARE] requireAuth called for: ${location.href}`);

  // Return empty object - actual auth check happens in the component
  return {};
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
  // With Clerk, the component will handle redirects
  // based on isSignedIn state from Clerk
  return {};
}

/**
 * Role-based authorization middleware factory
 * Note: With Clerk, role checks should be done in the component
 * using the user data from AuthContext
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
    // Role checks happen in the component using AuthContext
    // This middleware just passes through
    return { allowedRoles };
  };
}

/**
 * Optional authentication middleware
 * Doesn't require authentication but provides user data if available
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
  // With Clerk, components can access auth state via AuthContext
  // This middleware just passes through
  return {};
}
