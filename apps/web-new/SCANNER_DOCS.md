# QR Code Ticket Scanner Implementation

## Overview

A complete QR code ticket scanning system with validation, attendee lookup, and check-in functionality.

## Features

✅ **QR Code Scanning**
- Camera-based QR code scanning using html5-qrcode
- Auto-detect and prefer back camera on mobile devices
- Real-time scanning with visual feedback

✅ **Data Validation**
- Comprehensive JSON validation
- Schema checking (id, email, full_name)
- Type validation (id must be positive integer)
- Email format validation
- Error handling for invalid QR codes

✅ **Attendee Management**
- Fetch attendee details from API
- Display comprehensive attendee information
- Check-in functionality
- Real-time status updates

✅ **Mobile-First Design**
- Responsive layout
- Touch-friendly controls
- Optimized camera preview

## File Structure

```
web-new/
├── app/
│   └── scanner/
│       └── page.tsx                    # Main scanner page
├── components/
│   ├── scanner/
│   │   └── qr-scanner.tsx              # QR scanner component
│   └── attendees/
│       └── attendee-details.tsx        # Attendee info display
├── lib/
│   ├── qr-validator.ts                 # QR data validation
│   └── api.ts                          # API endpoints
├── hooks/
│   └── use-attendees.ts                # Attendee queries & mutations
└── types/
    └── attendee.ts                     # TypeScript types
```

## QR Code Format

The QR code must contain a JSON string with the following structure:

```json
{
  "id": 123,
  "email": "attendee@example.com",
  "full_name": "John Doe"
}
```

### Field Requirements

- **id**: Must be a positive integer (number type)
- **email**: Must be a valid email format
- **full_name**: Must be a non-empty string

## Validation Logic

The `validateQRData` function performs the following checks:

1. ✅ QR string is not empty
2. ✅ String is valid JSON
3. ✅ All required fields present (id, email, full_name)
4. ✅ ID is a valid positive integer
5. ✅ Email matches regex pattern
6. ✅ Name is a non-empty string
7. ✅ Handles unexpected errors gracefully

### Example Validation Results

**Valid QR Code:**
```typescript
{
  isValid: true,
  data: {
    id: 123,
    email: "attendee@example.com",
    full_name: "John Doe"
  }
}
```

**Invalid QR Code:**
```typescript
{
  isValid: false,
  error: "Invalid email format"
}
```

## API Integration

### Endpoints Used

1. **GET /attendees/:id**
   - Fetches attendee details by ID
   - Returns Attendee object

2. **POST /attendees/checkin/:id**
   - Checks in an attendee
   - Updates check_in_time and checked_in status

3. **GET /attendees/ischeckedin/:id**
   - Checks if attendee is already checked in
   - Returns boolean status

## User Flow

```
┌─────────────────────────────────────────┐
│  User opens Scanner Page                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Camera permission requested            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  User scans QR code                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  QR data validated                      │
│  ├─ Valid → Continue                    │
│  └─ Invalid → Show error                │
└────────────────┬────────────────────────┘
                 │ (if valid)
                 ▼
┌─────────────────────────────────────────┐
│  Fetch attendee from API                │
│  ├─ Found → Display details             │
│  └─ Not found → Show error              │
└────────────────┬────────────────────────┘
                 │ (if found)
                 ▼
┌─────────────────────────────────────────┐
│  Show attendee details                  │
│  - Personal info                        │
│  - Check-in status                      │
│  - Meal status                          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  User clicks "Check In"                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  POST check-in to API                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Success message shown                  │
│  Ready for next scan                    │
└─────────────────────────────────────────┘
```

## Component Breakdown

### 1. QR Scanner Component

**Location:** `components/scanner/qr-scanner.tsx`

**Features:**
- Camera selection dropdown
- Start/Stop controls
- Visual scanner frame
- Real-time QR detection

**Props:**
```typescript
interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}
```

**Usage:**
```tsx
<QRScanner
  onScan={(qrString) => handleScan(qrString)}
  onError={(error) => setError(error)}
/>
```

### 2. Attendee Details Component

**Location:** `components/attendees/attendee-details.tsx`

**Features:**
- Complete attendee information display
- Check-in button (if not checked in)
- Status indicators
- Loading states

**Props:**
```typescript
interface AttendeeDetailsProps {
  attendee: Attendee;
  onCheckIn?: () => void;
  isCheckingIn?: boolean;
  onClose?: () => void;
}
```

**Displays:**
- Personal info (name, email, phone)
- Event details (food preference, sessions)
- Check-in status (time, status)
- Meal status (lunch 1, lunch 2)

### 3. Scanner Page

**Location:** `app/scanner/page.tsx`

**Features:**
- Protected route (auth required)
- Full scanner workflow
- Error handling
- Success notifications
- Attendee not found handling

## Error Handling

### Types of Errors

1. **Invalid QR Format**
   ```
   "Invalid QR code format. Expected JSON data."
   ```

2. **Missing Fields**
   ```
   "Missing required field: email"
   ```

3. **Invalid Data Types**
   ```
   "Invalid ID: must be a positive integer"
   "Invalid email format"
   ```

4. **Attendee Not Found**
   ```
   "No attendee found with ID: 123"
   ```

5. **Camera Access**
   ```
   "Unable to access camera. Please check permissions."
   ```

6. **Network Errors**
   ```
   "Failed to check in attendee"
   ```

### Error Display

- Errors shown in red alert boxes
- Clear, user-friendly messages
- Dismissible errors
- Option to try again

## Testing

### Test QR Codes

Create test QR codes with these JSON strings:

**Valid Ticket:**
```json
{"id": 1, "email": "test@example.com", "full_name": "Test User"}
```

**Invalid - Missing Field:**
```json
{"id": 1, "full_name": "Test User"}
```

**Invalid - Wrong Type:**
```json
{"id": "abc", "email": "test@example.com", "full_name": "Test User"}
```

**Invalid - Not JSON:**
```
Not a JSON string
```

### Manual Testing Steps

1. ✅ Navigate to /scanner
2. ✅ Grant camera permissions
3. ✅ Scan valid QR code
4. ✅ Verify attendee details display
5. ✅ Click "Check In"
6. ✅ Verify success message
7. ✅ Scan invalid QR code
8. ✅ Verify error message
9. ✅ Test with non-existent attendee ID
10. ✅ Verify camera stop/start

## Security Considerations

1. **Input Validation**: All QR data validated before API calls
2. **Error Handling**: No sensitive error details exposed
3. **Authentication**: Scanner page requires login
4. **Authorization**: API validates user role (VOLUNTEER)

## Performance

- ✅ React Query caching reduces API calls
- ✅ Optimistic updates for better UX
- ✅ Lazy loading of attendee data
- ✅ Camera only active when needed

## Browser Compatibility

**Supported:**
- ✅ Chrome (desktop & mobile)
- ✅ Safari (iOS)
- ✅ Firefox (desktop & mobile)
- ✅ Edge

**Requirements:**
- Camera access
- getUserMedia API support
- JavaScript enabled

## Troubleshooting

### Camera not working

1. Check browser permissions
2. Try different camera (use dropdown)
3. Reload page
4. Check HTTPS (required for camera)

### QR code not scanning

1. Ensure good lighting
2. Hold steady in frame
3. Clean camera lens
4. Check QR code quality

### Attendee not found

1. Verify QR code is from this event
2. Check attendee exists in database
3. Verify API is running

## Future Enhancements

Possible improvements:

- [ ] Bulk scanning mode
- [ ] Offline support
- [ ] Manual ID entry
- [ ] Scan history
- [ ] Statistics dashboard
- [ ] Export check-in reports
- [ ] Sound/vibration feedback
- [ ] Duplicate scan prevention

## Dependencies

```json
{
  "html5-qrcode": "^2.3.8",
  "@tanstack/react-query": "^5.90.10",
  "axios": "^1.13.2"
}
```

## Routes

- `/scanner` - QR code scanner page
- `/dashboard` - Main dashboard with scanner link

## Access

Only authenticated users (organizers/volunteers) can access the scanner.
