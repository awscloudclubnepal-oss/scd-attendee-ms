# Deployment (Docker Compose + Caddy)

This guide describes how to deploy the AWS Ticket Management System using Docker Compose for containers and Caddy as a reverse proxy.

The provided deployment stack is designed for event-scale usage (for example, AWS Student Community Day with approximately 1,500 participants). For this scale, taking daily backups via a Docker-hosted `pg_dump` is a practical and reliable approach.

## Architecture

- **Caddy**: Terminates TLS and reverse proxies incoming traffic to the API container.
- **API**: Runs the NestJS API (`aws-ticket-api`). The deployment Compose file pulls a prebuilt image from the public Docker Hub repository `awscloudclubtu/aws-ticket-api:latest`.
- **PostgreSQL**: Primary database.
- **Redis**: Used by BullMQ for background jobs.

## Prerequisites

- A Linux server with a public IP
- Docker and Docker Compose plugin installed (`docker compose ...`)
- Firewall rules allowing inbound **80/tcp** and **443/tcp**
- A domain name pointing to the server, or a `nip.io` hostname

## Configuration

All deployment files live in `deployment/`:

- `deployment/docker-compose.yml`
- `deployment/Caddyfile`
- `deployment/.env.example` (copy to `.env`)
- `deployment/daily_backup.sh`

### 1) Create the environment file

From `deployment/`:

```bash
cp .env.example .env
```

Edit `deployment/.env` and set values for:

- `JWT_SECRET`, `ROOT_USER`, `ROOT_PASSWORD`
- `DB_PASS`, `DB_NAME`
- `GMAIL_USER`, `GOOGLE_APP_PASSWORD` (Gmail SMTP)

Note: `DB_HOST` and `REDIS_HOST` are set to container names and should generally remain unchanged.

### 2) Configure Caddy

Open `deployment/Caddyfile` and replace the site address:

- If you have a real domain (recommended):

  - Point your domain’s DNS A/AAAA record to the server.
  - Set the Caddyfile site label to your domain (for example, `tickets.example.com`).

- If you want a quick setup using `nip.io`:

  - Replace `<PUBLIC_IP>` with the server’s public IP.
  - Example: `203.0.113.10.nip.io`

Caddy will obtain and renew TLS certificates automatically.

## Start the stack

From `deployment/`:

```bash
docker compose up -d
```

To follow logs:

```bash
docker compose logs -f caddy aws-ticket-api
```

## Updating the API image (Docker Hub)

`deployment/docker-compose.yml` is configured to run the API from the public Docker Hub image `awscloudclubtu/aws-ticket-api:latest`.

### Publish a new image

Run these commands on your build machine (where you have the repository and Docker available). This requires Docker Hub authentication to already be configured (for example, via `docker login`).

```bash
docker compose build
docker tag aws-ticket-api:latest awscloudclubtu/aws-ticket-api:latest
docker push awscloudclubtu/aws-ticket-api:latest
```

### Pull and restart on the server

On the server (from `deployment/`):

```bash
docker compose pull aws-ticket-api
docker compose up -d
```

## Daily database backups

Backups are handled by `deployment/daily_backup.sh`, which:

1. Creates a timestamped `.sql` dump using `docker exec ... pg_dump` against the running Postgres container.
2. Commits the backup to a Git repository and pushes it to the configured remote (intended to be a private repository).

This is suitable for an event dataset of this size (around 1,500 participants), and keeps operations simple.

### Backup script setup

1) Create a backups directory under your deployment home:

```bash
mkdir -p /path/to/deployment_home/backups
```

2) Edit `deployment/daily_backup.sh` and set:

- `BACKUP_HOME=/path/to/deployment_home`

3) Ensure the directory is a Git repository with a private remote:

```bash
cd /path/to/deployment_home
git init
git remote add origin <YOUR_PRIVATE_GIT_REMOTE_URL>
```

4) Make the script executable:

```bash
chmod +x /path/to/deployment_home/daily_backup.sh
```

Important notes:

- The script currently dumps a database named `aws-ticket`. If your deployed database name differs, update the `pg_dump` command accordingly.
- The script currently pushes to `origin master`. If your backup repository uses `main` (or another branch), update the push target.
- Ensure the server user running cron has Git credentials set up (SSH key or token-based authentication) to push to the private repository.

### Add a cron job

1) Open the crontab editor:

```bash
crontab -e
```

2) Add a daily schedule (example: every day at 02:00):

```cron
0 2 * * * /bin/bash /path/to/deployment_home/daily_backup.sh >> /path/to/deployment_home/backups/cron.log 2>&1
```

3) Verify the cron entry:

```bash
crontab -l
```

### Retrieve backups

You can pull backup files from the server using `scp`:

```bash
scp <user>@<server>:/path/to/deployment_home/backups/backup-*.sql .
```

Alternatively, you can push backups to storage of your choice (for example, object storage) by extending the script. The current script uses Git to push backups to a private repository.

## Restore (optional)

To restore a backup into the running Postgres container (example command, adjust DB name as needed):

```bash
cat /path/to/backup.sql | docker exec -i aws-new-postgres psql -U postgres "aws-ticket"
```

