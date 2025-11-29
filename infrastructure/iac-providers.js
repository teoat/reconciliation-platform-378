// ============================================================================
// IaC GENERATOR - Providers Module
// ============================================================================

/**
 * Load cloud providers
 * @param {Map} providers - Providers map to populate
 */
export function loadProviders(providers) {
  // AWS Provider
  providers.set('aws', {
    name: 'Amazon Web Services',
    terraform: {
      required_providers: {
        aws: {
          source: 'hashicorp/aws',
          version: '~> 5.0',
        },
      },
    },
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    defaultRegion: 'us-east-1',
  });

  // Azure Provider
  providers.set('azure', {
    name: 'Microsoft Azure',
    terraform: {
      required_providers: {
        azurerm: {
          source: 'hashicorp/azurerm',
          version: '~> 3.0',
        },
      },
    },
    regions: ['East US', 'West Europe', 'Southeast Asia'],
    defaultRegion: 'East US',
  });

  // GCP Provider
  providers.set('gcp', {
    name: 'Google Cloud Platform',
    terraform: {
      required_providers: {
        google: {
          source: 'hashicorp/google',
          version: '~> 4.0',
        },
      },
    },
    regions: ['us-central1', 'europe-west1', 'asia-southeast1'],
    defaultRegion: 'us-central1',
  });

  // DigitalOcean Provider
  providers.set('digitalocean', {
    name: 'DigitalOcean',
    terraform: {
      required_providers: {
        digitalocean: {
          source: 'digitalocean/digitalocean',
          version: '~> 2.0',
        },
      },
    },
    regions: ['nyc1', 'lon1', 'sgp1'],
    defaultRegion: 'nyc1',
  });
}
