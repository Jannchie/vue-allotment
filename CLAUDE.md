# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **vue-allotment**, a Vue 3 port of the React Allotment library that provides resizable split views with draggable dividers. It's built with Vue 3 Composition API, TypeScript, and uses es-toolkit instead of lodash for utilities.

## Development Commands

```bash
# Start development server (runs on http://localhost:5173)
pnpm dev

# Build for production (includes TypeScript compilation)
pnpm build

# Preview production build
pnpm preview

# Run Storybook development server
pnpm storybook

# Build Storybook for production
pnpm storybook:build

# Run ESLint (uses @jannchie/eslint-config)
npx eslint src/ --ext .ts,.vue

# Run TypeScript type checking only
npx vue-tsc --noEmit

# Auto-fix ESLint issues
npx eslint src/ --ext .ts,.vue --fix
```

## Core Architecture

The library is structured around several key architectural layers:

### 1. Component Layer

- **Allotment.vue**: Main container component that manages the split view layout
- **Pane.vue**: Individual pane component that registers with parent Allotment
- Components use Vue 3 Composition API with `<script setup>` syntax

### 2. Split View Engine (`src/lib/split-view/`)

- **SplitView**: Core engine class that manages view positioning, sizing, and resizing logic
- **ViewItem**: Abstract base class with `HorizontalViewItem` and `VerticalViewItem` implementations
- Handles complex resize algorithms with priority-based view sizing
- Manages sash (separator) positioning and drag interactions

### 3. Sash System (`src/lib/sash/`)

- **Sash**: Draggable separator component with pointer event handling
- Supports different states: Enabled, Disabled, Minimum, Maximum
- Uses EventEmitter pattern for drag events (start, change, end, reset)

### 4. Layout Services (`src/lib/layout-service/`, `src/lib/pane-view/`)

- **LayoutService**: Manages container size for percentage-based calculations
- **PaneView**: Implements the View interface, handles preferred size logic
- **Layout strategies**: PixelLayout, ProportionLayout, NullLayout for different sizing modes

### 5. Vue Integration Patterns

- Uses `provide/inject` for parent-child communication between Allotment and Pane
- Reactive refs and maps track pane registration: `splitViewViewRef`, `splitViewPropsRef`
- ResizeObserver integration for responsive container size changes
- Dynamic view management with `updateViews()` for add/remove/reorder operations

## Key Implementation Details

### Pane Registration System

Panes self-register with the parent Allotment using a unique key system. When pane props change, they re-register which triggers `updateViews()` to apply changes like `preferredSize` updates.

### Sizing and Layout Algorithm

The split view uses a sophisticated algorithm for view resizing:

1. **Priority-based resizing**: Views with High priority resize first, then Normal, then Low
2. **Constraint satisfaction**: Respects min/max size constraints while distributing space
3. **Proportional layout**: Can maintain proportions during container resize
4. **Snap behavior**: Views can snap to zero size when dragged below threshold

### CSS Architecture

- Uses CSS Modules (`allotment.module.css`, `sash.module.css`) fo scoped styling
- CSS custom properties for theming (`--sash-size`, `--focus-border`, etc.)
- Platform-specific styling (macOS, iOS adaptations)

## Important Implementation Notes

### es-toolkit Usage

The project recently migrated from lodash to es-toolkit. When working with utilities, use:

- `import { clamp } from 'es-toolkit'` (not `lodash.clamp`)
- `import { debounce } from 'es-toolkit'` (not `lodash.debounce`)
- `import { isEqual } from 'es-toolkit'` (not `lodash.isequal`)

### Dynamic PreferredSize Updates

When a pane's `preferredSize` prop changes at runtime, the system automatically calls `resizeToPreferredSize(index)` to apply the new size. This enables dynamic resizing based on reactive prop changes.

### Proxy Handling in Sash Management

The codebase includes special handling for Vue's Proxy wrappers when finding sash indices, comparing both direct object references and DOM element references for robust sash position detection.

### Testing Setup

- Playwright is configured for E2E testing
- Storybook provides component testing and documentation
- TypeScript strict mode enabled with separate configs for app and node environments

## File Structure Patterns

- Core library in `src/lib/` with clear separation of concerns
- Each major component has its own directory with index.ts barrel exports
- Helpers in `src/lib/helpers/` provide cross-platform utilities
- Stories in `src/stories/` demonstrate usage patterns and edge cases
