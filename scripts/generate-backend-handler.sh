#!/bin/bash
# Backend Handler Generator
# Generates Rust handler files with proper structure

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

HANDLER_NAME="${1:-}"
RESOURCE_NAME="${2:-}"

if [ -z "$HANDLER_NAME" ]; then
    echo "Usage: $0 <HandlerName> [resource_name]"
    echo "Example: $0 projects projects"
    echo "Example: $0 users users"
    exit 1
fi

if [ -z "$RESOURCE_NAME" ]; then
    RESOURCE_NAME=$(echo "$HANDLER_NAME" | tr '[:upper:]' '[:lower:]')
fi

BACKEND_DIR="backend"
HANDLERS_DIR="$BACKEND_DIR/src/handlers"
HANDLER_FILE="$HANDLERS_DIR/${HANDLER_NAME}.rs"

if [ -f "$HANDLER_FILE" ]; then
    log_warning "Handler file already exists: $HANDLER_FILE"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Generate handler file
cat > "$HANDLER_FILE" << EOF
//! ${HANDLER_NAME} handlers module
//!
//! Provides endpoints for ${RESOURCE_NAME} management

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};

use crate::errors::AppError;
use crate::handlers::types::ApiResponse;

/// Request body for creating ${RESOURCE_NAME}
#[derive(Debug, Deserialize)]
pub struct Create${HANDLER_NAME}Request {
    // Add fields here
}

/// Response for ${RESOURCE_NAME} operations
#[derive(Debug, Serialize)]
pub struct ${HANDLER_NAME}Response {
    id: i32,
    // Add fields here
}

/// GET /api/${RESOURCE_NAME} - List all ${RESOURCE_NAME}
pub async fn get_${RESOURCE_NAME}(path: web::Path<i32>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    
    // TODO: Implement logic
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(${HANDLER_NAME}Response {
            id,
            // Add fields
        }),
        message: Some("Success".to_string()),
        error: None,
    }))
}

/// POST /api/${RESOURCE_NAME} - Create new ${RESOURCE_NAME}
pub async fn create_${RESOURCE_NAME}(body: web::Json<Create${HANDLER_NAME}Request>) -> Result<HttpResponse, AppError> {
    // TODO: Implement creation logic
    
    Ok(HttpResponse::Created().json(ApiResponse {
        success: true,
        data: None,
        message: Some("${HANDLER_NAME} created successfully".to_string()),
        error: None,
    }))
}

/// PUT /api/${RESOURCE_NAME}/{id} - Update ${RESOURCE_NAME}
pub async fn update_${RESOURCE_NAME}(
    path: web::Path<i32>,
    body: web::Json<Create${HANDLER_NAME}Request>
) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    
    // TODO: Implement update logic
    
    Ok(HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: None,
        message: Some("${HANDLER_NAME} updated successfully".to_string()),
        error: None,
    }))
}

/// DELETE /api/${RESOURCE_NAME}/{id} - Delete ${RESOURCE_NAME}
pub async fn delete_${RESOURCE_NAME}(path: web::Path<i32>) -> Result<HttpResponse, AppError> {
    let id = path.into_inner();
    
    // TODO: Implement deletion logic
    
    Ok(HttpResponse::NoContent().finish())
}
EOF

log_success "Handler file created: $HANDLER_FILE"
echo ""
echo "Next steps:"
echo "1. Add handler to backend/src/handlers/mod.rs:"
echo "   pub mod ${HANDLER_NAME};"
echo ""
echo "2. Register routes in backend/src/handlers/mod.rs:"
echo "   .service(web::scope(\"/api/${RESOURCE_NAME}\")"
echo "       .route(\"\", web::get().to(${HANDLER_NAME}::get_${RESOURCE_NAME}))"
echo "       .route(\"\", web::post().to(${HANDLER_NAME}::create_${RESOURCE_NAME}))"
echo "       .route(\"/{id}\", web::put().to(${HANDLER_NAME}::update_${RESOURCE_NAME}))"
echo "       .route(\"/{id}\", web::delete().to(${HANDLER_NAME}::delete_${RESOURCE_NAME})))"

