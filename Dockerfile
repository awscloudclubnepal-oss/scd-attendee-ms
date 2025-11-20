FROM node:20-slim

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

COPY apps/api-new/package.json apps/api-new/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/api-new

RUN pnpm run build

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["pnpm", "run", "start:prod"]

