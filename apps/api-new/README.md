
# API Documentation (NestJS)

This service provides the backend for the AWS Ticket Management System (attendees, check-in, ticket QR generation, and email ticket delivery).

## Tech stack

- NestJS
- TypeORM + PostgreSQL
- BullMQ (Redis-backed job queue)
- Nodemailer (Gmail SMTP)
- Swagger (OpenAPI)

## Running locally

From the repository root, start PostgreSQL and Redis:

```bash
docker compose up -d aws-new-postgres redis
```

Then start the API:

```bash
pnpm -C apps/api-new dev
```

The server listens on `PORT` (default `3000`).

## Swagger

Swagger UI is available at:

- `http://localhost:<PORT>/api/docs`

Use Swagger to explore all endpoints, payloads, response shapes, and authentication requirements.

## Authentication and roles

- Auth is enforced globally via guards in `AuthModule`.
- Most endpoints require a JWT Bearer token.
- Role-based access control is used for protected modules (for example, attendees routes require the `VOLUNTEER` role).

Common endpoints:

- `POST /auth/login` (public): returns `{ accessToken, username }`
- `GET /auth/me` (JWT required): returns the current user and roles

## Key modules and responsibilities

### Attendees

The `AttendeesModule` handles:

- Creating attendees (`POST /attendees`)
- Paginated listing with filters (`GET /attendees`)
	- Supports `search`, `ticketSent`, and `checkedIn` query parameters
- Check-in (`POST /attendees/checkin/:id`)
- Session check-in (`POST /attendees/session/checkin`)
- Lunch tracking updates (`POST /attendees/update/lunch`)
- CSV import (`POST /attendees/csv` with multipart form field `file`)
- Bulk actions
	- `POST /attendees/bulk-delete`
	- `POST /attendees/bulk-send-tickets`

Gotchas:

- `GET /attendees` uses boolean query transforms for `ticketSent` and `checkedIn`. Send them as `true`/`false` strings.
- CSV import expects a multipart upload named `file`. The parser is tolerant of common header variations (for example, `Email Address`, `Full Name`, `Contact Number`).

### Ticket

The `TicketModule` generates ticket QR codes.

Public endpoints (no auth required):

- `GET /tickets/by-email?email=<email>`: returns the ticket as an inline PNG
- `GET /tickets/download?email=<email>`: returns the ticket as an attachment PNG

These are intended for controlled use (for example, help desk / re-download flows).

### Email + Queue

Ticket emails are processed asynchronously using a Redis-backed queue:

- Queue implementation: BullMQ (`QueueModule`) with worker `EmailProcessor`
- Backing service: Redis (not RabbitMQ)
- Worker behavior:
	- Concurrency: 5 jobs
	- Rate limiter: 5 emails/second
	- Retries: 3 attempts with exponential backoff

Important behavior:

- `POST /attendees/bulk-send-tickets` enqueues one job per attendee.
- On successful send, `EmailProcessor` sets `attendee.ticket_sent = true`.
- `POST /attendees/resendTicket/:id` sends the email directly (synchronous) and does not use the queue.
- In `AttendeesService.create`, the queue enqueue is currently commented out. Creating an attendee does not automatically send a ticket unless you explicitly trigger sending. This was done because of the gmail rate limiting us, however if you use other smtp provider like (SES), you should be able to un-comment it for live ticket email notification.

Operational gotchas:

- The worker is registered inside the API service. If the API container/process is down, queued jobs will not be processed.
- Make sure Redis is reachable via `REDIS_HOST`/`REDIS_PORT`.

## Google Forms integration (Apps Script)

You can create attendees from a Google Form submission by calling the attendee creation endpoint from Google Apps Script.

Notes:

- `POST /attendees` is protected by JWT + role guards. For Apps Script, use a dedicated volunteer/service user, obtain a JWT via `POST /auth/login`, and store it in Apps Script properties.
- Alternatively, implement a dedicated “ingest” endpoint protected by a shared secret if you need a non-JWT integration.

Minimal Apps Script example (authenticated request):

```javascript
function onFormSubmit(e) {
	var apiBase = 'https://your-api-domain.example.com';
	var token = PropertiesService.getScriptProperties().getProperty('API_JWT');

	var payload = {
		full_name: e.namedValues['Full Name'][0],
		email: e.namedValues['Email Address'][0],
		phone: e.namedValues['Contact Number'][0],
		food_preference: 'veg',
		session_choice: []
	};

	UrlFetchApp.fetch(apiBase + '/attendees', {
		method: 'post',
		contentType: 'application/json',
		payload: JSON.stringify(payload),
		headers: { Authorization: 'Bearer ' + token },
		muteHttpExceptions: true
	});
}
```

Use Swagger (`/api/docs`) to confirm the expected payload fields.

## Environment variables

See `deployment/.env.example` for a working baseline. Key variables used by the API:

- `PORT`
- `JWT_SECRET`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `REDIS_HOST`, `REDIS_PORT`
- `GMAIL_USER`, `GOOGLE_APP_PASSWORD` (required for email sending)
- `EMAIL_FROM` (optional)
- `CORS_ORIGINS` (comma-separated)

## Migrations

From `apps/api-new`:

```bash
pnpm run migration:generate migrations/<MigrationName>
pnpm run migration:run
```

