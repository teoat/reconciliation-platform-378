//! Matching algorithms for reconciliation
//! 
//! This module contains all matching algorithm implementations including
//! exact matching, fuzzy matching, and contains matching.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::MatchType;
use super::types::{ReconciliationRecord, MatchingResult, FieldDifference, DifferenceType, FuzzyAlgorithmType};

/// Trait for matching algorithms
pub trait MatchingAlgorithm {
    fn calculate_similarity(&self, value_a: &str, value_b: &str) -> f64;
    fn get_algorithm_name(&self) -> &str;
}

/// Exact matching algorithm
pub struct ExactMatchingAlgorithm;

impl MatchingAlgorithm for ExactMatchingAlgorithm {
    fn calculate_similarity(&self, value_a: &str, value_b: &str) -> f64 {
        if value_a == value_b {
            1.0
        } else {
            0.0
        }
    }
    
    fn get_algorithm_name(&self) -> &str {
        "exact"
    }
}

/// Contains matching algorithm
pub struct ContainsMatchingAlgorithm;

impl MatchingAlgorithm for ContainsMatchingAlgorithm {
    fn calculate_similarity(&self, value_a: &str, value_b: &str) -> f64 {
        let a_lower = value_a.to_lowercase();
        let b_lower = value_b.to_lowercase();
        
        if a_lower.contains(&b_lower) || b_lower.contains(&a_lower) {
            0.8 // Partial match score
        } else {
            0.0
        }
    }
    
    fn get_algorithm_name(&self) -> &str {
        "contains"
    }
}

/// Fuzzy matching algorithm
#[derive(Debug, Clone)]
pub struct FuzzyMatchingAlgorithm {
    pub threshold: f64,
    pub algorithm_type: FuzzyAlgorithmType,
}

impl FuzzyMatchingAlgorithm {
    pub fn new(threshold: f64, algorithm_type: FuzzyAlgorithmType) -> Self {
        Self {
            threshold,
            algorithm_type,
        }
    }
    
    fn levenshtein_distance(&self, s1: &str, s2: &str) -> usize {
        let s1_chars: Vec<char> = s1.chars().collect();
        let s2_chars: Vec<char> = s2.chars().collect();
        let s1_len = s1_chars.len();
        let s2_len = s2_chars.len();
        
        if s1_len == 0 {
            return s2_len;
        }
        if s2_len == 0 {
            return s1_len;
        }
        
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
    
    fn jaro_winkler(&self, s1: &str, s2: &str) -> f64 {
        // Simplified Jaro-Winkler implementation
        let jaro = self.jaro(s1, s2);
        let prefix_len = self.common_prefix_length(s1, s2).min(4);
        let winkler = 0.1 * prefix_len as f64 * (1.0 - jaro);
        
        jaro + winkler
    }
    
    fn jaro(&self, s1: &str, s2: &str) -> f64 {
        if s1 == s2 {
            return 1.0;
        }
        
        let s1_len = s1.chars().count();
        let s2_len = s2.chars().count();
        
        if s1_len == 0 || s2_len == 0 {
            return 0.0;
        }
        
        let match_window = ((s1_len.max(s2_len) / 2) - 1).max(0);
        let s1_matches = vec![false; s1_len];
        let s2_matches = vec![false; s2_len];
        
        let mut matches = 0;
        let mut transpositions = 0;
        
        // Simplified Jaro calculation
        for (i, c1) in s1.chars().enumerate() {
            let start = i.saturating_sub(match_window);
            let end = (i + match_window + 1).min(s2_len);
            
            for j in start..end {
                if !s2_matches[j] && c1 == s2.chars().nth(j).unwrap_or('\0') {
                    // Match found
                    matches += 1;
                    break;
                }
            }
        }
        
        if matches == 0 {
            return 0.0;
        }
        
        // Simplified similarity calculation
        let similarity = (matches as f64 / s1_len as f64 + 
                          matches as f64 / s2_len as f64 + 
                          (matches - transpositions) as f64 / matches as f64) / 3.0;
        
        similarity.min(1.0)
    }
    
    fn common_prefix_length(&self, s1: &str, s2: &str) -> usize {
        s1.chars()
            .zip(s2.chars())
            .take_while(|(a, b)| a == b)
            .count()
    }
}

impl MatchingAlgorithm for FuzzyMatchingAlgorithm {
    fn calculate_similarity(&self, value_a: &str, value_b: &str) -> f64 {
        match self.algorithm_type {
            FuzzyAlgorithmType::Levenshtein => {
                let distance = self.levenshtein_distance(value_a, value_b);
                let max_len = value_a.len().max(value_b.len());
                if max_len == 0 {
                    1.0
                } else {
                    1.0 - (distance as f64 / max_len as f64)
                }
            }
            FuzzyAlgorithmType::JaroWinkler => {
                self.jaro_winkler(value_a, value_b)
            }
            _ => {
                // Fallback to Levenshtein
                let distance = self.levenshtein_distance(value_a, value_b);
                let max_len = value_a.len().max(value_b.len());
                if max_len == 0 {
                    1.0
                } else {
                    1.0 - (distance as f64 / max_len as f64)
                }
            }
        }
    }
    
    fn get_algorithm_name(&self) -> &str {
        "fuzzy"
    }
}

/// Build an exact index for fast lookups
pub fn build_exact_index(
    records: &[(uuid::Uuid, HashMap<String, serde_json::Value>)],
    key_field: &str,
) -> HashMap<String, Vec<uuid::Uuid>> {
    let mut index: HashMap<String, Vec<uuid::Uuid>> = HashMap::new();
    for (id, fields) in records.iter() {
        if let Some(val) = fields.get(key_field) {
            let key = val.to_string();
            index.entry(key).or_default().push(*id);
        }
    }
    index
}

/// Match two records using specified algorithm
pub fn match_records(
    source_record: &ReconciliationRecord,
    target_record: &ReconciliationRecord,
    algorithm: &dyn MatchingAlgorithm,
    fields: &[String],
    threshold: f64,
) -> Option<MatchingResult> {
    let mut total_score = 0.0;
    let mut field_count = 0;
    let mut matching_fields = Vec::new();
    let mut differences = Vec::new();
    
    for field in fields {
        if let (Some(source_val), Some(target_val)) = (
            source_record.fields.get(field),
            target_record.fields.get(field),
        ) {
            let source_str = source_val.to_string();
            let target_str = target_val.to_string();
            
            let similarity = algorithm.calculate_similarity(&source_str, &target_str);
            total_score += similarity;
            field_count += 1;
            
            if similarity >= threshold {
                matching_fields.push(field.clone());
            } else {
                differences.push(FieldDifference {
                    field_name: field.clone(),
                    source_value: source_val.clone(),
                    target_value: target_val.clone(),
                    difference_type: if similarity > 0.5 {
                        DifferenceType::Similar
                    } else {
                        DifferenceType::Different
                    },
                    similarity_score: similarity,
                });
            }
        }
    }
    
    let confidence_score = if field_count > 0 {
        total_score / field_count as f64
    } else {
        0.0
    };
    
    if confidence_score >= threshold {
        Some(MatchingResult {
            source_record: source_record.clone(),
            target_record: target_record.clone(),
            confidence_score,
            match_type: MatchType::Exact,
            matching_fields,
            differences,
        })
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_matching_matches_equal_strings() {
        let alg = ExactMatchingAlgorithm;
        assert_eq!(alg.calculate_similarity("ABC123", "ABC123"), 1.0);
        assert_eq!(alg.calculate_similarity("abc", "def"), 0.0);
    }

    #[test]
    fn contains_matching_detects_substrings() {
        let alg = ContainsMatchingAlgorithm;
        assert!(alg.calculate_similarity("Invoice-12345", "12345") > 0.0);
        assert_eq!(alg.calculate_similarity("alpha", "beta"), 0.0);
    }

    #[test]
    fn fuzzy_levenshtein_similarity_behaves_reasonably() {
        let alg = FuzzyMatchingAlgorithm::new(0.7, FuzzyAlgorithmType::Levenshtein);
        let sim_same = alg.calculate_similarity("invoice", "invoice");
        let sim_close = alg.calculate_similarity("invoice-123", "invoice123");
        let sim_far = alg.calculate_similarity("invoice", "receipt");
        assert!(sim_same > 0.99);
        assert!(sim_close > sim_far);
    }
}

