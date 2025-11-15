# Brand Guidelines - 378 Data and Evidence Reconciliation App

## Overview
This document outlines the brand guidelines for the **378 Data and Evidence Reconciliation App**. These guidelines ensure consistent brand representation across all platforms, communications, and materials.

## Brand Name
- **Official Name**: 378 Data and Evidence Reconciliation App
- **Short Name**: 378 Reconciliation App
- **Package Name**: 378-data-evidence-reconciliation-app

## Brand Identity

### Mission
To provide a comprehensive, reliable, and efficient platform for data and evidence reconciliation, enabling organizations to match, analyze, and validate data with precision.

### Vision
To be the leading solution for data reconciliation across industries, known for accuracy, performance, and user-friendly design.

### Core Values
- **Accuracy**: Precise data matching and validation
- **Reliability**: Dependable platform performance
- **Efficiency**: Streamlined reconciliation workflows
- **Transparency**: Clear audit trails and reporting
- **Security**: Protected data and privacy

## Visual Identity

### Color Palette
- **Primary Blue**: #3B82F6 (Tailwind blue-500)
- **Secondary Colors**:
  - Success Green: #10B981 (green-500)
  - Warning Yellow: #F59E0B (yellow-500)
  - Error Red: #EF4444 (red-500)
  - Neutral Gray: #6B7280 (gray-500)
- **Background Colors**:
  - Light: #F8FAFC (slate-50)
  - Dark: #1E293B (slate-800)

### Typography
- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: JetBrains Mono (for code/data display)
- **Font Weights**: 
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

### Logo Guidelines
- **Logo Files Location**: `/public/logos/`
- **Main Logo**: `logo-main.svg`
- **Compact Logo**: `logo-compact.svg`
- **Dark Mode Variants**: `logo-dark-main.svg`, `logo-dark-compact.svg`
- **Monochrome Variants**: `logo-monochrome-main.svg`, `logo-monochrome-compact.svg`
- **Animated Variants**: `logo-animated-main.svg`, `logo-animated-compact.svg`

#### Logo Usage
- Minimum size: 32px height
- Clear space: Equal to the height of the "378" in the logo
- Do not stretch, skew, or alter colors
- Use dark variants on light backgrounds
- Use light/main variants on dark backgrounds

### Icons
- **Style**: Lucide React icons
- **Size**: 16px, 20px, 24px standard sizes
- **Stroke Width**: 2px
- **Color**: Match theme colors

## Brand Voice and Tone

### Voice Characteristics
- Professional yet approachable
- Clear and concise
- Technical when necessary, but accessible
- Confident but not arrogant

### Tone Guidelines
- **In Documentation**: Educational, thorough, helpful
- **In UI**: Action-oriented, clear, supportive
- **In Marketing**: Value-focused, professional, trustworthy
- **In Error Messages**: Helpful, apologetic, solution-oriented

## Naming Conventions

### Application Name Usage
Always use the full name "378 Data and Evidence Reconciliation App" in:
- Official documentation
- Legal documents
- Marketing materials
- App store listings
- Initial page loads

Use shortened "378 Reconciliation App" in:
- UI headers (when space is limited)
- Email subjects
- Social media posts

### Package Naming
- Frontend: `378-data-evidence-reconciliation-app`
- Backend: `378-data-evidence-backend`
- npm/yarn packages: Use kebab-case with "378-" prefix

### URL and Domain
- Production: `https://378-data-reconciliation.com`
- Staging: `https://staging.378-data-reconciliation.com`
- Development: `http://localhost:1000`

### Email Addresses
- General: `info@378-data-reconciliation.com`
- Support: `support@378-data-reconciliation.com`
- No-reply: `noreply@378-data-reconciliation.com`

## Brand Assets

### Required Assets
All required brand assets must be present in the repository:

1. **Logos** (in `/public/logos/`)
   - logo-main.svg
   - logo-compact.svg
   - logo-dark-main.svg
   - logo-dark-compact.svg
   - logo-monochrome-main.svg
   - logo-monochrome-compact.svg
   - logo-animated-main.svg
   - logo-animated-compact.svg

2. **Favicons** (in `/public/`)
   - favicon-32x32.svg
   - favicon-16x16.svg
   - favicon.ico

3. **Error Pages** (in `/public/`)
   - 404.html
   - 500.html
   - offline.html

4. **Email Templates** (in `/email-templates/`)
   - welcome-email.html
   - password-reset.html

## Usage Examples

### Correct Usage
✅ "Welcome to 378 Data and Evidence Reconciliation App"
✅ "Package name: 378-data-evidence-reconciliation-app"
✅ "Contact: support@378-data-reconciliation.com"
✅ "Visit us at https://378-data-reconciliation.com"

### Incorrect Usage
❌ "Reconciliation App" (too generic, missing brand identifier)
❌ "reconciliation-app" (old package name)
❌ "support@reconciliation.com" (old domain)
❌ "Data Reconciliation 378" (wrong order)

## Brand Compliance

All materials, code, documentation, and communications must comply with these guidelines. Regular brand consistency checks are performed via CI/CD pipelines to ensure adherence.

### Automated Checks
The repository includes automated brand consistency checks that verify:
- Correct app name usage
- Proper package naming
- Email domain consistency
- Logo file presence
- Documentation accuracy

### Review Process
All pull requests must pass brand consistency checks before merging.

## Contact
For questions about brand guidelines, contact the brand team at `brand@378-data-reconciliation.com`

---

**Last Updated**: November 2024
**Version**: 1.0.0
