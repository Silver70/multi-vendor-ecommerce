# Local Development Webhook Setup

Clerk webhooks won't work with `localhost` because Clerk's servers can't reach your local machine. You need to expose your local API using a tunneling service.

## Option 1: Using ngrok (Recommended)

### 1. Install ngrok
```bash
# Download from https://ngrok.com/download
# Or use snap on Linux:
sudo snap install ngrok

# Or use homebrew on Mac:
brew install ngrok/ngrok/ngrok
```

### 2. Sign up and authenticate
```bash
# Sign up at https://dashboard.ngrok.com/signup
# Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Start your backend
```bash
cd apps/backend/EcommerceApi
dotnet run
# Should be running on http://localhost:5176
```

### 4. Expose your local server
```bash
# In a new terminal:
ngrok http 5176
```

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5176
```

### 5. Configure Clerk webhook
1. Go to Clerk Dashboard → Webhooks
2. Click "Add Endpoint"
3. Enter URL: `https://abc123.ngrok-free.app/api/Webhook/clerk`
   (Replace `abc123.ngrok-free.app` with your ngrok URL)
4. Subscribe to events:
   - user.created
   - user.updated
   - user.deleted
5. Click "Create"
6. **Important**: Copy the "Signing Secret" and update your `appsettings.json`:
   ```json
   {
     "Clerk": {
       "WebhookSecret": "whsec_your_new_secret_here"
     }
   }
   ```

### 6. Test the webhook
1. First, test if the endpoint is accessible:
   ```bash
   curl https://abc123.ngrok-free.app/api/Webhook/clerk/test
   ```
   Should return: `{"message":"Webhook endpoint is accessible","timestamp":"..."}`

2. Register a new user in your app

3. Check backend logs for webhook messages:
   ```
   === Clerk Webhook Received ===
   Webhook body length: ...
   Webhook body: {"type":"user.created",...}
   ```

4. Check database for new user:
   ```sql
   SELECT * FROM Users WHERE ClerkId IS NOT NULL;
   ```

## Option 2: Using Cloudflare Tunnel

### 1. Install cloudflared
```bash
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

### 2. Run tunnel
```bash
cloudflared tunnel --url http://localhost:5176
```

### 3. Use the provided URL in Clerk webhook configuration

## Option 3: Using VS Code Port Forwarding (Limited)

If you have VS Code Remote or GitHub Codespaces:
1. Open Ports panel
2. Forward port 5176
3. Make port public
4. Use the provided URL

**Note**: This may not work reliably for webhooks.

## Troubleshooting

### Webhook not being called
1. **Check ngrok is running**: You should see requests in the ngrok terminal
2. **Check Clerk webhook logs**: Go to Clerk Dashboard → Webhooks → Click your endpoint → View logs
3. **Check webhook URL**: Make sure it ends with `/api/Webhook/clerk` (case-sensitive)
4. **Check firewall**: Make sure port 5176 isn't blocked

### Webhook called but signature fails
1. **Check webhook secret**: Must match between Clerk and your `appsettings.json`
2. **Check for extra characters**: No spaces or quotes in the secret
3. **Look at backend logs**: Check the signature verification logs

### User not created in database
1. **Check backend logs**: Look for errors in `HandleUserCreated`
2. **Check database connection**: Make sure EF Core can connect to your database
3. **Check User model**: Make sure `ClerkId` field exists (run migration)
4. **Check webhook payload**: Look at the logs to see what data Clerk is sending

### Backend logs to check
```bash
cd apps/backend/EcommerceApi
dotnet run
# Watch for these log messages:
# - "=== Clerk Webhook Received ==="
# - "Webhook signature verified successfully"
# - "Received Clerk webhook event: user.created"
# - "Created user with ClerkId ..."
```

## Alternative: Skip Webhooks for Testing

If you just want to test the authentication flow without webhooks:

1. Manually create a user in the database after registration:
   ```sql
   INSERT INTO Users (Id, ClerkId, Name, Email, Role, CreatedAt)
   VALUES (
     gen_random_uuid(),
     'user_xxx', -- Get this from Clerk dashboard
     'Test User',
     'test@example.com',
     'customer',
     NOW()
   );
   ```

2. Or create a temporary endpoint to manually sync:
   ```csharp
   [HttpPost("sync-user")]
   public async Task<IActionResult> SyncUser([FromBody] string clerkId)
   {
       // Use Clerk SDK to fetch user and create in database
       // This is just for testing!
   }
   ```

## Production Setup

For production, webhooks work normally because:
- Your API has a public URL
- Clerk can reach it directly
- No tunneling needed

Just configure the webhook with your production URL:
```
https://api.yourapp.com/api/Webhook/clerk
```
