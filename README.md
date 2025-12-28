# AWS Student Community Day Nepal Attendee Management System

A attendee management system built for AWS Student Communit Day event registration, attendee check-in, and email ticketing.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Database Management](#database-management)
- [Documentation](#documentation)
- [Deployment](#deployment)

## Features

- **Attendee Management**: Create, view, search, and manage event attendees with pagination and filtering
- **Google Forms Integration**: Automatic attendee creation on form submission via Google Apps Script
- **QR Code Ticketing**: Generate unique QR code tickets for each attendee
- **Email Notifications**: Send tickets via email using Gmail SMTP
- **Check-in System**: QR code scanner for attendee check-in at event venues
- **Bulk Operations**: Import attendees from CSV, bulk delete, and bulk email sending
- **Session and Lunch Tracking**: Track attendee participation across event sessions and lunch distribution
- **Admin Dashboard**: Secure admin interface for event management

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy the environment example file and configure your environment variables:
   ```bash
   cp .env.example .env
   ```

## Development Setup

### Start Infrastructure Services

Start the PostgreSQL database and Redis from the project root:

```bash
docker compose up -d aws-new-postgres redis
```

### Run Database Migrations

Apply existing migrations (from `apps/api-new`):

```bash
pnpm run migration:run
```

### Create Admin User

Create an admin user using `ROOT_USER` and `ROOT_PASSWORD` from your `.env` file (from `apps/api-new`):

```bash
pnpm run createadmin
```

### Start Development Server

Start the development server from the project root:

```bash
pnpm run dev
```

## Database Management

### Generate New Migrations

Create a new migration (from `apps/api-new`):

```bash
pnpm migration:generate migrations/<MigrationName>
```

## Documentation

- **API Documentation**: See [apps/api-new/README.md](./apps/api-new/README.md)
- **Web Application Documentation**: See [apps/web-new/README.md](./apps/web-new/README.md)

## Deployment

For production deployment instructions, refer to [deployment/README.md](./deployment/README.md).
