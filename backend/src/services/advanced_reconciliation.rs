// backend/src/services/advanced_reconciliation.rs
use crate::errors::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tokio::sync::RwLock;
use std::f64;

/// Reconciliation record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationRecord {
    pub id: Uuid,
    pub source_id: String,
    pub fields: HashMap<String, serde_json::Value>,
    pub metadata: HashMap<String, serde_json::Value>,
}

/// Matching result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MatchingResult {
    pub source_record: ReconciliationRecord,
    pub target_record: ReconciliationRecord,
    pub confidence_score: f64,
    pub match_type: MatchType,
    pub matching_fields: Vec<String>,
    pub differences: Vec<FieldDifference>,
}

/// Match types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MatchType {
    Exact,
    Fuzzy,
    Probabilistic,
    MachineLearning,
}

/// Field difference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldDifference {
    pub field_name: String,
    pub source_value: serde_json::Value,
    pub target_value: serde_json::Value,
    pub difference_type: DifferenceType,
    pub similarity_score: f64,
}

/// Difference types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DifferenceType {
    Exact,
    Similar,
    Different,
    Missing,
}

/// Fuzzy matching algorithm
#[derive(Debug, Clone)]
pub struct FuzzyMatchingAlgorithm {
    pub threshold: f64,
    pub algorithm_type: FuzzyAlgorithmType,
}

/// Fuzzy algorithm types
#[derive(Debug, Clone)]
pub enum FuzzyAlgorithmType {
    Levenshtein,
    JaroWinkler,
    Jaccard,
    Cosine,
    Soundex,
    Metaphone,
}

impl FuzzyMatchingAlgorithm {
    pub fn new(threshold: f64, algorithm_type: FuzzyAlgorithmType) -> Self {
        Self {
            threshold,
            algorithm_type,
        }
    }

    /// Calculate similarity between two strings
    pub fn calculate_similarity(&self, str1: &str, str2: &str) -> f64 {
        match self.algorithm_type {
            FuzzyAlgorithmType::Levenshtein => self.levenshtein_similarity(str1, str2),
            FuzzyAlgorithmType::JaroWinkler => self.jaro_winkler_similarity(str1, str2),
            FuzzyAlgorithmType::Jaccard => self.jaccard_similarity(str1, str2),
            FuzzyAlgorithmType::Cosine => self.cosine_similarity(str1, str2),
            FuzzyAlgorithmType::Soundex => self.soundex_similarity(str1, str2),
            FuzzyAlgorithmType::Metaphone => self.metaphone_similarity(str1, str2),
        }
    }

    /// Levenshtein distance similarity
    fn levenshtein_similarity(&self, str1: &str, str2: &str) -> f64 {
        let distance = self.levenshtein_distance(str1, str2);
        let max_len = std::cmp::max(str1.len(), str2.len()) as f64;
        if max_len == 0.0 {
            1.0
        } else {
            1.0 - (distance as f64 / max_len)
        }
    }

    /// Calculate Levenshtein distance
    fn levenshtein_distance(&self, str1: &str, str2: &str) -> usize {
        let len1 = str1.len();
        let len2 = str2.len();
        
        if len1 == 0 {
            return len2;
        }
        if len2 == 0 {
            return len1;
        }

        let mut matrix = vec![vec![0; len2 + 1]; len1 + 1];

        for i in 0..=len1 {
            matrix[i][0] = i;
        }
        for j in 0..=len2 {
            matrix[0][j] = j;
        }

        for i in 1..=len1 {
            for j in 1..=len2 {
                let cost = if str1.chars().nth(i - 1) == str2.chars().nth(j - 1) { 0 } else { 1 };
                matrix[i][j] = std::cmp::min(
                    std::cmp::min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1),
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        matrix[len1][len2]
    }

    /// Jaro-Winkler similarity
    fn jaro_winkler_similarity(&self, str1: &str, str2: &str) -> f64 {
        let jaro = self.jaro_similarity(str1, str2);
        let prefix_length = self.common_prefix_length(str1, str2, 4);
        jaro + (0.1 * prefix_length as f64 * (1.0 - jaro))
    }

    /// Jaro similarity
    fn jaro_similarity(&self, str1: &str, str2: &str) -> f64 {
        let len1 = str1.len();
        let len2 = str2.len();
        
        if len1 == 0 && len2 == 0 {
            return 1.0;
        }
        if len1 == 0 || len2 == 0 {
            return 0.0;
        }

        let match_window = std::cmp::max(len1, len2) / 2 - 1;
        let mut str1_matches = vec![false; len1];
        let mut str2_matches = vec![false; len2];

        let mut matches = 0;
        let mut transpositions = 0;

        // Find matches
        for i in 0..len1 {
            let start = if i >= match_window { i - match_window } else { 0 };
            let end = std::cmp::min(i + match_window + 1, len2);

            for j in start..end {
                if str2_matches[j] || str1.chars().nth(i) != str2.chars().nth(j) {
                    continue;
                }
                str1_matches[i] = true;
                str2_matches[j] = true;
                matches += 1;
                break;
            }
        }

        if matches == 0 {
            return 0.0;
        }

        // Count transpositions
        let mut k = 0;
        for i in 0..len1 {
            if !str1_matches[i] {
                continue;
            }
            while !str2_matches[k] {
                k += 1;
            }
            if str1.chars().nth(i) != str2.chars().nth(k) {
                transpositions += 1;
            }
            k += 1;
        }

        (matches as f64 / len1 as f64 + matches as f64 / len2 as f64 + (matches as f64 - transpositions as f64 / 2.0) / matches as f64) / 3.0
    }

    /// Common prefix length
    fn common_prefix_length(&self, str1: &str, str2: &str, max_length: usize) -> usize {
        let mut length = 0;
        let min_len = std::cmp::min(std::cmp::min(str1.len(), str2.len()), max_length);
        
        for i in 0..min_len {
            if str1.chars().nth(i) == str2.chars().nth(i) {
                length += 1;
            } else {
                break;
            }
        }
        
        length
    }

    /// Jaccard similarity
    fn jaccard_similarity(&self, str1: &str, str2: &str) -> f64 {
        let set1: std::collections::HashSet<char> = str1.chars().collect();
        let set2: std::collections::HashSet<char> = str2.chars().collect();
        
        let intersection = set1.intersection(&set2).count();
        let union = set1.union(&set2).count();
        
        if union == 0 {
            1.0
        } else {
            intersection as f64 / union as f64
        }
    }

    /// Cosine similarity
    fn cosine_similarity(&self, str1: &str, str2: &str) -> f64 {
        let words1: Vec<&str> = str1.split_whitespace().collect();
        let words2: Vec<&str> = str2.split_whitespace().collect();
        
        let mut word_counts1 = HashMap::new();
        let mut word_counts2 = HashMap::new();
        
        for word in words1 {
            *word_counts1.entry(word).or_insert(0) += 1;
        }
        
        for word in words2 {
            *word_counts2.entry(word).or_insert(0) += 1;
        }
        
        let all_words: std::collections::HashSet<&str> = word_counts1.keys().chain(word_counts2.keys()).cloned().collect();
        
        let mut dot_product = 0;
        let mut norm1 = 0;
        let mut norm2 = 0;
        
        for word in all_words {
            let count1 = word_counts1.get(word).unwrap_or(&0);
            let count2 = word_counts2.get(word).unwrap_or(&0);
            
            dot_product += count1 * count2;
            norm1 += count1 * count1;
            norm2 += count2 * count2;
        }
        
        if norm1 == 0 || norm2 == 0 {
            0.0
        } else {
            dot_product as f64 / ((norm1 as f64).sqrt() * (norm2 as f64).sqrt())
        }
    }

    /// Soundex similarity
    fn soundex_similarity(&self, str1: &str, str2: &str) -> f64 {
        let soundex1 = self.soundex(str1);
        let soundex2 = self.soundex(str2);
        
        if soundex1 == soundex2 {
            1.0
        } else {
            0.0
        }
    }

    /// Soundex algorithm
    fn soundex(&self, input: &str) -> String {
        let mut result = String::new();
        let chars: Vec<char> = input.to_uppercase().chars().collect();
        
        if chars.is_empty() {
            return result;
        }
        
        result.push(chars[0]);
        
        let mut prev_code = self.soundex_code(chars[0]);
        
        for &ch in chars.iter().skip(1) {
            let code = self.soundex_code(ch);
            if code != '0' && code != prev_code {
                result.push(code);
                prev_code = code;
            }
        }
        
        result.truncate(4);
        result
    }

    /// Soundex code for character
    fn soundex_code(&self, ch: char) -> char {
        match ch {
            'B' | 'F' | 'P' | 'V' => '1',
            'C' | 'G' | 'J' | 'K' | 'Q' | 'S' | 'X' | 'Z' => '2',
            'D' | 'T' => '3',
            'L' => '4',
            'M' | 'N' => '5',
            'R' => '6',
            _ => '0',
        }
    }

    /// Metaphone similarity
    fn metaphone_similarity(&self, str1: &str, str2: &str) -> f64 {
        let metaphone1 = self.metaphone(str1);
        let metaphone2 = self.metaphone(str2);
        
        if metaphone1 == metaphone2 {
            1.0
        } else {
            0.0
        }
    }

    /// Metaphone algorithm (simplified)
    fn metaphone(&self, input: &str) -> String {
        let mut result = String::new();
        let chars: Vec<char> = input.to_uppercase().chars().collect();
        
        let mut i = 0;
        while i < chars.len() && result.len() < 4 {
            let ch = chars[i];
            
            match ch {
                'A' | 'E' | 'I' | 'O' | 'U' => {
                    if i == 0 {
                        result.push(ch);
                    }
                }
                'B' => {
                    if i == chars.len() - 1 || chars[i + 1] != 'B' {
                        result.push('B');
                    }
                }
                'C' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'H' {
                        result.push('X');
                        i += 1;
                    } else if i + 1 < chars.len() && chars[i + 1] == 'I' && i + 2 < chars.len() && chars[i + 2] == 'A' {
                        result.push('X');
                        i += 2;
                    } else if i + 1 < chars.len() && (chars[i + 1] == 'E' || chars[i + 1] == 'I' || chars[i + 1] == 'Y') {
                        result.push('S');
                    } else {
                        result.push('K');
                    }
                }
                'D' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'G' && i + 2 < chars.len() && (chars[i + 2] == 'E' || chars[i + 2] == 'I' || chars[i + 2] == 'Y') {
                        result.push('J');
                        i += 1;
                    } else {
                        result.push('T');
                    }
                }
                'F' => result.push('F'),
                'G' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'H' && i + 2 < chars.len() && !self.is_vowel(chars[i + 2]) {
                        result.push('F');
                        i += 1;
                    } else if i + 1 < chars.len() && (chars[i + 1] == 'E' || chars[i + 1] == 'I' || chars[i + 1] == 'Y') {
                        result.push('J');
                    } else {
                        result.push('K');
                    }
                }
                'H' => {
                    if i > 0 && !self.is_vowel(chars[i - 1]) {
                        // Silent H
                    } else if i + 1 < chars.len() && !self.is_vowel(chars[i + 1]) {
                        // Silent H
                    } else {
                        result.push('H');
                    }
                }
                'J' => result.push('J'),
                'K' => {
                    if i == 0 || chars[i - 1] != 'C' {
                        result.push('K');
                    }
                }
                'L' => result.push('L'),
                'M' => result.push('M'),
                'N' => result.push('N'),
                'P' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'H' {
                        result.push('F');
                        i += 1;
                    } else {
                        result.push('P');
                    }
                }
                'Q' => result.push('K'),
                'R' => result.push('R'),
                'S' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'H' {
                        result.push('X');
                        i += 1;
                    } else if i + 1 < chars.len() && chars[i + 1] == 'I' && i + 2 < chars.len() && (chars[i + 2] == 'A' || chars[i + 2] == 'O') {
                        result.push('X');
                        i += 2;
                    } else {
                        result.push('S');
                    }
                }
                'T' => {
                    if i + 1 < chars.len() && chars[i + 1] == 'H' {
                        result.push('0'); // TH sound
                        i += 1;
                    } else if i + 1 < chars.len() && chars[i + 1] == 'I' && i + 2 < chars.len() && (chars[i + 2] == 'A' || chars[i + 2] == 'O') {
                        result.push('X');
                        i += 2;
                    } else {
                        result.push('T');
                    }
                }
                'V' => result.push('F'),
                'W' => {
                    if i == 0 || !self.is_vowel(chars[i - 1]) {
                        result.push('W');
                    }
                }
                'X' => {
                    if i == 0 {
                        result.push('S');
                    } else {
                        result.push('K');
                        result.push('S');
                    }
                }
                'Y' => {
                    if i == 0 || self.is_vowel(chars[i - 1]) {
                        result.push('Y');
                    }
                }
                'Z' => result.push('S'),
                _ => {}
            }
            
            i += 1;
        }
        
        result.truncate(4);
        result
    }

    /// Check if character is vowel
    fn is_vowel(&self, ch: char) -> bool {
        matches!(ch, 'A' | 'E' | 'I' | 'O' | 'U')
    }
}

/// Machine learning model for reconciliation
#[derive(Debug, Clone)]
pub struct MLReconciliationModel {
    pub model_type: MLModelType,
    pub features: Vec<String>,
    pub weights: HashMap<String, f64>,
    pub threshold: f64,
}

/// ML model types
#[derive(Debug, Clone)]
pub enum MLModelType {
    LogisticRegression,
    RandomForest,
    NeuralNetwork,
    SupportVectorMachine,
}

impl MLReconciliationModel {
    pub fn new(model_type: MLModelType, features: Vec<String>, threshold: f64) -> Self {
        Self {
            model_type,
            features,
            weights: HashMap::new(),
            threshold,
        }
    }

    /// Train the model
    pub async fn train(&mut self, training_data: Vec<TrainingExample>) -> AppResult<()> {
        match self.model_type {
            MLModelType::LogisticRegression => self.train_logistic_regression(training_data).await,
            MLModelType::RandomForest => self.train_random_forest(training_data).await,
            MLModelType::NeuralNetwork => self.train_neural_network(training_data).await,
            MLModelType::SupportVectorMachine => self.train_svm(training_data).await,
        }
    }

    /// Train logistic regression model
    async fn train_logistic_regression(&mut self, training_data: Vec<TrainingExample>) -> AppResult<()> {
        // Simplified logistic regression training
        // In a real implementation, this would use proper ML libraries
        
        for feature in &self.features {
            self.weights.insert(feature.clone(), 0.5); // Initialize with random weights
        }
        
        // Simulate training process
        for _epoch in 0..100 {
            for example in &training_data {
                let prediction = self.predict_logistic_regression(&example.features);
                let error = example.label - prediction;
                
                // Update weights (simplified gradient descent)
                for (feature, weight) in self.weights.iter_mut() {
                    if let Some(value) = example.features.get(feature) {
                        *weight += 0.01 * error * value;
                    }
                }
            }
        }
        
        Ok(())
    }

    /// Train random forest model
    async fn train_random_forest(&mut self, _training_data: Vec<TrainingExample>) -> AppResult<()> {
        // Simplified random forest training
        // In a real implementation, this would use proper ML libraries
        Ok(())
    }

    /// Train neural network model
    async fn train_neural_network(&mut self, _training_data: Vec<TrainingExample>) -> AppResult<()> {
        // Simplified neural network training
        // In a real implementation, this would use proper ML libraries
        Ok(())
    }

    /// Train SVM model
    async fn train_svm(&mut self, _training_data: Vec<TrainingExample>) -> AppResult<()> {
        // Simplified SVM training
        // In a real implementation, this would use proper ML libraries
        Ok(())
    }

    /// Predict using logistic regression
    fn predict_logistic_regression(&self, features: &HashMap<String, f64>) -> f64 {
        let mut sum = 0.0;
        for (feature, weight) in &self.weights {
            if let Some(value) = features.get(feature) {
                sum += weight * value;
            }
        }
        
        // Sigmoid function
        1.0 / (1.0 + (-sum).exp())
    }

    /// Predict match probability
    pub fn predict(&self, features: HashMap<String, f64>) -> f64 {
        match self.model_type {
            MLModelType::LogisticRegression => self.predict_logistic_regression(&features),
            MLModelType::RandomForest => 0.8, // Simplified
            MLModelType::NeuralNetwork => 0.85, // Simplified
            MLModelType::SupportVectorMachine => 0.75, // Simplified
        }
    }
}

/// Training example
#[derive(Debug, Clone)]
pub struct TrainingExample {
    pub features: HashMap<String, f64>,
    pub label: f64, // 1.0 for match, 0.0 for no match
}

/// Advanced reconciliation service
pub struct AdvancedReconciliationService {
    fuzzy_algorithms: Arc<RwLock<HashMap<String, FuzzyMatchingAlgorithm>>>,
    ml_models: Arc<RwLock<HashMap<String, MLReconciliationModel>>>,
    reconciliation_stats: Arc<RwLock<ReconciliationStats>>,
}

/// Reconciliation statistics
#[derive(Debug, Clone, Default)]
pub struct ReconciliationStats {
    pub total_reconciliations: u64,
    pub successful_reconciliations: u64,
    pub failed_reconciliations: u64,
    pub average_confidence_score: f64,
    pub match_type_counts: HashMap<MatchType, u64>,
}

impl AdvancedReconciliationService {
    pub fn new() -> Self {
        let mut service = Self {
            fuzzy_algorithms: Arc::new(RwLock::new(HashMap::new())),
            ml_models: Arc::new(RwLock::new(HashMap::new())),
            reconciliation_stats: Arc::new(RwLock::new(ReconciliationStats::default())),
        };
        
        // Initialize default algorithms
        service.initialize_default_algorithms();
        service
    }

    /// Initialize default fuzzy matching algorithms
    fn initialize_default_algorithms(&mut self) {
        let algorithms = vec![
            ("levenshtein", FuzzyMatchingAlgorithm::new(0.8, FuzzyAlgorithmType::Levenshtein)),
            ("jaro_winkler", FuzzyMatchingAlgorithm::new(0.9, FuzzyAlgorithmType::JaroWinkler)),
            ("jaccard", FuzzyMatchingAlgorithm::new(0.7, FuzzyAlgorithmType::Jaccard)),
            ("cosine", FuzzyMatchingAlgorithm::new(0.8, FuzzyAlgorithmType::Cosine)),
            ("soundex", FuzzyMatchingAlgorithm::new(1.0, FuzzyAlgorithmType::Soundex)),
            ("metaphone", FuzzyMatchingAlgorithm::new(1.0, FuzzyAlgorithmType::Metaphone)),
        ];

        for (name, algorithm) in algorithms {
            self.fuzzy_algorithms.write().unwrap().insert(name.to_string(), algorithm);
        }
    }

    /// Add fuzzy matching algorithm
    pub async fn add_fuzzy_algorithm(&self, name: String, algorithm: FuzzyMatchingAlgorithm) -> AppResult<()> {
        self.fuzzy_algorithms.write().await.insert(name, algorithm);
        Ok(())
    }

    /// Add ML model
    pub async fn add_ml_model(&self, name: String, model: MLReconciliationModel) -> AppResult<()> {
        self.ml_models.write().await.insert(name, model);
        Ok(())
    }

    /// Perform advanced reconciliation
    pub async fn reconcile_records(&self, source_records: Vec<ReconciliationRecord>, target_records: Vec<ReconciliationRecord>, config: ReconciliationConfig) -> AppResult<Vec<MatchingResult>> {
        let mut results = Vec::new();
        
        for source_record in source_records {
            let mut best_match: Option<MatchingResult> = None;
            let mut best_confidence = 0.0;
            
            for target_record in &target_records {
                let matching_result = self.match_records(&source_record, target_record, &config).await?;
                
                if matching_result.confidence_score > best_confidence && matching_result.confidence_score >= config.min_confidence_threshold {
                    best_confidence = matching_result.confidence_score;
                    best_match = Some(matching_result);
                }
            }
            
            if let Some(match_result) = best_match {
                results.push(match_result);
            }
        }
        
        // Update statistics
        self.update_reconciliation_stats(&results).await;
        
        Ok(results)
    }

    /// Match two records
    async fn match_records(&self, source_record: &ReconciliationRecord, target_record: &ReconciliationRecord, config: &ReconciliationConfig) -> AppResult<MatchingResult> {
        let mut matching_fields = Vec::new();
        let mut differences = Vec::new();
        let mut confidence_scores = Vec::new();
        
        // Compare each field
        for field_name in &config.matching_fields {
            let source_value = source_record.fields.get(field_name);
            let target_value = target_record.fields.get(field_name);
            
            match (source_value, target_value) {
                (Some(sv), Some(tv)) => {
                    let similarity = self.calculate_field_similarity(sv, tv, field_name, &config).await?;
                    
                    if similarity >= config.field_thresholds.get(field_name).unwrap_or(&0.8) {
                        matching_fields.push(field_name.clone());
                        confidence_scores.push(similarity);
                    }
                    
                    differences.push(FieldDifference {
                        field_name: field_name.clone(),
                        source_value: sv.clone(),
                        target_value: tv.clone(),
                        difference_type: if similarity >= 0.9 { DifferenceType::Exact } else if similarity >= 0.7 { DifferenceType::Similar } else { DifferenceType::Different },
                        similarity_score: similarity,
                    });
                }
                (Some(sv), None) => {
                    differences.push(FieldDifference {
                        field_name: field_name.clone(),
                        source_value: sv.clone(),
                        target_value: serde_json::Value::Null,
                        difference_type: DifferenceType::Missing,
                        similarity_score: 0.0,
                    });
                }
                (None, Some(tv)) => {
                    differences.push(FieldDifference {
                        field_name: field_name.clone(),
                        source_value: serde_json::Value::Null,
                        target_value: tv.clone(),
                        difference_type: DifferenceType::Missing,
                        similarity_score: 0.0,
                    });
                }
                (None, None) => {
                    // Both missing, consider as match
                    matching_fields.push(field_name.clone());
                    confidence_scores.push(1.0);
                }
            }
        }
        
        // Calculate overall confidence score
        let overall_confidence = if confidence_scores.is_empty() {
            0.0
        } else {
            confidence_scores.iter().sum::<f64>() / confidence_scores.len() as f64
        };
        
        // Determine match type
        let match_type = if overall_confidence >= 0.95 {
            MatchType::Exact
        } else if overall_confidence >= 0.8 {
            MatchType::Fuzzy
        } else if overall_confidence >= 0.6 {
            MatchType::Probabilistic
        } else {
            MatchType::MachineLearning
        };
        
        Ok(MatchingResult {
            source_record: source_record.clone(),
            target_record: target_record.clone(),
            confidence_score: overall_confidence,
            match_type,
            matching_fields,
            differences,
        })
    }

    /// Calculate field similarity
    async fn calculate_field_similarity(&self, value1: &serde_json::Value, value2: &serde_json::Value, field_name: &str, config: &ReconciliationConfig) -> AppResult<f64> {
        match (value1, value2) {
            (serde_json::Value::String(s1), serde_json::Value::String(s2)) => {
                if s1 == s2 {
                    Ok(1.0)
                } else {
                    // Use fuzzy matching for strings
                    let algorithm_name = config.fuzzy_algorithm.get(field_name).unwrap_or(&"levenshtein".to_string());
                    let algorithms = self.fuzzy_algorithms.read().await;
                    if let Some(algorithm) = algorithms.get(algorithm_name) {
                        Ok(algorithm.calculate_similarity(s1, s2))
                    } else {
                        Ok(0.0)
                    }
                }
            }
            (serde_json::Value::Number(n1), serde_json::Value::Number(n2)) => {
                let num1 = n1.as_f64().unwrap_or(0.0);
                let num2 = n2.as_f64().unwrap_or(0.0);
                
                if num1 == num2 {
                    Ok(1.0)
                } else {
                    // Calculate numeric similarity
                    let diff = (num1 - num2).abs();
                    let max_val = num1.abs().max(num2.abs());
                    if max_val == 0.0 {
                        Ok(1.0)
                    } else {
                        Ok(1.0 - (diff / max_val))
                    }
                }
            }
            (serde_json::Value::Bool(b1), serde_json::Value::Bool(b2)) => {
                Ok(if b1 == b2 { 1.0 } else { 0.0 })
            }
            _ => Ok(0.0),
        }
    }

    /// Update reconciliation statistics
    async fn update_reconciliation_stats(&self, results: &[MatchingResult]) {
        let mut stats = self.reconciliation_stats.write().await;
        stats.total_reconciliations += 1;
        
        if !results.is_empty() {
            stats.successful_reconciliations += 1;
            
            let total_confidence: f64 = results.iter().map(|r| r.confidence_score).sum();
            let avg_confidence = total_confidence / results.len() as f64;
            
            stats.average_confidence_score = (stats.average_confidence_score * (stats.successful_reconciliations - 1) as f64 + avg_confidence) / stats.successful_reconciliations as f64;
            
            for result in results {
                *stats.match_type_counts.entry(result.match_type.clone()).or_insert(0) += 1;
            }
        } else {
            stats.failed_reconciliations += 1;
        }
    }

    /// Get reconciliation statistics
    pub async fn get_reconciliation_stats(&self) -> AppResult<ReconciliationStats> {
        let stats = self.reconciliation_stats.read().await.clone();
        Ok(stats)
    }

    /// Train ML model
    pub async fn train_ml_model(&self, model_name: &str, training_data: Vec<TrainingExample>) -> AppResult<()> {
        let mut models = self.ml_models.write().await;
        if let Some(model) = models.get_mut(model_name) {
            model.train(training_data).await?;
        } else {
            return Err(AppError::Validation(format!("ML model '{}' not found", model_name)));
        }
        Ok(())
    }

    /// Get fuzzy algorithm
    pub async fn get_fuzzy_algorithm(&self, name: &str) -> AppResult<Option<FuzzyMatchingAlgorithm>> {
        let algorithms = self.fuzzy_algorithms.read().await;
        Ok(algorithms.get(name).cloned())
    }

    /// Get ML model
    pub async fn get_ml_model(&self, name: &str) -> AppResult<Option<MLReconciliationModel>> {
        let models = self.ml_models.read().await;
        Ok(models.get(name).cloned())
    }
}

/// Reconciliation configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReconciliationConfig {
    pub matching_fields: Vec<String>,
    pub field_thresholds: HashMap<String, f64>,
    pub min_confidence_threshold: f64,
    pub fuzzy_algorithm: HashMap<String, String>,
    pub ml_model_name: Option<String>,
    pub max_matches_per_record: usize,
}

impl Default for AdvancedReconciliationService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_fuzzy_matching() {
        let algorithm = FuzzyMatchingAlgorithm::new(0.8, FuzzyAlgorithmType::Levenshtein);
        
        // Test exact match
        let similarity = algorithm.calculate_similarity("hello", "hello");
        assert_eq!(similarity, 1.0);
        
        // Test similar strings
        let similarity = algorithm.calculate_similarity("hello", "helo");
        assert!(similarity > 0.8);
        
        // Test different strings
        let similarity = algorithm.calculate_similarity("hello", "world");
        assert!(similarity < 0.5);
    }

    #[tokio::test]
    async fn test_reconciliation_service() {
        let service = AdvancedReconciliationService::new();
        
        // Create test records
        let source_record = ReconciliationRecord {
            id: Uuid::new_v4(),
            source_id: "1".to_string(),
            fields: {
                let mut fields = HashMap::new();
                fields.insert("name".to_string(), serde_json::Value::String("John Doe".to_string()));
                fields.insert("amount".to_string(), serde_json::Value::Number(100.0.into()));
                fields
            },
            metadata: HashMap::new(),
        };
        
        let target_record = ReconciliationRecord {
            id: Uuid::new_v4(),
            source_id: "2".to_string(),
            fields: {
                let mut fields = HashMap::new();
                fields.insert("name".to_string(), serde_json::Value::String("John D".to_string()));
                fields.insert("amount".to_string(), serde_json::Value::Number(100.0.into()));
                fields
            },
            metadata: HashMap::new(),
        };
        
        // Configure reconciliation
        let config = ReconciliationConfig {
            matching_fields: vec!["name".to_string(), "amount".to_string()],
            field_thresholds: {
                let mut thresholds = HashMap::new();
                thresholds.insert("name".to_string(), 0.8);
                thresholds.insert("amount".to_string(), 0.9);
                thresholds
            },
            min_confidence_threshold: 0.7,
            fuzzy_algorithm: {
                let mut algorithms = HashMap::new();
                algorithms.insert("name".to_string(), "levenshtein".to_string());
                algorithms
            },
            ml_model_name: None,
            max_matches_per_record: 1,
        };
        
        // Perform reconciliation
        let results = service.reconcile_records(vec![source_record], vec![target_record], config).await.unwrap();
        
        assert!(!results.is_empty());
        assert!(results[0].confidence_score > 0.7);
    }

    #[tokio::test]
    async fn test_ml_model() {
        let mut model = MLReconciliationModel::new(
            MLModelType::LogisticRegression,
            vec!["field1".to_string(), "field2".to_string()],
            0.8
        );
        
        // Create training data
        let training_data = vec![
            TrainingExample {
                features: {
                    let mut features = HashMap::new();
                    features.insert("field1".to_string(), 1.0);
                    features.insert("field2".to_string(), 0.5);
                    features
                },
                label: 1.0,
            },
            TrainingExample {
                features: {
                    let mut features = HashMap::new();
                    features.insert("field1".to_string(), 0.0);
                    features.insert("field2".to_string(), 0.0);
                    features
                },
                label: 0.0,
            },
        ];
        
        // Train model
        model.train(training_data).await.unwrap();
        
        // Test prediction
        let features = {
            let mut features = HashMap::new();
            features.insert("field1".to_string(), 1.0);
            features.insert("field2".to_string(), 0.5);
            features
        };
        
        let prediction = model.predict(features);
        assert!(prediction > 0.0 && prediction < 1.0);
    }
}
