# Contextual Help Content

**Last Updated**: January 2025  
**Status**: Active  
**Version**: 1.0.0

---

## Overview

This document provides contextual help text and tooltips that can be used throughout the Reconciliation Platform UI. These help texts are designed to be concise, actionable, and user-friendly.

---

## Authentication & Login

### Login Page
- **Email Field**: "Enter your registered email address"
- **Password Field**: "Enter your password. Forgot password? Click the link below."
- **Login Button**: "Sign in to access your reconciliation projects"
- **Forgot Password Link**: "Reset your password via email"

### Password Reset
- **Email Field**: "Enter your email address to receive reset instructions"
- **Reset Button**: "Check your email for password reset link"
- **Success Message**: "Password reset email sent. Check your inbox and spam folder."

---

## Dashboard

### Dashboard Overview
- **Welcome Message**: "Welcome back! Here's an overview of your reconciliation activities."
- **Project Summary**: "Total number of projects and active reconciliations"
- **Recent Activity**: "Your latest reconciliation jobs and updates"
- **Quick Actions**: "Common tasks: Create project, upload data, start reconciliation"

### Statistics Cards
- **Match Rate**: "Percentage of successfully matched records"
- **Processing Time**: "Average time to process reconciliation jobs"
- **Data Quality**: "Overall quality score based on validation rules"

---

## Project Management

### Create Project
- **Project Name**: "Enter a descriptive name for your reconciliation project"
- **Description**: "Optional: Describe the purpose and scope of this project"
- **Settings**: "Configure project-specific settings and preferences"
- **Save Button**: "Create project and proceed to file upload"

### Project List
- **Search**: "Search projects by name, description, or status"
- **Filter**: "Filter projects by status, date, or owner"
- **Sort**: "Sort projects by name, date, or status"
- **New Project**: "Create a new reconciliation project"

### Project Settings
- **General**: "Update project name, description, and basic settings"
- **Members**: "Manage team members and their access levels"
- **Rules**: "Configure matching rules and reconciliation settings"
- **Delete**: "Permanently delete this project and all associated data"

---

## File Upload

### Upload Interface
- **Drag & Drop**: "Drag files here or click to browse. Supported: CSV, JSON, Excel, Text"
- **File Selection**: "Select one or more files to upload"
- **File Size**: "Maximum file size: Check your subscription plan"
- **Upload Button**: "Upload and process selected files"

### Upload Progress
- **Processing**: "Your file is being processed. This may take a few minutes."
- **Success**: "File uploaded successfully. Ready for reconciliation."
- **Error**: "Upload failed. Check file format and try again."

### Supported Formats
- **CSV**: "Comma-separated values file"
- **JSON**: "JavaScript Object Notation file"
- **Excel**: "Microsoft Excel file (.xlsx, .xls)"
- **Text**: "Plain text file"

---

## Reconciliation

### Start Reconciliation
- **Select Files**: "Choose files to reconcile from your uploaded data"
- **Matching Rules**: "Configure how records should be matched"
- **Threshold**: "Set similarity threshold for fuzzy matching (0-100%)"
- **Start Button**: "Begin reconciliation process"

### Reconciliation Status
- **Pending**: "Reconciliation job is queued and waiting to start"
- **Processing**: "Reconciliation is in progress. This may take several minutes."
- **Complete**: "Reconciliation finished. Review results below."
- **Error**: "Reconciliation failed. Check error details and try again."

### Results View
- **Matches**: "Records that were successfully matched"
- **Discrepancies**: "Records with differences that need review"
- **Unmatched**: "Records that couldn't be matched"
- **Export**: "Download results in CSV, Excel, or PDF format"

---

## Analytics & Reporting

### Reports
- **Overview**: "Summary of reconciliation activities and metrics"
- **Detailed**: "Detailed breakdown by project, date, or category"
- **Custom**: "Create custom reports with specific filters and metrics"
- **Export**: "Download reports in various formats"

### Charts & Graphs
- **Match Rate**: "Percentage of successfully matched records over time"
- **Processing Time**: "Average processing time by project or date"
- **Data Quality**: "Data quality metrics and trends"
- **Volume**: "Data volume processed over time"

---

## Settings & Preferences

### User Profile
- **Name**: "Your display name shown to team members"
- **Email**: "Your email address for notifications and login"
- **Avatar**: "Upload a profile picture (optional)"
- **Save**: "Save profile changes"

### Preferences
- **Notifications**: "Configure how and when you receive notifications"
- **Language**: "Select your preferred language"
- **Timezone**: "Set your timezone for accurate timestamps"
- **Theme**: "Choose light or dark theme"

### Security
- **Change Password**: "Update your account password"
- **Two-Factor Auth**: "Enable two-factor authentication for added security"
- **Session Management**: "View and manage active sessions"
- **API Keys**: "Manage API keys for programmatic access"

---

## Collaboration

### Comments
- **Add Comment**: "Add a comment or note to this record"
- **Mention User**: "Mention a team member using @username"
- **Resolve**: "Mark this comment as resolved"
- **Delete**: "Remove this comment"

### Sharing
- **Share Project**: "Share this project with team members"
- **Permissions**: "Set access levels: View, Edit, or Admin"
- **Invite**: "Invite new team members via email"
- **Remove**: "Remove team member access"

---

## Error Messages

### Common Errors
- **Authentication Failed**: "Invalid email or password. Please try again."
- **File Upload Failed**: "File format not supported or file too large. Check requirements."
- **Processing Error**: "An error occurred during processing. Please try again or contact support."
- **Permission Denied**: "You don't have permission to perform this action."
- **Session Expired**: "Your session has expired. Please log in again."

### Helpful Error Guidance
- **What happened?**: Brief explanation of the error
- **What can I do?**: Actionable steps to resolve
- **Need help?**: Link to support or documentation

---

## Tooltips for Common UI Elements

### Buttons
- **Save**: "Save your changes"
- **Cancel**: "Discard changes and close"
- **Delete**: "Permanently delete this item"
- **Export**: "Download data in selected format"
- **Refresh**: "Reload current data"
- **Filter**: "Apply filters to current view"
- **Search**: "Search within current view"

### Icons
- **Help (?)**: "Get help with this feature"
- **Settings (⚙️)**: "Configure settings"
- **Notifications (🔔)**: "View notifications"
- **User (👤)**: "User menu and profile"
- **Logout (🚪)**: "Sign out of your account"

---

## Form Field Help

### Common Fields
- **Required Field**: "This field is required"
- **Email Format**: "Enter a valid email address"
- **Password Strength**: "Password must be at least 8 characters with letters and numbers"
- **Date Format**: "Enter date in MM/DD/YYYY format"
- **Number Range**: "Enter a number between X and Y"

---

## Implementation Notes

### Usage Guidelines
1. **Keep it concise**: Help text should be brief and scannable
2. **Be actionable**: Tell users what they can do, not just what something is
3. **Use plain language**: Avoid technical jargon when possible
4. **Provide context**: Explain why something is needed or how it helps
5. **Link to more info**: For complex topics, link to detailed documentation

### Placement
- **Tooltips**: Hover over icons or help icons (?)
- **Inline Help**: Below form fields or sections
- **Help Overlay**: Accessible via help button or keyboard shortcut
- **Contextual Panels**: Side panels or modals for detailed help

---

## Related Documentation

- [User Training Guide](../operations/USER_TRAINING_GUIDE.md) - Comprehensive user guide
- [User Quick Reference](./USER_QUICK_REFERENCE.md) - Quick reference guide
- [Troubleshooting](../operations/TROUBLESHOOTING.md) - Common issues and solutions

---

**Last Updated**: January 2025  
**Maintainer**: Documentation Team  
**Version**: 1.0.0

