//! Cryptographic utility functions
//!
//! NOTE: Password hashing is handled by `services/auth/password.rs` using bcrypt.
//! This module provides other cryptographic utilities.

use rand::Rng;
use sha2::{Digest, Sha256};

/// Generate a random string of specified length
pub fn generate_random_string(length: usize) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();

    (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

/// Generate a secure random token
pub fn generate_secure_token() -> String {
    generate_random_string(32)
}

/// Calculate SHA256 hash of data
pub fn sha256_hash(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

/// Generate a UUID v4 string
pub fn generate_uuid() -> String {
    uuid::Uuid::new_v4().to_string()
}

/// Generate a random number in range
pub fn random_in_range(min: u32, max: u32) -> u32 {
    let mut rng = rand::thread_rng();
    rng.gen_range(min..=max)
}
