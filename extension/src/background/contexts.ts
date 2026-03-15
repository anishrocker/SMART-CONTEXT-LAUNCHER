/**
 * Hardcoded contexts and workflows for MVP.
 * TODO: replace with 5–8 real contexts and workflows; optionally load from storage later.
 */

import type { Context, Workflow } from '@shared/types';

export const CONTEXTS: Context[] = [
  {
    id: 'coding',
    name: 'Coding',
    summary: 'GitHub, Stack Overflow, Docs',
    urlRules: [{ pattern: 'github.com', type: 'host' }, { pattern: 'stackoverflow.com', type: 'host' }],
    workflowId: 'coding-stack',
  },
  {
    id: 'study',
    name: 'Study',
    summary: 'Coursera, YouTube, Notes',
    urlRules: [{ pattern: 'coursera.org', type: 'host' }, { pattern: 'youtube.com', type: 'host' }],
    workflowId: 'study-stack',
  },
];

export const WORKFLOWS: Workflow[] = [
  {
    id: 'coding-stack',
    name: 'Coding stack',
    steps: [{ action: 'open', urls: ['https://github.com', 'https://stackoverflow.com', 'https://developer.mozilla.org'] }],
  },
  {
    id: 'study-stack',
    name: 'Study stack',
    steps: [{ action: 'open', urls: ['https://www.coursera.org', 'https://www.youtube.com', 'https://keep.google.com'] }],
  },
];
