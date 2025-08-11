import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { Allotment, Pane, type AllotmentHandle } from '../lib'
import Content from './Content.vue'

// Mock action for stories
const action = (name: string) => (...args: any[]) => {
  console.log(`Action: ${name}`, args)
}

const meta = {
  title: 'Interactive/Programmatic Control',
  component: Allotment,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Allotment>

export default meta
type Story = StoryObj<typeof meta>

// Programmatic resize and reset
export const ProgrammaticControl: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    setup() {
      const allotmentRef = ref<AllotmentHandle>()
      
      const reset = () => {
        allotmentRef.value?.reset()
        action('reset-clicked')()
      }
      
      const resizeToEqual = () => {
        allotmentRef.value?.resize([250, 250, 250])
        action('resize-equal-clicked')()
      }
      
      const resizeToGolden = () => {
        allotmentRef.value?.resize([300, 200, 150])
        action('resize-golden-clicked')()
      }
      
      return {
        allotmentRef,
        reset,
        resizeToEqual,
        resizeToGolden,
      }
    },
    template: `
      <div style="height: 500px; border: 1px solid #ddd;">
        <div style="padding: 12px; background: #f5f5f5; border-bottom: 1px solid #ddd; display: flex; gap: 8px;">
          <button @click="reset" style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">
            Reset to Default
          </button>
          <button @click="resizeToEqual" style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">
            Equal Sizes (250px each)
          </button>
          <button @click="resizeToGolden" style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white; cursor: pointer;">
            Golden Ratio (300, 200, 150)
          </button>
        </div>
        
        <div style="height: calc(100% - 60px);">
          <Allotment 
            ref="allotmentRef"
            :default-sizes="[200, 300, 200]"
            @change="(sizes) => $emit('change', sizes)"
            @reset="() => $emit('reset')"
            @drag-start="(sizes) => $emit('drag-start', sizes)"
            @drag-end="(sizes) => $emit('drag-end', sizes)"
          >
            <Pane>
              <Content 
                title="Pane 1"
                subtitle="Use buttons above to resize programmatically"
              />
            </Pane>
            <Pane>
              <Content 
                title="Pane 2"
                subtitle="Or drag dividers manually"
              />
            </Pane>
            <Pane>
              <Content 
                title="Pane 3"
                subtitle="Watch the Actions panel below"
              />
            </Pane>
          </Allotment>
        </div>
      </div>
    `,
    emits: ['change', 'reset', 'drag-start', 'drag-end'],
  }),
}

// Dynamic visibility control
export const DynamicVisibility: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    setup() {
      const showPane1 = ref(true)
      const showPane2 = ref(true)
      const showPane3 = ref(true)
      
      return {
        showPane1,
        showPane2,
        showPane3,
      }
    },
    template: `
      <div style="height: 500px; border: 1px solid #ddd;">
        <div style="padding: 12px; background: #f5f5f5; border-bottom: 1px solid #ddd; display: flex; gap: 8px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" v-model="showPane1" />
            Show Pane 1
          </label>
          <label style="display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" v-model="showPane2" />
            Show Pane 2
          </label>
          <label style="display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" v-model="showPane3" />
            Show Pane 3
          </label>
        </div>
        
        <div style="height: calc(100% - 60px);">
          <Allotment
            @visible-change="(index, visible) => $emit('visible-change', index, visible)"
          >
            <Pane v-if="showPane1" :preferred-size="200">
              <Content 
                title="Pane 1"
                subtitle="Toggle visibility with checkboxes above"
                :style="{ background: '#e3f2fd' }"
              />
            </Pane>
            <Pane v-if="showPane2">
              <Content 
                title="Pane 2"
                subtitle="Dynamic show/hide"
                :style="{ background: '#f3e5f5' }"
              />
            </Pane>
            <Pane v-if="showPane3" :preferred-size="150">
              <Content 
                title="Pane 3"
                subtitle="Reactive visibility"
                :style="{ background: '#e8f5e8' }"
              />
            </Pane>
          </Allotment>
        </div>
      </div>
    `,
    emits: ['visible-change'],
  }),
}

// Real-time size monitoring
export const SizeMonitoring: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    setup() {
      const currentSizes = ref<number[]>([])
      
      const handleSizeChange = (sizes: number[]) => {
        currentSizes.value = sizes
        action('size-change')(sizes)
      }
      
      return {
        currentSizes,
        handleSizeChange,
      }
    },
    template: `
      <div style="height: 500px; border: 1px solid #ddd;">
        <div style="padding: 12px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
          <div style="font-weight: bold; margin-bottom: 4px;">Current Sizes:</div>
          <div style="font-family: monospace; font-size: 14px;">
            {{ currentSizes.map(s => s.toFixed(1) + 'px').join(' | ') }}
          </div>
        </div>
        
        <div style="height: calc(100% - 70px);">
          <Allotment
            :default-sizes="[200, 300, 150]"
            @change="handleSizeChange"
          >
            <Pane :min-size="100">
              <Content 
                title="Size Monitor"
                subtitle="Watch sizes update in real-time above"
              >
                <div style="margin-top: 16px;">
                  <p><strong>Current width:</strong> {{ currentSizes[0]?.toFixed(1) || '—' }}px</p>
                  <p><strong>Min size:</strong> 100px</p>
                  <p style="color: #666; font-size: 12px;">Resize by dragging the dividers</p>
                </div>
              </Content>
            </Pane>
            <Pane>
              <Content 
                title="Flexible Pane"
                subtitle="No size constraints"
              >
                <div style="margin-top: 16px;">
                  <p><strong>Current width:</strong> {{ currentSizes[1]?.toFixed(1) || '—' }}px</p>
                  <p><strong>Constraints:</strong> None</p>
                  <p style="color: #666; font-size: 12px;">This pane adapts to available space</p>
                </div>
              </Content>
            </Pane>
            <Pane :max-size="400">
              <Content 
                title="Max Constrained"
                subtitle="Limited maximum width"
              >
                <div style="margin-top: 16px;">
                  <p><strong>Current width:</strong> {{ currentSizes[2]?.toFixed(1) || '—' }}px</p>
                  <p><strong>Max size:</strong> 400px</p>
                  <p style="color: #666; font-size: 12px;">Cannot exceed 400px width</p>
                </div>
              </Content>
            </Pane>
          </Allotment>
        </div>
      </div>
    `,
  }),
}