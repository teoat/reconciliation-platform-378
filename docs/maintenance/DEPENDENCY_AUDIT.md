# Dependency Audit Report

**Last Updated**: January 2025  
**Status**: Active

## Overview

This document tracks dependency audits and removal of unused packages.

## Root package.json Analysis

The root `package.json` contains dependencies that should be in `frontend/package.json`:

### Dependencies to Move to Frontend
- `@hookform/resolvers@^5.2.2` - Should be in frontend
- `@reduxjs/toolkit@^2.9.2` - Should be in frontend
- `@sentry/react@^10.22.0` - Should be in frontend
- `lucide-react@^0.552.0` - Should be in frontend
- `next@16.0.1` - Should be in frontend (if using Next.js)
- `react@^19.2.0` - Should be in frontend
- `react-dom@^19.2.0` - Should be in frontend
- `react-dropzone@^14.2.3` - Should be in frontend
- `react-hook-form@^7.47.0` - Should be in frontend
- `react-hot-toast@^2.4.1` - Should be in frontend
- `react-intl@^7.1.14` - Should be in frontend
- `react-query@^3.39.3` - Should be in frontend
- `react-redux@^9.2.0` - Should be in frontend
- `react-router-dom@^7.9.6` - Should be in frontend
- `recharts@^3.3.0` - Should be in frontend
- `redux@^5.0.1` - Should be in frontend
- `redux-persist@^6.0.0` - Should be in frontend
- `socket.io-client@^4.7.2` - Should be in frontend
- `tailwindcss@^4.1.17` - Should be in frontend
- `web-vitals@^5.1.0` - Should be in frontend
- `zod@^4.1.12` - Should be in frontend

### DevDependencies to Move to Frontend
- `@playwright/test@^1.48.0` - Should be in frontend
- `@testing-library/jest-dom@^6.9.1` - Should be in frontend
- `@testing-library/react@^16.3.0` - Should be in frontend
- `@testing-library/user-event@^14.6.1` - Should be in frontend
- `@types/jest@^30.0.0` - Should be in frontend
- `@types/node@^24.10.1` - Should be in frontend
- `@types/react@^19.2.5` - Should be in frontend
- `@types/react-dom@^19.2.3` - Should be in frontend
- `@types/recharts@^2.0.1` - Should be in frontend
- `eslint@^9.0.0` - Should be in frontend
- `eslint-config-next@16.0.3` - Should be in frontend
- `jest@^30.2.0` - Should be in frontend
- `jest-environment-jsdom@^30.2.0` - Should be in frontend
- `prettier@^3.2.4` - Should be in frontend
- `ts-jest@^29.4.5` - Should be in frontend
- `typescript@^5.2.2` - Should be in frontend
- `webpack-bundle-analyzer@^4.10.2` - Should be in frontend

## Action Items

1. **Move Dependencies**: Move all frontend dependencies from root to `frontend/package.json`
2. **Remove Root package.json**: Delete or minimize root `package.json` (keep only workspace-level scripts if needed)
3. **Update Scripts**: Ensure all scripts reference correct package.json locations
4. **Verify Builds**: Test that frontend builds work after migration

## Frontend package.json Status

The `frontend/package.json` already has most dependencies. Need to:
- Add missing dependencies from root
- Remove duplicates
- Ensure version consistency

## Backend Cargo.toml Status

- All dependencies appear to be in use
- No obvious unused dependencies found
- Regular `cargo audit` recommended for security

---

**Status**: Audit complete, migration plan documented

