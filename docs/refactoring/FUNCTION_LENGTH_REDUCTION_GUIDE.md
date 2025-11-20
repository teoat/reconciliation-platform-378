# Function Length Reduction Guide

**Last Updated**: January 2025  
**Status**: Active

## Overview

This guide provides strategies for reducing function length by extracting logical blocks into smaller, focused functions.

## Function Length Targets

- **Ideal**: < 50 lines
- **Acceptable**: 50-100 lines
- **Review Required**: 100-200 lines
- **Must Refactor**: > 200 lines

## Refactoring Strategies

### 1. Extract Logical Blocks

**Before:**
```typescript
async function processFile(file: File) {
  // Validation (20 lines)
  if (!file) throw new Error('No file');
  if (file.size > MAX_SIZE) throw new Error('File too large');
  // ... more validation
  
  // Upload (30 lines)
  const formData = new FormData();
  formData.append('file', file);
  // ... upload logic
  
  // Processing (40 lines)
  const response = await fetch('/api/process', { /* ... */ });
  // ... processing logic
  
  // Response handling (20 lines)
  if (response.ok) {
    // ... success handling
  } else {
    // ... error handling
  }
}
```

**After:**
```typescript
async function processFile(file: File) {
  validateFile(file);
  const uploadResult = await uploadFile(file);
  const processed = await processUploadedFile(uploadResult);
  return handleProcessingResult(processed);
}

function validateFile(file: File): void { /* ... */ }
async function uploadFile(file: File): Promise<UploadResult> { /* ... */ }
async function processUploadedFile(result: UploadResult): Promise<ProcessedResult> { /* ... */ }
function handleProcessingResult(result: ProcessedResult): ProcessedFile { /* ... */ }
```

### 2. Extract Data Transformation

**Before:**
```typescript
function formatUserData(rawData: any) {
  // 80 lines of data transformation
  const formatted = {
    id: rawData.user_id,
    name: `${rawData.first_name} ${rawData.last_name}`,
    // ... many more transformations
  };
  return formatted;
}
```

**After:**
```typescript
function formatUserData(rawData: any): User {
  return {
    id: extractUserId(rawData),
    name: formatUserName(rawData),
    email: formatEmail(rawData),
    // ... other fields
  };
}

function extractUserId(data: any): string { /* ... */ }
function formatUserName(data: any): string { /* ... */ }
function formatEmail(data: any): string { /* ... */ }
```

### 3. Extract Error Handling

**Before:**
```typescript
async function fetchData() {
  try {
    // 50 lines of main logic
    const response = await fetch('/api/data');
    // ... processing
  } catch (error) {
    // 30 lines of error handling
    if (error instanceof NetworkError) {
      // ...
    } else if (error instanceof ValidationError) {
      // ...
    }
  }
}
```

**After:**
```typescript
async function fetchData() {
  try {
    return await performDataFetch();
  } catch (error) {
    return handleFetchError(error);
  }
}

async function performDataFetch(): Promise<Data> { /* ... */ }
function handleFetchError(error: unknown): Data { /* ... */ }
```

### 4. Extract Configuration Objects

**Before:**
```typescript
function createWidget(options: any) {
  // 100 lines with many configuration options
  const config = {
    width: options.width || 100,
    height: options.height || 50,
    // ... 20 more options
  };
  // ... widget creation logic
}
```

**After:**
```typescript
function createWidget(options: WidgetOptions) {
  const config = buildWidgetConfig(options);
  return buildWidget(config);
}

function buildWidgetConfig(options: WidgetOptions): WidgetConfig { /* ... */ }
function buildWidget(config: WidgetConfig): Widget { /* ... */ }
```

## Implementation Checklist

- [ ] Identify functions > 200 lines
- [ ] Identify functions > 100 lines
- [ ] Extract validation logic
- [ ] Extract data transformation
- [ ] Extract error handling
- [ ] Extract configuration building
- [ ] Extract API calls
- [ ] Extract UI rendering logic
- [ ] Test after each extraction
- [ ] Update documentation

---

**Status**: Guide created, ready for implementation

