// Ingestion workflow hook
import { useState, useCallback } from 'react';
import type { UploadedFile } from '@/types/ingestion/index';

export type WorkflowStep = 'upload' | 'validate' | 'map' | 'transform' | 'review' | 'complete';

export const useIngestionWorkflow = () => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());

  const nextStep = useCallback(() => {
    const steps: WorkflowStep[] = ['upload', 'validate', 'map', 'transform', 'review', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const next = steps[currentIndex + 1];
      setCurrentStep(next);
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const steps: WorkflowStep[] = ['upload', 'validate', 'map', 'transform', 'review', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
  }, []);

  const reset = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setCompletedSteps(new Set());
  }, []);

  return {
    currentStep,
    selectedFile,
    setSelectedFile,
    completedSteps,
    nextStep,
    previousStep,
    goToStep,
    reset,
  };
};

