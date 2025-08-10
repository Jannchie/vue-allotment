<script setup lang="ts">
import type { AllotmentHandle } from './lib'
import { ref } from 'vue'
import { Allotment, Pane } from './lib'

const sizes = ref<number[]>([])
const allotmentRef = ref<AllotmentHandle>()
const visible1 = ref(true)
const preferredSize = ref(200)
const panes = ref([0, 1, 2])

function onSizeChange(newSizes: number[]) {
  sizes.value = newSizes
  // console.log('Sizes changed:', newSizes)
}

function onReset() {
  // console.log('Reset triggered')
}

function onDragStart(_startSizes: number[]) {
  // console.log('Drag started with sizes:', startSizes)
}

function onDragEnd(_endSizes: number[]) {
  // console.log('Drag ended with sizes:', endSizes)
}

function onVisibleChange(index: number, visible: boolean) {
  // console.log(`Pane ${index} visibility changed to:`, visible)
  if (index === 1) {
    visible1.value = visible
  }
}

function resetAllotment() {
  allotmentRef.value?.reset()
}

function resizeAllotment() {
  allotmentRef.value?.resize([200, 300, 200])
}

function randomPreferredSize() {
  preferredSize.value = Math.round(100 + Math.random() * 200)
}

function addPane() {
  const newId = Math.max(...panes.value, -1) + 1
  panes.value.push(newId)
}

function removePane(id: number) {
  const index = panes.value.indexOf(id)
  if (index !== -1) {
    panes.value.splice(index, 1)
  }
}
</script>

<template>
  <div id="app">
    <h1>Vue Allotment Demo</h1>

    <div class="demo-container">
      <div class="info-panel">
        <h3>Current Sizes</h3>
        <p v-if="sizes.length > 0">
          {{ sizes.map(s => Math.round(s)).join('px, ') }}px
        </p>
        <p v-else>
          No sizes available yet
        </p>
      </div>

      <h2>Basic Horizontal Split</h2>
      <div class="demo-box">
        <Allotment
          :default-sizes="[300, 400]"
          @change="onSizeChange"
          @reset="onReset"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
        >
          <Pane key="pane1">
            <div class="pane-content pane-1">
              <h3>Left Pane</h3>
              <p>This is the left pane. Try dragging the sash!</p>
              <p>Min size: 30px</p>
            </div>
          </Pane>
          <Pane key="pane2">
            <div class="pane-content pane-2">
              <h3>Right Pane</h3>
              <p>This is the right pane.</p>
              <p>You can resize by dragging the divider.</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h2>Vertical Split</h2>
      <div class="demo-box">
        <Allotment vertical :default-sizes="[150, 150]">
          <Pane key="top">
            <div class="pane-content pane-3">
              <h3>Top Pane</h3>
              <p>This is the top pane</p>
            </div>
          </Pane>
          <Pane key="bottom">
            <div class="pane-content pane-4">
              <h3>Bottom Pane</h3>
              <p>This is the bottom pane</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h2>Three Panes with Custom Properties</h2>
      <div class="demo-box">
        <Allotment :default-sizes="[200, 300, 100]">
          <Pane key="left" :min-size="100" :max-size="400">
            <div class="pane-content pane-1">
              <h3>Left</h3>
              <p>Min: 100px, Max: 400px</p>
            </div>
          </Pane>
          <Pane key="center" :min-size="200">
            <div class="pane-content pane-2">
              <h3>Center</h3>
              <p>Min: 200px</p>
            </div>
          </Pane>
          <Pane key="right" :min-size="50" :max-size="200">
            <div class="pane-content pane-3">
              <h3>Right</h3>
              <p>Min: 50px, Max: 200px</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h2>Snap to Zero</h2>
      <div class="demo-box">
        <Allotment :default-sizes="[200, 300]">
          <Pane key="snap1" :min-size="0" :snap="true">
            <div class="pane-content pane-5">
              <h3>Snap Pane</h3>
              <p>This pane can snap to 0</p>
              <p>Min size: 0px (with snap)</p>
            </div>
          </Pane>
          <Pane key="normal1">
            <div class="pane-content pane-6">
              <h3>Normal Pane</h3>
              <p>Regular pane</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h2>Nested Splits</h2>
      <div class="demo-box">
        <Allotment>
          <Pane key="main-left">
            <div class="pane-content pane-1">
              <h3>Left Panel</h3>
              <p>Static left panel</p>
            </div>
          </Pane>
          <Pane key="main-right">
            <Allotment vertical :default-sizes="[150, 150]">
              <Pane key="nested-top">
                <div class="pane-content pane-2">
                  <h3>Top Right</h3>
                  <p>Nested top panel</p>
                </div>
              </Pane>
              <Pane key="nested-bottom">
                <div class="pane-content pane-4">
                  <h3>Bottom Right</h3>
                  <p>Nested bottom panel</p>
                </div>
              </Pane>
            </Allotment>
          </Pane>
        </Allotment>
      </div>

      <h2>Advanced Features</h2>

      <h3>Reset and Resize Controls</h3>
      <div class="controls">
        <button class="control-btn" @click="resetAllotment">
          Reset Layout
        </button>
        <button class="control-btn" @click="resizeAllotment">
          Resize to [200, 300, 200]
        </button>
      </div>
      <div class="demo-box">
        <Allotment ref="allotmentRef" :default-sizes="[250, 250, 200]">
          <Pane key="control1">
            <div class="pane-content pane-1">
              <h3>Pane 1</h3>
              <p>Use controls above</p>
            </div>
          </Pane>
          <Pane key="control2">
            <div class="pane-content pane-2">
              <h3>Pane 2</h3>
              <p>To reset or resize</p>
            </div>
          </Pane>
          <Pane key="control3">
            <div class="pane-content pane-3">
              <h3>Pane 3</h3>
              <p>The layout</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h3>Preferred Size with Percentage</h3>
      <div class="controls">
        <button class="control-btn" @click="randomPreferredSize">
          Random preferredSize: {{ preferredSize }}px
        </button>
      </div>
      <div class="demo-box">
        <Allotment>
          <Pane key="pref1" preferred-size="20%">
            <div class="pane-content pane-4">
              <h3>20% Width</h3>
              <p>Preferred size: 20%</p>
            </div>
          </Pane>
          <Pane key="pref2">
            <div class="pane-content pane-5">
              <h3>Flexible</h3>
              <p>Takes remaining space</p>
            </div>
          </Pane>
          <Pane key="pref3" :preferred-size="preferredSize">
            <div class="pane-content pane-6">
              <h3>Dynamic</h3>
              <p>Preferred: {{ preferredSize }}px</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h3>Visible/Hidden Panes</h3>
      <div class="controls">
        <button class="control-btn" @click="visible1 = !visible1">
          {{ visible1 ? 'Hide' : 'Show' }} Middle Pane
        </button>
      </div>
      <div class="demo-box">
        <Allotment
          @visible-change="onVisibleChange"
        >
          <Pane key="vis1">
            <div class="pane-content pane-1">
              <h3>Always Visible</h3>
              <p>This pane is always shown</p>
            </div>
          </Pane>
          <Pane key="vis2" :visible="visible1" :min-size="0" :snap="true">
            <div class="pane-content pane-2">
              <h3>Toggleable</h3>
              <p>Click button to hide/show</p>
            </div>
          </Pane>
          <Pane key="vis3">
            <div class="pane-content pane-3">
              <h3>Always Visible</h3>
              <p>This pane is always shown</p>
            </div>
          </Pane>
        </Allotment>
      </div>

      <h3>Dynamic Add/Remove Panes</h3>
      <div class="controls">
        <button class="control-btn" @click="addPane">
          Add Pane
        </button>
      </div>
      <div class="demo-box">
        <Allotment>
          <Pane v-for="paneId in panes" :key="`pane-${paneId}`">
            <div class="pane-content" :class="`pane-${(paneId % 6) + 1}`">
              <h3>Pane {{ paneId + 1 }}</h3>
              <button class="close-btn" @click="removePane(paneId)">
                ×
              </button>
              <p>Dynamic pane</p>
            </div>
          </Pane>
        </Allotment>
      </div>
    </div>
  </div>
</template>

<style scoped>
#app {
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #34495e;
  margin-top: 30px;
  margin-bottom: 10px;
}

.demo-container {
  max-width: 1200px;
  margin: 0 auto;
}

.info-panel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-panel h3 {
  margin-top: 0;
  color: #495057;
}

.info-panel p {
  margin-bottom: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

.demo-box {
  height: 300px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.pane-content {
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
}

.pane-1 {
  background-color: #f8f9fa;
  color: #495057;
}

.pane-2 {
  background-color: #e3f2fd;
  color: #1565c0;
}

.pane-3 {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.pane-4 {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.pane-5 {
  background-color: #fff3e0;
  color: #e65100;
}

.pane-6 {
  background-color: #fce4ec;
  color: #c2185b;
}

.pane-content h3 {
  margin: 0 0 10px 0;
  font-size: 1.2em;
}

.pane-content p {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  opacity: 0.8;
}

.pane-content p:last-child {
  margin-bottom: 0;
}

.controls {
  margin: 10px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.control-btn {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.control-btn:hover {
  background-color: #2980b9;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background-color: #ff4444;
  color: white;
  border-color: #ff4444;
}

h3 {
  color: #34495e;
  margin-bottom: 10px;
}
</style>
