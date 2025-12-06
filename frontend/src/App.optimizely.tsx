import { useExperiment, useFeature } from '@optimizely/react-sdk';

function App() {
  // A/B Test Example: 'new_homepage_heading' experiment
  const [variation, visitorIsWaiting] = useExperiment('new_homepage_heading');

  let headingText = 'Welcome to the Reconciliation Platform!';
  if (!visitorIsWaiting && variation === 'new_heading') {
    headingText = 'Experience the New Reconciliation Platform!';
  }

  // Feature Flag Example: 'beta_feature_enabled' feature flag
  const [featureEnabled, , isFeatureLoading] = useFeature('beta_feature_enabled');

  return (
    <div>
      <h1>{headingText}</h1>
      {isFeatureLoading ? (
        <p>Loading feature...</p>
      ) : (
        featureEnabled && (
          <button style={{
            backgroundColor: '#4CAF50', /* Green */
            border: 'none',
            color: 'white',
            padding: '15px 32px',
            textAlign: 'center',
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '16px',
            margin: '4px 2px',
            cursor: 'pointer',
            borderRadius: '8px',
          }}>
            Try Beta Feature!
          </button>
        )
      )}
    </div>
  );
}

export default App;
