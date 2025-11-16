//! Password Encryption Utilities
//!
//! Handles encryption and decryption of passwords using AES-256-GCM.

use crate::errors::{AppError, AppResult};
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::engine::{general_purpose, Engine};
use sha2::{Digest, Sha256};

/// Encrypt password with master key
/// 
/// Uses AES-256-GCM encryption with a random nonce.
/// Returns base64-encoded encrypted data (nonce + ciphertext).
pub fn encrypt_password(password: &str, master_key: &str) -> AppResult<String> {
    // Derive 256-bit key from master key using SHA-256
    let mut hasher = Sha256::new();
    hasher.update(master_key.as_bytes());
    let key_bytes = hasher.finalize();
    
    // Initialize AES-GCM cipher
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| AppError::InternalServerError(format!("Failed to initialize cipher: {}", e)))?;
    
    // Generate random nonce (12 bytes for GCM)
    let nonce = Aes256Gcm::generate_nonce(&mut rand::thread_rng());
    
    // Encrypt password
    let ciphertext = cipher
        .encrypt(&nonce, password.as_bytes())
        .map_err(|e| AppError::InternalServerError(format!("Failed to encrypt password: {}", e)))?;
    
    // Combine nonce and ciphertext, then encode to base64
    let mut combined = nonce.to_vec();
    combined.extend_from_slice(&ciphertext);
    let encoded = general_purpose::STANDARD.encode(&combined);
    
    Ok(encoded)
}

/// Decrypt password with master key
/// 
/// Decodes base64-encoded data and extracts nonce and ciphertext.
/// Returns decrypted password.
pub fn decrypt_password(encrypted: &str, master_key: &str) -> AppResult<String> {
    // Decode from base64
    let combined = general_purpose::STANDARD
        .decode(encrypted)
        .map_err(|e| AppError::InternalServerError(format!("Failed to decode password: {}", e)))?;
    
    if combined.len() < 12 {
        return Err(AppError::InternalServerError("Invalid encrypted data format".to_string()));
    }
    
    // Extract nonce (first 12 bytes) and ciphertext (rest)
    let nonce = Nonce::from_slice(&combined[..12]);
    let ciphertext = &combined[12..];
    
    // Derive key from master key
    let mut hasher = Sha256::new();
    hasher.update(master_key.as_bytes());
    let key_bytes = hasher.finalize();
    
    // Initialize AES-GCM cipher
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| AppError::InternalServerError(format!("Failed to initialize cipher: {}", e)))?;
    
    // Decrypt password
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| AppError::InternalServerError(format!("Failed to decrypt password: {}", e)))?;
    
    let password = String::from_utf8(plaintext)
        .map_err(|e| AppError::InternalServerError(format!("Invalid password encoding: {}", e)))?;
    
    Ok(password)
}

/// Generate secure random password
/// 
/// Generates a cryptographically secure random password of specified length.
pub fn generate_secure_password(length: usize) -> AppResult<String> {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    
    let mut rng = rand::thread_rng();
    let password: String = (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();
    
    Ok(password)
}

