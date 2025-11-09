import React from 'react'

export { default as AuthPage } from '../../frontend/src/pages/AuthPage'
export { default as ReconciliationPage } from '../../frontend/src/pages/ReconciliationPage'

// Placeholder exports for missing pages - these will need to be created
export const ProjectSelectionPage: React.FC<any> = () => React.createElement('div', null, 'Project Selection Page - Coming Soon')
export const IngestionPage: React.FC<any> = () => React.createElement('div', null, 'Ingestion Page - Coming Soon')
export const AdjudicationPage: React.FC<any> = () => React.createElement('div', null, 'Adjudication Page - Coming Soon')
export const VisualizationPage: React.FC<any> = () => React.createElement('div', null, 'Visualization Page - Coming Soon')
export const PresummaryPage: React.FC<any> = () => React.createElement('div', null, 'Presummary Page - Coming Soon')
export const CashflowEvaluationPage: React.FC<any> = () => React.createElement('div', null, 'Cashflow Evaluation Page - Coming Soon')
export const SummaryExportPage: React.FC<any> = () => React.createElement('div', null, 'Summary Export Page - Coming Soon')