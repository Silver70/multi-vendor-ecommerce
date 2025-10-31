# Clerk Authentication Setup Checklist

Use this checklist to ensure your Clerk authentication is properly configured.

## Backend Setup

- [ ] Clerk.BackendAPI NuGet package installed
- [ ] `Clerk` configuration section added to `appsettings.json`
- [ ] Environment variables/secrets configured:
  - [ ] `Clerk:SecretKey`
  - [ ] `Clerk:PublishableKey`
  - [ ] `Clerk:WebhookSecret`
  - [ ] `Clerk:FrontendApi`
- [ ] Database migration created (`dotnet ef migrations add AddClerkIdToUser`)
- [ ] Database migration applied (`dotnet ef database update`)
- [ ] CORS configured to allow frontend domain
- [ ] Webhook endpoint accessible (use ngrok for local dev)

## Frontend Setup

- [ ] `@clerk/tanstack-react-start` package installed (already installed)
- [ ] `.env` file created with:
  - [ ] `VITE_CLERK_PUBLISHABLE_KEY`
  - [ ] `VITE_API_BASE_URL`
- [ ] `ClerkProvider` wrapped around app in `__root.tsx`
- [ ] Login form updated to use Clerk
- [ ] Register form updated to use Clerk
- [ ] AuthContext updated to use Clerk hooks

## Clerk Dashboard Setup

- [ ] Clerk application created at https://dashboard.clerk.com
- [ ] Email authentication enabled
- [ ] Email verification configured
- [ ] Webhook endpoint added:
  - [ ] URL: `https://your-domain.com/api/Webhook/clerk`
  - [ ] Events subscribed: `user.created`, `user.updated`, `user.deleted`
  - [ ] Signing secret copied to backend config
- [ ] API keys copied to configurations

## Testing

- [ ] Registration flow works
  - [ ] User can register
  - [ ] Email verification code received
  - [ ] User can verify email
  - [ ] User redirected after verification
  - [ ] User appears in database with ClerkId
- [ ] Login flow works
  - [ ] User can login with correct credentials
  - [ ] Invalid credentials show error
  - [ ] User redirected after login
- [ ] Webhook sync works
  - [ ] New users created in database
  - [ ] User updates sync to database
  - [ ] Check Clerk dashboard webhook logs
- [ ] Protected routes work
  - [ ] Logged-out users redirected to login
  - [ ] Logged-in users can access protected routes
- [ ] API requests work
  - [ ] Bearer token attached to requests
  - [ ] Backend validates token successfully
  - [ ] User data retrieved from backend

## Optional Enhancements

- [ ] Add social OAuth providers (Google, GitHub, etc.)
- [ ] Enable multi-factor authentication
- [ ] Add password reset flow
- [ ] Implement role-based access control using Clerk metadata
- [ ] Add organization/multi-tenancy support
- [ ] Configure session timeout settings
- [ ] Add user profile management page
- [ ] Implement logout functionality
- [ ] Add "Remember me" functionality

## Production Deployment

- [ ] Move secrets to secure storage (Azure Key Vault, AWS Secrets Manager, etc.)
- [ ] Update webhook URL to production domain
- [ ] Enable HTTPS for all endpoints
- [ ] Configure production Clerk application
- [ ] Update frontend environment variables for production
- [ ] Test webhook in production environment
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Add error tracking (Sentry, Application Insights, etc.)
- [ ] Remove old AuthController and authentication code

## Rollback Plan

If issues occur, you can rollback by:
1. Restore old AuthController
2. Revert Program.cs JWT configuration
3. Revert frontend auth changes
4. Use database migration rollback if needed

Keep the old authentication code in a separate branch until Clerk is fully verified in production.
