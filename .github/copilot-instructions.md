---
description: "Workspace instructions for life-city-os project: coding standards, conventions, and best practices."
---

# Copilot Instructions — life-city-os

## Coding Standards

### General
- **Language:** JavaScript (ES6+), JSX for React components
- **Style:** Clean, readable, modular code
- **Comments:** JSDoc for functions/classes, inline for non-obvious logic
- **Naming:** camelCase for variables/functions, PascalCase for components/classes
- **Imports:** Group by type (React, Phaser, local modules), alphabetize within groups

### Game-Specific
- **Performance:** Avoid heavy computations in game loops; use caching where possible
- **State:** Use Zustand store for global state; avoid direct DOM manipulation
- **Assets:** Preload all assets; use consistent naming (e.g., `buildingType_variant.png`)
- **Scenes:** Phaser scenes should be self-contained; use events for inter-scene communication

### File Structure
- **Components:** One component per file, index.js for exports
- **Systems:** Pure functions preferred; side effects isolated
- **Assets:** Organized by type (characters, buildings, etc.) and area (dojo, park, etc.)

### Best Practices
- **Error Handling:** Use try/catch for async operations; validate inputs
- **Testing:** Simulate game outcomes after changes; check for regressions
- **Commits:** Descriptive messages; reference issue IDs if applicable
- **Refactoring:** Only when behavior remains identical; document structural changes

### Tools
- **Linting:** ESLint with React rules
- **Build:** Vite for development and production
- **Game Engine:** Phaser 3 for rendering and game logic

## 📝 MEMORY & HISTORY TRACKING (CRITICAL)

### 🔍 AUTO-REVIEW ON SESSION START

**Before any new work, ALWAYS:**
1. Read `/memories/repo/project-state.md` — latest known system state
2. Read most recent `/memories/repo/session[N]-project-state.md` — last session changes
3. Check `/memories/session/` for unfinished work items
4. Output a **"🔍 Previous Session Review"** block:
   ```
   🔍 Previous Session Review
   • Last session: [topic + status]
   • Completed: [✅ items]
   • At risk: [⚠️/❌ items that need attention]
   • Blockers: [❌ unresolved issues]
   • Regression test: [✅/⚠️/❌ on prior features]
   • Entry point: [next task to pick up]
   ```
5. If blockers exist: **RESOLVE BEFORE CONTINUING** — do not skip regression issues

**Every session MUST:**
1. **On Start:** Run auto-review above
2. **During Work:** After EVERY code change, immediately update `/memories/session/session[N]-work-log.md`:
   - File changed + line numbers
   - What was fixed/added/removed (brief)
   - Why (impact on other systems)
   - Test result: ✅ Pass / ⚠️ Risk / ❌ Fail
3. **After Major Changes:** Also append to `/memories/repo/project-state.md`:
   - New files created
   - Files modified with file + line numbers
   - Breaking changes or refactors
   - Build/lint status
4. **On End:** Create `/memories/session/session[N]-final-summary.md` with:
   - All completed work
   - All known issues
   - Hand-off notes for next session

**File locations:**
- `/memories/` — User preferences, patterns, common solutions (persistent across all projects)
- `/memories/session/` — Current session progress, work logs, summaries
- `/memories/repo/` — Project-specific facts, conventions, state snapshots

**Never skip memory updates** — they are the connective tissue between sessions and prevent rework.

Always follow the CityOS Agent workflow: Plan → Code → Cascade → Test → Log.

---

## 🔗 GIT WORKFLOW — AUTO-COMMIT SESSIONS

### What is `git checkout`?
- **Git checkout:** Reverts local files to last committed state (undoes changes)
- **NOT for GitHub:** This is local-only. Use `git push` to send changes to GitHub
- **When we use it:** To test if changes broke things, or to undo experiments

### AUTO-COMMIT PROTOCOL (REQUIRED)

**On session END, always commit your work:**

```bash
git add -A
git commit -m "Session [N]: [brief description of work done]"
git push
```

**Commit message format:**
```
Session 17: Drag&drop performance + background/video restoration

- Optimized pointer move throttling (RAF-based buffering)
- Fixed hover state caching (skip redundant setAlpha calls)
- Restored video overlay & seasonal systems after revert
- Build: ✅ 85 modules, zero errors
```

**Timing:**
- **After major features:** Commit immediately (don't wait for session end)
- **After bug fixes:** Commit with fix description
- **On session exit:** Final commit with summary of all work

**Benefits:**
- ✅ Changes saved to GitHub (not just local)
- ✅ History preserved for debugging
- ✅ Team can see progress
- ✅ Easy rollback if needed (`git revert [commit-hash]`)

**Never leave work uncommitted** — it's lost if your machine crashes or you switch devices.