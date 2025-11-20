export interface FrenlyState {
  isVisible: boolean;
  isMinimized: boolean;
  currentPage: string;
  userProgress: {
    completedSteps: string[];
    currentStep: string;
    totalSteps: number;
  };
  personality: {
    mood: 'happy' | 'excited' | 'calm' | 'concerned' | 'celebrating';
    energy: 'low' | 'medium' | 'high';
    helpfulness: number;
  };
  preferences: {
    showTips: boolean;
    showCelebrations: boolean;
    showWarnings: boolean;
    voiceEnabled: boolean;
    animationSpeed: 'slow' | 'normal' | 'fast';
  };
  conversationHistory: FrenlyMessage[];
  activeMessage?: FrenlyMessage;
}

export interface FrenlyMessage {
  id: string;
  type:
    | 'greeting'
    | 'tip'
    | 'warning'
    | 'celebration'
    | 'help'
    | 'progress'
    | 'error'
    | 'instruction'
    | 'encouragement';
  content: string;
  timestamp: Date;
  page: string;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
  autoHide?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    type: 'primary' | 'secondary';
  }>;
  action?: {
    onClick: () => void;
    text: string;
  };
}

export interface FrenlyAnimation {
  type: 'bounce' | 'shake' | 'pulse' | 'spin' | 'fade' | 'slide';
  duration: number;
  repeat?: number;
  delay?: number;
}

export interface FrenlyExpression {
  eyes: 'happy' | 'excited' | 'calm' | 'concerned' | 'sleepy' | 'surprised' | 'wink' | 'normal';
  mouth: 'smile' | 'open' | 'frown' | 'neutral' | 'laugh' | 'big-smile';
  accessories: string[];
}
