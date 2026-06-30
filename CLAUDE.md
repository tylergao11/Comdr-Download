# CLAUDE.md

## Project

`@comdr/landing` — Comdr Download landing page. Vite + React 18 + TypeScript + Motion (Framer Motion fork). Private package, no backend.

- `src/main.tsx` — entry
- `src/App.tsx` — root component
- `src/components/` — HeroStarfield, DesignArchitecture, ConstellationGraph, InstallFlow
- `src/styles/site.css` — global styles
- `src/site-config.ts` — site configuration constants
- `scripts/sync-download.mjs` — pre-build sync script
- `npm run dev` — dev server
- `npm run build` — sync + typecheck + vite build
- `npm run typecheck` — tsc --noEmit only

### Probe Flow

Before editing, identify the smallest useful set of probes:

1. **State probe**: what is true now? Use source reads, rg, git diff, logs, build output, screenshots, runtime checks, or existing tests.
2. **Boundary probe**: which file, component, command, data path, document, cache, generated artifact, or runtime layer owns the behavior?
3. **Success probe**: what exact command, output, UI state, file diff, test, or audit result proves the work is done?
4. **Drift probe**: what stale doc, old eval, cache, duplicate definition, generated file, or partial path could make a false pass?
5. **Audit probe**: after the change, what source truth must be reread to prove code, tests, docs, and cleanup agree?

Keep probes practical. Use only the probes needed to remove guessing.

### Work Gate

Start implementation only after these are clear enough:

- goal
- owner boundary
- success proof
- verification command or manual check
- drift or cleanup risk

If any item is unclear, inspect more or ask.

### Fix Rule

Fix the owner cause, not only the visible symptom.

If the same class of failure appears twice, stop patching and run a root-cause loop:

- reread the source truth
- explain the cause
- check stale data, caches, generated files, docs, and runtime boundaries
- change the owner area
- verify again

### Cleanup Rule

This project is not online yet. Refactor or delete stale structure when it makes the system clearer, but finish the related cleanup:

- This is a refactor-phase project: do not keep old compatibility paths, legacy aliases, or dual implementations unless explicitly required.
- Remove dead paths and duplicate definitions.
- Update docs, tests, scripts, configs, or generated artifacts that belong to the change.
- Verify UTF-8 when touching Chinese text, Markdown, JSON, configs, scripts, or generated files.

### Output

At the start of an Open OS task, output only:

- Goal
- Probe Flow
- Success Criteria
- Verification
- Audit
- Blockers

Keep it short. The brief is a launch checklist, not a report.
