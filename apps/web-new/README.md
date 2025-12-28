
# Ticketing UI (Next.js)

This application is the admin and operations UI for the AWS Ticket Management System. It supports attendee management (search, pagination, bulk actions, CSV import), ticket sending, and on-site scanning/check-in workflows.

## Prerequisites

- Node.js (v18+)
- pnpm

## Environment variables

Create a local environment file (recommended):

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_API_URL`
	- Base URL for the API (example: `http://localhost:3000`)
- `NEXT_PUBLIC_PAGINATION_LIMIT`
	- Controls how many attendees are shown per page in the attendee list
	- Defaults to `20` when unset

## Development

Start the development server from the repository root. This is the recommended workflow because the UI almost always requires the backend API to be running.

```bash
pnpm run dev
```

By default, this UI runs on port `3001`.

## Notes

- The attendee list page uses `NEXT_PUBLIC_PAGINATION_LIMIT` to determine the page size sent to the API.
- For API details and payload shapes, rely on Swagger (`/api/docs`) exposed by the API service.

## TODO

- Implement an analytics dashboard (attendance, check-in rates, ticket sending status)
- Improve state management for the scanner and attendee list (reduce refetch churn, improve offline/latency handling)

