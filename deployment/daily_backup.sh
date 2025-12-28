#!/bin/bash

# daily backup script
#
BACKUP_HOME=/path/to/deployment_home

# 1. Navigate to the correct directory
cd $BACKUP_HOME || exit

# 2. Define the filename with the current date
FILENAME="./backups/backup-$(date +%Y-%m-%d_%H-%M-%S).sql"

# 3. Create the backup using Docker
# We use the full path for docker just to be safe in the cron environment
/usr/bin/docker exec aws-new-postgres pg_dump -U postgres "aws-ticket" > "$FILENAME"

# 4. Push to GitHub
# git add just the backups folder or everything
git add .
git commit -m "regular backup: $(date +%Y-%m-%d)"
git push origin master
