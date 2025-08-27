# Database Migrations

This directory will contain SQL migration files for the Website V2 database schema.

## Upcoming Migrations (by Epic)

### Step 1 (Epic A - Identity)
- Users table (pseudonymous identity)
- User preferences table
- Session management

### Step 2+ (Future Epics)
- News sources and articles (Epic B)
- Questions and events (Epic B)
- Stances and responses (Epic D)
- Community aggregation tables (Epic F)
- Moderation queues (Epic H)

## Migration Naming Convention
```
YYYYMMDD_HHMMSS_description.sql
```

Example: `20240115_143000_create_users_table.sql`

## Notes
- All migrations will be added in subsequent steps
- Use Supabase migration tooling for deployment
- Follow RLS (Row Level Security) best practices