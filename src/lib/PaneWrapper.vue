<template>
  <div
    ref="wrapperRef"
    :class="[
      'split-view-view',
      'split-view-view-visible',
      styles.splitViewView,
    ]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import styles from './allotment.module.css';

const wrapperRef = ref<HTMLElement>();
const instance = getCurrentInstance();

// Inject Allotment context
const allotment = inject<any>('allotment');

// Get unique key for this wrapper
const getWrapperKey = () => {
  return instance?.vnode.key as string || `wrapper-${Math.random().toString(36).slice(2, 11)}`;
};

const wrapperKey = getWrapperKey();

// Register with parent Allotment component
onMounted(() => {
  if (allotment && wrapperRef.value) {
    allotment.registerNonPane(wrapperKey, wrapperRef.value);
  }
});

// Unregister on unmount
onUnmounted(() => {
  if (allotment) {
    allotment.unregisterPane(wrapperKey);
  }
});

// Expose the ref for parent components
defineExpose({
  element: wrapperRef
});
</script>

<style scoped>
.split-view-view {
  overflow: hidden;
  position: absolute;
  white-space: initial;
}
</style>