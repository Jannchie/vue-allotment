<script setup lang="ts">
import type { CSSProperties } from 'vue'

interface Props {
  className?: string
  title?: string
  subtitle?: string
  style?: CSSProperties
}

withDefaults(defineProps<Props>(), {
  className: '',
  title: '',
  subtitle: '',
  style: () => ({}),
})
</script>

<template>
  <div class="content" :class="[className]" :style="style">
    <div class="content-header">
      <h3 v-if="title">
        {{ title }}
      </h3>
      <div v-if="subtitle" class="content-subtitle">
        {{ subtitle }}
      </div>
    </div>
    <div class="content-body">
      <slot>
        <p>This is a resizable pane. Drag the separator to resize.</p>
        <p>Content can be customized by passing different props or using slots.</p>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.content {
  height: 100%;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

.content-header {
  margin-bottom: 12px;
}

.content-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.content-subtitle {
  font-size: 14px;
  color: #6c757d;
}

.content-body {
  flex: 1;
  overflow: auto;
}

.content-body p {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
}
</style>
