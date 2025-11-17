/**
import { logger } from '../services/logger'; * Conversational Interface Component
 * 
 * Provides a multi-turn conversational interface for interacting with FrenlyGuidanceAgent.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, Download, Search } from 'lucide-react';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import { conversationStorage, ConversationMessage } from '../../utils/conversationStorage';
import { logger } from '../../services/logger';
// Note: Using relative import because agents/ is at project root, not in frontend/src
// Consider moving agents/ to frontend/src/agents/ or configuring a path alias for better maintainability
import { MessageContext } from '../../../../agents/guidance/FrenlyGuidanceAgent';

interface ConversationalInterfaceProps {
  userId: string;
  currentPage?: string;
  userProgress?: {
    completedSteps: string[];
    totalSteps: number;
    currentStep?: string;
  };
  className?: string;
}

export const ConversationalInterface: React.FC<ConversationalInterfaceProps> = ({
  userId,
  currentPage = 'dashboard',
  userProgress,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Initialize session and load conversation history
  useEffect(() => {
    if (isOpen) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      // Try to load previous conversation
      const savedSession = conversationStorage.loadConversation(newSessionId);
      if (savedSession && savedSession.messages.length > 0) {
        setMessages(savedSession.messages);
      } else if (messages.length === 0) {
        // Only show welcome if no messages loaded
        const welcomeMessage: ConversationMessage = {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm Frenly, your AI assistant! 👋 How can I help you today?",
          timestamp: new Date(),
          type: 'greeting',
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

  // Save conversation when messages change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      const saveConversation = async () => {
        try {
          await conversationStorage.saveConversation(sessionId, userId, messages);
        } catch (error) {
          logger.error('Error saving conversation:', error);
        }
      };
      
      // Debounce saves to avoid excessive writes
      const timeout = setTimeout(saveConversation, 1000);
      return () => clearTimeout(timeout);
    }
  }, [messages, sessionId, userId]);

  /**
   * Handle sending a message
   */
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: ConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Generate context
      const context: MessageContext = {
        userId,
        page: currentPage,
        progress: userProgress ? {
          completedSteps: userProgress.completedSteps,
          totalSteps: userProgress.totalSteps,
          currentStep: userProgress.currentStep,
        } : undefined,
        preferences: {
          communicationStyle: 'conversational',
          messageFrequency: 'medium',
        },
      };

      // Handle query with NLU
      const agentMessage = await frenlyAgentService.handleUserQuery(userId, userMessage.content, context);

      const assistantMessage: ConversationMessage = {
        id: agentMessage.id,
        role: 'assistant',
        content: agentMessage.content,
        timestamp: agentMessage.timestamp,
        type: agentMessage.type,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Track interaction
      await frenlyAgentService.trackInteraction(userId, 'message_sent', agentMessage.id).catch(err => {
        logger.warn('Failed to track interaction:', err);
      });
    } catch (error) {
      logger.error('Error handling query:', error);
      
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Could you please try again?",
        timestamp: new Date(),
        type: 'warning',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isTyping, userId, currentPage, userProgress]);

  /**
   * Handle input key press
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  /**
   * Export conversation
   */
  const handleExport = useCallback((format: 'json' | 'text') => {
    if (!sessionId) return;

    try {
      let content: string | null = null;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = conversationStorage.exportConversation(sessionId);
        filename = `frenly-conversation-${sessionId}.json`;
        mimeType = 'application/json';
      } else {
        content = conversationStorage.exportConversationAsText(sessionId);
        filename = `frenly-conversation-${sessionId}.txt`;
        mimeType = 'text/plain';
      }

      if (content) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
      }
    } catch (error) {
      logger.error('Error exporting conversation:', error);
    }
  }, [sessionId]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${className}`}
        title="Open Conversational Interface"
        aria-label="Open Conversational Interface"
      >
        <MessageCircle className="w-8 h-8 text-white" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16 sm:w-80 sm:h-16' : 'w-[calc(100vw-3rem)] sm:w-96 h-[calc(100vh-8rem)] sm:h-[600px] max-w-md'
      } ${className}`}
      role="dialog"
      aria-label="Frenly AI Conversational Interface"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-2xl border border-purple-200 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Frenly AI</h3>
              <p className="text-xs opacity-90">Your conversational assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {!isMinimized && (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                  title="Export conversation"
                  aria-label="Export conversation"
                  aria-expanded={showExportMenu}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      aria-label="Export as JSON"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('text')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      aria-label="Export as Text"
                    >
                      Export as Text
                    </button>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              title={isMinimized ? 'Expand' : 'Minimize'}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTyping}
                  aria-label="Message input"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    inputValue.trim() && !isTyping
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

