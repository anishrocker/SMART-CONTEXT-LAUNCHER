# Parallel Development Agents

This MVP is split into independent workstreams so engineering can ship in parallel.

## Agent 1 — Parser
- Owns command normalization, fuzzy ranking, aliases.
- Contract: `resolveCommand(input, contexts) => RankedContext[]`

## Agent 2 — Workflow Engine
- Owns staged sequential/parallel execution orchestration.
- Contract: `executeWorkflow(workflow) => ExecutionResult`

## Agent 3 — Integrations
- Owns integration adapters and registry.
- Contract: `integrationRegistry[action.type].execute(action)`

## Agent 4 — UI
- Owns command palette, context preview, execution feedback.
- Contract: consumes Parser + Engine + Integrations contracts.

## Coordination Rules
- Shared source of truth: `/types`.
- Any contract change requires cross-agent update note in PR.
- Keep modules decoupled and integration tested through workflow execution.
