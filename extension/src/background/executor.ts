/**
 * Workflow executor: runs a workflow (open tabs, optional group/close).
 * Uses chrome.tabs only.
 */

import type { Workflow, WorkflowStep } from '@shared/types';

// TODO: add group, closeOthers steps when needed

export async function runWorkflow(workflowId: string, workflows: Workflow[]): Promise<void> {
  const workflow = workflows.find((w) => w.id === workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  for (const step of workflow.steps) {
    if ((step as WorkflowStep).action === 'open') {
      const urls = (step as { action: 'open'; urls: string[] }).urls;
      for (const url of urls) {
        await chrome.tabs.create({ url });
      }
    }
    // TODO: handle 'group', 'closeOthers'
  }
}
