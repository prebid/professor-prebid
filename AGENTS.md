# Agent Guidelines for Professor Prebid

This document defines conventions and operational guidelines for AI agents working in this repository.

## 1. Workspace Hygiene & Repository Cleanliness

- **No Temporary or Report Files**: Never write temporary report files, linter outputs, formatter logs, audit lists, or dump files to the root directory or anywhere in the workspace.
  - Prohibited file examples: `eslint_report*.json`, `prettier_report*.txt`, `tsc_report.txt`, `files_to_audit.txt`, `scan_results.json`, `*.log`, `tmp_*`.
- **Command Output**: Inspect compiler, test, lint, and formatting results directly via terminal stdout/stderr rather than piping them to disk files.
- **Scratch Space**: If temporary analysis scripts or data are required during an agent session, store them in the agent's internal temporary/scratch directories outside the repository tree. Never leave scratch files in the repo.
- **Git Cleanliness**: Keep `git status` clean. Ensure no untracked artifacts or transient files remain after completing tasks.

## 2. Development Workflow

- **Build**:
  - Development / Fast build: `npm run build:fast`
  - Production build: `npm run build`
- **Testing**:
  - Unit / Component tests: `npm test` (or `npx vitest run`)
  - Watch mode: `npm run test:watch`
  - Coverage: `npm run test:coverage`
  - End-to-End tests: `npm run test:e2e` (Playwright)
- **Formatting & Style**:
  - Code formatting is managed with Prettier (configured in `package.json` / `.prettierrc`).
  - Follow existing TypeScript and React functional component patterns.
