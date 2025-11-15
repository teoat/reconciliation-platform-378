// ============================================================================
// DATA SCIENCE ENVIRONMENT SETUP - Data Science Setup
// ============================================================================

class DataScienceSetup {
  constructor() {
    this.environments = new Map();
    this.templates = new Map();
    this.packages = new Map();
    this.isActive = false;
  }

  // Initialize the data science setup
  async initialize() {
    console.log('🧪 Initializing Data Science Environment Setup...');

    this.loadEnvironmentTemplates();
    this.loadPackageConfigurations();
    this.loadJupyterConfigurations();

    this.isActive = true;
    console.log('✅ Data Science Setup activated');
  }

  // Load environment templates
  loadEnvironmentTemplates() {
    // Base Python environment
    this.templates.set('python-base', {
      name: 'Python Base Environment',
      pythonVersion: '3.11',
      baseImage: 'python:3.11-slim',
      systemPackages: [
        'build-essential',
        'gcc',
        'g++',
        'libffi-dev',
        'libssl-dev',
        'curl',
        'git',
        'vim',
        'htop',
      ],
      pythonPackages: ['pip', 'setuptools', 'wheel', 'virtualenv'],
    });

    // Data Science environment
    this.templates.set('data-science', {
      name: 'Data Science Environment',
      extends: 'python-base',
      pythonVersion: '3.11',
      condaPackages: [
        'numpy',
        'pandas',
        'matplotlib',
        'seaborn',
        'scipy',
        'scikit-learn',
        'jupyter',
        'notebook',
        'jupyterlab',
        'ipykernel',
      ],
      pipPackages: [
        'tensorflow>=2.13.0',
        'torch>=2.0.0',
        'transformers',
        'datasets',
        'accelerate',
        'xgboost',
        'lightgbm',
        'catboost',
        'plotly',
        'streamlit',
        'fastapi',
        'uvicorn',
        'pydantic',
      ],
    });

    // Machine Learning environment
    this.templates.set('ml-research', {
      name: 'ML Research Environment',
      extends: 'data-science',
      pythonVersion: '3.11',
      additionalPackages: [
        'ray[all]',
        'dask[complete]',
        'mlflow',
        'wandb',
        'optuna',
        'hyperopt',
        'pytorch-lightning',
        'tensorflow-probability',
        'jax',
        'flax',
        'dm-haiku',
      ],
    });

    // NLP environment
    this.templates.set('nlp', {
      name: 'Natural Language Processing',
      extends: 'data-science',
      pythonVersion: '3.11',
      additionalPackages: [
        'spacy',
        'nltk',
        'gensim',
        'transformers',
        'datasets',
        'tokenizers',
        'sentence-transformers',
        'textblob',
        'langchain',
        'openai',
        'anthropic',
      ],
      spacyModels: ['en_core_web_sm', 'en_core_web_md'],
    });

    // Computer Vision environment
    this.templates.set('computer-vision', {
      name: 'Computer Vision Environment',
      extends: 'data-science',
      pythonVersion: '3.11',
      additionalPackages: [
        'opencv-python',
        'pillow',
        'scikit-image',
        'torchvision',
        'detectron2',
        'albumentations',
        'timm',
        'efficientnet-pytorch',
        'segmentation-models-pytorch',
      ],
    });

    // Time Series environment
    this.templates.set('time-series', {
      name: 'Time Series Analysis',
      extends: 'data-science',
      pythonVersion: '3.11',
      additionalPackages: [
        'statsmodels',
        'prophet',
        'tsfresh',
        'sktime',
        'pmdarima',
        'tbats',
        'neuralprophet',
        'darts',
      ],
    });
  }

  // Load package configurations
  loadPackageConfigurations() {
    this.packages.set('core-data-science', {
      conda: ['numpy', 'pandas', 'matplotlib', 'seaborn', 'scipy', 'scikit-learn'],
      pip: ['jupyter', 'notebook', 'jupyterlab'],
    });

    this.packages.set('deep-learning', {
      pip: [
        'tensorflow>=2.13.0',
        'torch>=2.0.0',
        'torchvision',
        'torchaudio',
        'keras',
        'transformers',
        'datasets',
        'accelerate',
      ],
    });

    this.packages.set('ml-ops', {
      pip: ['mlflow', 'wandb', 'dvc', 'hydra-core', 'omegaconf', 'pytorch-lightning'],
    });

    this.packages.set('data-visualization', {
      pip: ['plotly', 'bokeh', 'altair', 'holoviews', 'panel', 'streamlit', 'dash', 'voila'],
    });

    this.packages.set('big-data', {
      pip: ['dask[complete]', 'modin', 'vaex', 'polars', 'pyspark', 'ray[all]'],
    });
  }

  // Load Jupyter configurations
  loadJupyterConfigurations() {
    this.jupyterConfig = {
      NotebookApp: {
        password: '', // Will be set during setup
        ip: '0.0.0.0',
        port: 8888,
        open_browser: false,
        allow_root: true,
      },
      extensions: [
        'jupyterlab-git',
        'jupyterlab-lsp',
        '@jupyter-widgets/jupyterlab-manager',
        'jupyterlab-plotly',
        'jupyterlab-vim',
      ],
      kernels: ['python3', 'tensorflow', 'pytorch'],
    };
  }

  // Generate Dockerfile for data science environment
  async generateDockerfile(templateName, config = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    console.log(`🐳 Generating Dockerfile for ${template.name}`);

    const { gpu = false, jupyter = true, ports = [8888, 6006], volumes = [] } = config;

    let dockerfile = '';

    // Base image
    if (gpu) {
      dockerfile += `FROM nvidia/cuda:11.8-runtime-ubuntu20.04\n`;
    } else {
      dockerfile += `FROM ${template.baseImage}\n`;
    }

    dockerfile += '\n# Install system dependencies\n';
    dockerfile += 'RUN apt-get update && apt-get install -y \\\n';
    dockerfile += `    ${template.systemPackages.join(' \\\n    ')} \\\n`;
    if (gpu) {
      dockerfile += '    nvidia-cuda-toolkit \\\n';
    }
    dockerfile += '    && rm -rf /var/lib/apt/lists/*\n\n';

    // Install Miniconda
    dockerfile += '# Install Miniconda\n';
    dockerfile += 'ENV CONDA_DIR /opt/conda\n';
    dockerfile +=
      'RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh && \\\n';
    dockerfile += '    /bin/bash ~/miniconda.sh -b -p /opt/conda && \\\n';
    dockerfile += '    rm ~/miniconda.sh && \\\n';
    dockerfile += '    /opt/conda/bin/conda clean -tipsy && \\\n';
    dockerfile += '    ln -s /opt/conda/etc/profile.d/conda.sh /etc/profile.d/conda.sh && \\\n';
    dockerfile += '    echo ". /opt/conda/etc/profile.d/conda.sh" >> ~/.bashrc && \\\n';
    dockerfile += '    echo "conda activate base" >> ~/.bashrc\n\n';

    // Set environment variables
    dockerfile += '# Environment variables\n';
    dockerfile += 'ENV PATH /opt/conda/bin:$PATH\n';
    dockerfile += 'ENV PYTHONPATH /app:$PYTHONPATH\n';
    dockerfile += 'ENV MPLBACKEND Agg\n\n';

    // Create working directory
    dockerfile += '# Create working directory\n';
    dockerfile += 'WORKDIR /app\n\n';

    // Copy environment files
    dockerfile += '# Copy environment files\n';
    dockerfile += 'COPY environment.yml* ./\n';
    dockerfile += 'COPY requirements.txt* ./\n\n';

    // Install Python packages
    const allPackages = this.collectPackages(template);
    dockerfile += '# Install Python packages\n';
    dockerfile += 'RUN conda install -c conda-forge -y \\\n';
    dockerfile += `    ${allPackages.conda.join(' \\\n    ')}\n\n`;

    if (allPackages.pip.length > 0) {
      dockerfile += 'RUN pip install --no-cache-dir \\\n';
      dockerfile += `    ${allPackages.pip.join(' \\\n    ')}\n\n`;
    }

    // Install Jupyter extensions if requested
    if (jupyter) {
      dockerfile += '# Install Jupyter extensions\n';
      dockerfile +=
        'RUN pip install --no-cache-dir jupyterlab-git jupyterlab-lsp jupyter-widgets \\\n';
      dockerfile += '    jupyterlab-plotly jupyterlab-vim\n\n';

      // Configure Jupyter
      dockerfile += '# Configure Jupyter\n';
      dockerfile += 'RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager \\\n';
      dockerfile += '    jupyterlab-plotly @jupyterlab/git \\\n';
      dockerfile += '    @krassowski/jupyterlab-lsp\n\n';
    }

    // Install spaCy models if NLP template
    if (templateName === 'nlp' && template.spacyModels) {
      dockerfile += '# Install spaCy models\n';
      dockerfile += 'RUN python -m spacy download en_core_web_sm\n\n';
    }

    // Copy application code
    dockerfile += '# Copy application code\n';
    dockerfile += 'COPY . .\n\n';

    // Expose ports
    dockerfile += '# Expose ports\n';
    ports.forEach((port) => {
      dockerfile += `EXPOSE ${port}\n`;
    });
    dockerfile += '\n';

    // Create non-root user
    dockerfile += '# Create non-root user\n';
    dockerfile +=
      'RUN useradd --create-home --shell /bin/bash --user-group --uid 1000 --groups sudo jupyter && \\\n';
    dockerfile += '    echo "jupyter ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers && \\\n';
    dockerfile += '    chown -R jupyter:jupyter /app /opt/conda\n\n';

    // Switch to non-root user
    dockerfile += 'USER jupyter\n\n';

    // Set default command
    if (jupyter) {
      dockerfile += '# Start Jupyter Lab\n';
      dockerfile +=
        'CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--NotebookApp.token=\'\'"]\n';
    } else {
      dockerfile += '# Default command\n';
      dockerfile += 'CMD ["python", "main.py"]\n';
    }

    const result = {
      template: templateName,
      dockerfile,
      metadata: {
        baseImage: gpu ? 'nvidia/cuda:11.8-runtime-ubuntu20.04' : template.baseImage,
        pythonVersion: template.pythonVersion,
        gpu,
        jupyter,
        ports,
        packages: allPackages,
        generatedAt: new Date().toISOString(),
      },
    };

    console.log(`✅ Generated Dockerfile for ${template.name}`);
    return result;
  }

  // Collect all packages for a template
  collectPackages(template) {
    const allPackages = {
      conda: [],
      pip: [],
    };

    // Add base packages
    if (template.extends) {
      const baseTemplate = this.templates.get(template.extends);
      if (baseTemplate) {
        const basePackages = this.collectPackages(baseTemplate);
        allPackages.conda.push(...basePackages.conda);
        allPackages.pip.push(...basePackages.pip);
      }
    }

    // Add conda packages
    if (template.condaPackages) {
      allPackages.conda.push(...template.condaPackages);
    }

    // Add pip packages
    if (template.pipPackages) {
      allPackages.pip.push(...template.pipPackages);
    }

    // Add additional packages
    if (template.additionalPackages) {
      allPackages.pip.push(...template.additionalPackages);
    }

    // Remove duplicates
    allPackages.conda = [...new Set(allPackages.conda)];
    allPackages.pip = [...new Set(allPackages.pip)];

    return allPackages;
  }

  // Generate environment.yml for conda
  generateEnvironmentFile(templateName, config = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    console.log(`📝 Generating environment.yml for ${template.name}`);

    const packages = this.collectPackages(template);

    const envFile = `name: ${templateName}
channels:
  - conda-forge
  - defaults
dependencies:
${packages.conda.map((pkg) => `  - ${pkg}`).join('\n')}
${packages.pip.length > 0 ? `  - pip\n  - pip:\n${packages.pip.map((pkg) => `    - ${pkg}`).join('\n')}` : ''}
`;

    console.log(`✅ Generated environment.yml for ${template.name}`);
    return envFile;
  }

  // Generate requirements.txt for pip
  generateRequirementsFile(templateName, config = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    console.log(`📝 Generating requirements.txt for ${template.name}`);

    const packages = this.collectPackages(template);
    const requirements = packages.pip.join('\n');

    console.log(`✅ Generated requirements.txt for ${template.name}`);
    return requirements;
  }

  // Generate docker-compose.yml for data science stack
  async generateDockerCompose(services, config = {}) {
    console.log('🐳 Generating docker-compose.yml for data science services');

    const {
      version = '3.8',
      networks = ['data-science-network'],
      volumes = ['jupyter-data', 'mlflow-data', 'data-volume'],
    } = config;

    const composeConfig = {
      version,
      services: {},
      networks: {},
      volumes: {},
    };

    // Add networks
    networks.forEach((network) => {
      composeConfig.networks[network] = {
        driver: 'bridge',
      };
    });

    // Add volumes
    volumes.forEach((volume) => {
      composeConfig.volumes[volume] = {
        driver: 'local',
      };
    });

    // Add services
    for (const service of services) {
      const serviceConfig = await this.generateServiceConfig(service);
      composeConfig.services[service.name] = serviceConfig;
    }

    const yamlContent = this.convertToYAML(composeConfig);
    console.log('✅ Generated docker-compose.yml for data science stack');

    return yamlContent;
  }

  // Generate service configuration for docker-compose
  async generateServiceConfig(service) {
    const config = {
      build: {
        context: '.',
        dockerfile: `Dockerfile.${service.name}`,
      },
      container_name: service.name,
      networks: ['data-science-network'],
      environment: service.environment || [],
      volumes: service.volumes || [],
      ports: service.ports || [],
      depends_on: service.dependsOn || [],
      restart: 'unless-stopped',
    };

    // Add GPU support if requested
    if (service.gpu) {
      config.deploy = {
        resources: {
          reservations: {
            devices: [
              {
                driver: 'nvidia',
                count: 'all',
                capabilities: ['gpu'],
              },
            ],
          },
        },
      };
    }

    // Service-specific configurations
    switch (service.type) {
      case 'jupyter':
        config.environment.push('JUPYTER_TOKEN=${JUPYTER_TOKEN}');
        config.volumes.push('./notebooks:/app/notebooks');
        config.ports.push('8888:8888');
        break;

      case 'mlflow':
        config.environment.push(
          'MLFLOW_TRACKING_URI=http://localhost:5000',
          'BACKEND_STORE_URI=sqlite:///mlflow.db'
        );
        config.volumes.push('mlflow-data:/app/mlruns');
        config.ports.push('5000:5000');
        break;

      case 'streamlit':
        config.environment.push('STREAMLIT_SERVER_PORT=8501');
        config.ports.push('8501:8501');
        break;

      case 'tensorboard':
        config.volumes.push('./logs:/app/logs');
        config.ports.push('6006:6006');
        break;

      case 'postgres':
        config.environment.push(
          'POSTGRES_DB=${POSTGRES_DB}',
          'POSTGRES_USER=${POSTGRES_USER}',
          'POSTGRES_PASSWORD=${POSTGRES_PASSWORD}'
        );
        config.volumes.push('postgres-data:/var/lib/postgresql/data');
        config.ports.push('5432:5432');
        break;

      case 'mongodb':
        config.volumes.push('mongodb-data:/data/db');
        config.ports.push('27017:27017');
        break;
    }

    return config;
  }

  // Convert configuration to YAML
  convertToYAML(obj, indent = 0) {
    const spaces = ' '.repeat(indent * 2);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  - ${this.convertToYAML(item, indent + 1).trim()}\n`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.convertToYAML(value, indent + 1);
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }

  // Generate Jupyter configuration
  generateJupyterConfig(config = {}) {
    const jupyterConfig = { ...this.jupyterConfig };

    // Override with custom config
    Object.assign(jupyterConfig.NotebookApp, config);

    const configContent = `# Jupyter Configuration
c = get_config()

# NotebookApp settings
c.NotebookApp.ip = '${jupyterConfig.NotebookApp.ip}'
c.NotebookApp.port = ${jupyterConfig.NotebookApp.port}
c.NotebookApp.open_browser = ${jupyterConfig.NotebookApp.open_browser}
c.NotebookApp.allow_root = ${jupyterConfig.NotebookApp.allow_root}

# Security (set password hash)
c.NotebookApp.password = '${jupyterConfig.NotebookApp.password}'

# Extensions
${jupyterConfig.extensions.map((ext) => `# c.NotebookApp.nbserver_extensions.append('${ext}')`).join('\n')}
`;

    return configContent;
  }

  // Generate setup scripts
  async generateSetupScripts(templateName, outputDir = './data-science/generated') {
    console.log('📜 Generating data science setup scripts');

    const scripts = [];

    // Environment setup script
    const envSetupScript = `#!/bin/bash
# Data Science Environment Setup Script
echo "Setting up data science environment..."

# Create conda environment
echo "Creating conda environment..."
conda env create -f environment.yml

# Activate environment
echo "Activating environment..."
conda activate ${templateName}

# Install additional packages if needed
echo "Installing additional packages..."
pip install --upgrade pip

# Setup Jupyter
echo "Setting up Jupyter..."
jupyter notebook --generate-config
jupyter labextension install @jupyter-widgets/jupyterlab-manager

echo "Data science environment setup complete!"
echo "Activate with: conda activate ${templateName}"
echo "Start Jupyter with: jupyter lab"
`;

    await this.writeFile(`${outputDir}/setup-environment.sh`, envSetupScript);
    scripts.push('setup-environment.sh');

    // Docker build script
    const dockerBuildScript = `#!/bin/bash
# Docker Build Script for Data Science Environment
echo "Building data science Docker image..."

# Build the image
docker build -t data-science-${templateName}:latest -f Dockerfile.${templateName} .

# Tag the image
docker tag data-science-${templateName}:latest data-science-${templateName}:\$(date +%Y%m%d)

echo "Docker image built successfully!"
echo "Run with: docker run -p 8888:8888 data-science-${templateName}:latest"
`;

    await this.writeFile(`${outputDir}/build-docker.sh`, dockerBuildScript);
    scripts.push('build-docker.sh');

    // Run script
    const runScript = `#!/bin/bash
# Run Data Science Environment
echo "Starting data science environment..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Using Docker..."
    docker run -it --rm \\
        -p 8888:8888 \\
        -p 6006:6006 \\
        -v \$(pwd)/notebooks:/app/notebooks \\
        -v \$(pwd)/data:/app/data \\
        data-science-${templateName}:latest
else
    echo "Using local environment..."
    # Activate conda environment
    conda activate ${templateName}
    # Start Jupyter
    jupyter lab --ip=0.0.0.0 --port=8888 --no-browser
fi
`;

    await this.writeFile(`${outputDir}/run-environment.sh`, runScript);
    scripts.push('run-environment.sh');

    return scripts;
  }

  // Generate complete data science environment
  async generateDataScienceEnvironment(templateName, config = {}) {
    console.log('🏗️ Generating complete data science environment');

    const results = {
      dockerfile: null,
      environmentFile: '',
      requirementsFile: '',
      jupyterConfig: '',
      scripts: [],
      documentation: '',
    };

    // Generate Dockerfile
    results.dockerfile = await this.generateDockerfile(templateName, config);

    // Generate environment files
    results.environmentFile = this.generateEnvironmentFile(templateName, config);
    results.requirementsFile = this.generateRequirementsFile(templateName, config);

    // Generate Jupyter config
    results.jupyterConfig = this.generateJupyterConfig(config.jupyter || {});

    // Generate setup scripts
    results.scripts = await this.generateSetupScripts(templateName);

    // Generate documentation
    results.documentation = this.generateDocumentation(templateName, results);

    console.log('✅ Complete data science environment generated');
    return results;
  }

  // Generate documentation
  generateDocumentation(templateName, results) {
    const template = this.templates.get(templateName);

    const docs = `# Data Science Environment: ${template.name}

Generated on: ${new Date().toISOString()}

## Overview

This environment provides a complete data science setup with ${template.pythonVersion} and essential packages.

## Included Packages

### Core Data Science
${results.dockerfile.metadata.packages.conda.map((pkg) => `- ${pkg}`).join('\n')}

### Additional Libraries
${results.dockerfile.metadata.packages.pip.map((pkg) => `- ${pkg}`).join('\n')}

## Getting Started

### Using Docker (Recommended)

1. **Build the image**:
   \`\`\`bash
   ./build-docker.sh
   \`\`\`

2. **Run the environment**:
   \`\`\`bash
   ./run-environment.sh
   \`\`\`

3. **Access Jupyter Lab**:
   - Open http://localhost:8888 in your browser
   - No token required (for development only)

### Using Local Environment

1. **Setup the environment**:
   \`\`\`bash
   ./setup-environment.sh
   \`\`\`

2. **Activate and run**:
   \`\`\`bash
   conda activate ${templateName}
   jupyter lab
   \`\`\`

## Ports

- **8888**: Jupyter Lab
- **6006**: TensorBoard (if available)

## Volumes

- \`./notebooks\`: Jupyter notebooks directory
- \`./data\`: Data files directory
- \`./models\`: Trained models directory

## GPU Support

${results.dockerfile.metadata.gpu ? '✅ GPU support enabled' : '❌ GPU support not enabled'}

To enable GPU support, ensure you have:
- NVIDIA GPU
- NVIDIA Docker runtime installed
- Set \`gpu: true\` in configuration

## Customization

### Adding Packages

Edit \`requirements.txt\` to add Python packages:
\`\`\`
package-name==version
\`\`\`

### Custom Configuration

Modify the generated files:
- \`Dockerfile.${templateName}\`: Container configuration
- \`environment.yml\`: Conda environment
- \`jupyter_notebook_config.py\`: Jupyter settings

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Change port mapping in docker run command
   - Stop other services using the port

2. **GPU not detected**:
   - Install NVIDIA drivers
   - Install nvidia-docker2
   - Use --gpus all flag

3. **Package installation fails**:
   - Check internet connection
   - Clear conda/pip cache
   - Try installing packages individually

### Getting Help

- Check logs: \`docker logs <container_name>\`
- Jupyter logs: Available in container at \`/var/log/jupyter.log\`
- Conda info: \`conda info --envs\`

## Security Notes

- Default Jupyter configuration has no password (development only)
- Set strong passwords in production
- Use HTTPS in production environments
- Regularly update base images and packages
`;

    return docs;
  }

  // Write file (simulated)
  async writeFile(filename, content) {
    console.log(`📝 Writing file: ${filename}`);
    // In a real implementation, this would write to the filesystem
  }

  // Get setup status
  getSetupStatus() {
    return {
      isActive: this.isActive,
      availableTemplates: Array.from(this.templates.keys()),
      availablePackages: Array.from(this.packages.keys()),
      templateCount: this.templates.size,
      packageCount: this.packages.size,
    };
  }

  // Stop the setup
  stop() {
    this.isActive = false;
    console.log('⏹️ Data Science Setup stopped');
  }
}

// Export singleton instance
export const dataScienceSetup = new DataScienceSetup();

// Auto-initialize if running in Node.js environment
if (typeof window === 'undefined') {
  dataScienceSetup.initialize().catch(console.error);
}
