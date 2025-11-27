# API Client SDK Generation Guide

**Last Updated**: 2025-11-26  
**Status**: Active

## Overview

This guide explains how to generate client SDKs from the OpenAPI specification for the Reconciliation Platform API.

## Available Tools

### 1. OpenAPI Generator

[OpenAPI Generator](https://openapi-generator.tech/) supports 50+ client languages.

#### Installation

```bash
# Using Homebrew (macOS)
brew install openapi-generator

# Using npm
npm install -g @openapi-generator-plus/cli

# Using Docker
docker pull openapitools/openapi-generator-cli
```

#### Generate Client SDK

```bash
# Generate TypeScript client
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g typescript-axios \
  -o ./generated-clients/typescript

# Generate Python client
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g python \
  -o ./generated-clients/python

# Generate Rust client
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g rust \
  -o ./generated-clients/rust

# Generate JavaScript client
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g javascript \
  -o ./generated-clients/javascript
```

### 2. Swagger Codegen

[Swagger Codegen](https://swagger.io/tools/swagger-codegen/) is the original code generator.

#### Installation

```bash
# Download JAR file
wget https://repo1.maven.org/maven2/io/swagger/swagger-codegen-cli/3.0.0/swagger-codegen-cli-3.0.0.jar
```

#### Generate Client SDK

```bash
java -jar swagger-codegen-cli.jar generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -l typescript-axios \
  -o ./generated-clients/typescript
```

### 3. TypeScript-Specific Tools

#### openapi-typescript-codegen

```bash
npm install -g openapi-typescript-codegen

openapi-typescript-codegen \
  --input http://localhost:2000/api-docs/openapi.json \
  --output ./generated-clients/typescript
```

#### orval

```bash
npm install -g orval

# Create orval.config.js
cat > orval.config.js << EOF
module.exports = {
  api: {
    input: 'http://localhost:2000/api-docs/openapi.json',
    output: {
      target: './generated-clients/typescript/api.ts',
      client: 'axios',
    },
  },
};
EOF

orval
```

## Recommended Workflow

### 1. Start Backend Server

```bash
cd backend
cargo run
```

### 2. Verify OpenAPI Endpoint

```bash
curl http://localhost:2000/api-docs/openapi.json | jq .info
```

### 3. Generate Client SDK

Choose your preferred tool and language:

```bash
# TypeScript (recommended for frontend)
openapi-generator generate \
  -i http://localhost:2000/api-docs/openapi.json \
  -g typescript-axios \
  -o ./frontend/src/generated/api-client \
  --additional-properties=supportsES6=true,withInterfaces=true
```

### 4. Integrate Generated Client

```typescript
// frontend/src/services/api.ts
import { Configuration, DefaultApi } from './generated/api-client';

const config = new Configuration({
  basePath: process.env.REACT_APP_API_URL || 'http://localhost:2000/api/v1',
  accessToken: () => localStorage.getItem('token') || '',
});

export const apiClient = new DefaultApi(config);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Generate API Client

on:
  push:
    branches: [main]
    paths:
      - 'backend/src/api/openapi.rs'
      - 'backend/src/handlers/**'

jobs:
  generate-client:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start backend server
        run: |
          cd backend
          cargo build
          cargo run &
          sleep 10
      
      - name: Generate TypeScript client
        run: |
          docker run --rm \
            -v ${PWD}:/local \
            openapitools/openapi-generator-cli generate \
            -i http://localhost:2000/api-docs/openapi.json \
            -g typescript-axios \
            -o /local/frontend/src/generated/api-client
      
      - name: Commit generated client
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add frontend/src/generated/api-client
          git commit -m "Update generated API client" || exit 0
          git push
```

## Best Practices

1. **Version Control**: Commit generated clients to version control for reproducibility
2. **Automation**: Generate clients automatically in CI/CD pipeline
3. **Type Safety**: Use TypeScript clients for type-safe API calls
4. **Documentation**: Keep client generation scripts in `scripts/` directory
5. **Testing**: Test generated clients against actual API endpoints

## Supported Languages

- TypeScript/JavaScript
- Python
- Rust
- Go
- Java
- C#
- PHP
- Ruby
- Swift
- Kotlin
- And 40+ more...

## Related Documentation

- [OpenAPI Setup](../api/OPENAPI_SETUP.md)
- [API Versioning Strategy](./API_VERSIONING_STRATEGY.md)
- [RESTful API Conventions](../../.cursor/rules/api-conventions.mdc)

---

**Status**: ✅ Ready for use  
**Last Updated**: 2025-11-26

