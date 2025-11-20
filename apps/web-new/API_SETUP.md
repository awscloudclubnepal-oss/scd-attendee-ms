# API & State Management Setup

## Overview

The application now uses **Axios** for HTTP requests and **TanStack Query (React Query)** for state management, caching, and data synchronization.

## Tech Stack

- **Axios**: HTTP client with interceptors
- **TanStack Query v5**: Server state management
- **TypeScript**: Full type safety

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Components                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  React Query Hooks                      │
│  (useLogin, useLogout, useAttendees, useTickets, etc.)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    API Client                           │
│              (Axios with interceptors)                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend API                            │
│              (NestJS on port 3000)                      │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
web-new/
├── lib/
│   ├── api.ts                  # Axios instance & API client
│   └── auth.ts                 # Auth service (localStorage)
├── hooks/
│   ├── use-auth.ts             # Auth hooks (login, logout, me)
│   ├── use-attendees.ts        # Attendees hooks
│   └── use-tickets.ts          # Tickets hooks
└── components/
    └── providers/
        └── query-provider.tsx  # React Query provider
```

## API Client (`lib/api.ts`)

### Axios Instance

```typescript
import { axiosInstance } from '@/lib/api';

// Configured with:
// - Base URL from env
// - Content-Type: application/json
// - Auto token injection
// - Error handling
```

### Features

1. **Auto Token Injection**: JWT token automatically added to Authorization header
2. **Error Handling**: Standardized error responses
3. **Type Safety**: Full TypeScript support

### API Endpoints

```typescript
// Auth
apiClient.auth.login(credentials)
apiClient.auth.me()

// Attendees (placeholder)
apiClient.attendees.getAll()
apiClient.attendees.getById(id)

// Tickets (placeholder)
apiClient.tickets.getAll()
apiClient.tickets.scan(ticketId)
```

## React Query Hooks

### Authentication Hooks (`hooks/use-auth.ts`)

#### `useLogin()`

Login mutation with auto-redirect to dashboard.

```typescript
const loginMutation = useLogin();

// Usage in component
loginMutation.mutate({ username, password });

// States
loginMutation.isPending   // Loading state
loginMutation.error       // Error object
loginMutation.isSuccess   // Success state
```

#### `useLogout()`

Logout mutation that clears auth and redirects to sign-in.

```typescript
const logoutMutation = useLogout();

// Usage
logoutMutation.mutate();
```

#### `useCurrentUser()`

Query to fetch current user data.

```typescript
const { data, isLoading, error } = useCurrentUser();

// Features:
// - Auto-disabled if not authenticated
// - 5-minute stale time
// - No retry on failure
```

### Attendees Hooks (`hooks/use-attendees.ts`)

```typescript
// Get all attendees
const { data, isLoading, error } = useAttendees();

// Get single attendee
const { data, isLoading, error } = useAttendee(id);
```

### Tickets Hooks (`hooks/use-tickets.ts`)

```typescript
// Get all tickets
const { data, isLoading, error } = useTickets();

// Scan ticket
const scanMutation = useScanTicket();
scanMutation.mutate(ticketId);
```

## Query Provider Setup

The `QueryProvider` wraps the entire app in `app/layout.tsx`:

```tsx
import { QueryProvider } from '@/components/providers/query-provider';

<QueryProvider>
  {children}
</QueryProvider>
```

### Features

- **Default stale time**: 1 minute
- **Retry**: 1 attempt
- **Dev tools**: Included (visible in development)

## Usage Examples

### 1. Sign In Page

```tsx
import { useLogin } from '@/hooks/use-auth';

export default function SignInPage() {
  const loginMutation = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Error display */}
      {loginMutation.error && (
        <div>{loginMutation.error.message}</div>
      )}
      
      {/* Form fields */}
      <input disabled={loginMutation.isPending} />
      
      {/* Submit button */}
      <button disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Loading...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### 2. Dashboard with Logout

```tsx
import { useLogout } from '@/hooks/use-auth';

export default function Dashboard() {
  const logoutMutation = useLogout();

  return (
    <button onClick={() => logoutMutation.mutate()}>
      Sign Out
    </button>
  );
}
```

### 3. Attendees List (Future)

```tsx
import { useAttendees } from '@/hooks/use-attendees';

export default function AttendeesList() {
  const { data, isLoading, error } = useAttendees();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(attendee => (
        <div key={attendee.id}>{attendee.name}</div>
      ))}
    </div>
  );
}
```

### 4. Ticket Scanner (Future)

```tsx
import { useScanTicket } from '@/hooks/use-tickets';

export default function TicketScanner() {
  const scanMutation = useScanTicket();

  const handleScan = (ticketId: string) => {
    scanMutation.mutate(ticketId, {
      onSuccess: () => {
        alert('Ticket scanned successfully!');
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
    });
  };

  return (
    <button 
      onClick={() => handleScan('ticket-123')}
      disabled={scanMutation.isPending}
    >
      {scanMutation.isPending ? 'Scanning...' : 'Scan Ticket'}
    </button>
  );
}
```

## Benefits

### 1. **Automatic Caching**
- Data is cached and shared across components
- Reduces unnecessary API calls
- Improves performance

### 2. **Loading & Error States**
- Built-in loading states (`isPending`)
- Standardized error handling
- Better UX

### 3. **Optimistic Updates**
- Can update UI before API response
- Rollback on error
- Feels instant

### 4. **Auto Refetching**
- Refetch on window focus
- Refetch on reconnect
- Configurable intervals

### 5. **Type Safety**
- Full TypeScript support
- Autocomplete for API calls
- Compile-time error checking

## React Query DevTools

Available in development mode (bottom-right corner):

- View all queries
- Inspect cache
- Debug refetch behavior
- Monitor network requests

## Query Keys Convention

```typescript
// Feature-based query keys
authKeys = {
  all: ['auth'],
  me: ['auth', 'me'],
}

attendeeKeys = {
  all: ['attendees'],
  lists: ['attendees', 'list'],
  list: (filters) => ['attendees', 'list', filters],
  details: ['attendees', 'detail'],
  detail: (id) => ['attendees', 'detail', id],
}
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Next Steps

When implementing new features:

1. **Add API endpoint** to `lib/api.ts`
2. **Create React Query hook** in `hooks/`
3. **Use hook in component**
4. **Enjoy automatic caching and state management!**

## Migration Notes

### Before (Fetch API)

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/attendees')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

### After (React Query)

```typescript
const { data, isLoading, error } = useAttendees();
```

Much simpler and more powerful! 🎉
