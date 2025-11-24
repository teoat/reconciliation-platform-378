// AI Service - Secure backend proxy for AI API calls
// Prevents API key exposure in frontend

use actix_web::Result;
use serde::{Deserialize, Serialize};
use std::env;
use reqwest::Client;

#[derive(Debug, Serialize, Deserialize)]
pub struct AIRequest {
    pub prompt: String,
    pub provider: Option<String>, // "openai", "anthropic", "gemini"
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIResponse {
    pub response: String,
    pub provider: String,
    pub model: String,
    pub usage: Option<AIUsage>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AIUsage {
    pub prompt_tokens: Option<u32>,
    pub completion_tokens: Option<u32>,
    pub total_tokens: Option<u32>,
}

pub struct AIService {
    client: Client,
    pub openai_key: Option<String>,
    pub anthropic_key: Option<String>,
    pub gemini_key: Option<String>,
}

impl Default for AIService {
    fn default() -> Self {
        Self::new()
    }
}

impl AIService {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            openai_key: env::var("OPENAI_API_KEY").ok(),
            anthropic_key: env::var("ANTHROPIC_API_KEY").ok(),
            gemini_key: env::var("GEMINI_API_KEY").ok(),
        }
    }

    pub async fn generate_response(&self, request: AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
        let provider = request.provider.as_deref().unwrap_or("openai");

        match provider {
            "openai" => self.call_openai(request).await,
            "anthropic" => self.call_anthropic(request).await,
            "gemini" => self.call_gemini(request).await,
            _ => Err("Unsupported AI provider".into()),
        }
    }

    async fn call_openai(&self, request: AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
        let api_key = self.openai_key.as_ref().ok_or("OpenAI API key not configured")?;
        let model = request.model.as_deref().unwrap_or("gpt-3.5-turbo");

        let payload = serde_json::json!({
            "model": model,
            "messages": [{"role": "user", "content": request.prompt}],
            "temperature": request.temperature.unwrap_or(0.7),
            "max_tokens": request.max_tokens.unwrap_or(500),
        });

        let response = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("OpenAI API error: {}", response.status()).into());
        }

        let data: serde_json::Value = response.json().await?;
        let content = data["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("No response generated");

        Ok(AIResponse {
            response: content.to_string(),
            provider: "openai".to_string(),
            model: model.to_string(),
            usage: Some(AIUsage {
                prompt_tokens: data["usage"]["prompt_tokens"].as_u64().map(|x| x as u32),
                completion_tokens: data["usage"]["completion_tokens"].as_u64().map(|x| x as u32),
                total_tokens: data["usage"]["total_tokens"].as_u64().map(|x| x as u32),
            }),
        })
    }

    async fn call_anthropic(&self, request: AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
        let api_key = self.anthropic_key.as_ref().ok_or("Anthropic API key not configured")?;
        let model = request.model.as_deref().unwrap_or("claude-3-sonnet-20240229");

        let payload = serde_json::json!({
            "model": model,
            "max_tokens": request.max_tokens.unwrap_or(500),
            "messages": [{"role": "user", "content": request.prompt}],
        });

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Anthropic API error: {}", response.status()).into());
        }

        let data: serde_json::Value = response.json().await?;
        let content = data["content"][0]["text"]
            .as_str()
            .unwrap_or("No response generated");

        Ok(AIResponse {
            response: content.to_string(),
            provider: "anthropic".to_string(),
            model: model.to_string(),
            usage: Some(AIUsage {
                prompt_tokens: data["usage"]["input_tokens"].as_u64().map(|x| x as u32),
                completion_tokens: data["usage"]["output_tokens"].as_u64().map(|x| x as u32),
                total_tokens: None,
            }),
        })
    }

    async fn call_gemini(&self, request: AIRequest) -> Result<AIResponse, Box<dyn std::error::Error>> {
        let api_key = self.gemini_key.as_ref().ok_or("Gemini API key not configured")?;
        let model = request.model.as_deref().unwrap_or("gemini-pro");

        let payload = serde_json::json!({
            "contents": [{
                "parts": [{"text": request.prompt}]
            }]
        });

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
        );

        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(format!("Gemini API error: {}", response.status()).into());
        }

        let data: serde_json::Value = response.json().await?;
        let content = data["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .unwrap_or("No response generated");

        Ok(AIResponse {
            response: content.to_string(),
            provider: "gemini".to_string(),
            model: model.to_string(),
            usage: None, // Gemini doesn't provide token usage in this endpoint
        })
    }
}