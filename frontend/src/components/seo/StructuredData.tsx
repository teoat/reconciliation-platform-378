import React from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

/**
 * StructuredData Component
 *
 * Adds JSON-LD structured data for better search engine understanding.
 * Supports various schema.org types.
 *
 * @example
 * ```tsx
 * <StructuredData
 *   data={{
 *     '@context': 'https://schema.org',
 *     '@type': 'WebApplication',
 *     name: 'Reconciliation Platform',
 *     description: 'Financial reconciliation platform',
 *   }}
 * />
 * ```
 */

interface StructuredDataProps {
  /** JSON-LD structured data object */
  data: object;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} // Safe: JSON.stringify on trusted data
    />
  );
};

/**
 * Helper function to create WebApplication structured data
 */
export const createWebApplicationSchema = (data: {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: data.name,
    description: data.description,
    url: data.url,
    applicationCategory: data.applicationCategory || 'BusinessApplication',
    operatingSystem: data.operatingSystem || 'Web',
  };
};

/**
 * Helper function to create Organization structured data
 */
export const createOrganizationSchema = (data: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
  };
};
