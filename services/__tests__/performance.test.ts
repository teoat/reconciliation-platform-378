// Performance Testing Suite
// Comprehensive performance testing for all consolidated services

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { formService } from '../services/formService';
import { fileService } from '../services/fileService';
import { uiService } from '../services/uiService';
import { testingService } from '../services/testingService';

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Performance test utilities
const measurePerformance = async (fn: () => unknown) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

const createLargeFormData = (size: number) => {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < size; i++) {
    data[`field_${i}`] = `value_${i}`.repeat(10);
  }
  return data;
};

const createLargeFile = (sizeInMB: number) => {
  const content = 'x'.repeat(sizeInMB * 1024 * 1024);
  return new File([content], `test-${sizeInMB}mb.txt`, { type: 'text/plain' });
};

describe('Form Service Performance Tests', () => {
  beforeEach(() => {
    formService.clear();
  });

  afterEach(() => {
    formService.cleanup();
  });

  it('should handle large form data efficiently', async () => {
    const largeData = createLargeFormData(1000);

    const { duration } = await measurePerformance(async () => {
      return formService.saveFormData('large-form', largeData, {
        page: 'test-page',
        userId: 'user-123',
      });
    });

    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should validate many fields quickly', async () => {
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 100; i++) {
        formService.validateField(`field_${i}`, `value_${i}`, {
          fieldType: 'text',
          maxLength: 100,
          minLength: 1,
          isRequired: true,
        });
      }
    });

    expect(duration).toBeLessThan(50); // Should complete in under 50ms
  });

  it('should handle rapid button clicks efficiently', async () => {
    let clickCount = 0;
    const callback = () => {
      clickCount++;
    };

    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 100; i++) {
        formService.handleButtonClick('test-button', callback);
      }
    });

    expect(duration).toBeLessThan(10); // Should complete in under 10ms
    expect(clickCount).toBeLessThan(100); // Some clicks should be debounced
  });

  it('should manage multiple auto-save sessions', async () => {
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 50; i++) {
        formService.startAutoSave(
          `form_${i}`,
          { data: `value_${i}` },
          {
            page: 'test-page',
            userId: 'user-123',
          }
        );
      }
    });

    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });
});

describe('File Service Performance Tests', () => {
  beforeEach(() => {
    fileService.clear();
  });

  afterEach(() => {
    fileService.cleanup();
  });

  it('should handle large file uploads efficiently', async () => {
    const largeFile = createLargeFile(10); // 10MB file

    const { duration } = await measurePerformance(async () => {
      return fileService.startUpload(largeFile, {
        description: 'Large test file',
        projectId: 'project-123',
      });
    });

    expect(duration).toBeLessThan(500); // Should complete in under 500ms
  });

  it('should process multiple files concurrently', async () => {
    const files = Array.from(
      { length: 10 },
      (_, i) => createLargeFile(1) // 1MB files
    );

    const { duration } = await measurePerformance(async () => {
      const sessions = files.map((file) => fileService.startUpload(file));
      return sessions;
    });

    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });

  it('should manage file versions efficiently', async () => {
    const file = createLargeFile(5); // 5MB file

    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 20; i++) {
        fileService.createFileVersion(`file_${i}`, file, {
          description: `Version ${i}`,
          projectId: 'project-123',
        });
      }
    });

    expect(duration).toBeLessThan(300); // Should complete in under 300ms
  });

  it('should pause and resume uploads quickly', async () => {
    const file = createLargeFile(5); // 5MB file
    const session = fileService.startUpload(file);

    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 100; i++) {
        fileService.pauseUpload(session.id);
        fileService.resumeUpload(session.id);
      }
    });

    expect(duration).toBeLessThan(50); // Should complete in under 50ms
  });
});

describe('UI Service Performance Tests', () => {
  beforeEach(() => {
    uiService.clear();
  });

  afterEach(() => {
    uiService.cleanup();
  });

  it('should create themes quickly', async () => {
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 100; i++) {
        uiService.createTheme({
          name: `Theme ${i}`,
          type: 'light',
          colors: {
            primary: '#3b82f6',
            secondary: '#64748b',
            background: '#ffffff',
            surface: '#f8fafc',
            text: '#1e293b',
            textSecondary: '#64748b',
            border: '#e2e8f0',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#06b6d4',
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              base: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
              '2xl': '1.5rem',
              '3xl': '1.875rem',
            },
            lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
          },
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
          },
          borderRadius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
        });
      }
    });

    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  it('should calculate contrast ratios efficiently', async () => {
    const colorPairs = [
      ['#000000', '#ffffff'],
      ['#ff0000', '#00ff00'],
      ['#0000ff', '#ffff00'],
      ['#800080', '#ffff00'],
      ['#ffa500', '#000080'],
    ];

    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 1000; i++) {
        const pair = colorPairs[i % colorPairs.length];
        uiService.calculateContrast(pair[0], pair[1]);
      }
    });

    expect(duration).toBeLessThan(50); // Should complete in under 50ms
  });

  it('should toggle high contrast quickly', async () => {
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 1000; i++) {
        uiService.toggleHighContrast();
      }
    });

    expect(duration).toBeLessThan(10); // Should complete in under 10ms
  });

  it('should manage font size changes efficiently', async () => {
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 1000; i++) {
        uiService.setFontSize(12 + (i % 20));
      }
    });

    expect(duration).toBeLessThan(20); // Should complete in under 20ms
  });
});

describe('Testing Service Performance Tests', () => {
  beforeEach(() => {
    testingService.clear();
  });

  afterEach(() => {
    testingService.cleanup();
  });

  it('should run many tests efficiently', async () => {
    const tests = Array.from({ length: 100 }, (_, i) => ({
      id: `test-${i}`,
      test: async () => ({
        id: `test-${i}`,
        name: `Test ${i}`,
        success: true,
        message: `Test ${i} passed`,
        timestamp: new Date(),
        duration: 10,
        category: 'integration' as const,
        priority: 'high' as const,
      }),
    }));

    const { duration } = await measurePerformance(async () => {
      return testingService.runTestSuite('performance-suite', tests);
    });

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle test timeouts efficiently', async () => {
    const slowTest = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second delay
      return {
        id: 'slow-test',
        name: 'Slow Test',
        success: true,
        message: 'Slow test passed',
        timestamp: new Date(),
        duration: 2000,
        category: 'integration' as const,
        priority: 'high' as const,
      };
    };

    const { duration } = await measurePerformance(async () => {
      return testingService.runTest('slow-test', slowTest);
    });

    expect(duration).toBeLessThan(5000); // Should timeout and complete in under 5 seconds
  });

  it('should manage test results efficiently', async () => {
    // Add many test results
    const { duration } = await measurePerformance(async () => {
      for (let i = 0; i < 1000; i++) {
        testingService.set(`test-${i}`, {
          id: `test-${i}`,
          name: `Test ${i}`,
          success: i % 2 === 0,
          message: `Test ${i} ${i % 2 === 0 ? 'passed' : 'failed'}`,
          timestamp: new Date(),
          duration: 10,
          category: 'integration',
          priority: 'high',
        });
      }
    });

    expect(duration).toBeLessThan(100); // Should complete in under 100ms

    // Test statistics calculation
    const { duration: statsDuration } = await measurePerformance(async () => {
      return testingService.getTestStatistics();
    });

    expect(statsDuration).toBeLessThan(10); // Should complete in under 10ms
  });
});

describe('Memory Usage Tests', () => {
  it('should not leak memory with form service', async () => {
    const initialMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;

    // Create and destroy many form data entries
    for (let i = 0; i < 1000; i++) {
      const id = formService.saveFormData(
        `form-${i}`,
        { data: `value-${i}` },
        {
          page: 'test-page',
          userId: 'user-123',
        }
      );
      formService.deleteFormData(`form-${i}`);
    }

    formService.cleanup();

    const finalMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });

  it('should not leak memory with file service', async () => {
    const initialMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;

    // Create and destroy many file upload sessions
    for (let i = 0; i < 100; i++) {
      const file = createLargeFile(1); // 1MB file
      const session = fileService.startUpload(file);
      fileService.cancelUpload(session.id);
    }

    fileService.cleanup();

    const finalMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('should not leak memory with UI service', async () => {
    const initialMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;

    // Create and destroy many themes
    for (let i = 0; i < 1000; i++) {
      const themeId = uiService.createTheme({
        name: `Theme ${i}`,
        type: 'light',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          error: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#06b6d4',
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        borderRadius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      });
      uiService.delete(themeId);
    }

    uiService.cleanup();

    const finalMemory =
      (performance as Performance & { memory: PerformanceMemory }).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (less than 1MB)
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
});

describe('Concurrent Operations Tests', () => {
  it('should handle concurrent form operations', async () => {
    const operations = Array.from({ length: 100 }, (_, i) =>
      formService.saveFormData(
        `form-${i}`,
        { data: `value-${i}` },
        {
          page: 'test-page',
          userId: 'user-123',
        }
      )
    );

    const { duration } = await measurePerformance(async () => {
      await Promise.all(operations);
    });

    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });

  it('should handle concurrent file operations', async () => {
    const files = Array.from({ length: 50 }, (_, i) => createLargeFile(1));

    const { duration } = await measurePerformance(async () => {
      const sessions = files.map((file) => fileService.startUpload(file));
      await Promise.all(sessions);
    });

    expect(duration).toBeLessThan(500); // Should complete in under 500ms
  });

  it('should handle concurrent UI operations', async () => {
    const operations = Array.from({ length: 100 }, (_, i) =>
      uiService.createTheme({
        name: `Theme ${i}`,
        type: 'light',
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          error: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          info: '#06b6d4',
        },
        typography: {
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          lineHeight: { tight: '1.25', normal: '1.5', relaxed: '1.75' },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        borderRadius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      })
    );

    const { duration } = await measurePerformance(async () => {
      await Promise.all(operations);
    });

    expect(duration).toBeLessThan(200); // Should complete in under 200ms
  });
});
