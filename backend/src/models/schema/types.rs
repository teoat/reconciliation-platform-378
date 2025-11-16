// Custom types for Diesel schema compatibility
// Using serde_json::Value directly - Diesel supports this natively

// This file is kept for potential future custom types
// For now, we use serde_json::Value directly in models

// Diesel natively supports serde_json::Value for Jsonb columns:
// - Non-nullable Jsonb -> serde_json::Value
// - Nullable<Jsonb> -> Option<serde_json::Value>
