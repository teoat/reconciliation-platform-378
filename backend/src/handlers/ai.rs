// AI Handler - Secure backend endpoints for AI services

use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::services::ai::{AIService, AIRequest, AIResponse};

#[derive(Debug, Serialize, Deserialize)]
pub struct AIChatRequest {
    pub message: String,
    pub provider: Option<String>,
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIChatResponse {
    pub success: bool,
    pub data: Option<AIResponse>,
    pub error: Option<String>,
}

// POST /api/ai/chat
pub async fn chat_handler(
    request: web::Json<AIChatRequest>,
) -> Result<HttpResponse> {
    let ai_service = AIService::new();

    let ai_request = AIRequest {
        prompt: request.message.clone(),
        provider: request.provider.clone(),
        model: request.model.clone(),
        temperature: request.temperature,
        max_tokens: request.max_tokens,
    };

    match ai_service.generate_response(ai_request).await {
        Ok(response) => {
            let chat_response = AIChatResponse {
                success: true,
                data: Some(response),
                error: None,
            };
            Ok(HttpResponse::Ok().json(chat_response))
        }
        Err(err) => {
            let chat_response = AIChatResponse {
                success: false,
                data: None,
                error: Some(err.to_string()),
            };
            Ok(HttpResponse::InternalServerError().json(chat_response))
        }
    }
}

// Health check endpoint for AI service
pub async fn health_handler() -> Result<HttpResponse> {
    let ai_service = AIService::new();

    // Check if at least one AI provider is configured
    let has_openai = ai_service.openai_key.is_some();
    let has_anthropic = ai_service.anthropic_key.is_some();
    let has_gemini = ai_service.gemini_key.is_some();

    let status = if has_openai || has_anthropic || has_gemini {
        serde_json::json!({
            "status": "healthy",
            "providers": {
                "openai": has_openai,
                "anthropic": has_anthropic,
                "gemini": has_gemini
            }
        })
    } else {
        serde_json::json!({
            "status": "unhealthy",
            "message": "No AI providers configured",
            "providers": {
                "openai": false,
                "anthropic": false,
                "gemini": false
            }
        })
    };

    Ok(HttpResponse::Ok().json(status))
}

// Configure AI routes
pub fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        .route("/chat", web::post().to(chat_handler))
        .route("/health", web::get().to(health_handler));
}