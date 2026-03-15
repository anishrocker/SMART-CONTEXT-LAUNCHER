/**
 * Command parser: maps user input (e.g. "coding", "study") to context ID.
 * MVP: literal/fuzzy match on context names and aliases.
 */

import type { Context } from '@shared/types';

// TODO: implement parseCommand(input: string, contexts: Context[]): string | null
// - Normalize input (trim, lowercase)
// - Return first context.id where context.name or context.id matches
// - Optional: alias list per context for multi-word triggers

export function parseCommand(_input: string, _contexts: Context[]): string | null {
  // TODO: implement
  return null;
}
