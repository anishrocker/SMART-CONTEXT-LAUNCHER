/**
 * Shared types for Smart Context Launcher.
 * Used by background, and mirrored in message payloads for UI.
 */

// ---------------------------------------------------------------------------
// URL rules for context detection
// ---------------------------------------------------------------------------

export type UrlRuleType = 'substring' | 'host' | 'regex';

export interface UrlRule {
  pattern: string;
  type: UrlRuleType;
}

// ---------------------------------------------------------------------------
// Context: named "mode" (e.g. coding, study) with rules and linked workflow
// ---------------------------------------------------------------------------

export interface Context {
  id: string;
  name: string;
  summary?: string;
  urlRules: UrlRule[];
  workflowId: string;
}

// ---------------------------------------------------------------------------
// Workflow: sequence of actions to run when a context is launched
// ---------------------------------------------------------------------------

export type WorkflowStepOpen = { action: 'open'; urls: string[] };
export type WorkflowStepGroup = { action: 'group'; name?: string; tabIds?: number[] };
export type WorkflowStepCloseOthers = { action: 'closeOthers' };

export type WorkflowStep = WorkflowStepOpen | WorkflowStepGroup | WorkflowStepCloseOthers;

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

// ---------------------------------------------------------------------------
// Action: single executable unit (used by executor; can extend later)
// ---------------------------------------------------------------------------

export type ActionType = 'open' | 'group' | 'closeOthers';

export interface Action {
  type: ActionType;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Session / Tab bundle: saved set of tabs for restore
// ---------------------------------------------------------------------------

export interface SessionTab {
  url: string;
  title?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  tabs: SessionTab[];
  windowId?: number;
}

// ---------------------------------------------------------------------------
// Inferred state (context detection result)
// ---------------------------------------------------------------------------

export type Confidence = 'high' | 'low' | 'none';

export interface InferredState {
  contextId: string | null;
  contextName: string | null;
  confidence: Confidence;
  tabIds: number[];
}

// ---------------------------------------------------------------------------
// Settings (storage)
// ---------------------------------------------------------------------------

export interface Settings {
  suggestContext: boolean;
}
