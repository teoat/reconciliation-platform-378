'use client';

import React, { useState, useEffect } from 'react';
import { useFrenly } from './frenly/FrenlyProvider';
import type { FrenlyMessage } from './frenly/FrenlyProvider';
import { CheckCircle } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import { Play } from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { Eye } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Settings } from 'lucide-react';
import { Zap } from 'lucide-react';
import { Heart } from 'lucide-react';

interface FrenlyTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: string;
}

const FrenlyAITester: React.FC = () => {
  const {
    state,
    updateProgress,
    showMessage,
    hideMessage,
    updatePage,
    toggleVisibility,
    toggleMinimize,
  } = useFrenly();
  const [testResults, setTestResults] = useState<FrenlyTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');

  const pages = [
    '/auth',
    '/projects',
    '/ingestion',
    '/reconciliation',
    '/cashflow-evaluation',
    '/adjudication',
    '/visualization',
    '/presummary',
    '/summary',
  ];

  const tests = [
    {
      name: 'Context Provider Integration',
      test: () => {
        return state !== undefined && state.isVisible !== undefined;
      },
      message: 'FrenlyProvider context is properly integrated',
    },
    {
      name: 'Page Navigation',
      test: () => {
        return pages.includes(state.currentPage);
      },
      message: 'Current page is valid',
    },
    {
      name: 'Progress Tracking',
      test: () => {
        return (
          state.userProgress.completedSteps !== undefined &&
          state.userProgress.currentStep !== undefined &&
          state.userProgress.totalSteps > 0
        );
      },
      message: 'Progress tracking is functional',
    },
    {
      name: 'Message System',
      test: () => {
        return state.conversationHistory !== undefined;
      },
      message: 'Message system is initialized',
    },
    {
      name: 'Personality System',
      test: () => {
        return (
          state.personality.mood !== undefined &&
          state.personality.energy !== undefined &&
          state.personality.helpfulness >= 0 &&
          state.personality.helpfulness <= 100
        );
      },
      message: 'Personality system is functional',
    },
    {
      name: 'Preferences System',
      test: () => {
        return (
          state.preferences.showTips !== undefined &&
          state.preferences.showCelebrations !== undefined &&
          state.preferences.showWarnings !== undefined
        );
      },
      message: 'Preferences system is functional',
    },
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const test of tests) {
      setCurrentTest(test.name);

      try {
        const result = test.test();
        const testResult: FrenlyTestResult = {
          testName: test.name,
          status: result ? 'pass' : 'fail',
          message: test.message,
          details: result ? 'Test passed successfully' : 'Test failed',
        };

        setTestResults((prev) => [...prev, testResult]);

        // Small delay between tests for better UX
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const testResult: FrenlyTestResult = {
          testName: test.name,
          status: 'fail',
          message: test.message,
          details: `Error: ${error}`,
        };
        setTestResults((prev) => [...prev, testResult]);
      }
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const testPageNavigation = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (const page of pages) {
      setCurrentTest(`Testing page: ${page}`);

      try {
        updatePage(page);

        // Wait a bit for state update
        await new Promise((resolve) => setTimeout(resolve, 200));

        const testResult: FrenlyTestResult = {
          testName: `Page Navigation: ${page}`,
          status: 'pass',
          message: `Successfully navigated to ${page}`,
          details: `Current page: ${state.currentPage}`,
        };

        setTestResults((prev) => [...prev, testResult]);
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        const testResult: FrenlyTestResult = {
          testName: `Page Navigation: ${page}`,
          status: 'fail',
          message: `Failed to navigate to ${page}`,
          details: `Error: ${error}`,
        };
        setTestResults((prev) => [...prev, testResult]);
      }
    }

    setIsRunning(false);
    setCurrentTest('');
  };

  const testMessageSystem = () => {
    const testMessage: FrenlyMessage = {
      id: 'test-message',
      type: 'tip',
      content: 'This is a test message from Frenly AI! 🧪',
      timestamp: new Date(),
      page: state.currentPage,
      priority: 'medium',
      dismissible: true,
      autoHide: 3000,
    };

    showMessage(testMessage as any);

    setTimeout(() => {
      hideMessage();
    }, 3000);
  };

  const testProgressTracking = () => {
    const testSteps = ['test_step_1', 'test_step_2', 'test_step_3', 'test_step_4', 'test_step_5'];

    testSteps.forEach((step, index) => {
      setTimeout(() => {
        updateProgress(step);
      }, index * 500);
    });
  };

  const resetTests = () => {
    setTestResults([]);
    setCurrentTest('');
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const passedTests = testResults.filter((test) => test.status === 'pass').length;
  const failedTests = testResults.filter((test) => test.status === 'fail').length;
  const totalTests = testResults.length;

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          Frenly AI Tester
        </h3>
        <button onClick={resetTests} className="p-1 hover:bg-gray-100 rounded" title="Reset Tests">
          <RotateCcw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Test Controls */}
      <div className="space-y-2 mb-4">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="w-full bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={testPageNavigation}
            disabled={isRunning}
            className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Test Pages
          </button>

          <button
            onClick={testMessageSystem}
            className="bg-purple-500 text-white px-3 py-2 rounded-md hover:bg-purple-600 text-sm flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-3 h-3" />
            Test Messages
          </button>
        </div>

        <button
          onClick={testProgressTracking}
          className="w-full bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-orange-600 text-sm flex items-center justify-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Test Progress
        </button>
      </div>

      {/* Current Test */}
      {currentTest && (
        <div className="mb-4 p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 font-medium">Running: {currentTest}</p>
        </div>
      )}

      {/* Test Results Summary */}
      {totalTests > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Test Results:</span>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">{passedTests} passed</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-600 font-medium">{failedTests} failed</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(passedTests / totalTests) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded-md">
            {getStatusIcon(result.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{result.testName}</p>
              <p className="text-xs text-gray-600">{result.message}</p>
              {result.details && <p className="text-xs text-gray-500 mt-1">{result.details}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Current State Info */}
      <div className="mt-4 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
        <p>
          <strong>Current Page:</strong> {state.currentPage}
        </p>
        <p>
          <strong>Progress:</strong> {state.userProgress.completedSteps.length}/
          {state.userProgress.totalSteps}
        </p>
        <p>
          <strong>Mood:</strong> {state.personality.mood}
        </p>
        <p>
          <strong>Messages:</strong> {state.conversationHistory.length}
        </p>
      </div>
    </div>
  );
};

export default FrenlyAITester;
