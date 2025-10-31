# Quick Fix: Webhook Not Syncing Users

## The Problem

Users you register with Clerk are not appearing in your database because **Clerk's webhooks can't reach `localhost`**. This is a common issue in local development.

## Quick Solutions

### Solution 1: Manual Sync (Fastest for Testing)

I've created a debug endpoint you can use to manually sync users:

1. **After registering/logging in**, make a POST request:
   ```bash
   # Get your token from browser dev tools (Application > Cookies > __session)
   # Or use the DebugSyncUser component
   curl -X POST http://localhost:5176/api/Debug/sync-current-user \
     -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Your Name","email":"your@email.com"}'
   ```

2. **Or use the UI component** - Add to any page:
   ```tsx
   import { DebugSyncUser } from "~/components/DebugSyncUser";

   function YourPage() {
     return (
       <div>
         {/* Show only in development */}
         {import.meta.env.DEV && <DebugSyncUser />}
       </div>
     );
   }
   ```

3. **Check if it worked**:
   ```bash
   curl http://localhost:5176/api/Debug/check-database
   ```

### Solution 2: Use ngrok for Webhooks (Proper Fix)

1. **Install ngrok**:
   ```bash
   # Linux
   sudo snap install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start ngrok** (in a new terminal):
   ```bash
   ngrok http 5176
   ```

   You'll see:
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:5176
   ```

3. **Configure Clerk Webhook**:
   - Go to: https://dashboard.clerk.com/apps/YOUR_APP/webhooks
   - Click "Add Endpoint"
   - Enter URL: `https://abc123.ngrok-free.app/api/Webhook/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the "Signing Secret"

4. **Update `appsettings.json`** with the new webhook secret:
   ```json
   {
     "Clerk": {
       "WebhookSecret": "whsec_YOUR_NEW_SECRET"
     }
   }
   ```

5. **Restart your backend** and register a new user - should sync automatically!

## Verification Steps

### Check if webhook endpoint is accessible:
```bash
# If using ngrok:
curl https://YOUR_NGROK_URL.ngrok-free.app/api/Webhook/clerk/test

# Should return: {"message":"Webhook endpoint is accessible","timestamp":"..."}
```

### Check backend logs:
When a user is created, you should see:
```
=== Clerk Webhook Received ===
Webhook body length: ...
Webhook signature verified successfully
Received Clerk webhook event: user.created
Created user with ClerkId user_xxx
```

### Check database:
```bash
# Using your DB tool, check:
SELECT * FROM Users WHERE ClerkId IS NOT NULL;
```

## Troubleshooting

### "User not found in backend database" after login
- **Cause**: Webhook hasn't synced yet or isn't working
- **Quick fix**: Use the manual sync endpoint or component above
- **Proper fix**: Set up ngrok

### Webhook is called but user still not created
1. Check backend logs for errors
2. Make sure database migration ran: `dotnet ef database update`
3. Check the `ClerkId` column exists in Users table
4. Look for errors in the `HandleUserCreated` method logs

### How to check if webhooks are being called
1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Logs" tab
4. You'll see all webhook attempts and their responses

## Important Notes

- **The debug endpoints are for development only** - remove `DebugController.cs` before deploying to production
- **Webhooks work fine in production** because your API will have a public URL
- **The manual sync is a workaround** - proper fix is using ngrok for local dev

## Still Not Working?

1. Check that backend is running on port 5176
2. Check that you're using the correct Clerk keys
3. Make sure the database migration ran successfully
4. Check for any CORS errors in browser console
5. Look at the detailed logs in the backend terminal

## Files Created for Debugging

- `Controllers/DebugController.cs` - Manual sync endpoints
- `components/DebugSyncUser.tsx` - UI component for manual sync
- `Controllers/WebhookController.cs` - Enhanced logging

These files should be removed before production deployment!
