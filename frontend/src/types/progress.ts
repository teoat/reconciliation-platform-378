
export interface CheckpointData {
  stage: string;
  data: unknown;
  metadata: Record<string, unknown>;
}

export interface ResumeData {
  canResume: boolean;
  resumePoint: string;
  dependencies: string[];
  state: Record<string, unknown>;
}
