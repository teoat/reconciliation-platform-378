/**
 * Frenly Guidance Agent - Interfaces and Types
 */

export interface MessageContext {
  userId: string;
  page?: string;
  progress?: {
    completedSteps: string[];
    totalSteps: number;
    currentStep?: string;
  };
  preferences?: {
    communicationStyle?: 'brief' | 'detailed' | 'conversational';
    messageFrequency?: 'low' | 'medium' | 'high';
  };
  behavior?: {
    sessionDuration?: number;
    actionsPerformed?: number;
    errors?: number;
  };
}

export interface GeneratedMessage {
  id: string;
  type: 'greeting' | 'tip' | 'warning' | 'celebration' | 'help';
  content: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  context: MessageContext;
}

export interface UserBehavior {
  userId: string;
  messageInteractions: Array<{
    messageId: string;
    feedback?: 'helpful' | 'not-helpful' | 'dismissed';
    timestamp: Date;
  }>;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferences: MessageContext['preferences'];
  lastInteraction: Date;
}
