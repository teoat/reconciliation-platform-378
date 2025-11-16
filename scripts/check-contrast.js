#!/usr/bin/env node

/**
 * Color Contrast Checker Script
 * Analyzes color contrast ratios in the application
 * Ensures WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
 */

const fs = require('fs');
const path = require('path');

// Color contrast calculation (WCAG formula)
function getContrastRatio(color1, color2) {
  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

// Common color combinations from Tailwind config
const colorCombinations = [
  // Primary colors
  { foreground: '#3b82f6', background: '#ffffff', name: 'Primary on White' },
  { foreground: '#ffffff', background: '#3b82f6', name: 'White on Primary' },
  { foreground: '#2563eb', background: '#ffffff', name: 'Primary-600 on White' },
  { foreground: '#1d4ed8', background: '#ffffff', name: 'Primary-700 on White' },
  
  // Text colors
  { foreground: '#1f2937', background: '#ffffff', name: 'Gray-800 on White' },
  { foreground: '#4b5563', background: '#ffffff', name: 'Gray-600 on White' },
  { foreground: '#6b7280', background: '#ffffff', name: 'Gray-500 on White' },
  { foreground: '#ffffff', background: '#1f2937', name: 'White on Gray-800' },
  
  // Error/Warning colors
  { foreground: '#dc2626', background: '#ffffff', name: 'Red-600 on White' },
  { foreground: '#ffffff', background: '#dc2626', name: 'White on Red-600' },
  { foreground: '#f59e0b', background: '#ffffff', name: 'Amber-500 on White (DEPRECATED - use warning-600)' },
  { foreground: '#ffffff', background: '#f59e0b', name: 'White on Amber-500 (DEPRECATED - use warning-600)' },
  { foreground: '#d97706', background: '#ffffff', name: 'Warning-600 on White (DEPRECATED - use warning-700)' },
  { foreground: '#ffffff', background: '#d97706', name: 'White on Warning-600 (DEPRECATED - use warning-700)' },
  { foreground: '#b45309', background: '#ffffff', name: 'Warning-700 on White' },
  { foreground: '#ffffff', background: '#b45309', name: 'White on Warning-700' },
  
  // Background combinations
  { foreground: '#1f2937', background: '#f3f4f6', name: 'Gray-800 on Gray-100' },
  { foreground: '#374151', background: '#f9fafb', name: 'Gray-700 on Gray-50' },
];

function checkContrast(foreground, background, name) {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return { valid: false, error: 'Invalid color format' };
  }

  const ratio = getContrastRatio(fgRgb, bgRgb);
  const passesAA = ratio >= 4.5;
  const passesAALarge = ratio >= 3.0;
  const passesAAA = ratio >= 7.0;

  return {
    ratio: ratio.toFixed(2),
    passesAA,
    passesAALarge,
    passesAAA,
    level: passesAAA ? 'AAA' : passesAA ? 'AA' : 'FAIL',
  };
}

function generateReport() {
  console.log('Color Contrast Analysis Report\n');
  console.log('='.repeat(80));
  console.log('WCAG Standards:');
  console.log('  - Normal text: 4.5:1 (AA), 7:1 (AAA)');
  console.log('  - Large text: 3:1 (AA), 4.5:1 (AAA)');
  console.log('='.repeat(80));
  console.log('');

  const results = [];
  let passCount = 0;
  let failCount = 0;

  colorCombinations.forEach((combo) => {
    const result = checkContrast(combo.foreground, combo.background, combo.name);
    results.push({ ...combo, ...result });

    if (result.passesAA) {
      passCount++;
    } else {
      failCount++;
    }
  });

  // Print results
  results.forEach((result) => {
    const status = result.passesAA ? '✓' : '✗';
    const statusColor = result.passesAA ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(
      `${statusColor}${status}${resetColor} ${result.name.padEnd(30)} ` +
        `Ratio: ${result.ratio}:1  Level: ${result.level}`
    );

    if (!result.passesAA) {
      console.log(`  ⚠  Foreground: ${result.foreground}, Background: ${result.background}`);
    }
  });

  console.log('');
  console.log('='.repeat(80));
  console.log(`Summary: ${passCount} passed, ${failCount} failed`);
  console.log('='.repeat(80));

  // Save JSON report
  const reportPath = path.join(process.cwd(), 'accessibility-reports', 'contrast-report.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { passed: passCount, failed: failCount },
        results: results,
      },
      null,
      2
    )
  );

  console.log(`\nReport saved to: ${reportPath}`);

  return failCount === 0;
}

// Run the check
if (require.main === module) {
  const success = generateReport();
  process.exit(success ? 0 : 1);
}

module.exports = { checkContrast, generateReport };

