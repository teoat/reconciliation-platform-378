// Frenly AI Components Export
export { FrenlyProvider, useFrenly } from './FrenlyProvider';
export { FrenlyGuidance, FrenlyTips } from './FrenlyGuidance';

// Frenly AI Types Export
export type { FrenlyMessage, FrenlyState } from './FrenlyProvider';
export type { GuidanceStep, FrenlyGuidanceProps, FrenlyTipsProps } from './FrenlyGuidance';

// Re-export useFrenly for backward compatibility
export { useFrenly as useFrenlyAI } from './FrenlyProvider';

// Utility hook for backward compatibility
import { useFrenly } from './FrenlyProvider';

export const useFrenlyFeatures = () => {
  const { state, updateProgress, startTutorial, stopTutorial, toggleTips, getProgressPercentage, getNextStep, isStepCompleted } = useFrenly();
  
  return {
    userProgress: state.userProgress.completedSteps,
    updateProgress,
    isTutorialActive: state.isTutorialActive,
    startTutorial,
    stopTutorial,
    showTips: state.showTips,
    toggleTips,
    personality: state.personality,
    getProgressPercentage,
    getNextStep,
    isStepCompleted,
  };
};
