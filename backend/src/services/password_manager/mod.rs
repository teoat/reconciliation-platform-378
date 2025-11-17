//! Password Manager Utilities Module
//!
//! Provides extracted utilities for password management:
//! - Rotation: Password rotation scheduling
//! - Audit: Audit logging for password operations
//! - Encryption: Encryption/decryption utilities
//!
//! These are separate utilities that can be used independently.
//! The main password_manager.rs file contains the core PasswordManager implementation.

pub mod audit;
pub mod encryption;
pub mod rotation;

// Re-export for convenience
pub use audit::PasswordAuditLogger;
pub use encryption::{encrypt_password, decrypt_password, generate_secure_password};
pub use rotation::PasswordRotationScheduler as RotationScheduler;
