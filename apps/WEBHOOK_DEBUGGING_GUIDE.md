# Webhook Debugging Guide

## Current Status
You're seeing webhook failures (45% error rate) which means webhooks ARE being called but something is failing.

## Changes Made

### 1. Fixed JSON Deserialization
- Added proper `JsonPropertyName` attributes to match Clerk's JSON format
- Clerk sends: `first_name`, `last_name`, `email_addresses`, etc.
- Our models now correctly map these properties

### 2. Improved Signature Verification
- Enhanced logging to see exactly what's being verified
- Fixed secret decoding (Clerk uses base64-encoded secrets)
- Added detailed logs for debugging

### 3. Temporary Debug Mode
- Added `SkipWebhookSignatureVerification: true` to skip signature checks temporarily
- This lets us see if the issue is signature verification or something else
- **IMPORTANT**: Set this to `false` once webhooks work!

## Next Steps

### 1. Restart Your Backend
```bash
# Stop the current backend (Ctrl+C in the terminal where it's running)

# Then start it again
cd apps/backend/EcommerceApi
dotnet run
```

### 2. Register a New Test User
In Clerk dashboard or your app, register a brand new user.

### 3. Check Backend Logs
You should see detailed logs like:
```
=== Clerk Webhook Received ===
Webhook body length: ...
Webhook body: {"type":"user.created","data":{...}}
⚠️ SKIPPING signature verification - FOR DEBUGGING ONLY!
Received Clerk webhook event: user.created
Created user with ClerkId user_xxx
```

### 4. Check Clerk Dashboard
Go to: Clerk Dashboard → Webhooks → Your Endpoint → Logs

Look for:
- ✅ **200 OK responses** = Working!
- ❌ **401 Unauthorized** = Signature verification failing
- ❌ **400 Bad Request** = Missing headers or bad JSON
- ❌ **500 Internal Server Error** = Code error (check backend logs)

## Common Issues & Solutions

### Issue: Still Getting 401 Errors
**Cause**: Signature verification is still failing (even though we're skipping it now)

**Solution**: Make sure you restarted the backend after the changes

### Issue: Getting 400 Bad Request
**Cause**: Missing Svix headers or malformed request

**Check**:
1. Webhook URL in Clerk is correct: `https://your-ngrok-url.ngrok-free.app/api/Webhook/clerk`
2. URL ends with `/clerk` (case-sensitive)
3. Using POST method

### Issue: Getting 500 Internal Server Error
**Cause**: Database or code error

**Check Backend Logs For**:
- Database connection errors
- JSON deserialization errors
- Null reference exceptions

**Common Fixes**:
1. Make sure database migration ran: `dotnet ef database update`
2. Check connection string in appsettings.json
3. Look at the full error in backend console

### Issue: 200 OK but User Still Not in Database
**Cause**: Webhook succeeded but database insert failed

**Check**:
1. Backend logs for "Created user with ClerkId..."
2. Database for ClerkId column
3. Any constraint violations (duplicate email, etc.)

## Verification Checklist

- [ ] Backend is running and showing logs
- [ ] ngrok is running and forwarding to localhost:5176
- [ ] Webhook URL in Clerk matches ngrok URL
- [ ] Webhook events subscribed: user.created, user.updated, user.deleted
- [ ] `SkipWebhookSignatureVerification: true` in appsettings.json
- [ ] Backend restarted after changes
- [ ] Can access test endpoint: `curl https://your-ngrok-url/api/Webhook/clerk/test`

## What to Look For in Logs

### Success Case:
```
info: EcommerceApi.Controllers.WebhookController[0]
      === Clerk Webhook Received ===
info: EcommerceApi.Controllers.WebhookController[0]
      Webhook body length: 1234
info: EcommerceApi.Controllers.WebhookController[0]
      ⚠️ SKIPPING signature verification - FOR DEBUGGING ONLY!
info: EcommerceApi.Controllers.WebhookController[0]
      Received Clerk webhook event: user.created
info: EcommerceApi.Controllers.WebhookController[0]
      Created user with ClerkId user_2abc123
```

### Failure Case (Signature):
```
info: EcommerceApi.Controllers.WebhookController[0]
      === Clerk Webhook Received ===
warn: EcommerceApi.Controllers.WebhookController[0]
      Invalid webhook signature
```

### Failure Case (Database):
```
info: EcommerceApi.Controllers.WebhookController[0]
      === Clerk Webhook Received ===
fail: EcommerceApi.Controllers.WebhookController[0]
      Error creating user from Clerk webhook
      System.Data.SqlClient.SqlException: ...
```

## Once Webhooks Work

1. **Re-enable signature verification**:
   ```json
   {
     "Clerk": {
       "SkipWebhookSignatureVerification": false
     }
   }
   ```

2. **Test again** to make sure signatures work

3. **If signatures still fail**:
   - Double-check the webhook secret in Clerk dashboard
   - Make sure you're using the secret from the CURRENT webhook endpoint
   - Try deleting and recreating the webhook endpoint in Clerk
   - Get a fresh signing secret

## Manual Testing Webhook Endpoint

Test if the endpoint is accessible:
```bash
# Should return 200 OK with JSON
curl https://your-ngrok-url.ngrok-free.app/api/Webhook/clerk/test
```

Test webhook manually (won't work without valid signature, but tests routing):
```bash
curl -X POST https://your-ngrok-url.ngrok-free.app/api/Webhook/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test" \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,test" \
  -d '{"type":"user.created","data":{"id":"user_test"}}'
```

## Still Not Working?

Share these details:
1. Exact error from Clerk dashboard webhook logs
2. Backend console logs (especially around webhook calls)
3. HTTP status code from Clerk logs
4. Whether ngrok is showing the webhook requests

The most likely issue is:
- Signature verification (we're skipping now, so shouldn't be this)
- JSON deserialization (fixed with JsonPropertyName attributes)
- Database connection or constraint violation
