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

Always follow the CityOS Agent workflow: Plan → Code → Cascade → Test → Log.