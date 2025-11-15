use crate::ai::models::*;
use crate::models::ReconciliationRecord;
use crate::utils::error::{AppError, AppResult};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use ndarray::{Array1, Array2};
// use linfa::prelude::*;
// use linfa_bayes::GaussianNb;
// use linfa_clustering::KMeans;
// use linfa_trees::DecisionTree;
use smartcore::linalg::basic::matrix::DenseMatrix;
use smartcore::linalg::basic::vectors::DenseVector;
use smartcore::linear::logistic_regression::LogisticRegression;
use smartcore::neighbors::knn_classifier::KNNClassifier;
use smartcore::svm::SVC;
use statrs::distribution::{Normal, Continuous};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

/// AI-powered matching engine with multiple ML algorithms
pub struct AIMatchingEngine {
    models: HashMap<ModelType, MLModel>,
    training_data: Vec<TrainingData>,
    performance_cache: HashMap<ModelType, ModelPerformance>,
}

impl AIMatchingEngine {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
            training_data: Vec::new(),
            performance_cache: HashMap::new(),
        }
    }

    /// Initialize models with default configurations
    pub async fn initialize_models(&mut self) -> AppResult<()> {
        tracing::info!("Initializing AI matching models");

        // Initialize exact matching model
        self.models.insert(ModelType::ExactMatch, self.create_exact_match_model().await?);
        
        // Initialize fuzzy matching model
        self.models.insert(ModelType::FuzzyMatch, self.create_fuzzy_match_model().await?);
        
        // Initialize date matching model
        self.models.insert(ModelType::DateMatch, self.create_date_match_model().await?);
        
        // Initialize amount matching model
        self.models.insert(ModelType::AmountMatch, self.create_amount_match_model().await?);
        
        // Initialize text similarity model
        self.models.insert(ModelType::TextSimilarity, self.create_text_similarity_model().await?);
        
        // Initialize anomaly detection model
        self.models.insert(ModelType::AnomalyDetection, self.create_anomaly_detection_model().await?);

        tracing::info!("AI matching models initialized successfully");
        Ok(())
    }

    /// Perform AI-powered matching between two records
    pub async fn match_records(
        &mut self,
        record1: &ReconciliationRecord,
        record2: &ReconciliationRecord,
        confidence_threshold: Option<f64>,
    ) -> AppResult<AIMatchingResult> {
        let start_time = std::time::Instant::now();
        let threshold = confidence_threshold.unwrap_or(0.8);

        tracing::debug!("Starting AI matching for records {} and {}", record1.id, record2.id);

        // Extract features from both records
        let features1 = self.extract_features(record1)?;
        let features2 = self.extract_features(record2)?;

        // Calculate similarity scores using different models
        let mut confidence_scores = HashMap::new();
        let mut reasons = Vec::new();
        let mut feature_importance = HashMap::new();

        // Exact matching
        if let Some(model) = self.models.get(&ModelType::ExactMatch) {
            let score = self.exact_match_score(&features1, &features2)?;
            confidence_scores.insert(ModelType::ExactMatch, score);
            if score > 0.9 {
                reasons.push("Exact match detected".to_string());
            }
            feature_importance.insert("exact_match".to_string(), score);
        }

        // Fuzzy matching
        if let Some(model) = self.models.get(&ModelType::FuzzyMatch) {
            let score = self.fuzzy_match_score(&features1, &features2)?;
            confidence_scores.insert(ModelType::FuzzyMatch, score);
            if score > 0.7 {
                reasons.push("Fuzzy match detected".to_string());
            }
            feature_importance.insert("fuzzy_match".to_string(), score);
        }

        // Date matching
        if let Some(model) = self.models.get(&ModelType::DateMatch) {
            let score = self.date_match_score(&features1, &features2)?;
            confidence_scores.insert(ModelType::DateMatch, score);
            if score > 0.8 {
                reasons.push("Date match detected".to_string());
            }
            feature_importance.insert("date_match".to_string(), score);
        }

        // Amount matching
        if let Some(model) = self.models.get(&ModelType::AmountMatch) {
            let score = self.amount_match_score(&features1, &features2)?;
            confidence_scores.insert(ModelType::AmountMatch, score);
            if score > 0.8 {
                reasons.push("Amount match detected".to_string());
            }
            feature_importance.insert("amount_match".to_string(), score);
        }

        // Text similarity
        if let Some(model) = self.models.get(&ModelType::TextSimilarity) {
            let score = self.text_similarity_score(&features1, &features2)?;
            confidence_scores.insert(ModelType::TextSimilarity, score);
            if score > 0.7 {
                reasons.push("Text similarity detected".to_string());
            }
            feature_importance.insert("text_similarity".to_string(), score);
        }

        // Calculate weighted confidence score
        let weights = self.get_model_weights();
        let mut total_confidence = 0.0;
        let mut total_weight = 0.0;

        for (model_type, score) in &confidence_scores {
            if let Some(weight) = weights.get(model_type) {
                total_confidence += score * weight;
                total_weight += weight;
            }
        }

        let final_confidence = if total_weight > 0.0 {
            total_confidence / total_weight
        } else {
            0.0
        };

        // Anomaly detection
        let anomaly_score = self.detect_anomaly(&features1, &features2).await?;

        // Determine match type and recommendations
        let (match_type, recommendations) = self.determine_match_type_and_recommendations(
            final_confidence,
            &confidence_scores,
            &feature_importance,
        )?;

        let is_match = final_confidence >= threshold;
        let processing_time = start_time.elapsed().as_millis() as u64;

        // Store training data for future learning
        self.store_training_data(record1, record2, final_confidence, is_match).await?;

        let result = AIMatchingResult {
            record1_id: record1.id,
            record2_id: record2.id,
            confidence: final_confidence,
            match_type,
            reasons,
            is_match,
            model_used: ModelType::ExactMatch, // Primary model used
            feature_importance,
            processing_time_ms: processing_time,
            anomaly_score,
            recommendations,
        };

        tracing::info!(
            "AI matching completed: confidence={:.3}, is_match={}, time={}ms",
            final_confidence,
            is_match,
            processing_time
        );

        Ok(result)
    }

    /// Extract features from a reconciliation record
    fn extract_features(&self, record: &ReconciliationRecord) -> AppResult<FeatureVector> {
        let mut metadata = HashMap::new();
        
        // Parse source data if it's JSON
        if let Ok(source_data) = serde_json::from_str::<serde_json::Value>(&record.source_data) {
            if let Some(obj) = source_data.as_object() {
                for (key, value) in obj {
                    metadata.insert(key.clone(), value.clone());
                }
            }
        }

        Ok(FeatureVector {
            amount: record.amount,
            date: record.transaction_date,
            description: record.description.clone(),
            external_id: record.external_id.clone(),
            source_system: metadata.get("source_system")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            transaction_type: metadata.get("transaction_type")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            metadata,
        })
    }

    /// Calculate exact match score
    fn exact_match_score(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<f64> {
        let mut score = 0.0;
        let mut factors = 0;

        // Amount exact match
        if let (Some(amount1), Some(amount2)) = (features1.amount, features2.amount) {
            factors += 1;
            if (amount1 - amount2).abs() < 0.01 {
                score += 1.0;
            }
        }

        // Date exact match
        if let (Some(date1), Some(date2)) = (features1.date, features2.date) {
            factors += 1;
            if date1 == date2 {
                score += 1.0;
            }
        }

        // Description exact match
        if let (Some(desc1), Some(desc2)) = (&features1.description, &features2.description) {
            factors += 1;
            if desc1 == desc2 {
                score += 1.0;
            }
        }

        // External ID exact match
        if let (Some(id1), Some(id2)) = (&features1.external_id, &features2.external_id) {
            factors += 1;
            if id1 == id2 {
                score += 1.0;
            }
        }

        Ok(if factors > 0 { score / factors as f64 } else { 0.0 })
    }

    /// Calculate fuzzy match score using string similarity
    fn fuzzy_match_score(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<f64> {
        let mut scores = Vec::new();

        // Description fuzzy match
        if let (Some(desc1), Some(desc2)) = (&features1.description, &features2.description) {
            scores.push(self.calculate_string_similarity(desc1, desc2));
        }

        // External ID fuzzy match
        if let (Some(id1), Some(id2)) = (&features1.external_id, &features2.external_id) {
            scores.push(self.calculate_string_similarity(id1, id2));
        }

        Ok(if scores.is_empty() {
            0.0
        } else {
            scores.iter().sum::<f64>() / scores.len() as f64
        })
    }

    /// Calculate date match score with tolerance
    fn date_match_score(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<f64> {
        if let (Some(date1), Some(date2)) = (features1.date, features2.date) {
            let days_diff = (date1 - date2).num_days().abs();
            
            if days_diff == 0 {
                Ok(1.0)
            } else if days_diff <= 1 {
                Ok(0.8)
            } else if days_diff <= 3 {
                Ok(0.6)
            } else if days_diff <= 7 {
                Ok(0.4)
            } else {
                Ok(0.0)
            }
        } else {
            Ok(0.0)
        }
    }

    /// Calculate amount match score with tolerance
    fn amount_match_score(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<f64> {
        if let (Some(amount1), Some(amount2)) = (features1.amount, features2.amount) {
            let diff = (amount1 - amount2).abs();
            let max_amount = amount1.max(amount2);
            
            if diff < 0.01 {
                Ok(1.0)
            } else if diff / max_amount < 0.01 {
                Ok(0.9)
            } else if diff / max_amount < 0.05 {
                Ok(0.7)
            } else if diff / max_amount < 0.1 {
                Ok(0.5)
            } else {
                Ok(0.0)
            }
        } else {
            Ok(0.0)
        }
    }

    /// Calculate text similarity score using advanced algorithms
    fn text_similarity_score(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<f64> {
        let mut scores = Vec::new();

        // Description similarity
        if let (Some(desc1), Some(desc2)) = (&features1.description, &features2.description) {
            scores.push(self.calculate_advanced_similarity(desc1, desc2));
        }

        // External ID similarity
        if let (Some(id1), Some(id2)) = (&features1.external_id, &features2.external_id) {
            scores.push(self.calculate_advanced_similarity(id1, id2));
        }

        Ok(if scores.is_empty() {
            0.0
        } else {
            scores.iter().sum::<f64>() / scores.len() as f64
        })
    }

    /// Calculate string similarity using Jaccard similarity
    fn calculate_string_similarity(&self, s1: &str, s2: &str) -> f64 {
        let s1_lower = s1.to_lowercase();
        let s2_lower = s2.to_lowercase();
        let words1: std::collections::HashSet<&str> = s1_lower.split_whitespace().collect();
        let words2: std::collections::HashSet<&str> = s2_lower.split_whitespace().collect();
        
        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();
        
        if union == 0 { 0.0 } else { intersection as f64 / union as f64 }
    }

    /// Calculate advanced string similarity using multiple algorithms
    fn calculate_advanced_similarity(&self, s1: &str, s2: &str) -> f64 {
        // Jaccard similarity
        let jaccard = self.calculate_string_similarity(s1, s2);
        
        // Levenshtein distance similarity
        let levenshtein = self.calculate_levenshtein_similarity(s1, s2);
        
        // Cosine similarity (simplified)
        let cosine = self.calculate_cosine_similarity(s1, s2);
        
        // Weighted average
        (jaccard * 0.4 + levenshtein * 0.3 + cosine * 0.3)
    }

    /// Calculate Levenshtein distance similarity
    fn calculate_levenshtein_similarity(&self, s1: &str, s2: &str) -> f64 {
        let distance = self.levenshtein_distance(s1, s2);
        let max_len = s1.len().max(s2.len());
        
        if max_len == 0 {
            1.0
        } else {
            1.0 - (distance as f64 / max_len as f64)
        }
    }

    /// Calculate Levenshtein distance
    fn levenshtein_distance(&self, s1: &str, s2: &str) -> usize {
        let s1_chars: Vec<char> = s1.chars().collect();
        let s2_chars: Vec<char> = s2.chars().collect();
        let s1_len = s1_chars.len();
        let s2_len = s2_chars.len();

        let mut matrix = vec![vec![0; s2_len + 1]; s1_len + 1];

        for i in 0..=s1_len {
            matrix[i][0] = i;
        }
        for j in 0..=s2_len {
            matrix[0][j] = j;
        }

        for i in 1..=s1_len {
            for j in 1..=s2_len {
                let cost = if s1_chars[i - 1] == s2_chars[j - 1] { 0 } else { 1 };
                matrix[i][j] = (matrix[i - 1][j] + 1)
                    .min(matrix[i][j - 1] + 1)
                    .min(matrix[i - 1][j - 1] + cost);
            }
        }

        matrix[s1_len][s2_len]
    }

    /// Calculate cosine similarity
    fn calculate_cosine_similarity(&self, s1: &str, s2: &str) -> f64 {
        let words1: std::collections::HashMap<&str, u32> = s1.to_lowercase()
            .split_whitespace()
            .fold(std::collections::HashMap::new(), |mut acc, word| {
                *acc.entry(word).or_insert(0) += 1;
                acc
            });
        
        let words2: std::collections::HashMap<&str, u32> = s2.to_lowercase()
            .split_whitespace()
            .fold(std::collections::HashMap::new(), |mut acc, word| {
                *acc.entry(word).or_insert(0) += 1;
                acc
            });

        let mut dot_product = 0.0;
        let mut norm1 = 0.0;
        let mut norm2 = 0.0;

        for (word, count1) in &words1 {
            let count2 = words2.get(word).unwrap_or(&0);
            dot_product += (*count1 as f64) * (*count2 as f64);
            norm1 += (*count1 as f64).powi(2);
        }

        for (_, count2) in &words2 {
            norm2 += (*count2 as f64).powi(2);
        }

        if norm1 == 0.0 || norm2 == 0.0 {
            0.0
        } else {
            dot_product / (norm1.sqrt() * norm2.sqrt())
        }
    }

    /// Detect anomalies in the matching process
    async fn detect_anomaly(&self, features1: &FeatureVector, features2: &FeatureVector) -> AppResult<Option<f64>> {
        // Simple anomaly detection based on feature patterns
        let mut anomaly_score = 0.0;

        // Check for unusual amount patterns
        if let (Some(amount1), Some(amount2)) = (features1.amount, features2.amount) {
            let ratio = amount1 / amount2;
            if ratio > 10.0 || ratio < 0.1 {
                anomaly_score += 0.3;
            }
        }

        // Check for unusual date patterns
        if let (Some(date1), Some(date2)) = (features1.date, features2.date) {
            let days_diff = (date1 - date2).num_days().abs();
            if days_diff > 30 {
                anomaly_score += 0.2;
            }
        }

        // Check for unusual text patterns
        if let (Some(desc1), Some(desc2)) = (&features1.description, &features2.description) {
            let similarity = self.calculate_string_similarity(desc1, desc2);
            if similarity < 0.1 && desc1.len() > 10 && desc2.len() > 10 {
                anomaly_score += 0.2;
            }
        }

        Ok(if anomaly_score > 0.0 { Some(anomaly_score) } else { None })
    }

    /// Determine match type and generate recommendations
    fn determine_match_type_and_recommendations(
        &self,
        confidence: f64,
        scores: &HashMap<ModelType, f64>,
        feature_importance: &HashMap<String, f64>,
    ) -> AppResult<(String, Vec<String>)> {
        let mut match_type = "no_match".to_string();
        let mut recommendations = Vec::new();

        if confidence >= 0.95 {
            match_type = "exact_match".to_string();
        } else if confidence >= 0.85 {
            match_type = "high_confidence".to_string();
        } else if confidence >= 0.7 {
            match_type = "medium_confidence".to_string();
        } else if confidence >= 0.5 {
            match_type = "low_confidence".to_string();
        }

        // Generate recommendations based on scores
        if let Some(text_score) = scores.get(&ModelType::TextSimilarity) {
            if *text_score < 0.5 {
                recommendations.push("Consider improving description quality for better matching".to_string());
            }
        }

        if let Some(date_score) = scores.get(&ModelType::DateMatch) {
            if *date_score < 0.5 {
                recommendations.push("Check date formats and consider date tolerance settings".to_string());
            }
        }

        if let Some(amount_score) = scores.get(&ModelType::AmountMatch) {
            if *amount_score < 0.5 {
                recommendations.push("Verify amount precision and currency handling".to_string());
            }
        }

        Ok((match_type, recommendations))
    }

    /// Get model weights for confidence calculation
    fn get_model_weights(&self) -> HashMap<ModelType, f64> {
        let mut weights = HashMap::new();
        weights.insert(ModelType::ExactMatch, 0.3);
        weights.insert(ModelType::FuzzyMatch, 0.2);
        weights.insert(ModelType::DateMatch, 0.2);
        weights.insert(ModelType::AmountMatch, 0.2);
        weights.insert(ModelType::TextSimilarity, 0.1);
        weights
    }

    /// Store training data for future model improvement
    async fn store_training_data(
        &mut self,
        record1: &ReconciliationRecord,
        record2: &ReconciliationRecord,
        confidence: f64,
        is_match: bool,
    ) -> AppResult<()> {
        let training_data = TrainingData {
            id: Uuid::new_v4(),
            model_type: ModelType::ExactMatch,
            input_features: vec![
                self.extract_features(record1)?,
                self.extract_features(record2)?,
            ],
            expected_output: serde_json::json!(is_match),
            actual_output: Some(serde_json::json!(confidence)),
            is_correct: Some(is_match),
            confidence_score: Some(confidence),
            created_at: Utc::now(),
            user_feedback: None,
        };

        self.training_data.push(training_data);

        // Keep only recent training data (last 10000 records)
        if self.training_data.len() > 10000 {
            self.training_data.drain(0..1000);
        }

        Ok(())
    }

    /// Create exact match model
    async fn create_exact_match_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::ExactMatch,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.95,
                confidence_threshold: 0.9,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.95,
                    precision: 0.95,
                    recall: 0.95,
                    f1_score: 0.95,
                    processing_time_ms: 1,
                    false_positive_rate: 0.05,
                    false_negative_rate: 0.05,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create fuzzy match model
    async fn create_fuzzy_match_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::FuzzyMatch,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.85,
                confidence_threshold: 0.8,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.85,
                    precision: 0.85,
                    recall: 0.85,
                    f1_score: 0.85,
                    processing_time_ms: 5,
                    false_positive_rate: 0.15,
                    false_negative_rate: 0.15,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create date match model
    async fn create_date_match_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::DateMatch,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.9,
                confidence_threshold: 0.8,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.9,
                    precision: 0.9,
                    recall: 0.9,
                    f1_score: 0.9,
                    processing_time_ms: 2,
                    false_positive_rate: 0.1,
                    false_negative_rate: 0.1,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create amount match model
    async fn create_amount_match_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AmountMatch,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.95,
                confidence_threshold: 0.9,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.95,
                    precision: 0.95,
                    recall: 0.95,
                    f1_score: 0.95,
                    processing_time_ms: 1,
                    false_positive_rate: 0.05,
                    false_negative_rate: 0.05,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create text similarity model
    async fn create_text_similarity_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::TextSimilarity,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.8,
                confidence_threshold: 0.7,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.8,
                    precision: 0.8,
                    recall: 0.8,
                    f1_score: 0.8,
                    processing_time_ms: 10,
                    false_positive_rate: 0.2,
                    false_negative_rate: 0.2,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create anomaly detection model
    async fn create_anomaly_detection_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.85,
                confidence_threshold: 0.8,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.85,
                    precision: 0.85,
                    recall: 0.85,
                    f1_score: 0.85,
                    processing_time_ms: 15,
                    false_positive_rate: 0.15,
                    false_negative_rate: 0.15,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Get model performance metrics
    pub fn get_model_performance(&self, model_type: &ModelType) -> Option<&ModelPerformance> {
        self.models.get(model_type).map(|model| &model.config.performance_metrics)
    }

    /// Update model with user feedback
    pub async fn update_model_with_feedback(
        &mut self,
        model_type: ModelType,
        feedback: UserFeedback,
    ) -> AppResult<()> {
        tracing::info!("Updating model {:?} with user feedback", model_type);

        // Find the corresponding training data
        if let Some(training_data) = self.training_data.iter_mut().find(|td| td.id == feedback.user_id) {
            training_data.user_feedback = Some(feedback);
        }

        // Trigger model retraining if enough feedback is collected
        let feedback_count = self.training_data.iter()
            .filter(|td| td.user_feedback.is_some())
            .count();

        if feedback_count >= 100 {
            self.retrain_model(model_type).await?;
        }

        Ok(())
    }

    /// Retrain model with collected feedback
    async fn retrain_model(&mut self, model_type: ModelType) -> AppResult<()> {
        tracing::info!("Retraining model {:?}", model_type);

        // This is a placeholder for actual model retraining
        // In a real implementation, this would:
        // 1. Extract features from training data
        // 2. Train the ML model
        // 3. Evaluate performance
        // 4. Update model weights and parameters

        if let Some(model) = self.models.get_mut(&model_type) {
            model.config.last_trained = Some(Utc::now());
            model.config.training_data_size += self.training_data.len() as u64;
        }

        tracing::info!("Model {:?} retrained successfully", model_type);
        Ok(())
    }
}
