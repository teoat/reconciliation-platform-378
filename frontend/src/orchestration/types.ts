/**
 * Orchestration Types - Core interfaces for page and feature orchestration
 * with Frenly AI meta-agent integration
 */

// ============================================================================
// PAGE ORCHESTRATION TYPES
// ============================================================================

export interface PageMetadata {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'workflow' | 'analytics' | 'settings';
  features: string[];
  onboardingSteps: string[];
  guidanceTopics: string[];
  icon?: string;
}

export interface PageContext {
  [key: string]: unknown;
  currentView?: string;
  userRole?: string;
  timestamp?: number;
}

export interface WorkflowState {
  workflowId?: string;
  currentStep: string;
  completedSteps: string[];
  totalSteps: number;
  progress: number;
  metadata?: Record<string, any>;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetElement?: string;
  completed: boolean;
  skipped: boolean;
  order: number;
}

export interface OnboardingProgress {
  pageId: string;
  completedSteps: string[];
  currentStep: string | null;
  totalSteps: number;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// FRENLY AI INTEGRATION TYPES
// ============================================================================

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
  pageData?: PageContext;
}

export interface FrenlyMessage {
  id: string;
  type:
    | 'greeting'
    | 'tip'
    | 'warning'
    | 'celebration'
    | 'question'
    | 'instruction'
    | 'encouragement';
  content: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  timestamp: Date;
  page?: string;
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
  autoHide?: number;
}

export interface GuidanceContent {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'info' | 'warning' | 'help';
  category?: string;
  relatedFeatures?: string[];
}

export interface GuidanceHandler {
  id: string;
  featureId: string;
  handler: (context: PageContext) => Promise<FrenlyMessage | null>;
  priority: number;
}

// ============================================================================
// FEATURE INTEGRATION TYPES
// ============================================================================

export interface FeatureContext {
  featureId: string;
  action: string;
  data?: Record<string, any>;
  timestamp: number;
}

export interface FeatureMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  guidanceTopics: string[];
}

// ============================================================================
// SYNCHRONIZATION TYPES
// ============================================================================

export interface SyncTask {
  pageId: string;
  state: PageContext;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

export interface PageEvent {
  type: 'mount' | 'update' | 'unmount' | 'feature-used' | 'feature-error' | 'user-action';
  pageId: string;
  data?: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// ORCHESTRATION INTERFACES
// ============================================================================

export interface PageOrchestrationInterface {
  // Page identification
  getPageId(): string;
  getPageMetadata(): PageMetadata;

  // Context provision
  getPageContext(): PageContext;

  // Onboarding integration
  getOnboardingSteps(): OnboardingStep[];
  getCurrentOnboardingStep(): OnboardingStep | null;
  completeOnboardingStep(stepId: string): Promise<void>;
  skipOnboardingStep(stepId: string): Promise<void>;

  // Guidance integration
  registerGuidanceHandlers(): GuidanceHandler[];
  getGuidanceContent(topic: string): GuidanceContent[];

  // Workflow integration
  getWorkflowState(): WorkflowState | null;
  updateWorkflowState(state: Partial<WorkflowState>): Promise<void>;

  // Synchronization
  syncWithFrenly(): Promise<void>;
  onPageMount(): Promise<void>;
  onPageUpdate(changes: Partial<PageContext>): Promise<void>;
  onPageUnmount(): Promise<void>;
}

export interface FeatureFrenlyIntegration {
  featureId: string;
  featureName: string;
  getFeatureMetadata(): FeatureMetadata;
  getFeatureGuidance(): GuidanceContent[];
  trackFeatureUsage(context: FeatureContext): Promise<void>;
  generateFeatureMessage(context: FeatureContext): Promise<FrenlyMessage | null>;
}

export interface FrenlyIntegrationPattern {
  collectPageContext(): Promise<MessageContext>;
  generateContextualMessage(): Promise<FrenlyMessage>;
  syncPageState(): Promise<void>;
  handlePageEvents(events: PageEvent[]): Promise<void>;
  showMessage(message: FrenlyMessage): Promise<void>;
  hideMessage(messageId: string): Promise<void>;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface PageMountEvent extends PageEvent {
  type: 'mount';
  pageMetadata: PageMetadata;
}

export interface PageUpdateEvent extends PageEvent {
  type: 'update';
  changes: Partial<PageContext>;
}

export interface FeatureErrorEvent extends PageEvent {
  type: 'feature-error';
  featureId: string;
  error: Error;
}

export interface UserActionEvent extends PageEvent {
  type: 'user-action';
  action: string;
  target?: string;
}
