// Components
export { default as Allotment } from './Allotment.vue';
export { default as Pane } from './Pane.vue';

// Types
export type { AllotmentProps, AllotmentHandle } from './Allotment.vue';
export type { PaneProps } from './Pane.vue';

// Enums and Constants
export { LayoutPriority } from './split-view';
export { Orientation } from './sash';

// Utilities
export { setSashSize } from './utils';

// Re-export core functionality for advanced use cases
export { LayoutService } from './layout-service';
export { PaneView } from './pane-view';
export { SplitView, Sizing } from './split-view';