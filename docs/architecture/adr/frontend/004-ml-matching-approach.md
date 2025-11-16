# ML-Based Record Matching

## Status

Accepted

## Context

Traditional rule-based record matching in reconciliation systems has limitations:

- Requires manual rule creation and maintenance
- Struggles with inconsistent data formats
- Limited adaptability to new data patterns
- Poor handling of fuzzy matches and edge cases
- High false positive/negative rates in complex scenarios

The platform needed intelligent matching that could:
- Learn from historical matches
- Handle various data types and formats
- Provide confidence scores for matches
- Scale with increasing data volumes
- Adapt to new matching patterns

## Decision

We implemented a hybrid ML and rule-based matching approach:

- **ML Algorithms**: Cosine similarity, Jaccard similarity, Levenshtein distance
- **Ensemble Matching**: Weighted combination of multiple algorithms
- **Feature Engineering**: Extract relevant features (amount, date, description, etc.)
- **Blocking Strategy**: Pre-filter candidates to reduce computational complexity
- **Confidence Scoring**: Probabilistic confidence scores for match quality
- **Training Data**: Historical matches used to tune algorithm weights

### Implementation:
- **mlMatchingService.ts**: Core ML matching algorithms
- **Feature Extraction**: Convert records to numerical features
- **Similarity Metrics**: Text, numeric, and categorical similarity functions
- **Ensemble Model**: Weighted combination with configurable thresholds

## Consequences

### Positive
- **Accuracy**: Improved match quality over rule-based systems
- **Adaptability**: Learns from data patterns without manual rules
- **Scalability**: Blocking strategy handles large datasets efficiently
- **Confidence Scores**: Provides uncertainty quantification
- **Flexibility**: Supports multiple matching algorithms and weights

### Negative
- **Complexity**: ML algorithms require understanding and tuning
- **Performance**: Feature extraction and similarity calculations add overhead
- **Training Data**: Requires labeled examples for optimal performance
- **Explainability**: ML decisions can be harder to understand than rules

### Risks
- Over-reliance on ML without human oversight
- Performance degradation with very large datasets
- Algorithm bias from training data
- Maintenance complexity of ML pipeline

## Alternatives Considered

### Pure Rule-Based Matching
- **Pros**: Simple, explainable, fast execution
- **Cons**: Limited adaptability, high maintenance, poor fuzzy matching
- **Decision**: Rejected due to poor performance on complex datasets

### External ML Services (AWS SageMaker, etc.)
- **Pros**: Managed infrastructure, advanced algorithms
- **Cons**: Vendor lock-in, latency, cost, data privacy concerns
- **Decision**: Rejected due to cost and data sensitivity

### Deep Learning Approaches
- **Pros**: High accuracy, automatic feature learning
- **Cons**: Requires large training datasets, computational complexity
- **Decision**: Rejected due to data volume constraints and complexity

### Fuzzy String Matching Only
- **Pros**: Simple implementation, good for text fields
- **Cons**: Ignores numerical and categorical relationships
- **Decision**: Rejected due to limited scope

## Related ADRs

- [ADR 001: Frontend Architecture Choice](001-frontend-architecture.md)
- [ADR 006: Testing Strategy](006-testing-strategy.md)

## Notes

- Ensemble approach provides best balance of accuracy and performance
- Blocking strategy crucial for scaling to large datasets
- Confidence scores enable human-in-the-loop validation
- Feature engineering focuses on reconciliation domain knowledge