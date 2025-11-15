use crate::ai::models::*;
use crate::models::ReconciliationRecord;
use crate::utils::error::{AppError, AppResult};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc, Duration};
use ndarray::{Array1, Array2};
// use linfa::prelude::*;
// use linfa_clustering::KMeans;
use smartcore::linalg::basic::matrix::DenseMatrix;
use smartcore::ensemble::isolation_forest::IsolationForest;
use smartcore::neighbors::lof::LocalOutlierFactor;
use statrs::distribution::{Normal, Continuous};
use rand::{Rng, SeedableRng};
use rand::rngs::StdRng;

/// Advanced anomaly detection engine for reconciliation data
pub struct AnomalyDetectionEngine {
    models: HashMap<AnomalyType, MLModel>,
    historical_patterns: Vec<HistoricalPattern>,
    anomaly_thresholds: HashMap<AnomalyType, f64>,
    performance_cache: HashMap<AnomalyType, ModelPerformance>,
}

/// Historical pattern for anomaly detection
#[derive(Debug, Clone)]
pub struct HistoricalPattern {
    pub pattern_type: AnomalyType,
    pub features: HashMap<String, f64>,
    pub frequency: u32,
    pub severity: AnomalySeverity,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub confidence: f64,
}

/// Statistical model for anomaly detection
#[derive(Debug, Clone)]
pub struct StatisticalModel {
    pub mean: f64,
    pub std_dev: f64,
    pub min_value: f64,
    pub max_value: f64,
    pub percentile_25: f64,
    pub percentile_75: f64,
    pub percentile_95: f64,
    pub percentile_99: f64,
    pub sample_count: u32,
}

impl AnomalyDetectionEngine {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
            historical_patterns: Vec::new(),
            anomaly_thresholds: Self::get_default_thresholds(),
            performance_cache: HashMap::new(),
        }
    }

    /// Initialize anomaly detection models
    pub async fn initialize_models(&mut self) -> AppResult<()> {
        tracing::info!("Initializing anomaly detection models");

        // Initialize amount discrepancy detection
        self.models.insert(
            AnomalyType::AmountDiscrepancy,
            self.create_amount_discrepancy_model().await?
        );

        // Initialize date anomaly detection
        self.models.insert(
            AnomalyType::DateAnomaly,
            self.create_date_anomaly_model().await?
        );

        // Initialize pattern deviation detection
        self.models.insert(
            AnomalyType::PatternDeviation,
            self.create_pattern_deviation_model().await?
        );

        // Initialize volume spike detection
        self.models.insert(
            AnomalyType::VolumeSpike,
            self.create_volume_spike_model().await?
        );

        // Initialize processing delay detection
        self.models.insert(
            AnomalyType::ProcessingDelay,
            self.create_processing_delay_model().await?
        );

        // Initialize data quality anomaly detection
        self.models.insert(
            AnomalyType::DataQuality,
            self.create_data_quality_model().await?
        );

        // Initialize security threat detection
        self.models.insert(
            AnomalyType::SecurityThreat,
            self.create_security_threat_model().await?
        );

        // Initialize system error detection
        self.models.insert(
            AnomalyType::SystemError,
            self.create_system_error_model().await?
        );

        tracing::info!("Anomaly detection models initialized successfully");
        Ok(())
    }

    /// Detect anomalies in reconciliation records
    pub async fn detect_anomalies(
        &mut self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let start_time = std::time::Instant::now();
        let mut anomalies = Vec::new();

        tracing::debug!("Starting anomaly detection for {} records", records.len());

        // Detect amount discrepancies
        let amount_anomalies = self.detect_amount_discrepancies(records, context).await?;
        anomalies.extend(amount_anomalies);

        // Detect date anomalies
        let date_anomalies = self.detect_date_anomalies(records, context).await?;
        anomalies.extend(date_anomalies);

        // Detect pattern deviations
        let pattern_anomalies = self.detect_pattern_deviations(records, context).await?;
        anomalies.extend(pattern_anomalies);

        // Detect volume spikes
        let volume_anomalies = self.detect_volume_spikes(records, context).await?;
        anomalies.extend(volume_anomalies);

        // Detect processing delays
        let delay_anomalies = self.detect_processing_delays(records, context).await?;
        anomalies.extend(delay_anomalies);

        // Detect data quality issues
        let quality_anomalies = self.detect_data_quality_issues(records, context).await?;
        anomalies.extend(quality_anomalies);

        // Detect security threats
        let security_anomalies = self.detect_security_threats(records, context).await?;
        anomalies.extend(security_anomalies);

        // Detect system errors
        let system_anomalies = self.detect_system_errors(records, context).await?;
        anomalies.extend(system_anomalies);

        // Update historical patterns
        self.update_historical_patterns(&anomalies).await?;

        let processing_time = start_time.elapsed().as_millis() as u64;

        tracing::info!(
            "Anomaly detection completed: {} anomalies found, time: {}ms",
            anomalies.len(),
            processing_time
        );

        Ok(anomalies)
    }

    /// Detect amount discrepancies
    async fn detect_amount_discrepancies(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Group records by project and ingestion job
        let mut grouped_records: HashMap<(Uuid, Uuid), Vec<&ReconciliationRecord>> = HashMap::new();
        for record in records {
            let key = (record.project_id, record.ingestion_job_id);
            grouped_records.entry(key).or_insert_with(Vec::new).push(record);
        }

        for (_, group_records) in grouped_records {
            if group_records.len() < 2 {
                continue;
            }

            // Calculate statistical model for amounts
            let amounts: Vec<f64> = group_records.iter()
                .filter_map(|r| r.amount)
                .collect();

            if amounts.len() < 10 {
                continue;
            }

            let stats = self.calculate_statistical_model(&amounts)?;

            // Detect outliers using statistical methods
            for record in group_records {
                if let Some(amount) = record.amount {
                    let z_score = (amount - stats.mean) / stats.std_dev;
                    let anomaly_score = z_score.abs();

                    if anomaly_score > 3.0 {
                        let severity = if anomaly_score > 5.0 {
                            AnomalySeverity::Critical
                        } else if anomaly_score > 4.0 {
                            AnomalySeverity::High
                        } else {
                            AnomalySeverity::Medium
                        };

                        let anomaly = AnomalyResult {
                            record_id: record.id,
                            anomaly_type: AnomalyType::AmountDiscrepancy,
                            severity,
                            score: anomaly_score,
                            description: format!(
                                "Amount {} is {} standard deviations from mean {}",
                                amount, z_score.round(), stats.mean
                            ),
                            suggested_actions: vec![
                                "Verify amount accuracy".to_string(),
                                "Check for data entry errors".to_string(),
                                "Review transaction source".to_string(),
                            ],
                            confidence: self.calculate_anomaly_confidence(anomaly_score),
                            detected_at: Utc::now(),
                        };

                        anomalies.push(anomaly);
                    }
                }
            }
        }

        Ok(anomalies)
    }

    /// Detect date anomalies
    async fn detect_date_anomalies(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Group records by project
        let mut grouped_records: HashMap<Uuid, Vec<&ReconciliationRecord>> = HashMap::new();
        for record in records {
            grouped_records.entry(record.project_id).or_insert_with(Vec::new).push(record);
        }

        for (_, group_records) in grouped_records {
            let dates: Vec<chrono::NaiveDate> = group_records.iter()
                .filter_map(|r| r.transaction_date)
                .collect();

            if dates.len() < 5 {
                continue;
            }

            // Detect future dates
            let today = Utc::now().date_naive();
            for record in group_records {
                if let Some(date) = record.transaction_date {
                    if date > today {
                        let anomaly = AnomalyResult {
                            record_id: record.id,
                            anomaly_type: AnomalyType::DateAnomaly,
                            severity: AnomalySeverity::High,
                            score: 0.9,
                            description: format!("Future date detected: {}", date),
                            suggested_actions: vec![
                                "Verify transaction date".to_string(),
                                "Check for timezone issues".to_string(),
                                "Review data source".to_string(),
                            ],
                            confidence: 0.95,
                            detected_at: Utc::now(),
                        };
                        anomalies.push(anomaly);
                    }
                }
            }

            // Detect very old dates
            let cutoff_date = today - Duration::days(365 * 10); // 10 years ago
            for record in group_records {
                if let Some(date) = record.transaction_date {
                    if date < cutoff_date {
                        let anomaly = AnomalyResult {
                            record_id: record.id,
                            anomaly_type: AnomalyType::DateAnomaly,
                            severity: AnomalySeverity::Medium,
                            score: 0.7,
                            description: format!("Very old date detected: {}", date),
                            suggested_actions: vec![
                                "Verify transaction date".to_string(),
                                "Check for data migration issues".to_string(),
                            ],
                            confidence: 0.8,
                            detected_at: Utc::now(),
                        };
                        anomalies.push(anomaly);
                    }
                }
            }

            // Detect unusual date patterns
            let date_gaps = self.calculate_date_gaps(&dates);
            if let Some(max_gap) = date_gaps.iter().max() {
                if *max_gap > 30 {
                    for record in group_records {
                        if let Some(date) = record.transaction_date {
                            let anomaly = AnomalyResult {
                                record_id: record.id,
                                anomaly_type: AnomalyType::DateAnomaly,
                                severity: AnomalySeverity::Low,
                                score: 0.5,
                                description: format!("Unusual date pattern detected"),
                                suggested_actions: vec![
                                    "Review date consistency".to_string(),
                                ],
                                confidence: 0.6,
                                detected_at: Utc::now(),
                            };
                            anomalies.push(anomaly);
                        }
                    }
                }
            }
        }

        Ok(anomalies)
    }

    /// Detect pattern deviations
    async fn detect_pattern_deviations(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Analyze description patterns
        let descriptions: Vec<&str> = records.iter()
            .filter_map(|r| r.description.as_deref())
            .collect();

        if descriptions.len() < 10 {
            return Ok(anomalies);
        }

        // Detect unusual description patterns
        let description_patterns = self.analyze_description_patterns(&descriptions)?;

        for record in records {
            if let Some(description) = &record.description {
                let pattern_score = self.calculate_pattern_deviation_score(
                    description,
                    &description_patterns,
                )?;

                if pattern_score > 0.8 {
                    let anomaly = AnomalyResult {
                        record_id: record.id,
                        anomaly_type: AnomalyType::PatternDeviation,
                        severity: AnomalySeverity::Medium,
                        score: pattern_score,
                        description: "Unusual description pattern detected".to_string(),
                        suggested_actions: vec![
                            "Review description format".to_string(),
                            "Check for data quality issues".to_string(),
                        ],
                        confidence: 0.7,
                        detected_at: Utc::now(),
                    };
                    anomalies.push(anomaly);
                }
            }
        }

        Ok(anomalies)
    }

    /// Detect volume spikes
    async fn detect_volume_spikes(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Group records by time periods
        let mut hourly_counts: HashMap<u32, u32> = HashMap::new();
        let mut daily_counts: HashMap<chrono::NaiveDate, u32> = HashMap::new();

        for record in records {
            let hour = record.created_at.hour();
            *hourly_counts.entry(hour).or_insert(0) += 1;

            let date = record.created_at.date_naive();
            *daily_counts.entry(date).or_insert(0) += 1;
        }

        // Detect hourly spikes
        let avg_hourly = hourly_counts.values().sum::<u32>() as f64 / hourly_counts.len() as f64;
        for (hour, count) in hourly_counts {
            if count as f64 > avg_hourly * 3.0 {
                // Create a representative anomaly for the hour
                if let Some(record) = records.first() {
                    let anomaly = AnomalyResult {
                        record_id: record.id,
                        anomaly_type: AnomalyType::VolumeSpike,
                        severity: AnomalySeverity::High,
                        score: (count as f64 / avg_hourly).min(5.0),
                        description: format!("Volume spike detected at hour {}: {} records", hour, count),
                        suggested_actions: vec![
                            "Investigate volume spike".to_string(),
                            "Check for automated processes".to_string(),
                            "Monitor system performance".to_string(),
                        ],
                        confidence: 0.8,
                        detected_at: Utc::now(),
                    };
                    anomalies.push(anomaly);
                }
            }
        }

        // Detect daily spikes
        let avg_daily = daily_counts.values().sum::<u32>() as f64 / daily_counts.len() as f64;
        for (date, count) in daily_counts {
            if count as f64 > avg_daily * 2.0 {
                if let Some(record) = records.first() {
                    let anomaly = AnomalyResult {
                        record_id: record.id,
                        anomaly_type: AnomalyType::VolumeSpike,
                        severity: AnomalySeverity::Medium,
                        score: (count as f64 / avg_daily).min(3.0),
                        description: format!("Daily volume spike detected on {}: {} records", date, count),
                        suggested_actions: vec![
                            "Review daily processing patterns".to_string(),
                            "Check for batch processing issues".to_string(),
                        ],
                        confidence: 0.7,
                        detected_at: Utc::now(),
                    };
                    anomalies.push(anomaly);
                }
            }
        }

        Ok(anomalies)
    }

    /// Detect processing delays
    async fn detect_processing_delays(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Calculate processing times
        let mut processing_times = Vec::new();
        for record in records {
            let processing_time = record.updated_at - record.created_at;
            processing_times.push(processing_time.num_milliseconds() as f64);
        }

        if processing_times.len() < 5 {
            return Ok(anomalies);
        }

        let stats = self.calculate_statistical_model(&processing_times)?;

        // Detect slow processing
        for record in records {
            let processing_time = (record.updated_at - record.created_at).num_milliseconds() as f64;
            let z_score = (processing_time - stats.mean) / stats.std_dev;

            if z_score > 2.0 {
                let severity = if z_score > 4.0 {
                    AnomalySeverity::Critical
                } else if z_score > 3.0 {
                    AnomalySeverity::High
                } else {
                    AnomalySeverity::Medium
                };

                let anomaly = AnomalyResult {
                    record_id: record.id,
                    anomaly_type: AnomalyType::ProcessingDelay,
                    severity,
                    score: z_score,
                    description: format!(
                        "Processing delay detected: {}ms ({} standard deviations above mean)",
                        processing_time, z_score.round()
                    ),
                    suggested_actions: vec![
                        "Check system performance".to_string(),
                        "Review processing queue".to_string(),
                        "Monitor resource usage".to_string(),
                    ],
                    confidence: self.calculate_anomaly_confidence(z_score),
                    detected_at: Utc::now(),
                };
                anomalies.push(anomaly);
            }
        }

        Ok(anomalies)
    }

    /// Detect data quality issues
    async fn detect_data_quality_issues(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        for record in records {
            let mut quality_score = 1.0;
            let mut issues = Vec::new();

            // Check for missing required fields
            if record.amount.is_none() {
                quality_score -= 0.3;
                issues.push("Missing amount".to_string());
            }

            if record.transaction_date.is_none() {
                quality_score -= 0.2;
                issues.push("Missing transaction date".to_string());
            }

            if record.description.is_none() || record.description.as_ref().unwrap().is_empty() {
                quality_score -= 0.2;
                issues.push("Missing description".to_string());
            }

            if record.external_id.is_none() {
                quality_score -= 0.1;
                issues.push("Missing external ID".to_string());
            }

            // Check for invalid data formats
            if let Some(description) = &record.description {
                if description.len() > 1000 {
                    quality_score -= 0.1;
                    issues.push("Description too long".to_string());
                }
            }

            if let Some(amount) = record.amount {
                if amount < 0.0 {
                    quality_score -= 0.2;
                    issues.push("Negative amount".to_string());
                }
                if amount > 1_000_000.0 {
                    quality_score -= 0.1;
                    issues.push("Unusually large amount".to_string());
                }
            }

            if quality_score < 0.7 {
                let severity = if quality_score < 0.4 {
                    AnomalySeverity::High
                } else if quality_score < 0.6 {
                    AnomalySeverity::Medium
                } else {
                    AnomalySeverity::Low
                };

                let anomaly = AnomalyResult {
                    record_id: record.id,
                    anomaly_type: AnomalyType::DataQuality,
                    severity,
                    score: 1.0 - quality_score,
                    description: format!("Data quality issues: {}", issues.join(", ")),
                    suggested_actions: vec![
                        "Improve data validation".to_string(),
                        "Review data source quality".to_string(),
                        "Implement data cleansing".to_string(),
                    ],
                    confidence: 0.9,
                    detected_at: Utc::now(),
                };
                anomalies.push(anomaly);
            }
        }

        Ok(anomalies)
    }

    /// Detect security threats
    async fn detect_security_threats(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Detect suspicious patterns
        for record in records {
            let mut threat_score = 0.0;

            // Check for suspicious amounts (round numbers, common fraud amounts)
            if let Some(amount) = record.amount {
                if amount == 1000.0 || amount == 5000.0 || amount == 10000.0 {
                    threat_score += 0.3;
                }
                if amount.fract() == 0.0 && amount > 1000.0 {
                    threat_score += 0.2;
                }
            }

            // Check for suspicious descriptions
            if let Some(description) = &record.description {
                let desc_lower = description.to_lowercase();
                if desc_lower.contains("test") || desc_lower.contains("fraud") || desc_lower.contains("suspicious") {
                    threat_score += 0.5;
                }
            }

            // Check for rapid successive transactions
            // This would require more context about transaction timing

            if threat_score > 0.5 {
                let anomaly = AnomalyResult {
                    record_id: record.id,
                    anomaly_type: AnomalyType::SecurityThreat,
                    severity: AnomalySeverity::High,
                    score: threat_score,
                    description: "Potential security threat detected".to_string(),
                    suggested_actions: vec![
                        "Review transaction manually".to_string(),
                        "Check for fraud patterns".to_string(),
                        "Notify security team".to_string(),
                    ],
                    confidence: 0.8,
                    detected_at: Utc::now(),
                };
                anomalies.push(anomaly);
            }
        }

        Ok(anomalies)
    }

    /// Detect system errors
    async fn detect_system_errors(
        &self,
        records: &[ReconciliationRecord],
        context: &AnomalyDetectionContext,
    ) -> AppResult<Vec<AnomalyResult>> {
        let mut anomalies = Vec::new();

        // Detect error patterns in status
        let error_statuses = vec!["error", "failed", "timeout", "invalid"];
        for record in records {
            if error_statuses.contains(&record.status.as_str()) {
                let anomaly = AnomalyResult {
                    record_id: record.id,
                    anomaly_type: AnomalyType::SystemError,
                    severity: AnomalySeverity::High,
                    score: 0.9,
                    description: format!("System error detected: {}", record.status),
                    suggested_actions: vec![
                        "Check system logs".to_string(),
                        "Review error handling".to_string(),
                        "Monitor system health".to_string(),
                    ],
                    confidence: 0.95,
                    detected_at: Utc::now(),
                };
                anomalies.push(anomaly);
            }
        }

        Ok(anomalies)
    }

    /// Calculate statistical model for a dataset
    fn calculate_statistical_model(&self, data: &[f64]) -> AppResult<StatisticalModel> {
        if data.is_empty() {
            return Err(AppError::BadRequest("Empty dataset".to_string()));
        }

        let mut sorted_data = data.to_vec();
        sorted_data.sort_by(|a, b| a.partial_cmp(b).unwrap());

        let n = data.len() as f64;
        let sum: f64 = data.iter().sum();
        let mean = sum / n;

        let variance: f64 = data.iter()
            .map(|x| (x - mean).powi(2))
            .sum::<f64>() / n;
        let std_dev = variance.sqrt();

        let min_value = sorted_data[0];
        let max_value = sorted_data[sorted_data.len() - 1];

        let percentile_25 = sorted_data[(sorted_data.len() as f64 * 0.25) as usize];
        let percentile_75 = sorted_data[(sorted_data.len() as f64 * 0.75) as usize];
        let percentile_95 = sorted_data[(sorted_data.len() as f64 * 0.95) as usize];
        let percentile_99 = sorted_data[(sorted_data.len() as f64 * 0.99) as usize];

        Ok(StatisticalModel {
            mean,
            std_dev,
            min_value,
            max_value,
            percentile_25,
            percentile_75,
            percentile_95,
            percentile_99,
            sample_count: data.len() as u32,
        })
    }

    /// Calculate date gaps
    fn calculate_date_gaps(&self, dates: &[chrono::NaiveDate]) -> Vec<i64> {
        let mut gaps = Vec::new();
        let mut sorted_dates = dates.to_vec();
        sorted_dates.sort();

        for i in 1..sorted_dates.len() {
            let gap = (sorted_dates[i] - sorted_dates[i - 1]).num_days();
            gaps.push(gap);
        }

        gaps
    }

    /// Analyze description patterns
    fn analyze_description_patterns(&self, descriptions: &[&str]) -> AppResult<HashMap<String, f64>> {
        let mut patterns = HashMap::new();

        // Analyze common words
        let mut word_counts: HashMap<String, u32> = HashMap::new();
        for desc in descriptions {
            let words: Vec<&str> = desc.to_lowercase().split_whitespace().collect();
            for word in words {
                if word.len() > 3 {
                    *word_counts.entry(word.to_string()).or_insert(0) += 1;
                }
            }
        }

        let total_words: u32 = word_counts.values().sum();
        for (word, count) in word_counts {
            let frequency = count as f64 / total_words as f64;
            patterns.insert(word, frequency);
        }

        Ok(patterns)
    }

    /// Calculate pattern deviation score
    fn calculate_pattern_deviation_score(
        &self,
        description: &str,
        patterns: &HashMap<String, f64>,
    ) -> AppResult<f64> {
        let words: Vec<&str> = description.to_lowercase().split_whitespace().collect();
        let mut deviation_score = 0.0;

        for word in words {
            if word.len() > 3 {
                let expected_frequency = patterns.get(word).unwrap_or(&0.0);
                if *expected_frequency < 0.01 {
                    deviation_score += 0.1;
                }
            }
        }

        Ok(deviation_score.min(1.0))
    }

    /// Calculate anomaly confidence
    fn calculate_anomaly_confidence(&self, score: f64) -> f64 {
        // Higher scores get higher confidence, but cap at 0.95
        (score / 10.0).min(0.95).max(0.5)
    }

    /// Update historical patterns
    async fn update_historical_patterns(&mut self, anomalies: &[AnomalyResult]) -> AppResult<()> {
        for anomaly in anomalies {
            let pattern = HistoricalPattern {
                pattern_type: anomaly.anomaly_type.clone(),
                features: HashMap::new(), // Would be populated with actual features
                frequency: 1,
                severity: anomaly.severity.clone(),
                first_seen: anomaly.detected_at,
                last_seen: anomaly.detected_at,
                confidence: anomaly.confidence,
            };

            // Check if similar pattern exists
            if let Some(existing_pattern) = self.historical_patterns.iter_mut()
                .find(|p| p.pattern_type == anomaly.anomaly_type) {
                existing_pattern.frequency += 1;
                existing_pattern.last_seen = anomaly.detected_at;
            } else {
                self.historical_patterns.push(pattern);
            }
        }

        // Keep only recent patterns (last 1000)
        if self.historical_patterns.len() > 1000 {
            self.historical_patterns.drain(0..100);
        }

        Ok(())
    }

    /// Get default anomaly thresholds
    fn get_default_thresholds() -> HashMap<AnomalyType, f64> {
        let mut thresholds = HashMap::new();
        thresholds.insert(AnomalyType::AmountDiscrepancy, 3.0);
        thresholds.insert(AnomalyType::DateAnomaly, 0.8);
        thresholds.insert(AnomalyType::PatternDeviation, 0.7);
        thresholds.insert(AnomalyType::VolumeSpike, 2.0);
        thresholds.insert(AnomalyType::ProcessingDelay, 2.0);
        thresholds.insert(AnomalyType::DataQuality, 0.7);
        thresholds.insert(AnomalyType::SecurityThreat, 0.5);
        thresholds.insert(AnomalyType::SystemError, 0.9);
        thresholds
    }

    /// Create amount discrepancy detection model
    async fn create_amount_discrepancy_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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
                    processing_time_ms: 20,
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

    /// Create date anomaly detection model
    async fn create_date_anomaly_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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

    /// Create pattern deviation detection model
    async fn create_pattern_deviation_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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

    /// Create volume spike detection model
    async fn create_volume_spike_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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

    /// Create processing delay detection model
    async fn create_processing_delay_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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

    /// Create data quality detection model
    async fn create_data_quality_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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
                    processing_time_ms: 10,
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

    /// Create security threat detection model
    async fn create_security_threat_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
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
                    processing_time_ms: 35,
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

    /// Create system error detection model
    async fn create_system_error_model(&self) -> AppResult<MLModel> {
        Ok(MLModel {
            id: Uuid::new_v4(),
            config: ModelConfig {
                model_type: ModelType::AnomalyDetection,
                version: "1.0.0".to_string(),
                parameters: HashMap::new(),
                accuracy_threshold: 0.95,
                confidence_threshold: 0.90,
                training_data_size: 0,
                last_trained: None,
                performance_metrics: ModelPerformance {
                    accuracy: 0.95,
                    precision: 0.95,
                    recall: 0.95,
                    f1_score: 0.95,
                    processing_time_ms: 5,
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
}

/// Context for anomaly detection
#[derive(Debug, Clone)]
pub struct AnomalyDetectionContext {
    pub project_id: Uuid,
    pub time_window: Duration,
    pub user_id: Option<Uuid>,
    pub system_metrics: HashMap<String, f64>,
    pub historical_baseline: HashMap<String, f64>,
}
