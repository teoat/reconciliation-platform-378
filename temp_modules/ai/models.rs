use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc, NaiveDate};
use rust_decimal::Decimal;
use std::collections::HashMap;

/// AI/ML Model types for different matching algorithms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ModelType {
    ExactMatch,
    FuzzyMatch,
    DateMatch,
    AmountMatch,
    TextSimilarity,
    AnomalyDetection,
    PredictiveAnalytics,
    RecommendationEngine,
}

/// Model configuration and parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub model_type: ModelType,
    pub version: String,
    pub parameters: HashMap<String, serde_json::Value>,
    pub accuracy_threshold: f64,
    pub confidence_threshold: f64,
    pub training_data_size: u64,
    pub last_trained: Option<DateTime<Utc>>,
    pub performance_metrics: ModelPerformance,
}

/// Model performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPerformance {
    pub accuracy: f64,
    pub precision: f64,
    pub recall: f64,
    pub f1_score: f64,
    pub processing_time_ms: u64,
    pub false_positive_rate: f64,
    pub false_negative_rate: f64,
}

/// Training data for ML models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingData {
    pub id: Uuid,
    pub model_type: ModelType,
    pub input_features: Vec<FeatureVector>,
    pub expected_output: serde_json::Value,
    pub actual_output: Option<serde_json::Value>,
    pub is_correct: Option<bool>,
    pub confidence_score: Option<f64>,
    pub created_at: DateTime<Utc>,
    pub user_feedback: Option<UserFeedback>,
}

/// Feature vector for ML models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureVector {
    pub amount: Option<f64>,
    pub date: Option<NaiveDate>,
    pub description: Option<String>,
    pub external_id: Option<String>,
    pub source_system: Option<String>,
    pub transaction_type: Option<String>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// User feedback for model improvement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserFeedback {
    pub user_id: Uuid,
    pub feedback_type: FeedbackType,
    pub is_correct: bool,
    pub confidence_adjustment: Option<f64>,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Types of user feedback
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeedbackType {
    MatchConfirmation,
    MatchRejection,
    ConfidenceAdjustment,
    FalsePositive,
    FalseNegative,
    ModelImprovement,
}

/// ML Model instance for runtime inference
#[derive(Debug, Clone)]
pub struct MLModel {
    pub id: Uuid,
    pub config: ModelConfig,
    pub weights: Vec<f64>,
    pub bias: Vec<f64>,
    pub feature_scalers: HashMap<String, FeatureScaler>,
    pub is_trained: bool,
    pub last_inference: Option<DateTime<Utc>>,
}

/// Feature scaler for normalization
#[derive(Debug, Clone)]
pub struct FeatureScaler {
    pub min_value: f64,
    pub max_value: f64,
    pub mean: f64,
    pub std_dev: f64,
    pub scaling_method: ScalingMethod,
}

/// Scaling methods for feature normalization
#[derive(Debug, Clone)]
pub enum ScalingMethod {
    MinMax,
    Standardization,
    Robust,
    Normalization,
}

/// Matching result with AI/ML confidence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIMatchingResult {
    pub record1_id: Uuid,
    pub record2_id: Uuid,
    pub confidence: f64,
    pub match_type: String,
    pub reasons: Vec<String>,
    pub is_match: bool,
    pub model_used: ModelType,
    pub feature_importance: HashMap<String, f64>,
    pub processing_time_ms: u64,
    pub anomaly_score: Option<f64>,
    pub recommendations: Vec<String>,
}

/// Predictive analytics result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PredictiveResult {
    pub prediction_type: PredictionType,
    pub predicted_value: serde_json::Value,
    pub confidence: f64,
    pub time_horizon: String,
    pub factors: Vec<String>,
    pub model_accuracy: f64,
    pub created_at: DateTime<Utc>,
}

/// Types of predictions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PredictionType {
    MatchProbability,
    ProcessingTime,
    ErrorRate,
    VolumeForecast,
    AnomalyRisk,
    UserBehavior,
}

/// Anomaly detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyResult {
    pub record_id: Uuid,
    pub anomaly_type: AnomalyType,
    pub severity: AnomalySeverity,
    pub score: f64,
    pub description: String,
    pub suggested_actions: Vec<String>,
    pub confidence: f64,
    pub detected_at: DateTime<Utc>,
}

/// Types of anomalies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnomalyType {
    AmountDiscrepancy,
    DateAnomaly,
    PatternDeviation,
    VolumeSpike,
    ProcessingDelay,
    DataQuality,
    SecurityThreat,
    SystemError,
}

/// Anomaly severity levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnomalySeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Recommendation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendationResult {
    pub recommendation_type: RecommendationType,
    pub title: String,
    pub description: String,
    pub priority: RecommendationPriority,
    pub confidence: f64,
    pub expected_impact: String,
    pub implementation_effort: String,
    pub related_records: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
}

/// Types of recommendations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendationType {
    MatchingRule,
    ProcessOptimization,
    DataQuality,
    WorkflowImprovement,
    SystemConfiguration,
    UserTraining,
    SecurityEnhancement,
}

/// Recommendation priority levels
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecommendationPriority {
    Low,
    Medium,
    High,
    Critical,
}

/// Model training configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingConfig {
    pub model_type: ModelType,
    pub training_data_size: u64,
    pub validation_split: f64,
    pub test_split: f64,
    pub epochs: u32,
    pub learning_rate: f64,
    pub batch_size: u32,
    pub early_stopping_patience: u32,
    pub regularization: f64,
    pub feature_selection: bool,
    pub cross_validation_folds: u32,
}

/// Model evaluation metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvaluationMetrics {
    pub accuracy: f64,
    pub precision: f64,
    pub recall: f64,
    pub f1_score: f64,
    pub auc_roc: f64,
    pub confusion_matrix: ConfusionMatrix,
    pub feature_importance: HashMap<String, f64>,
    pub cross_validation_scores: Vec<f64>,
    pub training_time_ms: u64,
    pub inference_time_ms: u64,
}

/// Confusion matrix for classification models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfusionMatrix {
    pub true_positives: u64,
    pub true_negatives: u64,
    pub false_positives: u64,
    pub false_negatives: u64,
}

impl ConfusionMatrix {
    pub fn accuracy(&self) -> f64 {
        let total = self.true_positives + self.true_negatives + self.false_positives + self.false_negatives;
        if total == 0 {
            0.0
        } else {
            (self.true_positives + self.true_negatives) as f64 / total as f64
        }
    }

    pub fn precision(&self) -> f64 {
        if self.true_positives + self.false_positives == 0 {
            0.0
        } else {
            self.true_positives as f64 / (self.true_positives + self.false_positives) as f64
        }
    }

    pub fn recall(&self) -> f64 {
        if self.true_positives + self.false_negatives == 0 {
            0.0
        } else {
            self.true_positives as f64 / (self.true_positives + self.false_negatives) as f64
        }
    }

    pub fn f1_score(&self) -> f64 {
        let precision = self.precision();
        let recall = self.recall();
        if precision + recall == 0.0 {
            0.0
        } else {
            2.0 * (precision * recall) / (precision + recall)
        }
    }
}
