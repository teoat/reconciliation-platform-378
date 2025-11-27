# Backend Register Endpoint Fix

## Issue Found

The register endpoint is crashing because `get_user_by_id()` and `get_user_by_email()` are making **blocking database calls** in async functions without proper handling.

### Problematic Code

In `backend/src/services/user/mod.rs`:

```rust
// Line 252 - BLOCKING CALL IN ASYNC FUNCTION
pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo> {
    let mut conn = self.db.get_connection()?;  // ❌ BLOCKING - can crash async runtime
    // ...
}

// Line 286 - SAME ISSUE
pub async fn get_user_by_email(&self, email: &str) -> AppResult<User> {
    let mut conn = self.db.get_connection()?;  // ❌ BLOCKING - can crash async runtime
    // ...
}
```

### Why This Causes Crashes

1. `get_connection()` is a **synchronous blocking function**
2. It's called directly in `async fn` without `spawn_blocking` or `block_in_place`
3. This can block the Tokio async runtime, causing:
   - "Empty reply from server" errors
   - Connection timeouts
   - Server crashes

## Fix

Wrap the blocking database operations in `tokio::task::spawn_blocking`:

```rust
pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo> {
    let db = Arc::clone(&self.db);
    let user_id_clone = user_id;
    
    let (user, project_count) = tokio::task::spawn_blocking(move || {
        let mut conn = db.get_connection()?;
        
        let user = users::table
            .filter(users::id.eq(user_id_clone))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)?;

        let project_count = projects::table
            .filter(projects::owner_id.eq(user_id_clone))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        Ok::<_, AppError>((user, project_count))
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))??;

    Ok(UserInfo {
        id: user.id,
        email: user.email,
        name: user
            .first_name
            .as_ref()
            .and_then(|f| user.last_name.as_ref().map(|l| format!("{} {}", f, l))),
        first_name: user.first_name.unwrap_or_default(),
        last_name: user.last_name.unwrap_or_default(),
        role: user.status.clone(),
        is_active: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login_at,
        project_count,
    })
}

pub async fn get_user_by_email(&self, email: &str) -> AppResult<User> {
    let db = Arc::clone(&self.db);
    let email = email.to_string();
    
    tokio::task::spawn_blocking(move || {
        let mut conn = db.get_connection()?;
        users::table
            .filter(users::email.eq(&email))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)
    })
    .await
    .map_err(|e| AppError::Internal(format!("Task join error: {}", e)))?
}
```

## Alternative: Use block_in_place

If you prefer `block_in_place` (moves blocking work off async threads):

```rust
pub async fn get_user_by_id(&self, user_id: Uuid) -> AppResult<UserInfo> {
    let (user, project_count) = tokio::task::block_in_place(|| {
        let mut conn = self.db.get_connection()?;
        
        let user = users::table
            .filter(users::id.eq(user_id))
            .first::<User>(&mut conn)
            .map_err(AppError::Database)?;

        let project_count = projects::table
            .filter(projects::owner_id.eq(user_id))
            .count()
            .get_result::<i64>(&mut conn)
            .map_err(AppError::Database)?;

        Ok::<_, AppError>((user, project_count))
    })?;

    // ... rest of the function
}
```

## Files to Fix

1. `backend/src/services/user/mod.rs`
   - `get_user_by_id()` - line 251
   - `get_user_by_email()` - line 285
   - Check other methods that use `get_connection()` directly

## Testing

After fixing, test the register endpoint:

```bash
curl -X POST http://localhost:2000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!",
    "first_name":"Test",
    "last_name":"User"
  }'
```

Should return a 201 Created response with user info and token.

