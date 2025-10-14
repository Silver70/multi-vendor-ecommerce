# Clerk Authentication Migration Guide

This guide documents the migration from custom JWT authentication to Clerk authentication for the multi-vendor ecommerce application.

## Overview

The application now uses Clerk for authentication instead of a custom JWT implementation. Clerk handles:
- User registration and login
- Password hashing and security
- Session management
- Email verification
- OAuth providers (optional)

Your backend still maintains a Users table synced via Clerk webhooks to support your business logic (orders, addresses, etc.).

## Architecture

### Flow
1. User signs up/logs in through your custom UI (powered by Clerk APIs)
2. Clerk handles authentication and issues a JWT
3. Frontend receives Clerk JWT and attaches it to API requests as Bearer token
4. Backend verifies Clerk JWT using Clerk's public JWKs
5. Clerk webhook syncs user data to your database when users are created/updated/deleted

## Setup Instructions

### 1. Clerk Dashboard Setup

1. Create a Clerk application at [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Get your keys from the Clerk dashboard:
   - **Publishable Key**: Found in API Keys section
   - **Secret Key**: Found in API Keys section
   - **Frontend API**: Format is `clerk.{your-instance}.{domain}` (e.g., `clerk-test-123.lcl.dev`)

3. Configure Clerk settings:
   - Go to **User & Authentication** > **Email, Phone, Username**
   - Enable Email as a sign-in method
   - Configure email verification settings

4. Set up webhook:
   - Go to **Webhooks** in the Clerk dashboard
   - Click **Add Endpoint**
   - Set URL to: `https://your-api-domain.com/api/Webhook/clerk`
   - For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local API
   - Subscribe to these events:
     - `user.created`
     - `user.updated`
     - `user.deleted`
   - Copy the **Signing Secret** (starts with `whsec_`)

### 2. Backend Configuration

1. Update `appsettings.json` or use User Secrets:

```json
{
  "Clerk": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_...",
    "FrontendApi": "clerk.your-instance.lcl.dev"
  }
}
```

For production, use environment variables or Azure Key Vault.

2. Run the database migration:

```bash
cd backend/EcommerceApi
dotnet ef database update
```

This adds the `ClerkId` field to the Users table.

### 3. Frontend Configuration

1. Create `.env` file in `frontend/` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:5176
```

2. For production, set these environment variables in your hosting platform.

## How It Works

### User Registration

1. User fills out the registration form
2. Frontend calls `signUp.create()` with email and password
3. Clerk sends verification email
4. User enters verification code
5. Frontend calls `signUp.attemptEmailAddressVerification()`
6. Clerk webhook fires `user.created` event
7. Backend webhook endpoint creates user record in database
8. User is redirected to home page

### User Login

1. User fills out login form
2. Frontend calls `signIn.create()` with credentials
3. Clerk validates and returns session
4. Frontend calls `setActive()` to activate session
5. Clerk JWT is automatically stored in cookies
6. Frontend fetches user data from backend using Clerk JWT
7. User is redirected to home page

### API Requests

1. Frontend gets Clerk JWT using `getToken()`
2. JWT is attached as `Authorization: Bearer {token}` header
3. Backend validates JWT using Clerk's public JWKs
4. Backend extracts `sub` claim (Clerk user ID)
5. Backend looks up user in database by `ClerkId`
6. Request proceeds with authenticated user context

### Webhook Sync

When users are created, updated, or deleted in Clerk:

1. Clerk sends POST request to `/api/Webhook/clerk`
2. Backend verifies webhook signature using Svix headers
3. Backend processes event:
   - **user.created**: Creates new user record
   - **user.updated**: Updates existing user record
   - **user.deleted**: Deletes user record (or soft delete)

## Migration from Old System

If you have existing users with the old auth system:

### Option 1: Force Password Reset
1. Keep old AuthController temporarily
2. Add a migration endpoint that:
   - Creates Clerk user with existing email
   - Links Clerk ID to existing database user
   - Forces password reset

### Option 2: Gradual Migration
1. Support both auth systems temporarily
2. Detect which system user belongs to
3. Migrate users as they log in

### Option 3: Fresh Start
1. Remove old AuthController
2. Users re-register with Clerk
3. Manually migrate critical user data if needed

## Key Files Changed

### Backend
- `Models/User.cs`: Added `ClerkId` field, made `PasswordHash` nullable
- `Controllers/WebhookController.cs`: NEW - Handles Clerk webhooks
- `Controllers/UserController.cs`: NEW - Replaces AuthController with Clerk-aware endpoints
- `Program.cs`: Updated JWT validation to use Clerk's JWKs
- `appsettings.json`: Added Clerk configuration section

### Frontend
- `routes/__root.tsx`: Added `ClerkProvider`
- `context/AuthContext.tsx`: Updated to use Clerk hooks
- `components/login-form.tsx`: Updated to use `useSignIn` hook
- `components/register-form.tsx`: Updated to use `useSignUp` hook with email verification
- `middleware/auth.ts`: Simplified to work with Clerk session state
- `.env.example`: Added Clerk configuration

## Testing

### Test Registration Flow
1. Navigate to `/auth/register`
2. Fill in name, email, and password
3. Check email for verification code
4. Enter code and verify
5. Should redirect to home page
6. Check database to confirm user was created with ClerkId

### Test Login Flow
1. Navigate to `/auth/login`
2. Enter credentials
3. Should redirect to home page
4. Check browser dev tools for Clerk session cookie
5. API requests should include Bearer token

### Test Webhook
1. Register a new user in your app
2. Check backend logs for webhook receipt
3. Verify user exists in database with ClerkId
4. Update user in Clerk dashboard
5. Verify changes sync to database

### Test Protected Routes
1. Log out
2. Try to access protected route
3. Should redirect to login
4. Log in
5. Should access protected route successfully

## Troubleshooting

### "User not found in database" after login
- **Cause**: Webhook hasn't synced yet or failed
- **Solution**: Check webhook logs in Clerk dashboard, verify webhook URL is accessible, check backend logs

### JWT validation fails
- **Cause**: Incorrect `FrontendApi` configuration
- **Solution**: Verify `Clerk:FrontendApi` matches your Clerk instance URL

### CORS errors
- **Cause**: Backend not configured for Clerk's domains
- **Solution**: Ensure CORS allows requests from your frontend domain

### Email verification not working
- **Cause**: Clerk email settings not configured
- **Solution**: Check Clerk dashboard email settings, verify email provider is set up

## Security Considerations

1. **Never expose Secret Key**: Only use server-side
2. **Validate webhook signatures**: Always verify Svix headers
3. **Use HTTPS**: Especially for webhook endpoints
4. **Rate limiting**: Implement on authentication endpoints
5. **Environment variables**: Never commit secrets to git

## Additional Features

Clerk provides additional features you can enable:

- **Multi-factor authentication (MFA)**: TOTP, SMS
- **Social OAuth**: Google, GitHub, etc.
- **Magic links**: Passwordless login
- **Organization management**: Multi-tenancy
- **Session management**: Device tracking, revocation
- **User impersonation**: Admin feature

See [Clerk documentation](https://clerk.com/docs) for more details.

## Support

- Clerk Documentation: https://clerk.com/docs
- Clerk Discord: https://clerk.com/discord
- Backend API Reference: https://clerk.com/docs/reference/backend-api
