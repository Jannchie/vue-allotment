import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Allotment, Pane } from '../lib'
import Content from './Content.vue'

const meta = {
  title: 'Basic/Pane',
  component: Pane,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    minSize: {
      control: 'number',
      description: 'Minimum size for this pane',
    },
    maxSize: {
      control: 'number',
      description: 'Maximum size for this pane',
    },
    preferredSize: {
      control: 'text',
      description: 'Preferred size (number of pixels or percentage string)',
    },
    snap: {
      control: 'boolean',
      description: 'Enable snap to zero size for this pane',
    },
    visible: {
      control: 'boolean',
      description: 'Whether the pane is visible',
    },
    className: {
      control: 'text',
      description: 'Custom CSS class',
    },
  },
  args: {
    visible: true,
    snap: false,
  },
} satisfies Meta<typeof Pane>

export default meta
type Story = StoryObj<typeof meta>

// Pane with minimum size
export const WithMinSize: Story = {
  args: {
    minSize: 200,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Min Size: 200px"
              subtitle="This pane cannot be smaller than 200px"
            />
          </Pane>
          <Pane>
            <Content 
              title="Flexible Pane"
              subtitle="No size constraints"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Pane with maximum size
export const WithMaxSize: Story = {
  args: {
    maxSize: 300,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Max Size: 300px"
              subtitle="This pane cannot be larger than 300px"
            />
          </Pane>
          <Pane>
            <Content 
              title="Flexible Pane"
              subtitle="No size constraints"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Pane with both min and max size
export const WithMinMaxSize: Story = {
  args: {
    minSize: 150,
    maxSize: 400,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Constrained Pane"
              subtitle="Min: 150px, Max: 400px"
            />
          </Pane>
          <Pane>
            <Content 
              title="Flexible Pane"
              subtitle="No size constraints"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Pane with preferred size (pixels)
export const WithPreferredSizePixels: Story = {
  args: {
    preferredSize: 250,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Preferred Size: 250px"
              subtitle="Initial size preference"
            />
          </Pane>
          <Pane>
            <Content 
              title="Flexible Pane"
              subtitle="Takes remaining space"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Pane with preferred size (percentage)
export const WithPreferredSizePercentage: Story = {
  args: {
    preferredSize: '30%',
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Preferred Size: 30%"
              subtitle="Percentage of total width"
            />
          </Pane>
          <Pane>
            <Content 
              title="Flexible Pane"
              subtitle="Takes remaining 70%"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Pane with snap enabled
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
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Snap Enabled"
              subtitle="Drag to very small size to snap to zero"
            />
          </Pane>
          <Pane>
            <Content 
              title="Regular Pane"
              subtitle="No snap behavior"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Hidden pane
export const HiddenPane: Story = {
  args: {
    visible: false,
  },
  render: args => ({
    components: { Allotment, Pane, Content },
    setup() {
      return { args }
    },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane v-bind="args">
            <Content 
              title="Hidden Pane"
              subtitle="This pane is not visible"
            />
          </Pane>
          <Pane>
            <Content 
              title="Visible Pane"
              subtitle="Only this pane is shown"
            />
          </Pane>
          <Pane>
            <Content 
              title="Another Visible Pane"
              subtitle="This one is also shown"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Multiple configured panes
export const MultipleConfiguredPanes: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 100dvh;">
        <Allotment>
          <Pane :min-size="100" :max-size="200" :preferred-size="150">
            <Content 
              title="Pane 1"
              subtitle="Min: 100px, Max: 200px, Preferred: 150px"
            />
          </Pane>
          <Pane :preferred-size="'40%'" snap>
            <Content 
              title="Pane 2"
              subtitle="Preferred: 40%, Snap enabled"
            />
          </Pane>
          <Pane :min-size="80">
            <Content 
              title="Pane 3"
              subtitle="Min: 80px, flexible max"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}
