// ============================================================================
// IaC GENERATOR - Core Module
// ============================================================================

import { loadIaCTemplates } from './iac-templates.js';
import { loadProviders } from './iac-providers.js';
import { loadModules } from './iac-modules.js';

class IaCGenerator {
  constructor() {
    this.templates = new Map();
    this.providers = new Map();
    this.modules = new Map();
    this.generatedConfigs = new Map();
    this.isActive = false;
  }

  // Initialize the IaC generator
  async initialize() {
    console.log('🏗️ Initializing Infrastructure as Code Generator...');

    loadIaCTemplates(this.templates);
    loadProviders(this.providers);
    loadModules(this.modules);

    this.isActive = true;
    console.log('✅ IaC Generator activated');
  }

  // Generate IaC configuration
  async generateIaCConfig(iacType, provider, config) {
    const { projectName, environment = 'dev', region, modules = [], customConfig = {} } = config;

    console.log(`🏗️ Generating ${iacType} configuration for ${projectName} on ${provider}`);

    const template = this.templates.get(iacType);
    if (!template) {
      throw new Error(`Unknown IaC type: ${iacType}`);
    }

    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const iacConfig = {
      type: iacType,
      provider,
      projectName,
      environment,
      region: region || providerConfig.defaultRegion,
      modules: [],
      files: {},
      generatedAt: new Date().toISOString(),
    };

    // Generate main configuration file
    iacConfig.files[template.structure.main || 'main.tf'] = await this.generateMainConfig(
      iacType,
      provider,
      config,
      modules
    );

    // Generate variables file
    if (template.structure.variables) {
      iacConfig.files[template.structure.variables] = this.generateVariablesFile(
        iacType,
        provider,
        config,
        modules
      );
    }

    // Generate outputs file
    if (template.structure.outputs) {
      iacConfig.files[template.structure.outputs] = this.generateOutputsFile(
        iacType,
        provider,
        modules
      );
    }

    // Generate terraform.tf file
    if (template.structure.terraform) {
      iacConfig.files[template.structure.terraform] = this.generateTerraformConfig(
        provider,
        config
      );
    }

    this.generatedConfigs.set(projectName, iacConfig);
    console.log(`✅ Generated IaC configuration for ${projectName}`);

    return iacConfig;
  }

  // Generate main configuration file
  async generateMainConfig(iacType, provider, config, modules) {
    let content = '';

    if (iacType === 'terraform') {
      // Provider configuration
      const providerConfig = this.providers.get(provider);
      content += this.convertToHCL({
        terraform: { required_providers: providerConfig.terraform.required_providers },
        provider: this.generateProviderBlock(provider, config),
      });

      // Module configurations
      for (const moduleName of modules) {
        const module = this.modules.get(moduleName);
        if (module && module[provider]) {
          content += `\n# ${module.name}\n`;
          content += this.convertToHCL({
            module: {
              [moduleName]: this.generateModuleBlock(moduleName, module[provider], config),
            },
          });
        }
      }

      // Custom resources
      if (config.customConfig) {
        content += `\n# Custom Resources\n`;
        content += this.convertToHCL(config.customConfig);
      }
    }

    return content;
  }

  // Generate provider block
  generateProviderBlock(provider, config) {
    switch (provider) {
      case 'aws':
        return {
          aws: {
            region: config.region || 'us-east-1',
            profile: '${var.aws_profile}',
          },
        };
      case 'azure':
        return {
          azurerm: {
            features: {},
          },
        };
      case 'gcp':
        return {
          google: {
            project: '${var.project_id}',
            region: config.region || 'us-central1',
          },
        };
      case 'digitalocean':
        return {
          digitalocean: {
            token: '${var.do_token}',
          },
        };
      default:
        return {};
    }
  }

  // Generate module block
  generateModuleBlock(moduleName, moduleConfig, config) {
    const moduleBlock = {
      source: `./modules/${moduleName}`,
      ...this.generateModuleVariables(moduleName, moduleConfig, config),
    };

    return moduleBlock;
  }

  // Generate module variables
  generateModuleVariables(moduleName, moduleConfig, config) {
    const variables = {};

    // Add common variables based on module type
    switch (moduleName) {
      case 'vpc':
        variables.vpc_name = '${var.project_name}-vpc';
        variables.vpc_cidr = '10.0.0.0/16';
        variables.environment = '${var.environment}';
        break;
      case 'compute':
        variables.instance_count = 2;
        variables.instance_type = 't3.micro';
        variables.name_prefix = '${var.project_name}';
        variables.environment = '${var.environment}';
        break;
      case 'database':
        variables.identifier = '${var.project_name}-db';
        variables.db_name = '${var.db_name}';
        variables.username = '${var.db_username}';
        variables.password = '${var.db_password}';
        variables.environment = '${var.environment}';
        break;
    }

    return variables;
  }

  // Generate variables file
  generateVariablesFile(iacType, provider, config, modules) {
    const variables = {
      project_name: {
        description: 'Name of the project',
        type: 'string',
        default: config.projectName,
      },
      environment: {
        description: 'Environment name',
        type: 'string',
        default: config.environment,
      },
    };

    // Add provider-specific variables
    switch (provider) {
      case 'aws':
        variables.aws_profile = {
          description: 'AWS profile to use',
          type: 'string',
          default: 'default',
        };
        break;
      case 'gcp':
        variables.project_id = {
          description: 'GCP project ID',
          type: 'string',
        };
        break;
      case 'digitalocean':
        variables.do_token = {
          description: 'DigitalOcean API token',
          type: 'string',
          sensitive: true,
        };
        break;
    }

    // Add module-specific variables
    for (const moduleName of modules) {
      switch (moduleName) {
        case 'database':
          variables.db_name = {
            description: 'Database name',
            type: 'string',
            default: 'appdb',
          };
          variables.db_username = {
            description: 'Database username',
            type: 'string',
            default: 'dbuser',
          };
          variables.db_password = {
            description: 'Database password',
            type: 'string',
            sensitive: true,
          };
          break;
      }
    }

    if (iacType === 'terraform') {
      return this.convertToHCL({ variable: variables });
    }

    return JSON.stringify(variables, null, 2);
  }

  // Generate outputs file
  generateOutputsFile(iacType, provider, modules) {
    const outputs = {};

    // Add common outputs
    outputs.project_name = {
      description: 'Project name',
      value: '${var.project_name}',
    };

    outputs.environment = {
      description: 'Environment',
      value: '${var.environment}',
    };

    // Add module-specific outputs
    for (const moduleName of modules) {
      switch (moduleName) {
        case 'vpc':
          outputs.vpc_id = {
            description: 'VPC ID',
            value: '${module.vpc.vpc_id}',
          };
          break;
        case 'compute':
          outputs.instance_ids = {
            description: 'Compute instance IDs',
            value: '${module.compute.instance_ids}',
          };
          break;
        case 'database':
          outputs.database_endpoint = {
            description: 'Database endpoint',
            value: '${module.database.endpoint}',
          };
          break;
      }
    }

    if (iacType === 'terraform') {
      return this.convertToHCL({ output: outputs });
    }

    return JSON.stringify(outputs, null, 2);
  }

  // Generate terraform.tf file
  generateTerraformConfig(provider, config) {
    const terraformConfig = {
      terraform: {
        required_version: '>= 1.0',
        backend: {
          s3: {
            bucket: '${var.project_name}-terraform-state',
            key: '${var.environment}/terraform.tfstate',
            region: config.region || 'us-east-1',
          },
        },
      },
    };

    return this.convertToHCL(terraformConfig);
  }

  // Convert configuration object to HCL
  convertToHCL(obj, indent = 0) {
    const spaces = ' '.repeat(indent * 2);
    let hcl = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        hcl += `${spaces}${key} = [\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            hcl += `${spaces}  {\n`;
            hcl += this.convertToHCL(item, indent + 2);
            hcl += `${spaces}  },\n`;
          } else {
            hcl += `${spaces}  "${item}",\n`;
          }
        });
        hcl += `${spaces}]\n`;
      } else if (typeof value === 'object' && value !== null) {
        hcl += `${spaces}${key} {\n`;
        hcl += this.convertToHCL(value, indent + 1);
        hcl += `${spaces}}\n`;
      } else {
        const quote = typeof value === 'string' ? '"' : '';
        hcl += `${spaces}${key} = ${quote}${value}${quote}\n`;
      }
    }

    return hcl;
  }

  // Generate deployment scripts
  async generateIaCDeploymentScripts(iacConfigs, outputDir = './infrastructure/iac/generated') {
    console.log('📜 Generating IaC deployment scripts');

    const scripts = [];

    for (const config of iacConfigs) {
      const projectDir = `${outputDir}/${config.projectName}`;

      // Init script
      const initScript = `#!/bin/bash
# Initialize IaC for ${config.projectName}
echo "Initializing IaC for ${config.projectName}..."

cd ${config.projectName}

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

echo "IaC initialization complete!"
`;

      await this.writeFile(`${projectDir}/init.sh`, initScript);
      scripts.push(`${config.projectName}/init.sh`);

      // Plan script
      const planScript = `#!/bin/bash
# Plan IaC changes for ${config.projectName}
echo "Planning IaC changes for ${config.projectName}..."

cd ${config.projectName}

# Create plan
terraform plan -out=tfplan

echo "IaC plan complete!"
`;

      await this.writeFile(`${projectDir}/plan.sh`, planScript);
      scripts.push(`${config.projectName}/plan.sh`);

      // Apply script
      const applyScript = `#!/bin/bash
# Apply IaC changes for ${config.projectName}
echo "Applying IaC changes for ${config.projectName}..."

cd ${config.projectName}

# Apply changes
terraform apply tfplan

echo "IaC apply complete!"
`;

      await this.writeFile(`${projectDir}/apply.sh`, applyScript);
      scripts.push(`${config.projectName}/apply.sh`);

      // Destroy script
      const destroyScript = `#!/bin/bash
# Destroy IaC resources for ${config.projectName}
echo "Destroying IaC resources for ${config.projectName}..."

cd ${config.projectName}

# Destroy resources
terraform destroy

echo "IaC destroy complete!"
`;

      await this.writeFile(`${projectDir}/destroy.sh`, destroyScript);
      scripts.push(`${config.projectName}/destroy.sh`);
    }

    return scripts;
  }

  // Generate complete infrastructure
  async generateInfrastructure(
    iacType,
    provider,
    config,
    outputDir = './infrastructure/iac/generated'
  ) {
    console.log('🏗️ Generating complete infrastructure setup');

    const results = {
      configurations: [],
      scripts: [],
      documentation: '',
    };

    // Generate IaC configuration
    const iacConfig = await this.generateIaCConfig(iacType, provider, config);
    results.configurations.push(iacConfig);

    // Write configuration files
    const projectDir = `${outputDir}/${config.projectName}`;
    for (const [filename, content] of Object.entries(iacConfig.files)) {
      await this.writeFile(`${projectDir}/${filename}`, content);
    }

    // Generate deployment scripts
    results.scripts = await this.generateIaCDeploymentScripts([iacConfig], outputDir);

    // Generate documentation
    results.documentation = this.generateIaCDocumentation(results.configurations);

    console.log('✅ Complete infrastructure setup generated');
    return results;
  }

  // Generate IaC documentation
  generateIaCDocumentation(configs) {
    const docs = `# Infrastructure as Code Documentation

Generated on: ${new Date().toISOString()}

## Projects

${configs
  .map(
    (config) => `
### ${config.projectName}
- **IaC Type**: ${config.type}
- **Provider**: ${config.provider}
- **Environment**: ${config.environment}
- **Region**: ${config.region}
- **Modules**: ${config.modules?.join(', ') || 'None'}

#### Files Generated
${Object.keys(config.files)
  .map((file) => `- \`${file}\``)
  .join('\n')}

#### Getting Started

1. **Initialize**:
   \`\`\`bash
   cd ${config.projectName}
   ./init.sh
   \`\`\`

2. **Plan Changes**:
   \`\`\`bash
   ./plan.sh
   \`\`\`

3. **Apply Changes**:
   \`\`\`bash
   ./apply.sh
   \`\`\`

4. **Destroy Resources** (if needed):
   \`\`\`bash
   ./destroy.sh
   \`\`\`

`
  )
  .join('\n')}

## Security Notes

- Never commit sensitive variables (passwords, tokens, keys) to version control
- Use remote state storage for team collaboration
- Implement proper access controls and IAM policies
- Regularly review and update infrastructure code
- Use version control for all IaC changes

## Best Practices

- Use modules for reusable infrastructure components
- Implement proper tagging and naming conventions
- Use variables for environment-specific values
- Implement proper state locking and backup
- Regular security audits and compliance checks
`;

    return docs;
  }

  // Write file (simulated)
  async writeFile(filename, content) {
    console.log(`📝 Writing file: ${filename}`);
    // In a real implementation, this would write to the filesystem
  }

  // Get generator status
  getGeneratorStatus() {
    return {
      isActive: this.isActive,
      availableTemplates: Array.from(this.templates.keys()),
      availableProviders: Array.from(this.providers.keys()),
      availableModules: Array.from(this.modules.keys()),
      generatedConfigs: Array.from(this.generatedConfigs.keys()),
    };
  }

  // Stop the generator
  stop() {
    this.isActive = false;
    console.log('⏹️ IaC Generator stopped');
  }
}

// Export singleton instance
export const iacGenerator = new IaCGenerator();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  iacGenerator.initialize().catch(console.error);
}
