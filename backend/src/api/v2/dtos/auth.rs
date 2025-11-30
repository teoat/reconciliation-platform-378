use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct RegisterUserRequest {
    pub email: String,
    pub password: String,
    pub first_name: String,
    pub last_name: String,
    pub role: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginUserRequest {
    pub email: String,
    pub password: String,
    pub two_factor_code: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct LoginWithRecoveryCodeRequest {
    pub email: String,
    pub recovery_code: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub refresh_token: Option<String>,
    pub user: UserInfo,
}

#[derive(Debug, Serialize)]
pub struct Generate2faSecretResponse {
    pub secret: String,
    pub qr_code_image: String, // Base64 encoded PNG image
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Verify2faCodeRequest {
    pub code: String,
}

#[derive(Debug, Serialize)]
pub struct RecoveryCodesResponse {
    pub recovery_codes: Vec<String>,
}

use crate::services::user::traits::UserInfo;
