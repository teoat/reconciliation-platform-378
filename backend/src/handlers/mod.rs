// Handlers Module
// Export all HTTP handlers

// Re-export existing handlers from main handlers file
// (These are likely defined elsewhere, this ensures they're accessible)

pub mod gdpr_handlers;
pub use gdpr_handlers::*;

