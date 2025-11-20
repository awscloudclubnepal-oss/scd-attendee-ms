# Routing Configuration

## Authentication Flow

The app now implements automatic routing based on authentication status:

### Routes

1. **`/` (Home/Root)**
   - **Purpose**: Entry point with automatic routing
   - **Behavior**: 
     - ✅ **Authenticated users** → Redirected to `/dashboard`
     - ❌ **Unauthenticated users** → Redirected to `/signin`
   - Shows a loading spinner during redirect

2. **`/signin` (Sign In)**
   - **Purpose**: Authentication page for organizers
   - **Behavior**:
     - ✅ **Authenticated users** → Redirected to `/dashboard`
     - ❌ **Unauthenticated users** → Shows sign-in form
   - After successful login → Redirects to `/dashboard`

3. **`/dashboard` (Dashboard)**
   - **Purpose**: Main organizer interface
   - **Behavior**:
     - ✅ **Authenticated users** → Shows dashboard
     - ❌ **Unauthenticated users** → Redirected to `/signin`
   - Features (placeholders for now):
     - Scan Tickets
     - View Attendees
     - Reports

## User Flow

### First Visit (Not Signed In)
```
User visits http://localhost:3001
    ↓
App checks auth status
    ↓
Not authenticated
    ↓
Redirects to /signin
    ↓
User enters credentials
    ↓
Successful login
    ↓
Redirects to /dashboard
```

### Returning User (Already Signed In)
```
User visits http://localhost:3001
    ↓
App checks auth status
    ↓
Authenticated (token in localStorage)
    ↓
Redirects to /dashboard
```

### Sign Out Flow
```
User clicks "Sign Out" button
    ↓
Clear auth tokens from localStorage
    ↓
Redirects to /signin
```

## Dashboard Features (Ready for Implementation)

The dashboard is set up with placeholder cards for:

1. **Scan Tickets**
   - Icon: QR Code scanner
   - Purpose: Scan attendee tickets for check-in
   - Status: Coming Soon

2. **Attendees**
   - Icon: Users
   - Purpose: View and manage attendee details
   - Status: Coming Soon

3. **Reports**
   - Icon: Chart/Stats
   - Purpose: View event analytics
   - Status: Coming Soon

## Implementation Notes

- All routes are protected with authentication checks
- Auth state is stored in localStorage (JWT token + username)
- Redirects happen on the client side using Next.js router
- Loading states shown during authentication checks
- Mobile-responsive dashboard layout
- Purple theme consistent throughout

## Next Steps

When you're ready to implement features, tell me which one:
- **Ticket Scanner**: QR code scanning functionality
- **Attendees Management**: View/search/filter attendees
- **Reports**: Statistics and analytics
- **Other features**: Just let me know!
