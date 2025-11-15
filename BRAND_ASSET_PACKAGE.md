# Brand Asset Package - 378 Data and Evidence Reconciliation App

## Overview
This document provides a comprehensive inventory and guidelines for all brand assets used in the 378 Data and Evidence Reconciliation App.

## Asset Structure

```
/
├── public/
│   ├── logos/
│   │   ├── logo-main.svg
│   │   ├── logo-compact.svg
│   │   ├── logo-dark-main.svg
│   │   ├── logo-dark-compact.svg
│   │   ├── logo-monochrome-main.svg
│   │   ├── logo-monochrome-compact.svg
│   │   ├── logo-animated-main.svg
│   │   └── logo-animated-compact.svg
│   ├── favicon-32x32.svg
│   ├── favicon-16x16.svg
│   ├── favicon.ico
│   ├── manifest.json
│   ├── 404.html
│   ├── 500.html
│   └── offline.html
├── email-templates/
│   ├── welcome-email.html
│   └── password-reset.html
└── BRAND_GUIDELINES.md
```

## Logo Assets

### Main Logo (logo-main.svg)
- **Purpose**: Primary branding, headers, marketing materials
- **Dimensions**: Scalable SVG
- **Color**: Primary brand colors
- **Usage**: Main navigation, landing pages, documentation headers

### Compact Logo (logo-compact.svg)
- **Purpose**: Mobile navigation, favicons, small spaces
- **Dimensions**: Square aspect ratio
- **Color**: Primary brand colors
- **Usage**: Mobile headers, app icons, compact layouts

### Dark Mode Variants
- **logo-dark-main.svg**: Dark mode version of main logo
- **logo-dark-compact.svg**: Dark mode version of compact logo
- **Usage**: Dark theme interfaces, presentations on dark backgrounds

### Monochrome Variants
- **logo-monochrome-main.svg**: Single color version (black/white)
- **logo-monochrome-compact.svg**: Single color compact version
- **Usage**: Print materials, watermarks, low-color contexts

### Animated Variants
- **logo-animated-main.svg**: Animated main logo
- **logo-animated-compact.svg**: Animated compact logo
- **Usage**: Loading screens, splash pages, promotional materials

## Favicon Assets

### favicon-32x32.svg
- **Dimensions**: 32x32 pixels
- **Format**: SVG
- **Usage**: Browser tabs, bookmarks
- **Required**: Yes

### favicon-16x16.svg
- **Dimensions**: 16x16 pixels
- **Format**: SVG
- **Usage**: Browser tabs at smaller sizes
- **Required**: Yes

### favicon.ico
- **Dimensions**: Multi-size (16x16, 32x32, 48x48)
- **Format**: ICO
- **Usage**: Legacy browser support
- **Required**: Yes

## Application Metadata

### manifest.json
Contains PWA metadata including:
```json
{
  "name": "378 Data and Evidence Reconciliation App",
  "short_name": "378 Reconciliation",
  "description": "A comprehensive data and evidence reconciliation application",
  "theme_color": "#3B82F6",
  "background_color": "#F8FAFC",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "/favicon-32x32.svg",
      "sizes": "32x32",
      "type": "image/svg+xml"
    },
    {
      "src": "/favicon-16x16.svg",
      "sizes": "16x16",
      "type": "image/svg+xml"
    }
  ]
}
```

## Error Pages

### 404.html
- **Purpose**: Page not found errors
- **Branding**: Must include app name and logo
- **Content**: Helpful error message and navigation links
- **Required**: Yes

### 500.html
- **Purpose**: Server error pages
- **Branding**: Must include app name and logo
- **Content**: Error explanation and support contact
- **Required**: Yes

### offline.html
- **Purpose**: Offline mode fallback
- **Branding**: Must include app name and logo
- **Content**: Offline status message and cached features
- **Required**: Yes

## Email Templates

### welcome-email.html
- **Purpose**: New user welcome emails
- **Branding Requirements**:
  - Include logo in header
  - Use brand colors
  - Include app name in subject and body
  - Footer with proper contact information
- **Required**: Yes

### password-reset.html
- **Purpose**: Password reset emails
- **Branding Requirements**:
  - Include logo in header
  - Use brand colors
  - Clear security messaging
  - Footer with support contact
- **Required**: Yes

## Asset Requirements

### SVG Logo Specifications
All SVG logos must:
- Be valid XML/SVG format
- Include viewport and viewBox attributes
- Use semantic IDs and classes
- Be optimized (no unnecessary metadata)
- Include accessibility attributes (title, desc)
- Support dark mode via CSS variables where applicable

### Image Optimization
- SVG files: Minified and optimized
- Raster images: Compressed (WebP preferred)
- Icons: Consistent stroke width (2px)
- Colors: Use brand color variables

### File Naming Conventions
- Use kebab-case: `logo-dark-main.svg`
- Descriptive names: `favicon-32x32.svg`
- Version suffixes when needed: `logo-v2.svg`
- No spaces or special characters

## Asset Validation

### Automated Checks
The CI/CD pipeline validates:
1. **Logo file presence**: All required logos exist
2. **SVG syntax**: Valid XML structure
3. **File sizes**: Within acceptable limits
4. **Brand consistency**: Correct naming and references

### Manual Review Checklist
- [ ] Logo displays correctly at various sizes
- [ ] Colors match brand guidelines
- [ ] Dark mode variants work properly
- [ ] Favicons render in all major browsers
- [ ] Error pages display correctly
- [ ] Email templates render in major email clients

## Asset Generation

### Creating Logo Variants
When creating new logo variants:
1. Start with the main logo source file
2. Apply appropriate color transformations
3. Optimize and minify SVG
4. Test at multiple sizes
5. Validate with xmllint
6. Update this documentation

### Tools
- **SVG Optimization**: SVGO, SVGCleaner
- **Validation**: xmllint, SVG validators
- **Testing**: Multiple browsers and email clients
- **Version Control**: Git with LFS for large assets

## Asset Distribution

### Internal Use
Assets are version-controlled in the repository:
- `/public/logos/` - Logo files
- `/public/` - Favicons and manifests
- `/email-templates/` - Email templates

### External Distribution
For external partners or marketing:
1. Package assets in a ZIP file
2. Include brand guidelines PDF
3. Include usage examples
4. Provide contact for questions

## Accessibility

All visual assets must meet accessibility standards:
- **Logos**: Include descriptive alt text
- **Icons**: ARIA labels where applicable
- **Color Contrast**: WCAG AA compliance minimum
- **Screen Readers**: Proper semantic markup

## Maintenance

### Regular Updates
- Review assets quarterly
- Update version numbers
- Check for broken links
- Validate against brand guidelines
- Test in new browser versions

### Deprecation Process
When deprecating assets:
1. Mark as deprecated in documentation
2. Provide replacement asset
3. Update references in code
4. Maintain for 2 versions
5. Remove and archive

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 2024 | Initial brand asset package |

## Contact

For brand asset questions or requests:
- Email: `brand@378-data-reconciliation.com`
- Documentation: See `BRAND_GUIDELINES.md`
- Issues: File in GitHub repository

---

**Note**: This is a living document. All brand assets must be reviewed and approved by the brand team before use in production.
