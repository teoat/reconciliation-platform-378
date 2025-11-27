/**
 * Report Export Service
 * Handles exporting reports to PDF, CSV, and XLSX formats
 */

import { logger } from './logger';
import type { CustomReport, ReportData } from '../components/reports/types';

class ReportExportService {
  /**
   * Export report as CSV
   */
  async exportToCSV(report: CustomReport, reportData: ReportData): Promise<void> {
    try {
      const headers = ['Metric', 'Value'];
      const rows = Object.entries(reportData.metrics).map(([key, value]) => {
        const metric = report.metrics.find((m) => m.id === key);
        return [metric?.name || key, String(value)];
      });

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      this.downloadBlob(blob, `${report.name.replace(/\s+/g, '_')}.csv`);
    } catch (error) {
      logger.error('Error exporting to CSV', { error });
      throw error;
    }
  }

  /**
   * Export report as XLSX
   */
  async exportToXLSX(report: CustomReport, reportData: ReportData): Promise<void> {
    try {
      // For XLSX, we'll create a simple CSV-like structure
      // In production, use a library like 'xlsx' or 'exceljs'
      const headers = ['Metric', 'Value'];
      const rows = Object.entries(reportData.metrics).map(([key, value]) => {
        const metric = report.metrics.find((m) => m.id === key);
        return [metric?.name || key, String(value)];
      });

      // Create TSV format (tab-separated) which Excel can open
      const tsvContent = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
      const blob = new Blob([tsvContent], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      this.downloadBlob(blob, `${report.name.replace(/\s+/g, '_')}.xlsx`);
    } catch (error) {
      logger.error('Error exporting to XLSX', { error });
      throw error;
    }
  }

  /**
   * Export report as PDF
   */
  async exportToPDF(report: CustomReport, reportData: ReportData): Promise<void> {
    try {
      // For PDF, create an HTML document and use browser print
      // In production, use a library like 'jsPDF' or 'pdfkit'
      const htmlContent = this.generatePDFHTML(report, reportData);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      } else {
        // Fallback: download as HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        this.downloadBlob(blob, `${report.name.replace(/\s+/g, '_')}.html`);
      }
    } catch (error) {
      logger.error('Error exporting to PDF', { error });
      throw error;
    }
  }

  /**
   * Generate HTML content for PDF
   */
  private generatePDFHTML(report: CustomReport, reportData: ReportData): string {
    const metricsHTML = Object.entries(reportData.metrics)
      .map(([key, value]) => {
        const metric = report.metrics.find((m) => m.id === key);
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${metric?.name || key}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${value}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f2f2f2; padding: 8px; border: 1px solid #ddd; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${report.name}</h1>
          <p>${report.description}</p>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              ${metricsHTML}
            </tbody>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </body>
      </html>
    `;
  }

  /**
   * Download blob as file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const reportExportService = new ReportExportService();

