# 🎯 **SSOT GUIDANCE DOCUMENT - SINGLE SOURCE OF TRUTH**

## 📋 **MANDATORY READING BEFORE ANY NEW DEVELOPMENT**

> ⚠️ **CRITICAL**: This document MUST be read and understood before adding any new files, features, or functions to the Reconciliation Platform. Failure to follow SSOT principles will result in code rejection.

---

## 🎯 **SSOT PRINCIPLES OVERVIEW**

### **Core SSOT Rules**
1. **ONE IMPLEMENTATION PER FEATURE** - Never duplicate functionality
2. **ONE LOCATION PER CONCEPT** - Each concept has exactly one authoritative source
3. **ONE RESPONSIBILITY PER FILE** - Each file serves one clear purpose
4. **ONE WAY TO DO THINGS** - Consistent patterns across the codebase
5. **ONE TRUTH SOURCE** - No conflicting information or implementations

---

## 📁 **SSOT DIRECTORY STRUCTURE**

### **MANDATORY PROJECT STRUCTURE**
```
reconciliation-platform/
├── frontend/                    # 🎨 SINGLE FRONTEND IMPLEMENTATION
│   ├── src/
│   │   ├── components/         # UI Components (SSOT)
│   │   ├── services/           # Business Logic Services (SSOT)
│   │   ├── hooks/              # React Hooks (SSOT)
│   │   ├── types/              # TypeScript Types (SSOT)
│   │   ├── utils/              # Utility Functions (SSOT)
│   │   └── styles/             # Styling (SSOT)
│   ├── package.json            # Frontend Dependencies (SSOT)
│   ├── vite.config.ts          # Build Configuration (SSOT)
│   └── tailwind.config.js      # Styling Configuration (SSOT)
│
├── backend/                     # 🦀 SINGLE BACKEND IMPLEMENTATION
│   ├── src/
│   │   ├── handlers/           # API Handlers (SSOT)
│   │   ├── services/           # Business Logic (SSOT)
│   │   ├── models/             # Data Models (SSOT)
│   │   ├── middleware/         # Middleware (SSOT)
│   │   ├── utils/              # Utilities (SSOT)
│   │   └── config/             # Configuration (SSOT)
│   ├── Cargo.toml              # Backend Dependencies (SSOT)
│   └── src/lib.rs              # Main Entry Point (SSOT)
│
├── infrastructure/              # 🏗️ SINGLE INFRASTRUCTURE SETUP
│   ├── docker/                 # Container Configuration (SSOT)
│   ├── k8s/                    # Kubernetes Configuration (SSOT)
│   ├── monitoring/             # Monitoring Setup (SSOT)
│   └── scripts/                # Deployment Scripts (SSOT)
│
├── docs/                        # 📚 SINGLE DOCUMENTATION SOURCE
│   ├── README.md               # Main Documentation (SSOT)
│   ├── ARCHITECTURE.md         # Architecture Guide (SSOT)
│   ├── API.md                  # API Documentation (SSOT)
│   ├── INFRASTRUCTURE.md       # Infrastructure Guide (SSOT)
│   └── SSOT_GUIDANCE.md        # This Document (SSOT)
│
├── tests/                       # 🧪 SINGLE TEST SUITE
│   ├── unit/                   # Unit Tests (SSOT)
│   ├── integration/            # Integration Tests (SSOT)
│   └── e2e/                    # End-to-End Tests (SSOT)
│
└── scripts/                     # 🔧 SINGLE SCRIPT COLLECTION
    ├── setup.sh                # Setup Script (SSOT)
    ├── deploy.sh               # Deployment Script (SSOT)
    ├── test.sh                 # Test Script (SSOT)
    └── backup.sh               # Backup Script (SSOT)
```

---

## 🚫 **FORBIDDEN ACTIONS - NEVER DO THESE**

### **❌ NEVER CREATE DUPLICATE DIRECTORIES**
```bash
# FORBIDDEN - Multiple frontend implementations
├── app/                    # ❌ FORBIDDEN
├── frontend-simple/        # ❌ FORBIDDEN  
├── components/             # ❌ FORBIDDEN (root level)
├── pages/                  # ❌ FORBIDDEN (root level)
├── hooks/                  # ❌ FORBIDDEN (root level)
├── services/               # ❌ FORBIDDEN (root level)
├── types/                  # ❌ FORBIDDEN (root level)
├── utils/                  # ❌ FORBIDDEN (root level)
```

### **❌ NEVER CREATE DUPLICATE FILES**
```bash
# FORBIDDEN - Multiple implementations of same functionality
├── Button.tsx              # ❌ FORBIDDEN (multiple locations)
├── Navigation.tsx          # ❌ FORBIDDEN (multiple locations)
├── AuthService.ts          # ❌ FORBIDDEN (multiple locations)
├── ApiClient.ts            # ❌ FORBIDDEN (multiple locations)
├── package.json            # ❌ FORBIDDEN (root level)
├── Dockerfile              # ❌ FORBIDDEN (multiple locations)
├── docker-compose.yml      # ❌ FORBIDDEN (multiple locations)
```

---

## ✅ **MANDATORY ACTIONS - ALWAYS DO THESE**

### **✅ ALWAYS CHECK BEFORE ADDING NEW FILES**

#### **Step 1: Verify SSOT Location**
```bash
# Before creating any new file, ask:
1. Does this functionality already exist?
2. Where is the SSOT location for this type of file?
3. Can I extend existing functionality instead?
4. Am I following the established patterns?
```

#### **Step 2: Use Correct SSOT Directory**
```bash
# Frontend Components
frontend/src/components/ui/           # Base UI components
frontend/src/components/layout/       # Layout components
frontend/src/components/forms/        # Form components
frontend/src/components/features/     # Feature-specific components

# Frontend Services
frontend/src/services/api/            # API communication
frontend/src/services/auth/           # Authentication
frontend/src/services/state/          # State management
frontend/src/services/utils/          # Utility services

# Backend Handlers
backend/src/handlers/                 # API endpoints

# Backend Services
backend/src/services/                 # Business logic

# Documentation
docs/                                 # All documentation
```

---

## 🎯 **CONCLUSION**

This SSOT Guidance Document is the **single source of truth** for all development practices in the Reconciliation Platform. Every developer, every feature, and every file must adhere to these principles to maintain the clean, efficient, and maintainable codebase we've achieved.

**Remember**: 
- 🎯 **One implementation per feature**
- 📁 **One location per concept**
- 🔧 **One responsibility per file**
- 📝 **One way to do things**
- ✅ **One truth source**

**The Reconciliation Platform's success depends on maintaining SSOT principles. Let's keep it clean, efficient, and maintainable!** 🚀

---

*This document is the SSOT for SSOT guidance. Any updates must be made here and communicated to all team members.*

**Last Updated**: $(date)
**Version**: 1.0
**Status**: ✅ Active and Mandatory
