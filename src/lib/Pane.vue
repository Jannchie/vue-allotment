<template>
  <div
    ref="paneRef"
    :class="[
      'split-view-view',
      visible && 'split-view-view-visible',
      styles.splitViewView,
      className
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch, getCurrentInstance } from 'vue';
import type { LayoutPriority } from './split-view';
import styles from './allotment.module.css';

export interface PaneProps {
  /** Sets a className attribute on the pane */
  className?: string;
  /** Maximum size of this pane */
  maxSize?: number;
  /** Minimum size of this pane */
  minSize?: number;
  /** Enable snap to zero size */
  snap?: boolean;
  /**
   * Preferred size of this pane. Allotment will attempt to use this size when adding this pane (including on initial mount) as well as when a user double clicks a sash, or the `reset` method is called on the Allotment instance.
   * @remarks The size can either be a number or a string. If it is a number it will be interpreted as a number of pixels. If it is a string it should end in either "px" or "%". If it ends in "px" it will be interpreted as a number of pixels, e.g. "120px". If it ends in "%" it will be interpreted as a percentage of the size of the Allotment component, e.g. "50%".
   */
  preferredSize?: number | string;
  /**
   * The priority of the pane when the layout algorithm runs. Panes with higher priority will be resized first.
   * @remarks Only used when `proportionalLayout` is false.
   */
  priority?: LayoutPriority;
  /** Whether the pane should be visible */
  visible?: boolean;
}

const props = withDefaults(defineProps<PaneProps>(), {
  className: '',
  snap: false,
  visible: true
});

const paneRef = ref<HTMLElement>();
const instance = getCurrentInstance();

// Inject Allotment context
const allotment = inject<any>('allotment');

// Get unique key for this pane
const getPaneKey = () => {
  return instance?.vnode.key as string || `pane-${Math.random().toString(36).slice(2, 11)}`;
};

const paneKey = getPaneKey();

// Register with parent Allotment component
onMounted(() => {
  if (allotment && paneRef.value) {
    allotment.registerPane(paneKey, paneRef.value, {
      minSize: props.minSize,
      maxSize: props.maxSize,
      preferredSize: props.preferredSize,
      priority: props.priority,
      snap: props.snap,
      visible: props.visible,
    });
  }
});

// Update parent when props change
watch(() => props, (newProps) => {
  if (allotment && paneRef.value) {
    allotment.registerPane(paneKey, paneRef.value, {
      minSize: newProps.minSize,
      maxSize: newProps.maxSize,
      preferredSize: newProps.preferredSize,
      priority: newProps.priority,
      snap: newProps.snap,
      visible: newProps.visible,
    });
  }
}, { deep: true });

// Unregister on unmount
onUnmounted(() => {
  if (allotment) {
    allotment.unregisterPane(paneKey);
  }
});

// Expose the ref for parent components
defineExpose({
  element: paneRef
});
</script>

