// AI Reconciliation Engine Prototype
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct ReconciliationRecord {
    pub id: String,
    pub amount: f64,
    pub description: String,
    pub date: String,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MatchResult {
    pub record1: ReconciliationRecord,
    pub record2: ReconciliationRecord,
    pub confidence: f64,
    pub match_type: String,
    pub reasons: Vec<String>,
}

pub struct AIReconciliationEngine {
    models: HashMap<String, Box<dyn MLModel>>,
    thresholds: HashMap<String, f64>,
}

impl AIReconciliationEngine {
    pub fn new() -> Self {
        Self {
            models: HashMap::new(),
            thresholds: HashMap::new(),
        }
    }
    
    pub async fn find_matches(&self, records: Vec<ReconciliationRecord>) -> Vec<MatchResult> {
        let mut matches = Vec::new();
        
        for i in 0..records.len() {
            for j in i+1..records.len() {
                let confidence = self.calculate_confidence(&records[i], &records[j]).await;
                
                if confidence > 0.8 {
                    matches.push(MatchResult {
                        record1: records[i].clone(),
                        record2: records[j].clone(),
                        confidence,
                        match_type: "fuzzy".to_string(),
                        reasons: vec!["High confidence match".to_string()],
                    });
                }
            }
        }
        
        matches
    }
    
    async fn calculate_confidence(&self, record1: &ReconciliationRecord, record2: &ReconciliationRecord) -> f64 {
        let mut confidence = 0.0;
        
        // Amount matching
        if (record1.amount - record2.amount).abs() < 0.01 {
            confidence += 0.4;
        }
        
        // Description similarity
        let desc_similarity = self.calculate_string_similarity(&record1.description, &record2.description);
        confidence += desc_similarity * 0.3;
        
        // Date proximity
        let date_similarity = self.calculate_date_similarity(&record1.date, &record2.date);
        confidence += date_similarity * 0.3;
        
        confidence
    }
    
    fn calculate_string_similarity(&self, s1: &str, s2: &str) -> f64 {
        // Levenshtein distance implementation
        let len1 = s1.len();
        let len2 = s2.len();
        
        if len1 == 0 { return len2 as f64; }
        if len2 == 0 { return len1 as f64; }
        
        let mut matrix = vec![vec![0; len2 + 1]; len1 + 1];
        
        for i in 0..=len1 {
            matrix[i][0] = i;
        }
        
        for j in 0..=len2 {
            matrix[0][j] = j;
        }
        
        for i in 1..=len1 {
            for j in 1..=len2 {
                let cost = if s1.chars().nth(i-1) == s2.chars().nth(j-1) { 0 } else { 1 };
                matrix[i][j] = std::cmp::min(
                    matrix[i-1][j] + 1,
                    std::cmp::min(
                        matrix[i][j-1] + 1,
                        matrix[i-1][j-1] + cost
                    )
                );
            }
        }
        
        let distance = matrix[len1][len2];
        1.0 - (distance as f64 / std::cmp::max(len1, len2) as f64)
    }
    
    fn calculate_date_similarity(&self, date1: &str, date2: &str) -> f64 {
        // Simple date similarity based on proximity
        // In production, use proper date parsing and comparison
        if date1 == date2 {
            1.0
        } else {
            0.5
        }
    }
}

trait MLModel {
    fn predict(&self, input: &[f64]) -> f64;
    fn train(&self, data: &[(Vec<f64>, f64)]);
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_ai_reconciliation_engine() {
        let engine = AIReconciliationEngine::new();
        
        let records = vec![
            ReconciliationRecord {
                id: "1".to_string(),
                amount: 100.0,
                description: "Payment to vendor".to_string(),
                date: "2024-01-01".to_string(),
                source: "bank".to_string(),
            },
            ReconciliationRecord {
                id: "2".to_string(),
                amount: 100.0,
                description: "Payment to vendor".to_string(),
                date: "2024-01-01".to_string(),
                source: "ledger".to_string(),
            },
        ];
        
        let matches = engine.find_matches(records).await;
        assert!(!matches.is_empty());
        assert!(matches[0].confidence > 0.8);
    }
}
