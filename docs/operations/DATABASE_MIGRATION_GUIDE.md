# Database Migration Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide explains how to execute database migrations for the Reconciliation Platform backend.

## Prerequisites

1. **PostgreSQL Database**: Ensure PostgreSQL is running and accessible
2. **DATABASE_URL**: Set the `DATABASE_URL` environment variable
3. **Diesel CLI**: Install Diesel CLI for running migrations

## Installation

### Install Diesel CLI

```bash
cargo install diesel_cli --no-default-features --features postgres
```

## Running Migrations

### Method 1: Using Diesel CLI (Recommended)

```bash
cd backend
diesel migration run
```

### Method 2: Using Migration Script

```bash
# From project root
./scripts/run_migrations.sh
```

### Method 3: Using Docker

```bash
# If using Docker Compose
./scripts/deployment/run-migrations.sh [environment]
```

## Migration Files Location

Migrations are located in: `backend/migrations/`

Each migration directory contains:
- `up.sql` - Migration to apply
- `down.sql` - Rollback migration

## Required Migrations

The following migrations should be executed:

1. **users** - User table and authentication schema
2. **projects** - Project management tables
3. **reconciliation_jobs** - Reconciliation job tracking
4. **reconciliation_results** - Reconciliation results storage

## Verification

### Check Applied Migrations

```bash
cd backend
diesel migration list
```

### Check Database Schema

```bash
psql $DATABASE_URL -c "\dt"  # List all tables
psql $DATABASE_URL -c "SELECT * FROM __diesel_schema_migrations;"  # List applied migrations
```

## Troubleshooting

### Migration Fails with "Table Already Exists"

This is normal if tables were created manually. The migration system will skip existing tables.

### Migration Fails with Connection Error

1. Verify `DATABASE_URL is set correctly
2. Verify PostgreSQL is running: `pg_isready`
3. Check database credentials

### Rollback a Migration

```bash
cd backend
diesel migration revert
```

## Automated Migration on Startup

The backend automatically runs migrations on startup if `ENVIRONMENT` is set to `development`. In production, migrations should be run manually or via CI/CD.

## Best Practices

1. **Always backup** before running migrations in production
2. **Test migrations** in development/staging first
3. **Review migration SQL** before applying
4. **Run migrations** during maintenance windows for production
5. **Monitor** migration execution time

## Related Documentation

- [Database Setup Guide](../deployment/DATABASE_SETUP_GUIDE.md)
- [Backend Deployment Guide](../deployment/BACKEND_DEPLOYMENT.md)

