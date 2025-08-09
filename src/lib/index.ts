export { default as Allotment } from './Allotment.vue';
export { default as Pane } from './Pane.vue';
export type { AllotmentProps, AllotmentHandle } from './Allotment.vue';
export type { PaneProps } from './Pane.vue';
export { LayoutPriority } from './split-view';
export { setSashSize } from './utils';

// Re-export key types and utilities
export * from './helpers';
export * from './layout-service';
export * from './pane-view';
export * from './sash';
export * from './split-view';