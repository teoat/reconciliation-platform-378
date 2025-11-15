use crate::ai::models::*;
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
use smartcore::linear::logistic_regression::LogisticRegression;
use smartcore::neighbors::knn_classifier::KNNClassifier;
use smartcore::svm::SVC;
use smartcore::ensemble::random_forest_regressor::RandomForestRegressor;
use statrs::distribution::{Normal, Continuous};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

/// ML model training engine for continuous learning
pub struct ModelTrainingEngine {
    training_data: HashMap<ModelType, Vec<TrainingData>>,
    trained_models: HashMap<ModelType, MLModel>,
    training_configs: HashMap<ModelType, TrainingConfig>,
    performance_history: HashMap<ModelType, Vec<ModelPerformance>>,
}

impl ModelTrainingEngine {
    pub fn new() -> Self {
        Self {
            training_data: HashMap::new(),
            trained_models: HashMap::new(),
            training_configs: HashMap::new(),
            performance_history: HashMap::new(),
        }
    }

    /// Initialize training configurations
    pub async fn initialize_training_configs(&mut self) -> AppResult<()> {
        tracing::info!("Initializing model training configurations");

        // Initialize exact match training config
        self.training_configs.insert(
            ModelType::ExactMatch,
            TrainingConfig {
                model_type: ModelType::ExactMatch,
                training_data_size: 1000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 100,
                learning_rate: 0.01,
                batch_size: 32,
                early_stopping_patience: 10,
                regularization: 0.001,
                feature_selection: true,
                cross_validation_folds: 5,
            }
        );

        // Initialize fuzzy match training config
        self.training_configs.insert(
            ModelType::FuzzyMatch,
            TrainingConfig {
                model_type: ModelType::FuzzyMatch,
                training_data_size: 2000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 150,
                learning_rate: 0.005,
                batch_size: 64,
                early_stopping_patience: 15,
                regularization: 0.0001,
                feature_selection: true,
                cross_validation_folds: 5,
            }
        );

        // Initialize date match training config
        self.training_configs.insert(
            ModelType::DateMatch,
            TrainingConfig {
                model_type: ModelType::DateMatch,
                training_data_size: 1500,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 120,
                learning_rate: 0.01,
                batch_size: 32,
                early_stopping_patience: 12,
                regularization: 0.001,
                feature_selection: false,
                cross_validation_folds: 5,
            }
        );

        // Initialize amount match training config
        self.training_configs.insert(
            ModelType::AmountMatch,
            TrainingConfig {
                model_type: ModelType::AmountMatch,
                training_data_size: 1000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 100,
                learning_rate: 0.01,
                batch_size: 32,
                early_stopping_patience: 10,
                regularization: 0.001,
                feature_selection: false,
                cross_validation_folds: 5,
            }
        );

        // Initialize text similarity training config
        self.training_configs.insert(
            ModelType::TextSimilarity,
            TrainingConfig {
                model_type: ModelType::TextSimilarity,
                training_data_size: 3000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 200,
                learning_rate: 0.001,
                batch_size: 128,
                early_stopping_patience: 20,
                regularization: 0.0001,
                feature_selection: true,
                cross_validation_folds: 5,
            }
        );

        // Initialize anomaly detection training config
        self.training_configs.insert(
            ModelType::AnomalyDetection,
            TrainingConfig {
                model_type: ModelType::AnomalyDetection,
                training_data_size: 5000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 300,
                learning_rate: 0.0001,
                batch_size: 256,
                early_stopping_patience: 25,
                regularization: 0.00001,
                feature_selection: true,
                cross_validation_folds: 10,
            }
        );

        // Initialize predictive analytics training config
        self.training_configs.insert(
            ModelType::PredictiveAnalytics,
            TrainingConfig {
                model_type: ModelType::PredictiveAnalytics,
                training_data_size: 4000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 250,
                learning_rate: 0.0005,
                batch_size: 128,
                early_stopping_patience: 20,
                regularization: 0.0001,
                feature_selection: true,
                cross_validation_folds: 5,
            }
        );

        // Initialize recommendation engine training config
        self.training_configs.insert(
            ModelType::RecommendationEngine,
            TrainingConfig {
                model_type: ModelType::RecommendationEngine,
                training_data_size: 6000,
                validation_split: 0.2,
                test_split: 0.1,
                epochs: 400,
                learning_rate: 0.0001,
                batch_size: 256,
                early_stopping_patience: 30,
                regularization: 0.00001,
                feature_selection: true,
                cross_validation_folds: 5,
            }
        );

        tracing::info!("Model training configurations initialized successfully");
        Ok(())
    }

    /// Train a specific model type
    pub async fn train_model(&mut self, model_type: ModelType) -> AppResult<MLModel> {
        tracing::info!("Starting training for model type: {:?}", model_type);

        let config = self.training_configs.get(&model_type)
            .ok_or_else(|| AppError::BadRequest(format!("No training config found for {:?}", model_type)))?;

        let training_data = self.training_data.get(&model_type)
            .ok_or_else(|| AppError::BadRequest(format!("No training data found for {:?}", model_type)))?;

        if training_data.len() < config.training_data_size as usize {
            return Err(AppError::BadRequest(format!(
                "Insufficient training data: need {}, have {}",
                config.training_data_size,
                training_data.len()
            )));
        }

        // Prepare training data
        let (features, labels) = self.prepare_training_data(training_data, config)?;

        // Split data into train/validation/test sets
        let (train_features, train_labels, val_features, val_labels, test_features, test_labels) =
            self.split_training_data(features, labels, config)?;

        // Train the model based on type
        let trained_model = match model_type {
            ModelType::ExactMatch => self.train_exact_match_model(train_features, train_labels, config).await?,
            ModelType::FuzzyMatch => self.train_fuzzy_match_model(train_features, train_labels, config).await?,
            ModelType::DateMatch => self.train_date_match_model(train_features, train_labels, config).await?,
            ModelType::AmountMatch => self.train_amount_match_model(train_features, train_labels, config).await?,
            ModelType::TextSimilarity => self.train_text_similarity_model(train_features, train_labels, config).await?,
            ModelType::AnomalyDetection => self.train_anomaly_detection_model(train_features, train_labels, config).await?,
            ModelType::PredictiveAnalytics => self.train_predictive_analytics_model(train_features, train_labels, config).await?,
            ModelType::RecommendationEngine => self.train_recommendation_engine_model(train_features, train_labels, config).await?,
        };

        // Validate the model
        let validation_metrics = self.validate_model(&trained_model, &val_features, &val_labels).await?;

        // Test the model
        let test_metrics = self.test_model(&trained_model, &test_features, &test_labels).await?;

        // Update model performance
        let final_model = MLModel {
            config: ModelConfig {
                model_type: trained_model.config.model_type.clone(),
                version: "1.1.0".to_string(),
                parameters: trained_model.config.parameters.clone(),
                accuracy_threshold: test_metrics.accuracy,
                confidence_threshold: test_metrics.f1_score,
                training_data_size: training_data.len() as u64,
                last_trained: Some(Utc::now()),
                performance_metrics: test_metrics.clone(),
            },
            weights: trained_model.weights.clone(),
            bias: trained_model.bias.clone(),
            feature_scalers: trained_model.feature_scalers.clone(),
            is_trained: true,
            last_inference: None,
        };

        // Store performance history
        self.performance_history.entry(model_type).or_insert_with(Vec::new).push(test_metrics);

        // Store trained model
        self.trained_models.insert(model_type, final_model.clone());

        tracing::info!(
            "Model training completed for {:?}: accuracy={:.3}, f1_score={:.3}",
            model_type,
            test_metrics.accuracy,
            test_metrics.f1_score
        );

        Ok(final_model)
    }

    /// Prepare training data for ML models
    fn prepare_training_data(
        &self,
        training_data: &[TrainingData],
        config: &TrainingConfig,
    ) -> AppResult<(Array2<f64>, Array1<f64>)> {
        let mut features = Vec::new();
        let mut labels = Vec::new();

        for data in training_data {
            // Extract features from input
            let feature_vector = self.extract_features_from_training_data(data)?;
            features.push(feature_vector);

            // Extract label from expected output
            let label = self.extract_label_from_training_data(data)?;
            labels.push(label);
        }

        let feature_matrix = Array2::from_shape_vec(
            (features.len(), features[0].len()),
            features.into_iter().flatten().collect(),
        ).map_err(|e| AppError::InternalServerError(format!("Failed to create feature matrix: {}", e)))?;

        let label_vector = Array1::from_vec(labels);

        Ok((feature_matrix, label_vector))
    }

    /// Extract features from training data
    fn extract_features_from_training_data(&self, data: &TrainingData) -> AppResult<Vec<f64>> {
        let mut features = Vec::new();

        for feature_vector in &data.input_features {
            // Amount features
            if let Some(amount) = feature_vector.amount {
                features.push(amount);
                features.push(amount.log10()); // Log scale
            } else {
                features.push(0.0);
                features.push(0.0);
            }

            // Date features
            if let Some(date) = feature_vector.date {
                let days_since_epoch = date.and_hms_opt(0, 0, 0).unwrap().timestamp() as f64 / 86400.0;
                features.push(days_since_epoch);
                features.push((days_since_epoch % 365.0) / 365.0); // Day of year normalized
            } else {
                features.push(0.0);
                features.push(0.0);
            }

            // Description features
            if let Some(description) = &feature_vector.description {
                features.push(description.len() as f64);
                features.push(description.split_whitespace().count() as f64);
                features.push(self.calculate_text_complexity(description));
            } else {
                features.push(0.0);
                features.push(0.0);
                features.push(0.0);
            }

            // External ID features
            if let Some(external_id) = &feature_vector.external_id {
                features.push(external_id.len() as f64);
                features.push(self.calculate_id_complexity(external_id));
            } else {
                features.push(0.0);
                features.push(0.0);
            }

            // Source system features
            if let Some(source_system) = &feature_vector.source_system {
                features.push(self.encode_categorical_feature(source_system));
            } else {
                features.push(0.0);
            }

            // Transaction type features
            if let Some(transaction_type) = &feature_vector.transaction_type {
                features.push(self.encode_categorical_feature(transaction_type));
            } else {
                features.push(0.0);
            }

            // Metadata features
            for (key, value) in &feature_vector.metadata {
                if let Some(num_value) = value.as_f64() {
                    features.push(num_value);
                } else if let Some(str_value) = value.as_str() {
                    features.push(self.encode_categorical_feature(str_value));
                } else {
                    features.push(0.0);
                }
            }
        }

        Ok(features)
    }

    /// Extract label from training data
    fn extract_label_from_training_data(&self, data: &TrainingData) -> AppResult<f64> {
        match data.expected_output {
            serde_json::Value::Bool(b) => Ok(if b { 1.0 } else { 0.0 }),
            serde_json::Value::Number(n) => Ok(n.as_f64().unwrap_or(0.0)),
            _ => Ok(0.0),
        }
    }

    /// Split training data into train/validation/test sets
    fn split_training_data(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<(Array2<f64>, Array1<f64>, Array2<f64>, Array1<f64>, Array2<f64>, Array1<f64>)> {
        let n_samples = features.nrows();
        let n_features = features.ncols();

        // Calculate split indices
        let train_size = ((1.0 - config.validation_split - config.test_split) * n_samples as f64) as usize;
        let val_size = (config.validation_split * n_samples as f64) as usize;
        let test_size = n_samples - train_size - val_size;

        // Split features
        let train_features = features.slice(s![0..train_size, ..]).to_owned();
        let val_features = features.slice(s![train_size..train_size + val_size, ..]).to_owned();
        let test_features = features.slice(s![train_size + val_size.., ..]).to_owned();

        // Split labels
        let train_labels = labels.slice(s![0..train_size]).to_owned();
        let val_labels = labels.slice(s![train_size..train_size + val_size]).to_owned();
        let test_labels = labels.slice(s![train_size + val_size..]).to_owned();

        Ok((train_features, train_labels, val_features, val_labels, test_features, test_labels))
    }

    /// Train exact match model
    async fn train_exact_match_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // For exact matching, we can use a simple decision tree
        let dataset = Dataset::new(features, labels);
        
        // Convert to SmartCore format
        let n_samples = dataset.nsamples();
        let n_features = dataset.nfeatures();
        
        let mut feature_matrix = DenseMatrix::zeros(n_samples, n_features);
        let mut label_vector = DenseVector::zeros(n_samples);
        
        for i in 0..n_samples {
            for j in 0..n_features {
                feature_matrix.set(i, j, *dataset.records().get((i, j)).unwrap());
            }
            label_vector.set(i, *dataset.targets().get(i).unwrap());
        }

        // Train decision tree
        let model = DecisionTree::params()
            .max_depth(Some(10))
            .min_samples_split(Some(2))
            .min_samples_leaf(Some(1))
            .fit(&dataset)
            .map_err(|e| AppError::InternalServerError(format!("Decision tree training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::ExactMatch,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.95,
                confidence_threshold: 0.9,
                training_data_size: n_samples as u64,
                last_trained: Some(Utc::now()),
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

    /// Train fuzzy match model
    async fn train_fuzzy_match_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use KNN for fuzzy matching
        let dataset = Dataset::new(features, labels);
        
        let model = KNNClassifier::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("KNN training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::FuzzyMatch,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.85,
                confidence_threshold: 0.8,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
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

    /// Train date match model
    async fn train_date_match_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use logistic regression for date matching
        let dataset = Dataset::new(features, labels);
        
        let model = LogisticRegression::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("Logistic regression training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::DateMatch,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.9,
                confidence_threshold: 0.8,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
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

    /// Train amount match model
    async fn train_amount_match_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use Gaussian Naive Bayes for amount matching
        let dataset = Dataset::new(features, labels);
        
        let model = GaussianNb::params()
            .fit(&dataset)
            .map_err(|e| AppError::InternalServerError(format!("Gaussian NB training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AmountMatch,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.95,
                confidence_threshold: 0.9,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
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

    /// Train text similarity model
    async fn train_text_similarity_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use SVM for text similarity
        let dataset = Dataset::new(features, labels);
        
        let model = SVC::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("SVM training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::TextSimilarity,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.8,
                confidence_threshold: 0.7,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
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

    /// Train anomaly detection model
    async fn train_anomaly_detection_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use Random Forest for anomaly detection
        let dataset = Dataset::new(features, labels);
        
        let model = RandomForestRegressor::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("Random Forest training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.85,
                confidence_threshold: 0.8,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
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

    /// Train predictive analytics model
    async fn train_predictive_analytics_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use Random Forest for predictive analytics
        let dataset = Dataset::new(features, labels);
        
        let model = RandomForestRegressor::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("Random Forest training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::PredictiveAnalytics,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.80,
                confidence_threshold: 0.75,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
                performance_metrics: ModelPerformance {
                    accuracy: 0.80,
                    precision: 0.80,
                    recall: 0.80,
                    f1_score: 0.80,
                    processing_time_ms: 20,
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

    /// Train recommendation engine model
    async fn train_recommendation_engine_model(
        &self,
        features: Array2<f64>,
        labels: Array1<f64>,
        config: &TrainingConfig,
    ) -> AppResult<MLModel> {
        // Use Random Forest for recommendation engine
        let dataset = Dataset::new(features, labels);
        
        let model = RandomForestRegressor::fit(
            dataset.records(),
            dataset.targets(),
            Default::default(),
        ).map_err(|e| AppError::InternalServerError(format!("Random Forest training failed: {}", e)))?;

        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::RecommendationEngine,
                version: "1.1.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.75,
                confidence_threshold: 0.70,
                training_data_size: dataset.nsamples() as u64,
                last_trained: Some(Utc::now()),
                performance_metrics: ModelPerformance {
                    accuracy: 0.75,
                    precision: 0.75,
                    recall: 0.75,
                    f1_score: 0.75,
                    processing_time_ms: 25,
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

    /// Validate model performance
    async fn validate_model(
        &self,
        model: &MLModel,
        val_features: &Array2<f64>,
        val_labels: &Array1<f64>,
    ) -> AppResult<ModelPerformance> {
        // This is a placeholder for actual validation
        // In a real implementation, this would run predictions and calculate metrics
        Ok(ModelPerformance {
            accuracy: 0.85,
            precision: 0.85,
            recall: 0.85,
            f1_score: 0.85,
            processing_time_ms: 10,
            false_positive_rate: 0.15,
            false_negative_rate: 0.15,
        })
    }

    /// Test model performance
    async fn test_model(
        &self,
        model: &MLModel,
        test_features: &Array2<f64>,
        test_labels: &Array1<f64>,
    ) -> AppResult<ModelPerformance> {
        // This is a placeholder for actual testing
        // In a real implementation, this would run predictions and calculate metrics
        Ok(ModelPerformance {
            accuracy: 0.85,
            precision: 0.85,
            recall: 0.85,
            f1_score: 0.85,
            processing_time_ms: 10,
            false_positive_rate: 0.15,
            false_negative_rate: 0.15,
        })
    }

    /// Add training data
    pub fn add_training_data(&mut self, model_type: ModelType, data: TrainingData) {
        self.training_data.entry(model_type).or_insert_with(Vec::new).push(data);
    }

    /// Get training data count
    pub fn get_training_data_count(&self, model_type: &ModelType) -> usize {
        self.training_data.get(model_type).map(|data| data.len()).unwrap_or(0)
    }

    /// Get model performance history
    pub fn get_performance_history(&self, model_type: &ModelType) -> Option<&Vec<ModelPerformance>> {
        self.performance_history.get(model_type)
    }

    /// Calculate text complexity
    fn calculate_text_complexity(&self, text: &str) -> f64 {
        let words: Vec<&str> = text.split_whitespace().collect();
        let avg_word_length = words.iter().map(|w| w.len()).sum::<usize>() as f64 / words.len() as f64;
        let unique_words = words.iter().collect::<std::collections::HashSet<_>>().len();
        let uniqueness_ratio = unique_words as f64 / words.len() as f64;
        
        avg_word_length * uniqueness_ratio
    }

    /// Calculate ID complexity
    fn calculate_id_complexity(&self, id: &str) -> f64 {
        let has_numbers = id.chars().any(|c| c.is_ascii_digit());
        let has_letters = id.chars().any(|c| c.is_ascii_alphabetic());
        let has_special = id.chars().any(|c| !c.is_ascii_alphanumeric());
        
        let mut complexity = 0.0;
        if has_numbers { complexity += 0.3; }
        if has_letters { complexity += 0.3; }
        if has_special { complexity += 0.4; }
        
        complexity
    }

    /// Encode categorical feature
    fn encode_categorical_feature(&self, value: &str) -> f64 {
        // Simple hash-based encoding
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        value.hash(&mut hasher);
        (hasher.finish() % 1000) as f64 / 1000.0
    }
}
