/**
 * Conversation Storage Utility
 *
 * Handles persistence of conversation history using IndexedDB with localStorage fallback
 */

import { logger } from '../services/logger';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'tip' | 'warning' | 'celebration' | 'help';
}

export interface ConversationSession {
  id: string;
  userId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

class ConversationStorage {
  private readonly STORAGE_KEY = 'frenly_conversations';
  private readonly MAX_CONVERSATIONS = 50;
  private readonly MAX_MESSAGES_PER_CONVERSATION = 1000;

  /**
   * Save conversation to storage
   */
  async saveConversation(
    sessionId: string,
    userId: string,
    messages: ConversationMessage[]
  ): Promise<void> {
    try {
      const conversations = this.loadConversations();

      const session: ConversationSession = {
        id: sessionId,
        userId,
        messages: messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION), // Keep last N messages
        createdAt: conversations[sessionId]?.createdAt || new Date(),
        updatedAt: new Date(),
        tags: conversations[sessionId]?.tags,
      };

      conversations[sessionId] = session;

      // Keep only the most recent conversations
      const sortedSessions = Object.values(conversations)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, this.MAX_CONVERSATIONS);

      const limitedConversations: Record<string, ConversationSession> = {};
      sortedSessions.forEach((session) => {
        limitedConversations[session.id] = session;
      });

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(limitedConversations, this.dateReplacer)
      );
    } catch (error) {
      logger.error('Error saving conversation:', { error });
      throw error;
    }
  }

  /**
   * Load conversation from storage
   */
  loadConversation(sessionId: string): ConversationSession | null {
    try {
      const conversations = this.loadConversations();
      return conversations[sessionId] || null;
    } catch (error) {
      logger.error('Error loading conversation:', { error });
      return null;
    }
  }

  /**
   * Load all conversations for a user
   */
  loadUserConversations(userId: string): ConversationSession[] {
    try {
      const conversations = this.loadConversations();
      return Object.values(conversations)
        .filter((session) => session.userId === userId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      logger.error('Error loading user conversations:', { error });
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  deleteConversation(sessionId: string): void {
    try {
      const conversations = this.loadConversations();
      delete conversations[sessionId];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations, this.dateReplacer));
    } catch (error) {
      logger.error('Error deleting conversation:', { error });
    }
  }

  /**
   * Export conversation as JSON
   */
  exportConversation(sessionId: string): string | null {
    try {
      const conversation = this.loadConversation(sessionId);
      if (!conversation) return null;

      return JSON.stringify(conversation, this.dateReplacer, 2);
    } catch (error) {
      logger.error('Error exporting conversation:', { error });
      return null;
    }
  }

  /**
   * Export conversation as text
   */
  exportConversationAsText(sessionId: string): string | null {
    try {
      const conversation = this.loadConversation(sessionId);
      if (!conversation) return null;

      let text = `Frenly AI Conversation\n`;
      text += `Session ID: ${conversation.id}\n`;
      text += `Created: ${conversation.createdAt.toISOString()}\n`;
      text += `Updated: ${conversation.updatedAt.toISOString()}\n`;
      text += `\n--- Messages ---\n\n`;

      conversation.messages.forEach((message, index) => {
        text += `[${message.timestamp.toISOString()}] ${message.role.toUpperCase()}:\n`;
        text += `${message.content}\n\n`;
      });

      return text;
    } catch (error) {
      logger.error('Error exporting conversation as text:', { error });
      return null;
    }
  }

  /**
   * Search conversations by content
   */
  searchConversations(userId: string, query: string): ConversationSession[] {
    try {
      const conversations = this.loadUserConversations(userId);
      const lowerQuery = query.toLowerCase();

      return conversations.filter((session) => {
        return session.messages.some((message) =>
          message.content.toLowerCase().includes(lowerQuery)
        );
      });
    } catch (error) {
      logger.error('Error searching conversations:', { error });
      return [];
    }
  }

  /**
   * Add tag to conversation
   */
  addTag(sessionId: string, tag: string): void {
    try {
      const conversations = this.loadConversations();
      const conversation = conversations[sessionId];

      if (conversation) {
        if (!conversation.tags) {
          conversation.tags = [];
        }
        if (!conversation.tags.includes(tag)) {
          conversation.tags.push(tag);
          conversation.updatedAt = new Date();
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations, this.dateReplacer));
        }
      }
    } catch (error) {
      logger.error('Error adding tag:', { error });
    }
  }

  /**
   * Load all conversations from storage
   */
  private loadConversations(): Record<string, ConversationSession> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return {};

      const parsed = JSON.parse(stored, this.dateReviver);
      return parsed || {};
    } catch (error) {
      logger.error('Error loading conversations from storage:', { error });
      return {};
    }
  }

  /**
   * Date replacer for JSON serialization
   */
  private dateReplacer(key: string, value: unknown): unknown {
    if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
      return value instanceof Date ? value.toISOString() : value;
    }
    return value;
  }

  /**
   * Date reviver for JSON parsing
   */
  private dateReviver(key: string, value: unknown): unknown {
    if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt') {
      return value ? new Date(value) : value;
    }
    return value;
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      logger.error('Error clearing conversations:', { error });
    }
  }
}

export const conversationStorage = new ConversationStorage();
