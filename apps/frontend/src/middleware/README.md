# Authentication Middleware

This directory contains authentication middleware for protecting routes in the TanStack Router application.

## Overview

The authentication system uses JWT cookies set by the .NET backend. The middleware functions integrate with TanStack Router's `beforeLoad` lifecycle to protect routes and manage user authentication state.

## Available Middleware Functions

### 1. `requireAuth`

Protects routes that require authentication. Redirects to `/login` if the user is not authenticated.

**Usage:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '~/middleware/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: requireAuth,
  component: DashboardComponent,
})

function DashboardComponent() {
  const { user } = Route.useRouteContext()
  return <div>Welcome {user.name}</div>
}
```

### 2. `requireGuest`

Restricts routes to unauthenticated users only (e.g., login, register pages). Redirects to `/` if already authenticated.

**Usage:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { requireGuest } from '~/middleware/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuest,
  component: LoginComponent,
})
```

### 3. `requireRole`

Factory function for role-based authorization. Checks if the authenticated user has one of the allowed roles.

**Usage:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '~/middleware/auth'

export const Route = createFileRoute('/admin/dashboard')({
  beforeLoad: requireRole(['admin', 'superadmin']),
  component: AdminDashboard,
})
```

**Note:** This requires the backend to include role information in the `/api/auth/me` response.

### 4. `optionalAuth`

Attempts to fetch user data but doesn't redirect if not authenticated. Useful for pages with different content for authenticated vs. guest users.

**Usage:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { optionalAuth } from '~/middleware/auth'

export const Route = createFileRoute('/')({
  beforeLoad: optionalAuth,
  component: HomeComponent,
})

function HomeComponent() {
  const context = Route.useRouteContext()
  const user = context.user

  return (
    <div>
      {user ? `Welcome back, ${user.name}!` : 'Welcome, guest!'}
    </div>
  )
}
```

## How It Works

1. **JWT Cookie**: The backend sets an HttpOnly, Secure cookie named `jwt` upon successful login
2. **Validation**: Middleware functions call `/api/auth/me` with `credentials: 'include'` to validate the JWT
3. **Redirect**: If authentication fails, the user is redirected to `/login` with the intended destination in the search params
4. **Context**: Authenticated user data is returned and available via `Route.useRouteContext()`

## Backend Configuration

The middleware expects the following backend endpoints:

- `POST /api/auth/login` - Login endpoint (sets JWT cookie)
- `POST /api/auth/logout` - Logout endpoint (clears JWT cookie)
- `GET /api/auth/me` - Returns current user data (requires valid JWT cookie)

### Backend JWT Configuration (from Program.cs)

```csharp
// JWT cookie is read from "jwt" cookie
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        if (context.Request.Cookies.ContainsKey("jwt"))
        {
            context.Token = context.Request.Cookies["jwt"];
        }
        return Task.CompletedTask;
    }
};
```

### Cookie Configuration (from AuthController.cs)

```csharp
Response.Cookies.Append("jwt", token, new CookieOptions
{
    HttpOnly = true,      // Prevents JavaScript access
    Secure = true,        // HTTPS only
    SameSite = SameSiteMode.Strict,
    Expires = DateTime.UtcNow.AddHours(12)
});
```

## Integration with AuthContext

The middleware works alongside the existing `AuthContext` provider in `context/AuthContext.tsx`. The AuthContext handles:

- Login/logout functionality
- User state management in React
- Initial authentication check on app load

The middleware adds:

- Route-level protection
- Automatic redirects for unauthorized access
- User data in route context

## Example: Protected Route Flow

1. User navigates to `/dashboard`
2. `requireAuth` middleware runs before the component loads
3. Middleware checks `/api/auth/me` with JWT cookie
4. If valid: User data is added to route context, component renders
5. If invalid: User is redirected to `/login?redirect=/dashboard`
6. After successful login, user is redirected back to `/dashboard`

## TypeScript Support

The middleware is fully typed and integrates with TanStack Router's type system. User data returned from the middleware is available in the route context with full type safety.

## Notes

- All middleware functions use `credentials: 'include'` to send the JWT cookie
- The cookie is HttpOnly, so it cannot be accessed via JavaScript (XSS protection)
- SameSite=Strict provides CSRF protection
- The middleware works with TanStack Router's file-based routing system
