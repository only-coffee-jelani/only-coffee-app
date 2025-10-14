# Google OAuth Setup - Backend Implementation

## iOS App Configuration ✅
- **Client ID**: `959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com`
- **URL Scheme**: `com.googleusercontent.apps.959339957405-tcmbul5a30adjpbppru24lqejidj2bos`
- **Redirect URI**: `onlycoffee://oauth/callback`

## Backend Requirements

Your NestJS backend needs to implement these Google OAuth endpoints:

### 1. Get Google OAuth URL
```typescript
// GET /api/v1/auth/oauth/google/url
@Get('oauth/google/url')
async getGoogleAuthUrl() {
  const clientId = '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com';
  const redirectUri = 'onlycoffee://oauth/callback';
  const scope = 'email profile';

  const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return { url };
}
```

### 2. Handle OAuth Callback
```typescript
// POST /api/v1/auth/oauth/callback
@Post('oauth/callback')
async handleOAuthCallback(@Body() body: { code: string; provider: string }) {
  if (body.provider !== 'google') {
    throw new BadRequestException('Invalid provider');
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: body.code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'onlycoffee://oauth/callback',
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const googleUser = await userResponse.json();

  // Find or create user in your database
  let user = await this.userService.findByEmail(googleUser.email);

  if (!user) {
    user = await this.userService.create({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      authProvider: 'google',
      googleId: googleUser.id,
    });
  }

  // Generate JWT tokens
  const accessToken = this.jwtService.sign({ userId: user.id });
  const refreshToken = this.jwtService.sign(
    { userId: user.id },
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}
```

## Environment Variables

Add to your `.env` file:

```bash
GOOGLE_CLIENT_ID=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to: **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   - `onlycoffee://oauth/callback`
6. Under **Authorized JavaScript origins** (if needed):
   - `http://localhost:3000`
   - Your production domain

## Testing the Flow

### From iOS App:
1. User taps "Continue with Google"
2. App calls: `GET /api/v1/auth/oauth/google/url`
3. Backend returns Google OAuth URL
4. App opens URL in browser
5. User signs in with Google
6. Google redirects to: `onlycoffee://oauth/callback?code=...`
7. App captures the code and calls: `POST /api/v1/auth/oauth/callback`
8. Backend exchanges code for tokens and user info
9. Backend returns access token and user data
10. User is logged in!

### Testing Backend Locally:
```bash
# Start your backend
cd backend/services/gateway
npm run start:dev

# Test the URL endpoint
curl http://localhost:3000/api/v1/auth/oauth/google/url

# Should return:
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

## Database Schema

Your User entity should include:

```typescript
@Entity()
export class User {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string; // Optional for OAuth users

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: 'local' })
  authProvider: 'local' | 'google' | 'facebook' | 'apple';

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  facebookId?: string;

  @Column({ nullable: true })
  appleId?: string;
}
```

## Security Notes

1. **Client Secret**: Never commit to version control. Use environment variables.
2. **HTTPS**: In production, use HTTPS for all API endpoints.
3. **Token Validation**: Always validate the access token from Google before trusting user info.
4. **Rate Limiting**: Add rate limiting to OAuth endpoints to prevent abuse.
5. **State Parameter**: Consider adding a state parameter for CSRF protection.

## Troubleshooting

### "redirect_uri_mismatch" Error
- Check that `onlycoffee://oauth/callback` is added to Google Cloud Console
- Ensure the redirect URI in your code exactly matches

### "invalid_client" Error
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Check environment variables are loaded properly

### Token Exchange Fails
- Verify client secret is correct
- Check that code hasn't expired (valid for ~10 minutes)
- Ensure redirect_uri matches exactly

## Quick Start Commands

```bash
# Install dependencies
npm install googleapis @nestjs/jwt @nestjs/passport passport passport-jwt

# Create auth module (if not exists)
nest g module auth
nest g controller auth
nest g service auth

# Create user module (if not exists)
nest g module user
nest g service user
```

## Example Response

When successful, the OAuth callback should return:

```json
{
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

## Next Steps

1. Implement the backend endpoints above
2. Test with Postman or cURL first
3. Get your Google Client Secret from Google Cloud Console
4. Add environment variables
5. Test the full flow from the iOS app
6. Monitor backend logs for any errors

The iOS app is ready and configured with your Google Client ID!
