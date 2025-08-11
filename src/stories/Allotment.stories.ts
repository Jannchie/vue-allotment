import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Allotment, Pane } from '../lib'
import Content from './Content.vue'

const meta = {
  title: 'Basic/Allotment',
  component: Allotment,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    vertical: {
      control: 'boolean',
      description: 'Split direction - horizontal or vertical',
    },
    separator: {
      control: 'boolean',
      description: 'Whether to show separator between panes',
    },
    proportionalLayout: {
      control: 'boolean',
      description: 'Resize each view proportionally when resizing container',
    },
    minSize: {
      control: 'number',
      description: 'Global minimum size for panes',
    },
    maxSize: {
      control: 'number',
      description: 'Global maximum size for panes',
    },
    snap: {
      control: 'boolean',
      description: 'Enable snap to zero size',
    },
    defaultSizes: {
      control: 'object',
      description: 'Initial sizes for each pane',
    },
  },
  args: {
    vertical: false,
    separator: true,
    proportionalLayout: true,
    minSize: 30,
    maxSize: Infinity,
    snap: false,
  },
} satisfies Meta<typeof Allotment>

export default meta
type Story = StoryObj<typeof meta>

// Simple horizontal split
export const Simple: Story = {
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane>
            <Content title="Left Panel" subtitle="Resizable pane" />
          </Pane>
          <Pane>
            <Content title="Right Panel" subtitle="Drag the divider to resize" />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Vertical split
export const Vertical: Story = {
  args: {
    vertical: true,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane>
            <Content title="Top Panel" subtitle="Vertical layout" />
          </Pane>
          <Pane>
            <Content title="Bottom Panel" subtitle="Resize vertically" />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Multiple panes
export const MultiplePanes: Story = {
  args: {
    defaultSizes: [200, 300, 150],
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane>
            <Content title="Pane 1" subtitle="200px initial size" />
          </Pane>
          <Pane>
            <Content title="Pane 2" subtitle="300px initial size" />
          </Pane>
          <Pane>
            <Content title="Pane 3" subtitle="150px initial size" />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// With min/max sizes
export const WithConstraints: Story = {
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane :min-size="100" :max-size="300">
            <Content 
              title="Constrained Pane" 
              subtitle="Min: 100px, Max: 300px"
            />
          </Pane>
          <Pane :min-size="200">
            <Content 
              title="Min Size Pane" 
              subtitle="Min: 200px, no max"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// No separator
export const NoSeparator: Story = {
  args: {
    separator: false,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane>
            <Content 
              title="No Separator"
              subtitle="Panes without visible divider"
            />
          </Pane>
          <Pane>
            <Content 
              title="Still Resizable"
              subtitle="You can still drag to resize"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// With snap to zero
export const WithSnap: Story = {
  args: {
    snap: true,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 400px; border: 1px solid #ddd;">
        <Allotment v-bind="args">
          <Pane snap>
            <Content 
              title="Snap Enabled"
              subtitle="This pane can snap to zero size"
            />
          </Pane>
          <Pane>
            <Content 
              title="Normal Pane"
              subtitle="Regular behavior"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}
