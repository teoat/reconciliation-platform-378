# Migration Instructions: Add auth_provider to users table

## Current Status

The migration file has been created but requires database administrator privileges to apply.

**Migration File**: `backend/migrations/20250125000000_add_auth_provider_to_users.sql`

## Permission Issue

The current database user (`reconciliation_user`) does not have ALTER TABLE permissions. The migration needs to be run by:
- A database superuser (postgres), OR
- A user with ALTER TABLE permissions on the users table

## Option 1: Run as Database Superuser (Recommended)

```bash
# Connect as postgres superuser
sudo -u postgres psql -d reconciliation_app -f backend/migrations/20250125000000_add_auth_provider_to_users.sql

# OR if using Docker
docker exec -i <postgres_container> psql -U postgres -d reconciliation_app < backend/migrations/20250125000000_add_auth_provider_to_users.sql
```

## Option 2: Grant Permissions to Application User

```sql
-- Connect as postgres superuser
GRANT ALTER ON TABLE users TO reconciliation_user;
GRANT CREATE ON SCHEMA public TO reconciliation_user;

-- Then run the migration
psql -U reconciliation_user -d reconciliation_app -f backend/migrations/20250125000000_add_auth_provider_to_users.sql
```

## Option 3: Manual SQL Execution

If you have database admin access, run these commands directly:

```sql
-- 1. Add the column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'password';

-- 2. Update existing OAuth users
UPDATE users 
SET auth_provider = 'google' 
WHERE password_hash LIKE 'oauth_user_%' 
AND auth_provider = 'password';

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- 4. Add comment
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: password, google, or other OAuth providers';
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'auth_provider';

-- Check index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_auth_provider';

-- Check user distribution
SELECT 
    auth_provider,
    COUNT(*) as user_count
FROM users
GROUP BY auth_provider;
```

## What the Migration Does

1. **Adds `auth_provider` column** - Tracks authentication method (password/google/etc)
2. **Updates existing OAuth users** - Sets auth_provider='google' for users with oauth_user_ password hash pattern
3. **Creates index** - Improves query performance
4. **Adds documentation** - Database comment explaining the column

## Impact

- **No breaking changes** - Column is nullable with default value
- **Backward compatible** - Existing code will work (auth_provider defaults to 'password')
- **New features enabled** - Can now distinguish between authentication methods

## Next Steps After Migration

1. ✅ Migration applied
2. Test signup flow - should create users with `auth_provider='password'`
3. Test Google OAuth - should create users with `auth_provider='google'`
4. Verify SecretManager initialization works for both flows

## Notes

- The application code is already updated to use `auth_provider`
- The migration is safe to run multiple times (uses IF NOT EXISTS)
- Existing users will have `auth_provider='password'` by default
- OAuth users will be automatically updated to `auth_provider='google'`

