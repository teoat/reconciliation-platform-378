use crate::ai::models::*;
use crate::models::ReconciliationRecord;
use crate::utils::error::{AppError, AppResult};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use ndarray::{Array1, Array2};
// use linfa::prelude::*;
// use linfa_trees::DecisionTree;
use smartcore::linalg::basic::matrix::DenseMatrix;
use smartcore::ensemble::random_forest_regressor::RandomForestRegressor;
use smartcore::neighbors::knn_classifier::KNNClassifier;
use statrs::distribution::{Normal, Continuous};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

/// Intelligent recommendation engine for reconciliation optimization
pub struct RecommendationEngine {
    models: HashMap<RecommendationType, MLModel>,
    user_preferences: HashMap<Uuid, UserPreferences>,
    historical_recommendations: Vec<HistoricalRecommendation>,
    performance_cache: HashMap<RecommendationType, ModelPerformance>,
}

/// User preferences for recommendations
#[derive(Debug, Clone)]
pub struct UserPreferences {
    pub user_id: Uuid,
    pub preferred_recommendation_types: Vec<RecommendationType>,
    pub priority_weights: HashMap<RecommendationPriority, f64>,
    pub implementation_preferences: HashMap<String, f64>,
    pub feedback_history: Vec<RecommendationFeedback>,
    pub last_updated: DateTime<Utc>,
}

/// Historical recommendation for learning
#[derive(Debug, Clone)]
pub struct HistoricalRecommendation {
    pub id: Uuid,
    pub recommendation_type: RecommendationType,
    pub title: String,
    pub description: String,
    pub priority: RecommendationPriority,
    pub confidence: f64,
    pub user_id: Uuid,
    pub project_id: Uuid,
    pub was_accepted: bool,
    pub implementation_effort: String,
    pub actual_impact: Option<String>,
    pub created_at: DateTime<Utc>,
    pub feedback: Option<RecommendationFeedback>,
}

/// Recommendation feedback from users
#[derive(Debug, Clone)]
pub struct RecommendationFeedback {
    pub user_id: Uuid,
    pub recommendation_id: Uuid,
    pub rating: u8, // 1-5 scale
    pub was_helpful: bool,
    pub was_implemented: bool,
    pub comments: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl RecommendationEngine {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
            user_preferences: HashMap::new(),
            historical_recommendations: Vec::new(),
            performance_cache: HashMap::new(),
        }
    }

    /// Initialize recommendation models
    pub async fn initialize_models(&mut self) -> AppResult<()> {
        tracing::info!("Initializing recommendation engine models");

        // Initialize matching rule recommendation model
        self.models.insert(
            RecommendationType::MatchingRule,
            self.create_matching_rule_model().await?
        );

        // Initialize process optimization recommendation model
        self.models.insert(
            RecommendationType::ProcessOptimization,
            self.create_process_optimization_model().await?
        );

        // Initialize data quality recommendation model
        self.models.insert(
            RecommendationType::DataQuality,
            self.create_data_quality_model().await?
        );

        // Initialize workflow improvement recommendation model
        self.models.insert(
            RecommendationType::WorkflowImprovement,
            self.create_workflow_improvement_model().await?
        );

        // Initialize system configuration recommendation model
        self.models.insert(
            RecommendationType::SystemConfiguration,
            self.create_system_configuration_model().await?
        );

        // Initialize user training recommendation model
        self.models.insert(
            RecommendationType::UserTraining,
            self.create_user_training_model().await?
        );

        // Initialize security enhancement recommendation model
        self.models.insert(
            RecommendationType::SecurityEnhancement,
            self.create_security_enhancement_model().await?
        );

        tracing::info!("Recommendation engine models initialized successfully");
        Ok(())
    }

    /// Generate recommendations for reconciliation optimization
    pub async fn generate_recommendations(
        &mut self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
    ) -> AppResult<Vec<RecommendationResult>> {
        let start_time = std::time::Instant::now();

        tracing::debug!("Generating recommendations for user {} and project {}", user_id, project_id);

        let mut recommendations = Vec::new();

        // Get user preferences
        let user_prefs = self.get_user_preferences(user_id).await?;

        // Generate matching rule recommendations
        let matching_rule_recs = self.generate_matching_rule_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(matching_rule_recs);

        // Generate process optimization recommendations
        let process_opt_recs = self.generate_process_optimization_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(process_opt_recs);

        // Generate data quality recommendations
        let data_quality_recs = self.generate_data_quality_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(data_quality_recs);

        // Generate workflow improvement recommendations
        let workflow_recs = self.generate_workflow_improvement_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(workflow_recs);

        // Generate system configuration recommendations
        let system_config_recs = self.generate_system_configuration_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(system_config_recs);

        // Generate user training recommendations
        let training_recs = self.generate_user_training_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(training_recs);

        // Generate security enhancement recommendations
        let security_recs = self.generate_security_enhancement_recommendations(
            user_id,
            project_id,
            context,
            &user_prefs,
        ).await?;
        recommendations.extend(security_recs);

        // Sort recommendations by priority and confidence
        recommendations.sort_by(|a, b| {
            let priority_order = self.get_priority_order(&a.priority).cmp(&self.get_priority_order(&b.priority));
            if priority_order == std::cmp::Ordering::Equal {
                b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                priority_order
            }
        });

        // Store recommendations for future learning
        self.store_recommendations(&recommendations, user_id, project_id).await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        tracing::info!(
            "Generated {} recommendations for user {} in {}ms",
            recommendations.len(),
            user_id,
            processing_time
        );

        Ok(recommendations)
    }

    /// Generate matching rule recommendations
    async fn generate_matching_rule_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze current matching performance
        let match_rate = context.metrics.get("match_rate").unwrap_or(&0.8);
        let false_positive_rate = context.metrics.get("false_positive_rate").unwrap_or(&0.1);
        let false_negative_rate = context.metrics.get("false_negative_rate").unwrap_or(&0.1);

        // Recommend confidence threshold adjustment
        if *false_positive_rate > 0.15 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::MatchingRule,
                title: "Adjust Confidence Threshold".to_string(),
                description: "Consider increasing the confidence threshold to reduce false positives. Current false positive rate is high.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.85,
                expected_impact: "Reduce false positives by 20-30%".to_string(),
                implementation_effort: "Low".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend fuzzy matching improvements
        if *match_rate < 0.7 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::MatchingRule,
                title: "Enable Fuzzy Matching".to_string(),
                description: "Enable fuzzy matching algorithms to improve match rate for records with slight variations.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.80,
                expected_impact: "Increase match rate by 15-25%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend date tolerance adjustment
        let avg_date_diff = context.metrics.get("avg_date_difference_days").unwrap_or(&0.0);
        if *avg_date_diff > 1.0 && *avg_date_diff < 7.0 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::MatchingRule,
                title: "Adjust Date Tolerance".to_string(),
                description: "Consider increasing date tolerance to capture more matches with small date differences.".to_string(),
                priority: RecommendationPriority::Low,
                confidence: 0.75,
                expected_impact: "Capture additional 5-10% of matches".to_string(),
                implementation_effort: "Low".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate process optimization recommendations
    async fn generate_process_optimization_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze processing performance
        let avg_processing_time = context.metrics.get("avg_processing_time_ms").unwrap_or(&1000.0);
        let throughput = context.metrics.get("records_per_minute").unwrap_or(&100.0);

        // Recommend batch processing
        if *avg_processing_time > 2000.0 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::ProcessOptimization,
                title: "Implement Batch Processing".to_string(),
                description: "Process records in batches to improve efficiency and reduce processing time.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.90,
                expected_impact: "Reduce processing time by 40-60%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend parallel processing
        if *throughput < 200.0 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::ProcessOptimization,
                title: "Enable Parallel Processing".to_string(),
                description: "Enable parallel processing to increase throughput and handle larger volumes.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.85,
                expected_impact: "Increase throughput by 2-3x".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend caching
        let cache_hit_rate = context.metrics.get("cache_hit_rate").unwrap_or(&0.0);
        if *cache_hit_rate < 0.3 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::ProcessOptimization,
                title: "Implement Intelligent Caching".to_string(),
                description: "Implement caching for frequently accessed data to improve performance.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.80,
                expected_impact: "Improve response time by 30-50%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate data quality recommendations
    async fn generate_data_quality_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze data quality metrics
        let data_quality_score = context.metrics.get("data_quality_score").unwrap_or(&0.8);
        let missing_data_rate = context.metrics.get("missing_data_rate").unwrap_or(&0.05);
        let duplicate_rate = context.metrics.get("duplicate_rate").unwrap_or(&0.02);

        // Recommend data validation improvements
        if *data_quality_score < 0.7 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::DataQuality,
                title: "Improve Data Validation".to_string(),
                description: "Implement stricter data validation rules to improve data quality.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.90,
                expected_impact: "Improve data quality score by 20-30%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend duplicate detection
        if *duplicate_rate > 0.05 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::DataQuality,
                title: "Implement Duplicate Detection".to_string(),
                description: "Implement automated duplicate detection to identify and handle duplicate records.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.85,
                expected_impact: "Reduce duplicate rate by 80-90%".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend data cleansing
        if *missing_data_rate > 0.1 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::DataQuality,
                title: "Implement Data Cleansing".to_string(),
                description: "Implement automated data cleansing to handle missing and invalid data.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.80,
                expected_impact: "Reduce missing data rate by 50-70%".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate workflow improvement recommendations
    async fn generate_workflow_improvement_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze workflow metrics
        let avg_resolution_time = context.metrics.get("avg_resolution_time_hours").unwrap_or(&24.0);
        let escalation_rate = context.metrics.get("escalation_rate").unwrap_or(&0.1);
        let user_satisfaction = context.metrics.get("user_satisfaction").unwrap_or(&0.8);

        // Recommend automated resolution
        if *avg_resolution_time > 48.0 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::WorkflowImprovement,
                title: "Implement Automated Resolution".to_string(),
                description: "Implement automated resolution for common discrepancies to reduce resolution time.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.85,
                expected_impact: "Reduce resolution time by 60-80%".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend workflow optimization
        if *escalation_rate > 0.2 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::WorkflowImprovement,
                title: "Optimize Escalation Rules".to_string(),
                description: "Review and optimize escalation rules to reduce unnecessary escalations.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.80,
                expected_impact: "Reduce escalation rate by 30-50%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend user experience improvements
        if *user_satisfaction < 0.7 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::WorkflowImprovement,
                title: "Improve User Experience".to_string(),
                description: "Enhance user interface and workflow to improve user satisfaction.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.75,
                expected_impact: "Improve user satisfaction by 20-30%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate system configuration recommendations
    async fn generate_system_configuration_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze system performance
        let cpu_usage = context.metrics.get("cpu_usage").unwrap_or(&0.5);
        let memory_usage = context.metrics.get("memory_usage").unwrap_or(&0.6);
        let disk_usage = context.metrics.get("disk_usage").unwrap_or(&0.4);

        // Recommend resource optimization
        if *cpu_usage > 0.8 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SystemConfiguration,
                title: "Optimize CPU Usage".to_string(),
                description: "Optimize CPU usage by implementing more efficient algorithms and caching.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.90,
                expected_impact: "Reduce CPU usage by 20-30%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend memory optimization
        if *memory_usage > 0.8 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SystemConfiguration,
                title: "Optimize Memory Usage".to_string(),
                description: "Implement memory optimization techniques to reduce memory consumption.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.85,
                expected_impact: "Reduce memory usage by 25-35%".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend storage optimization
        if *disk_usage > 0.8 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SystemConfiguration,
                title: "Optimize Storage Usage".to_string(),
                description: "Implement data compression and archiving to optimize storage usage.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.80,
                expected_impact: "Reduce storage usage by 40-60%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate user training recommendations
    async fn generate_user_training_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze user performance metrics
        let user_efficiency = context.metrics.get("user_efficiency").unwrap_or(&0.8);
        let error_rate = context.metrics.get("user_error_rate").unwrap_or(&0.05);
        let training_completion = context.metrics.get("training_completion_rate").unwrap_or(&0.6);

        // Recommend advanced training
        if *user_efficiency < 0.7 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::UserTraining,
                title: "Advanced Reconciliation Training".to_string(),
                description: "Provide advanced training on reconciliation best practices and techniques.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.85,
                expected_impact: "Improve user efficiency by 25-40%".to_string(),
                implementation_effort: "Low".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend error prevention training
        if *error_rate > 0.1 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::UserTraining,
                title: "Error Prevention Training".to_string(),
                description: "Provide training on common errors and how to prevent them.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.90,
                expected_impact: "Reduce error rate by 50-70%".to_string(),
                implementation_effort: "Low".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend feature training
        if *training_completion < 0.8 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::UserTraining,
                title: "Feature Training Program".to_string(),
                description: "Implement comprehensive training program for all system features.".to_string(),
                priority: RecommendationPriority::Low,
                confidence: 0.75,
                expected_impact: "Improve feature adoption by 30-50%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Generate security enhancement recommendations
    async fn generate_security_enhancement_recommendations(
        &self,
        user_id: Uuid,
        project_id: Uuid,
        context: &RecommendationContext,
        user_prefs: &UserPreferences,
    ) -> AppResult<Vec<RecommendationResult>> {
        let mut recommendations = Vec::new();

        // Analyze security metrics
        let failed_login_rate = context.metrics.get("failed_login_rate").unwrap_or(&0.02);
        let suspicious_activity = context.metrics.get("suspicious_activity_rate").unwrap_or(&0.01);
        let data_access_patterns = context.metrics.get("unusual_data_access").unwrap_or(&0.0);

        // Recommend enhanced authentication
        if *failed_login_rate > 0.05 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SecurityEnhancement,
                title: "Implement Multi-Factor Authentication".to_string(),
                description: "Implement multi-factor authentication to enhance security.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.95,
                expected_impact: "Reduce security incidents by 80-90%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend activity monitoring
        if *suspicious_activity > 0.02 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SecurityEnhancement,
                title: "Implement Activity Monitoring".to_string(),
                description: "Implement comprehensive activity monitoring and alerting.".to_string(),
                priority: RecommendationPriority::High,
                confidence: 0.90,
                expected_impact: "Improve threat detection by 70-85%".to_string(),
                implementation_effort: "High".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        // Recommend access control improvements
        if *data_access_patterns > 0.1 {
            recommendations.push(RecommendationResult {
                recommendation_type: RecommendationType::SecurityEnhancement,
                title: "Enhance Access Controls".to_string(),
                description: "Implement stricter access controls and data classification.".to_string(),
                priority: RecommendationPriority::Medium,
                confidence: 0.85,
                expected_impact: "Improve data protection by 60-75%".to_string(),
                implementation_effort: "Medium".to_string(),
                related_records: Vec::new(),
                created_at: Utc::now(),
            });
        }

        Ok(recommendations)
    }

    /// Get user preferences
    async fn get_user_preferences(&mut self, user_id: Uuid) -> AppResult<UserPreferences> {
        if let Some(prefs) = self.user_preferences.get(&user_id) {
            Ok(prefs.clone())
        } else {
            // Create default preferences
            let default_prefs = UserPreferences {
                user_id,
                preferred_recommendation_types: vec![
                    RecommendationType::MatchingRule,
                    RecommendationType::ProcessOptimization,
                    RecommendationType::DataQuality,
                ],
                priority_weights: {
                    let mut weights = HashMap::new();
                    weights.insert(RecommendationPriority::Critical, 1.0);
                    weights.insert(RecommendationPriority::High, 0.8);
                    weights.insert(RecommendationPriority::Medium, 0.6);
                    weights.insert(RecommendationPriority::Low, 0.4);
                    weights
                },
                implementation_preferences: HashMap::new(),
                feedback_history: Vec::new(),
                last_updated: Utc::now(),
            };
            self.user_preferences.insert(user_id, default_prefs.clone());
            Ok(default_prefs)
        }
    }

    /// Get priority order for sorting
    fn get_priority_order(&self, priority: &RecommendationPriority) -> u8 {
        match priority {
            RecommendationPriority::Critical => 4,
            RecommendationPriority::High => 3,
            RecommendationPriority::Medium => 2,
            RecommendationPriority::Low => 1,
        }
    }

    /// Store recommendations for future learning
    async fn store_recommendations(
        &mut self,
        recommendations: &[RecommendationResult],
        user_id: Uuid,
        project_id: Uuid,
    ) -> AppResult<()> {
        for rec in recommendations {
            let historical_rec = HistoricalRecommendation {
                id: Uuid::new_v4(),
                recommendation_type: rec.recommendation_type.clone(),
                title: rec.title.clone(),
                description: rec.description.clone(),
                priority: rec.priority.clone(),
                confidence: rec.confidence,
                user_id,
                project_id,
                was_accepted: false, // Will be updated when user provides feedback
                implementation_effort: rec.implementation_effort.clone(),
                actual_impact: None,
                created_at: rec.created_at,
                feedback: None,
            };
            self.historical_recommendations.push(historical_rec);
        }

        // Keep only recent recommendations (last 10000)
        if self.historical_recommendations.len() > 10000 {
            self.historical_recommendations.drain(0..1000);
        }

        Ok(())
    }

    /// Update recommendation with user feedback
    pub async fn update_recommendation_feedback(
        &mut self,
        recommendation_id: Uuid,
        feedback: RecommendationFeedback,
    ) -> AppResult<()> {
        tracing::info!("Updating recommendation {} with feedback", recommendation_id);

        if let Some(historical_rec) = self.historical_recommendations.iter_mut()
            .find(|r| r.id == recommendation_id) {
            historical_rec.feedback = Some(feedback.clone());
            historical_rec.was_accepted = feedback.was_implemented;

            // Update user preferences based on feedback
            if let Some(user_prefs) = self.user_preferences.get_mut(&feedback.user_id) {
                user_prefs.feedback_history.push(feedback);
                user_prefs.last_updated = Utc::now();
            }
        }

        Ok(())
    }

    /// Create matching rule recommendation model
    async fn create_matching_rule_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.85,
                confidence_threshold: 0.80,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.85,
                    precision: 0.85,
                    recall: 0.85,
                    f1_score: 0.85,
                    processing_time_ms: 30,
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

    /// Create process optimization recommendation model
    async fn create_process_optimization_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.80,
                confidence_threshold: 0.75,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.80,
                    precision: 0.80,
                    recall: 0.80,
                    f1_score: 0.80,
                    processing_time_ms: 25,
                    false_positive_rate: 0.20,
                    false_negative_rate: 0.20,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create data quality recommendation model
    async fn create_data_quality_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.88,
                confidence_threshold: 0.83,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.88,
                    precision: 0.88,
                    recall: 0.88,
                    f1_score: 0.88,
                    processing_time_ms: 20,
                    false_positive_rate: 0.12,
                    false_negative_rate: 0.12,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create workflow improvement recommendation model
    async fn create_workflow_improvement_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.82,
                confidence_threshold: 0.77,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.82,
                    precision: 0.82,
                    recall: 0.82,
                    f1_score: 0.82,
                    processing_time_ms: 35,
                    false_positive_rate: 0.18,
                    false_negative_rate: 0.18,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create system configuration recommendation model
    async fn create_system_configuration_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.90,
                confidence_threshold: 0.85,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.90,
                    precision: 0.90,
                    recall: 0.90,
                    f1_score: 0.90,
                    processing_time_ms: 40,
                    false_positive_rate: 0.10,
                    false_negative_rate: 0.10,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create user training recommendation model
    async fn create_user_training_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.75,
                confidence_threshold: 0.70,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.75,
                    precision: 0.75,
                    recall: 0.75,
                    f1_score: 0.75,
                    processing_time_ms: 15,
                    false_positive_rate: 0.25,
                    false_negative_rate: 0.25,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }

    /// Create security enhancement recommendation model
    async fn create_security_enhancement_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.92,
                confidence_threshold: 0.87,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.92,
                    precision: 0.92,
                    recall: 0.92,
                    f1_score: 0.92,
                    processing_time_ms: 50,
                    false_positive_rate: 0.08,
                    false_negative_rate: 0.08,
                },
            },
            weights: Vec::new(),
            bias: Vec::new(),
            feature_scalers: HashMap::new(),
            is_trained: true,
            last_inference: None,
        })
    }
}

/// Context for generating recommendations
#[derive(Debug, Clone)]
pub struct RecommendationContext {
    pub project_id: Uuid,
    pub user_id: Uuid,
    pub metrics: HashMap<String, f64>,
    pub recent_activity: Vec<RecentActivity>,
    pub system_state: HashMap<String, serde_json::Value>,
}

/// Recent activity for context
#[derive(Debug, Clone)]
pub struct RecentActivity {
    pub activity_type: String,
    pub timestamp: DateTime<Utc>,
    pub details: HashMap<String, serde_json::Value>,
}
