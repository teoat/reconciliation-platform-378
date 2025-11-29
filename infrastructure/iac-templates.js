// ============================================================================
// IaC GENERATOR - Templates Module
// ============================================================================

/**
 * Load IaC templates
 * @param {Map} templates - Templates map to populate
 */
export function loadIaCTemplates(templates) {
  // Terraform Template
  templates.set('terraform', {
    name: 'Terraform Configuration',
    extension: '.tf',
    structure: {
      main: 'main.tf',
      variables: 'variables.tf',
      outputs: 'outputs.tf',
      terraform: 'terraform.tf',
    },
  });

  // CloudFormation Template
  templates.set('cloudformation', {
    name: 'AWS CloudFormation',
    extension: '.yaml',
    structure: {
      template: 'template.yaml',
      parameters: 'parameters.json',
    },
  });

  // ARM Template
  templates.set('arm', {
    name: 'Azure Resource Manager',
    extension: '.json',
    structure: {
      template: 'azuredeploy.json',
      parameters: 'azuredeploy.parameters.json',
    },
  });

  // Pulumi Template
  templates.set('pulumi', {
    name: 'Pulumi Program',
    extension: '.ts',
    structure: {
      main: 'index.ts',
      package: 'package.json',
    },
  });
}
