<template>
  <div
    ref="containerRef"
    :id="id"
    :class="[
      'split-view',
      vertical ? 'split-view-vertical' : 'split-view-horizontal',
      { 'split-view-separator-border': separator },
      styles.splitView,
      vertical ? styles.vertical : styles.horizontal,
      { [styles.separatorBorder]: separator },
      className
    ]"
  >
    <div ref="splitViewContainerRef" :class="['split-view-container', styles.splitViewContainer]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  useSlots,
  watch,
  provide,
  type VNode,
} from 'vue';
import { isIOS } from './helpers/platform';
import { LayoutService } from './layout-service';
import { PaneView } from './pane-view';
import { Orientation } from './sash';
import { setSashSize } from './utils';
import {
  LayoutPriority,
  SplitView,
  type SplitViewOptions,
  Sizing,
} from './split-view';
import isEqual from 'lodash.isequal';

import styles from './allotment.module.css';

export interface AllotmentHandle {
  reset: () => void;
  resize: (sizes: number[]) => void;
}

export interface AllotmentProps {
  /** Sets a className attribute on the outer component */
  className?: string;
  /** Initial size of each element */
  defaultSizes?: number[];
  /** The id to set on the SplitView component */
  id?: string;
  /** Maximum size of each element */
  maxSize?: number;
  /** Minimum size of each element */
  minSize?: number;
  /** Resize each view proportionally when resizing container */
  proportionalLayout?: boolean;
  /** Whether to render a separator between panes */
  separator?: boolean;
  /** Enable snap to zero size */
  snap?: boolean;
  /**
   * Initial size of each element
   * @deprecated Use defaultSizes instead
   */
  sizes?: number[];
  /** Direction to split */
  vertical?: boolean;
}

const props = withDefaults(defineProps<AllotmentProps>(), {
  className: '',
  maxSize: Infinity,
  minSize: 30,
  proportionalLayout: true,
  separator: true,
  snap: false,
  vertical: false
});

const emit = defineEmits<{
  change: [sizes: number[]];
  reset: [];
  visibleChange: [index: number, visible: boolean];
  dragStart: [sizes: number[]];
  dragEnd: [sizes: number[]];
}>();

// Reactive state
const containerRef = ref<HTMLElement>();
const splitViewContainerRef = ref<HTMLElement>();
const dimensionsInitialized = ref(false);
const splitViewRef = ref<SplitView | null>(null);
const splitViewViewRef = reactive(new Map<string, HTMLElement>());
const splitViewPropsRef = reactive(new Map<string, any>());
const layoutService = ref<LayoutService>(new LayoutService());
const views = ref<PaneView[]>([]);
const previousKeys = ref<string[]>([]);
const resizeObserver = ref<ResizeObserver | null>(null);

// Slots handling
const slots = useSlots();

// Provide context for child Pane components
provide('allotment', {
  registerPane: (key: string, element: HTMLElement, props: any) => {
    splitViewViewRef.set(key, element);
    splitViewPropsRef.set(key, props);
  },
  unregisterPane: (key: string) => {
    splitViewViewRef.delete(key);
    splitViewPropsRef.delete(key);
  },
});

// Computed properties
const childrenArray = computed(() => {
  const slotContent = slots.default?.() || [];
  const flattenVNodes = (vnodes: VNode[]): VNode[] => {
    return vnodes.reduce((acc: VNode[], vnode) => {
      if (Array.isArray(vnode.children)) {
        return acc.concat(flattenVNodes(vnode.children as VNode[]));
      }
      if (vnode.type && typeof vnode.type === 'object' && 'name' in vnode.type) {
        acc.push(vnode);
      }
      return acc;
    }, []);
  };
  return flattenVNodes(slotContent);
});

// Methods
const resizeToPreferredSize = (index: number): boolean => {
  const view = views.value?.[index];

  if (typeof view?.preferredSize !== "number") {
    return false;
  }

  splitViewRef.value?.resizeView(index, Math.round(view.preferredSize));

  return true;
};

// Expose methods for template ref
const reset = () => {
  if (props.defaultSizes) {
    splitViewRef.value?.resizeViews(props.defaultSizes);
  } else {
    splitViewRef.value?.distributeViewSizes();
    for (let index = 0; index < views.value.length; index++) {
      resizeToPreferredSize(index);
    }
  }
  emit('reset');
};

const resize = (sizes: number[]) => {
  splitViewRef.value?.resizeViews(sizes);
};

defineExpose({
  reset,
  resize
});

// Initialize split view
const initializeSplitView = () => {
  if (!containerRef.value) return;

  let initializeSizes = true;

  if (
    props.defaultSizes &&
    splitViewViewRef.size !== props.defaultSizes.length
  ) {
    initializeSizes = false;
    console.warn(
      `Expected ${props.defaultSizes.length} children based on defaultSizes but found ${splitViewViewRef.size}`,
    );
  }

  if (initializeSizes && props.defaultSizes) {
    previousKeys.value = childrenArray.value.map(
      (child) => child.key as string,
    );
  }

  const options: SplitViewOptions = {
    orientation: props.vertical ? Orientation.Vertical : Orientation.Horizontal,
    proportionalLayout: props.proportionalLayout,
    ...(initializeSizes &&
      props.defaultSizes && {
        descriptor: {
          size: props.defaultSizes.reduce((a, b) => a + b, 0),
          views: props.defaultSizes.map((size, index) => {
            const paneProps = splitViewPropsRef.get(
              previousKeys.value[index],
            );

            const view = new PaneView(layoutService.value as LayoutService, {
              element: document.createElement("div"),
              minimumSize: paneProps?.minSize ?? props.minSize,
              maximumSize: paneProps?.maxSize ?? props.maxSize,
              priority: paneProps?.priority ?? LayoutPriority.Normal,
              ...(paneProps?.preferredSize && {
                preferredSize: paneProps?.preferredSize,
              }),
              snap: paneProps?.snap ?? props.snap,
            });

            views.value.push(view);

            return {
              container: [...splitViewViewRef.values()][index],
              size: size,
              view: view,
            };
          }),
        },
      }),
  };

  splitViewRef.value = new SplitView(
    containerRef.value,
    options,
    (sizes: number[]) => emit('change', sizes),
    (sizes: number[]) => emit('dragStart', sizes),
    (sizes: number[]) => emit('dragEnd', sizes),
  );

  // Setup event listeners
  splitViewRef.value.on("sashDragStart", () => {
    containerRef.value?.classList.add("split-view-sash-dragging");
  });
  
  splitViewRef.value.on("sashDragEnd", () => {
    containerRef.value?.classList.remove("split-view-sash-dragging");
  });

  splitViewRef.value.on("sashchange", (_index: number) => {
    if (splitViewRef.value) {
      const keys = childrenArray.value.map((child) => child.key as string);

      for (let index = 0; index < keys.length; index++) {
        const paneProps = splitViewPropsRef.get(keys[index]);

        if (paneProps?.visible !== undefined) {
          if (paneProps.visible !== splitViewRef.value.isViewVisible(index)) {
            emit('visibleChange', index, splitViewRef.value.isViewVisible(index));
          }
        }
      }
    }
  });

  splitViewRef.value?.on("sashreset", (index: number) => {
    emit('reset');
    if (resizeToPreferredSize(index)) {
      return;
    }

    if (resizeToPreferredSize(index + 1)) {
      return;
    }

    splitViewRef.value?.distributeViewSizes();
  });
};

// Update views when children change
const updateViews = () => {
  if (!dimensionsInitialized.value || !splitViewRef.value) return;

  const keys = childrenArray.value.map((child) => child.key as string);
  const panes = [...previousKeys.value];

  const enter = keys.filter((key) => !previousKeys.value.includes(key));
  const update = keys.filter((key) => previousKeys.value.includes(key));
  const exit = previousKeys.value.map((key, index) => ({ key, index, shouldExit: !keys.includes(key) }));

  // Remove exited views
  for (let i = exit.length - 1; i >= 0; i--) {
    if (exit[i].shouldExit) {
      splitViewRef.value.removeView(exit[i].index);
      panes.splice(exit[i].index, 1);
      views.value.splice(exit[i].index, 1);
    }
  }

  // Add new views
  for (const enterKey of enter) {
    const paneProps = splitViewPropsRef.get(enterKey);

    const view = new PaneView(layoutService.value as LayoutService, {
      element: document.createElement("div"),
      minimumSize: paneProps?.minSize ?? props.minSize,
      maximumSize: paneProps?.maxSize ?? props.maxSize,
      priority: paneProps?.priority ?? LayoutPriority.Normal,
      ...(paneProps?.preferredSize && {
        preferredSize: paneProps?.preferredSize,
      }),
      snap: paneProps?.snap ?? props.snap,
    });

    const index = keys.findIndex((key) => key === enterKey);
    
    splitViewRef.value.addView(
      splitViewViewRef.get(enterKey)!,
      view,
      Sizing.Distribute,
      index,
    );

    panes.splice(index, 0, enterKey);
    views.value.splice(index, 0, view);
  }

  // Move panes if order has changed
  while (!isEqual(keys, panes)) {
    for (const [i, key] of keys.entries()) {
      const index = panes.findIndex((pane) => pane === key);

      if (index !== i) {
        splitViewRef.value.moveView(
          splitViewViewRef.get(key) as HTMLElement,
          index,
          i,
        );

        const tempKey = panes[index];
        panes.splice(index, 1);
        panes.splice(i, 0, tempKey);

        const tempView = views.value[index];
        views.value.splice(index, 1);
        views.value.splice(i, 0, tempView);

        break;
      }
    }
  }

  // Update view properties
  for (const updateKey of [...enter, ...update]) {
    const paneProps = splitViewPropsRef.get(updateKey);
    const index = keys.findIndex((key) => key === updateKey);

    if (paneProps) {
      if (paneProps.visible !== undefined) {
        if (splitViewRef.value.isViewVisible(index) !== paneProps.visible) {
          splitViewRef.value.setViewVisible(index, paneProps.visible);
        }
      }

      if (paneProps.preferredSize !== undefined && views.value[index].preferredSize !== paneProps.preferredSize) {
        views.value[index].preferredSize = paneProps.preferredSize;
      }

      let sizeChanged = false;

      if (paneProps.minSize !== undefined && views.value[index].minimumSize !== paneProps.minSize) {
        views.value[index].minimumSize = paneProps.minSize;
        sizeChanged = true;
      }

      if (paneProps.maxSize !== undefined && views.value[index].maximumSize !== paneProps.maxSize) {
        views.value[index].maximumSize = paneProps.maxSize;
        sizeChanged = true;
      }

      if (sizeChanged) {
        splitViewRef.value.layout();
      }
    }
  }

  if (enter.length > 0 || exit.some(e => e.shouldExit)) {
    previousKeys.value = keys;
  }
};

// Setup resize observer
const setupResizeObserver = () => {
  if (!containerRef.value) return;

  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width && height) {
        splitViewRef.value?.layout(props.vertical ? height : width);
        layoutService.value.setSize(props.vertical ? height : width);
        if (!dimensionsInitialized.value) {
          dimensionsInitialized.value = true;
        }
      }
    }
  });

  resizeObserver.value.observe(containerRef.value);
};

// Lifecycle hooks
onMounted(() => {
  if (isIOS) {
    setSashSize(20);
  }

  nextTick(() => {
    initializeSplitView();
    setupResizeObserver();
    
    // 强制重新布局以确保正确的初始位置
    setTimeout(() => {
      if (containerRef.value && splitViewRef.value) {
        const rect = containerRef.value.getBoundingClientRect();
        const size = props.vertical ? rect.height : rect.width;
        if (size > 0) {
          splitViewRef.value.layout(size);
        }
      }
    }, 50);
  });
});

// Watch for children changes
watch(childrenArray, () => {
  nextTick(() => {
    updateViews();
  });
}, { deep: true });

// Watch for prop changes
watch(() => props.vertical, (newVal) => {
  if (splitViewRef.value) {
    splitViewRef.value.orientation = newVal ? Orientation.Vertical : Orientation.Horizontal;
    splitViewRef.value.layout();
  }
});

watch(() => props.proportionalLayout, (newVal) => {
  if (splitViewRef.value) {
    splitViewRef.value.proportionalLayout = newVal;
  }
});

onUnmounted(() => {
  resizeObserver.value?.disconnect();
  splitViewRef.value?.dispose();
});
</script>

<style scoped>
/* Component styles are handled by CSS modules */
</style>