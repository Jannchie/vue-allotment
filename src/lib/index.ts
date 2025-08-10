// Components
export { default as Allotment } from './Allotment.vue'
// Types
export type { AllotmentHandle, AllotmentProps } from './Allotment.vue'

// Re-export core functionality for advanced use cases
export { LayoutService } from './layout-service'
export { PaneView } from './pane-view'

export { default as Pane } from './Pane.vue'
export type { PaneProps } from './Pane.vue'

export { Orientation } from './sash'

// Enums and Constants
export { LayoutPriority } from './split-view'
export type { Sizing } from './split-view'
export { SplitView } from './split-view'
// Utilities
export { setSashSize } from './utils'
