/**
import { logger } from '../services/logger'; * Conversational Interface Component
 * 
 * Provides a multi-turn conversational interface for interacting with FrenlyGuidanceAgent.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { frenlyAgentService } from '@/services/frenlyAgentService';
import { MessageContext } from '../../../../agents/guidance/FrenlyGuidanceAgent';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'tip' | 'warning' | 'celebration' | 'help';
}

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

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ConversationMessage = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Frenly, your AI assistant! 👋 How can I help you today?",
        timestamp: new Date(),
        type: 'greeting',
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

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
      await frenlyAgentService.trackInteraction(userId, 'message_sent', agentMessage.id);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${className}`}
        title="Open Conversational Interface"
        aria-label="Open Conversational Interface"
      >
        <MessageCircle className="w-8 h-8 text-white" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } ${className}`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-purple-200 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Frenly AI</h3>
              <p className="text-xs opacity-90">Your conversational assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-2 rounded-lg transition-colors ${
                    inputValue.trim() && !isTyping
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

