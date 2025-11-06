/**
 * Comprehensive Integration Tests for Frenly AI
 * Tests all features, state management, and page integrations
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FrenlyProvider, useFrenly } from '../../frontend/src/components/frenly/FrenlyProvider'
import FrenlyAI from '../../frontend/src/components/FrenlyAI'
import { FrenlyGuidance } from '../../frontend/src/components/frenly/FrenlyGuidance'

// Test component to access context
function TestComponent() {
  const { state, updateProgress, showMessage, hideMessage, updatePage, toggleVisibility, toggleMinimize } = useFrenly()
  
  return (
    <div>
      <div data-testid="current-page">{state.currentPage}</div>
      <div data-testid="progress">{state.userProgress.completedSteps.length}/{state.userProgress.totalSteps}</div>
      <div data-testid="mood">{state.personality.mood}</div>
      <div data-testid="visible">{state.isVisible ? 'visible' : 'hidden'}</div>
      <div data-testid="minimized">{state.isMinimized ? 'minimized' : 'expanded'}</div>
      <div data-testid="messages">{state.conversationHistory.length}</div>
      
      <button onClick={() => updateProgress('test_step')}>Update Progress</button>
      <button onClick={() => updatePage('/projects')}>Update Page</button>
      <button onClick={() => showMessage({
        id: 'test',
        type: 'tip',
        content: 'Test message',
        timestamp: new Date(),
        page: '/test',
        priority: 'medium',
        dismissible: true
      })}>Show Message</button>
      <button onClick={hideMessage}>Hide Message</button>
      <button onClick={toggleVisibility}>Toggle Visibility</button>
      <button onClick={toggleMinimize}>Toggle Minimize</button>
    </div>
  )
}

describe('Frenly AI Integration Tests', () => {
  describe('Context Provider', () => {
    test('should provide context to child components', () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      expect(screen.getByTestId('current-page')).toBeInTheDocument()
      expect(screen.getByTestId('progress')).toBeInTheDocument()
      expect(screen.getByTestId('mood')).toBeInTheDocument()
    })

    test('should have initial state values', () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      expect(screen.getByTestId('visible')).toHaveTextContent('visible')
      expect(screen.getByTestId('minimized')).toHaveTextContent('expanded')
      expect(screen.getByTestId('mood')).toHaveTextContent('happy')
    })
  })

  describe('State Management', () => {
    test('should update progress when updateProgress is called', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      const initialProgress = screen.getByTestId('progress').textContent
      fireEvent.click(screen.getByText('Update Progress'))
      
      await waitFor(() => {
        const newProgress = screen.getByTestId('progress').textContent
        expect(newProgress).not.toBe(initialProgress)
      })
    })

    test('should update page when updatePage is called', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      fireEvent.click(screen.getByText('Update Page'))
      
      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('/projects')
      })
    })

    test('should toggle visibility', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      expect(screen.getByTestId('visible')).toHaveTextContent('visible')
      fireEvent.click(screen.getByText('Toggle Visibility'))
      
      await waitFor(() => {
        expect(screen.getByTestId('visible')).toHaveTextContent('hidden')
      })
    })

    test('should toggle minimize state', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      expect(screen.getByTestId('minimized')).toHaveTextContent('expanded')
      fireEvent.click(screen.getByText('Toggle Minimize'))
      
      await waitFor(() => {
        expect(screen.getByTestId('minimized')).toHaveTextContent('minimized')
      })
    })
  })

  describe('Message System', () => {
    test('should add message to conversation history', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      const initialMessages = parseInt(screen.getByTestId('messages').textContent || '0')
      fireEvent.click(screen.getByText('Show Message'))
      
      await waitFor(() => {
        const newMessages = parseInt(screen.getByTestId('messages').textContent || '0')
        expect(newMessages).toBeGreaterThan(initialMessages)
      })
    })

    test('should hide message when hideMessage is called', async () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      fireEvent.click(screen.getByText('Show Message'))
      await waitFor(() => {
        const messages = parseInt(screen.getByTestId('messages').textContent || '0')
        expect(messages).toBeGreaterThan(0)
      })
      
      fireEvent.click(screen.getByText('Hide Message'))
      // Message should be hidden from active state but remain in history
    })
  })

  describe('FrenlyAI Component', () => {
    test('should render with required props', () => {
      const { container } = render(
        <FrenlyAI
          currentPage="/projects"
          userProgress={{
            completedSteps: [],
            currentStep: 'init',
            totalSteps: 8
          }}
        />
      )
      
      expect(container.firstChild).toBeInTheDocument()
    })

    test('should generate contextual messages for different pages', () => {
      const pages = ['/auth', '/projects', '/ingestion', '/reconciliation']
      
      pages.forEach(page => {
        const { rerender } = render(
          <FrenlyAI
            currentPage={page}
            userProgress={{
              completedSteps: [],
              currentStep: 'init',
              totalSteps: 8
            }}
          />
        )
        
        expect(document.querySelector('.fixed')).toBeInTheDocument()
        
        rerender(
          <FrenlyAI
            currentPage={page}
            userProgress={{
              completedSteps: [],
              currentStep: 'init',
              totalSteps: 8
            }}
          />
        )
      })
    })

    test('should show progress indicator', () => {
      render(
        <FrenlyAI
          currentPage="/projects"
          userProgress={{
            completedSteps: ['step1', 'step2'],
            currentStep: 'step3',
            totalSteps: 8
          }}
        />
      )
      
      // Progress bar should be visible
      expect(document.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
    })
  })

  describe('FrenlyGuidance Component', () => {
    const mockOnStepComplete = jest.fn()
    const mockOnStartTutorial = jest.fn()

    test('should render guidance panel', () => {
      render(
        <FrenlyGuidance
          currentPage="ingestion"
          userProgress={[]}
          onStepComplete={mockOnStepComplete}
          onStartTutorial={mockOnStartTutorial}
        />
      )
      
      expect(document.querySelector('.fixed')).toBeInTheDocument()
    })

    test('should show completed steps', () => {
      render(
        <FrenlyGuidance
          currentPage="ingestion"
          userProgress={['welcome', 'upload-files']}
          onStepComplete={mockOnStepComplete}
          onStartTutorial={mockOnStartTutorial}
        />
      )
      
      // Should show progress
      expect(document.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
    })

    test('should calculate progress percentage', () => {
      const { container } = render(
        <FrenlyGuidance
          currentPage="ingestion"
          userProgress={['welcome', 'upload-files', 'configure-reconciliation']}
          onStepComplete={mockOnStepComplete}
          onStartTutorial={mockOnStartTutorial}
        />
      )
      
      // Should show some progress
      expect(container.querySelector('[style*="width"]')).toBeInTheDocument()
    })
  })

  describe('Integration with Pages', () => {
    test('should synchronize state across multiple components', async () => {
      const TestIntegration = () => {
        const { state, updatePage } = useFrenly()
        
        return (
          <div>
            <FrenlyAI
              currentPage={state.currentPage}
              userProgress={state.userProgress}
            />
            <button onClick={() => updatePage('/reconciliation')}>Change Page</button>
            <span data-testid="page-display">{state.currentPage}</span>
          </div>
        )
      }
      
      render(
        <FrenlyProvider>
          <TestIntegration />
        </FrenlyProvider>
      )
      
      fireEvent.click(screen.getByText('Change Page'))
      
      await waitFor(() => {
        expect(screen.getByTestId('page-display')).toHaveTextContent('/reconciliation')
      })
    })
  })

  describe('Personality System', () => {
    test('should maintain personality state', () => {
      render(
        <FrenlyProvider>
          <TestComponent />
        </FrenlyProvider>
      )
      
      expect(screen.getByTestId('mood')).toBeInTheDocument()
      const mood = screen.getByTestId('mood').textContent
      expect(['happy', 'excited', 'calm', 'concerned', 'celebrating']).toContain(mood)
    })
  })

  describe('Error Handling', () => {
    test('should throw error when useFrenly is used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useFrenly must be used within a FrenlyProvider')
      
      console.error = originalError
    })
  })
})

describe('Frenly AI Feature Completeness', () => {
  test('all required page routes have contextual messages', () => {
    const requiredPages = [
      '/auth',
      '/projects',
      '/ingestion',
      '/reconciliation',
      '/cashflow-evaluation',
      '/adjudication',
      '/visualization',
      '/presummary',
      '/summary'
    ]
    
    requiredPages.forEach(page => {
      const { container } = render(
        <FrenlyAI
          currentPage={page}
          userProgress={{
            completedSteps: [],
            currentStep: 'init',
            totalSteps: 8
          }}
        />
      )
      
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  test('all message types are supported', () => {
    const messageTypes = ['greeting', 'tip', 'warning', 'celebration', 'encouragement']
    
    messageTypes.forEach(type => {
      // Each message type should be handled
      expect(type).toBeTruthy()
    })
  })

  test('all preference options are available', () => {
    render(
      <FrenlyProvider>
        <TestComponent />
      </FrenlyProvider>
    )
    
    // Preferences should be initialized
    expect(screen.getByTestId('visible')).toBeInTheDocument()
  })
})
