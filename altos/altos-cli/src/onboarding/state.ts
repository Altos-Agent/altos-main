import fs from 'fs';
import path from 'path';
import os from 'os';
import { getConfigDir, getConfig } from '../config/manager.js';

export type OnboardingStep =
  | 'not_started'
  | 'mode_selected'
  | 'provider_selected'
  | 'provider_configured'
  | 'agent_created'
  | 'channel_selection'
  | 'completed';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skippedSteps: OnboardingStep[];
  data: {
    mode?: 'local-only' | 'local-web';
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    agentName?: string;
    agentDescription?: string;
    systemPrompt?: string;
    selectedChannels?: string[];
  };
  startedAt: string;
  updatedAt: string;
}

const STATE_FILE = 'onboarding-state.json';

function getStatePath(): string {
  return path.join(getConfigDir(), STATE_FILE);
}

export function getOnboardingState(): OnboardingState | null {
  const statePath = getStatePath();
  
  if (!fs.existsSync(statePath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(data) as OnboardingState;
  } catch {
    return null;
  }
}

export function saveOnboardingState(state: OnboardingState): void {
  const statePath = getStatePath();
  const configDir = getConfigDir();
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  state.updatedAt = new Date().toISOString();
  
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function createOnboardingState(): OnboardingState {
  const now = new Date().toISOString();
  
  return {
    currentStep: 'not_started',
    completedSteps: [],
    skippedSteps: [],
    data: {},
    startedAt: now,
    updatedAt: now
  };
}

export function updateOnboardingStep(
  step: OnboardingStep,
  data?: Partial<OnboardingState['data']>
): OnboardingState {
  let state = getOnboardingState();
  
  if (!state) {
    state = createOnboardingState();
  }
  
  if (step !== 'completed' && state.currentStep === 'completed') {
    state = createOnboardingState();
  }
  
  const stepOrder: OnboardingStep[] = [
    'not_started',
    'mode_selected',
    'provider_selected',
    'provider_configured',
    'agent_created',
    'channel_selection',
    'completed'
  ];
  
  const currentIndex = stepOrder.indexOf(state.currentStep);
  const newIndex = stepOrder.indexOf(step);
  
  if (newIndex > currentIndex && !state.completedSteps.includes(state.currentStep)) {
    state.completedSteps.push(state.currentStep);
  }
  
  state.currentStep = step;
  
  if (data) {
    state.data = { ...state.data, ...data };
  }
  
  saveOnboardingState(state);
  
  return state;
}

export function skipOnboardingStep(step: OnboardingStep): OnboardingState {
  let state = getOnboardingState();
  
  if (!state) {
    state = createOnboardingState();
  }
  
  if (!state.skippedSteps.includes(step)) {
    state.skippedSteps.push(step);
  }
  
  saveOnboardingState(state);
  
  return state;
}

export function resetOnboardingState(): void {
  const statePath = getStatePath();
  
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }
}

export function isOnboardingComplete(): boolean {
  const state = getOnboardingState();
  return state?.currentStep === 'completed';
}

export function getOnboardingProgress(): { current: number; total: number; percentage: number } {
  const state = getOnboardingState();
  
  if (!state) {
    return { current: 0, total: 5, percentage: 0 };
  }
  
  const stepOrder: OnboardingStep[] = [
    'mode_selected',
    'provider_selected',
    'provider_configured',
    'agent_created',
    'channel_selection'
  ];
  
  const completedCount = stepOrder.filter(
    step => state.completedSteps.includes(step) || state.skippedSteps.includes(step)
  ).length;
  
  const total = stepOrder.length;
  const percentage = Math.round((completedCount / total) * 100);
  
  return { current: completedCount, total, percentage };
}

export function canResumeOnboarding(): boolean {
  const state = getOnboardingState();
  
  if (!state) return false;
  
  if (state.currentStep === 'completed') return false;
  
  return true;
}

export function getNextOnboardingStep(): OnboardingStep | 'completed' {
  const state = getOnboardingState();
  
  if (!state) return 'mode_selected';
  
  const stepOrder: OnboardingStep[] = [
    'mode_selected',
    'provider_selected',
    'provider_configured',
    'agent_created',
    'channel_selection',
    'completed'
  ];
  
  const currentIndex = stepOrder.indexOf(state.currentStep);
  
  if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
    return 'completed';
  }
  
  return stepOrder[currentIndex + 1];
}

export function formatOnboardingStatus(): string {
  const state = getOnboardingState();
  const progress = getOnboardingProgress();
  
  if (!state) {
    return 'Not started. Run `altos init` to begin.';
  }
  
  if (state.currentStep === 'completed') {
    return 'Onboarding complete! ✓';
  }
  
  const stepLabels: Record<OnboardingStep, string> = {
    'not_started': 'Not started',
    'mode_selected': 'Mode selection',
    'provider_selected': 'Provider selection',
    'provider_configured': 'Provider configuration',
    'agent_created': 'Agent creation',
    'channel_selection': 'Channel selection',
    'completed': 'Complete'
  };
  
  return `${progress.percentage}% complete (${stepLabels[state.currentStep]})`;
}

export function getResumableSteps(): string[] {
  const state = getOnboardingState();
  
  if (!state) return [];
  
  const steps: string[] = [];
  
  if (!state.completedSteps.includes('mode_selected') && state.currentStep !== 'mode_selected') {
    steps.push('Select usage mode (local-only or local+web)');
  }
  
  if (!state.completedSteps.includes('provider_selected') && state.currentStep !== 'provider_selected') {
    steps.push('Choose AI provider');
  }
  
  if (!state.completedSteps.includes('provider_configured') && state.currentStep !== 'provider_configured') {
    steps.push('Configure provider API key');
  }
  
  if (!state.completedSteps.includes('agent_created') && state.currentStep !== 'agent_created') {
    steps.push('Create your first agent');
  }
  
  if (!state.completedSteps.includes('channel_selection') && state.currentStep !== 'channel_selection') {
    steps.push('Connect channels (optional)');
  }
  
  return steps;
}
