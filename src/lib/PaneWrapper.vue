<script setup lang="ts">
import { getCurrentInstance, inject, onMounted, onUnmounted, ref } from 'vue'
import styles from './allotment.module.css'

const wrapperRef = ref<HTMLElement>()
const instance = getCurrentInstance()

// Inject Allotment context
const allotment = inject<any>('allotment')

// Get unique key for this wrapper
function getWrapperKey() {
  return instance?.vnode.key as string || `wrapper-${Math.random().toString(36).slice(2, 11)}`
}

const wrapperKey = getWrapperKey()

// Register with parent Allotment component
onMounted(() => {
  if (allotment && wrapperRef.value) {
    allotment.registerNonPane(wrapperKey, wrapperRef.value)
  }
})

// Unregister on unmount
onUnmounted(() => {
  if (allotment) {
    allotment.unregisterPane(wrapperKey)
  }
})

// Expose the ref for parent components
defineExpose({
  element: wrapperRef,
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="split-view-view split-view-view-visible" :class="[
      styles.splitViewView,
    ]"
  >
    <slot />
  </div>
</template>
