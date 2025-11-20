# Migrations

- Generate migrations: 
`typeorm migration:generate -d src/data-source.ts migrations/<MIGRATION_NAME>`

- Apply migrations: 
`typeorm migration:run -d src/data-source.ts`


Generate Admin: 
`bun run scripts/generate-admin.ts`

