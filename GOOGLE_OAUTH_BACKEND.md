# Google OAuth Backend Implementation (No Client Secret for iOS)

## Important: iOS Apps Don't Need Client Secrets! ✅

Your iOS app uses the OAuth 2.0 flow for mobile apps, which doesn't require a client secret.

## Two Implementation Options

### Option 1: Backend Proxy (Simpler - Recommended)

The iOS app opens Google OAuth, gets the code, and sends it to your backend. Your backend validates it without needing a secret.

**Backend Code:**

```typescript
// auth.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('auth/oauth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Returns URL for iOS app to open
  @Get('google/url')
  getGoogleAuthUrl() {
    const clientId = '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com';
    const redirectUri = 'onlycoffee://oauth/callback';
    const scope = 'email profile';

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}`;

    return { url };
  }

  // Receives the code from iOS app and validates with Google
  @Post('callback')
  async handleCallback(@Body() body: { code: string; provider: string }) {
    if (body.provider !== 'google') {
      throw new BadRequestException('Invalid provider');
    }

    // Validate the authorization code with Google
    // Note: For mobile apps, you can validate WITHOUT a client secret
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: body.code,
        client_id: '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com',
        redirect_uri: 'onlycoffee://oauth/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new UnauthorizedException(`Google OAuth failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Verify the ID token and get user info
    const userInfo = await this.verifyGoogleToken(tokens.id_token);

    // Find or create user
    let user = await this.authService.findByEmail(userInfo.email);

    if (!user) {
      user = await this.authService.createUser({
        email: userInfo.email,
        firstName: userInfo.given_name || userInfo.name?.split(' ')[0],
        lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' '),
        authProvider: 'google',
        googleId: userInfo.sub,
      });
    }

    // Generate your app's JWT tokens
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

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

  // Verify Google ID token (no client secret needed!)
  private async verifyGoogleToken(idToken: string) {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const tokenInfo = await response.json();

    // Verify the token is for your app
    if (tokenInfo.aud !== '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com') {
      throw new UnauthorizedException('Token audience mismatch');
    }

    return tokenInfo;
  }
}
```

### Option 2: Use Google Sign-In Library (Even Simpler)

Install Google's official library:

```bash
npm install google-auth-library
```

```typescript
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(
      '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com'
    );
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: '959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com',
      });

      const payload = ticket.getPayload();

      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        googleId: payload.sub,
        picture: payload.picture,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async handleGoogleAuth(code: string) {
    // Exchange code for token
    const { tokens } = await this.googleClient.getToken({
      code,
      redirect_uri: 'onlycoffee://oauth/callback',
    });

    // Verify and get user info
    const userInfo = await this.verifyGoogleToken(tokens.id_token);

    // Create or find user in your database
    // ... your user logic here

    return { user, accessToken, refreshToken };
  }
}
```

## Environment Variables

You only need:

```bash
# .env
GOOGLE_CLIENT_ID=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com

# Optional: Only if you create a separate Web client for server-side OAuth
# GOOGLE_CLIENT_SECRET=<only-needed-for-web-client>
```

## Google Cloud Console Setup

### For Your iOS Client (Already Done ✅)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Your iOS OAuth client should have:
   - **Application type**: iOS
   - **Bundle ID**: `com.onlycoffee.app`
   - **No client secret** (not shown for iOS)

### Verify Redirect URIs
In your iOS client settings, make sure you have:
- ✅ `onlycoffee://oauth/callback` (not needed in Console for iOS, handled by URL scheme)

The iOS URL scheme is already configured in your Info.plist, so you're good!

## Testing Flow

### 1. Test URL Generation
```bash
curl http://localhost:3000/api/v1/auth/oauth/google/url

# Response:
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com&redirect_uri=onlycoffee%3A%2F%2Foauth%2Fcallback&response_type=code&scope=email%20profile"
}
```

### 2. Test Token Exchange (After getting code from app)
```bash
curl -X POST http://localhost:3000/api/v1/auth/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AY0e-g7...",
    "provider": "google"
  }'

# Response:
{
  "user": {
    "id": "123",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## Key Points

1. ✅ **No client secret needed** for iOS OAuth
2. ✅ Your Client ID is sufficient: `959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com`
3. ✅ Backend validates the authorization code with Google
4. ✅ Backend verifies the ID token (no secret required)
5. ✅ Backend creates your app's JWT tokens
6. ✅ User is authenticated in your app!

## Security Notes

- ✅ **ID Token Verification**: Always verify the `aud` (audience) claim matches your Client ID
- ✅ **HTTPS in Production**: Use HTTPS for all API calls in production
- ✅ **Token Expiration**: ID tokens are valid for 1 hour, validate expiration
- ✅ **Rate Limiting**: Add rate limiting to prevent abuse

## Troubleshooting

### "invalid_client" Error
- This usually means wrong Client ID
- Verify: `959339957405-tcmbul5a30adjpbppru24lqejidj2bos.apps.googleusercontent.com`

### "redirect_uri_mismatch" Error
- Check that your iOS app Info.plist has the correct URL scheme
- URL scheme: `com.googleusercontent.apps.959339957405-tcmbul5a30adjpbppru24lqejidj2bos`
- Callback: `onlycoffee://oauth/callback`

### Token Validation Fails
- Verify the `aud` claim in the ID token
- Check token hasn't expired
- Ensure you're calling the correct tokeninfo endpoint

## Complete Example

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

Your iOS app is ready, and the backend doesn't need a client secret! 🎉
