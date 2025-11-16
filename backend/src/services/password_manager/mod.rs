//! Password Manager Module
//!
//! Provides secure password storage, retrieval, and rotation functionality.
//! Organized into sub-modules for better separation of concerns.

pub mod audit;
pub mod encryption;
pub mod rotation;

// Re-export main types for backward compatibility
pub use super::password_manager::{
    PasswordEntry, PasswordManager, RotationSchedule,
};

