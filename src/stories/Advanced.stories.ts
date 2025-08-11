import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Allotment, Pane } from '../lib'
import Content from './Content.vue'

const meta = {
  title: 'Advanced/Complex Layouts',
  component: Allotment,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Allotment>

export default meta
type Story = StoryObj<typeof meta>

// Nested layout
export const NestedLayout: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 800px; border: 1px solid #ddd;">
        <Allotment vertical>
          <Pane :min-size="40" :preferred-size="60">
            <Content 
              title="Header"
              subtitle="Top level header"
            />
          </Pane>
          <Pane>
            <Allotment>
              <Pane :min-size="200" :max-size="400">
                <Content 
                  title="Sidebar"
                  subtitle="Constrained width"
                />
              </Pane>
              <Pane>
                <Allotment vertical>
                  <Pane>
                    <Content 
                      title="Main Content"
                      subtitle="Nested vertical split"
                    />
                  </Pane>
                  <Pane :min-size="30" :preferred-size="100">
                    <Content 
                      title="Bottom Panel"
                      subtitle="Min: 30px, Preferred: 100px"
                    />
                  </Pane>
                </Allotment>
              </Pane>
            </Allotment>
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Code editor layout (similar to VS Code)
export const CodeEditorLayout: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 600px; border: 1px solid #ddd;">
        <Allotment vertical>
          <!-- Title Bar -->
          <Pane :min-size="32" :max-size="32">
            <Content 
              title="Title Bar"
              subtitle="Fixed height"
              :style="{ background: '#2c2c2c', color: 'white', padding: '8px 16px' }"
            />
          </Pane>
          
          <!-- Main Layout -->
          <Pane>
            <Allotment>
              <!-- Activity Bar -->
              <Pane :min-size="48" :max-size="48">
                <Content 
                  title="Activity"
                  subtitle="Icons"
                  :style="{ background: '#333333', color: 'white', textAlign: 'center' }"
                />
              </Pane>
              
              <!-- Sidebar -->
              <Pane :min-size="200" :max-size="500" :preferred-size="250">
                <Content 
                  title="Explorer"
                  subtitle="File tree and panels"
                  :style="{ background: '#252526', color: 'white' }"
                />
              </Pane>
              
              <!-- Editor Group -->
              <Pane>
                <Allotment vertical>
                  <!-- Editor -->
                  <Pane>
                    <Content 
                      title="Editor"
                      subtitle="Main editing area"
                      :style="{ background: '#1e1e1e', color: 'white' }"
                    />
                  </Pane>
                  
                  <!-- Panel -->
                  <Pane :min-size="100" :preferred-size="200">
                    <Content 
                      title="Terminal"
                      subtitle="Output, terminal, problems"
                      :style="{ background: '#181818', color: 'white' }"
                    />
                  </Pane>
                </Allotment>
              </Pane>
            </Allotment>
          </Pane>
          
          <!-- Status Bar -->
          <Pane :min-size="22" :max-size="22">
            <Content 
              title="Status Bar"
              subtitle="Ready"
              :style="{ background: '#007acc', color: 'white', padding: '4px 16px', fontSize: '12px' }"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Dashboard layout
export const DashboardLayout: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 600px; border: 1px solid #ddd;">
        <Allotment vertical>
          <!-- Header -->
          <Pane :min-size="60" :max-size="60">
            <Content 
              title="Dashboard Header"
              subtitle="Navigation and controls"
              :style="{ background: '#4285f4', color: 'white' }"
            />
          </Pane>
          
          <!-- Main Content -->
          <Pane>
            <Allotment>
              <!-- Left Panel -->
              <Pane :min-size="200" :preferred-size="300">
                <Allotment vertical>
                  <Pane>
                    <Content 
                      title="Filters"
                      subtitle="Search and filter options"
                    />
                  </Pane>
                  <Pane>
                    <Content 
                      title="Quick Stats"
                      subtitle="Key metrics"
                    />
                  </Pane>
                </Allotment>
              </Pane>
              
              <!-- Main Content Area -->
              <Pane>
                <Allotment vertical>
                  <!-- Charts Row -->
                  <Pane>
                    <Allotment>
                      <Pane>
                        <Content 
                          title="Chart 1"
                          subtitle="Revenue over time"
                        />
                      </Pane>
                      <Pane>
                        <Content 
                          title="Chart 2"
                          subtitle="User activity"
                        />
                      </Pane>
                    </Allotment>
                  </Pane>
                  
                  <!-- Data Table -->
                  <Pane :preferred-size="250">
                    <Content 
                      title="Data Table"
                      subtitle="Recent transactions"
                    />
                  </Pane>
                </Allotment>
              </Pane>
              
              <!-- Right Panel -->
              <Pane :min-size="200" :preferred-size="250">
                <Allotment vertical>
                  <Pane>
                    <Content 
                      title="Notifications"
                      subtitle="Recent alerts"
                    />
                  </Pane>
                  <Pane>
                    <Content 
                      title="Activity Feed"
                      subtitle="User actions"
                    />
                  </Pane>
                </Allotment>
              </Pane>
            </Allotment>
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Simple nested test - to debug sash disable issue
export const SimpleNestedTest: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 100dvh;">
        <Allotment vertical>
          <Pane :min-size="30">
            <Content title="Top" subtitle="Min: 30px" />
          </Pane>
          <Pane>
            <Allotment>
              <Pane :min-size="100">
                <Content title="Left" subtitle="Min: 100px" />
              </Pane>
              <Pane>
                <Allotment vertical>
                  <Pane>
                    <Content title="Main" subtitle="No constraints" />
                  </Pane>
                  <Pane :min-size="25">
                    <Content title="Bottom" subtitle="Min: 25px" />
                  </Pane>
                </Allotment>
              </Pane>
            </Allotment>
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Responsive layout with collapsible panels
export const ResponsiveLayout: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    data() {
      return {
        showSidebar: true,
        showPanel: true,
      }
    },
    template: `
      <div style="height: 600px; border: 1px solid #ddd;">
        <div style="padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
          <button @click="showSidebar = !showSidebar" style="margin-right: 8px;">
            {{ showSidebar ? 'Hide' : 'Show' }} Sidebar
          </button>
          <button @click="showPanel = !showPanel">
            {{ showPanel ? 'Hide' : 'Show' }} Panel
          </button>
        </div>
        
        <div style="height: calc(100% - 50px);">
          <Allotment>
            <Pane v-if="showSidebar" :min-size="150" :preferred-size="200">
              <Content 
                title="Collapsible Sidebar"
                subtitle="Toggle with button above"
              />
            </Pane>
            
            <Pane>
              <Allotment vertical>
                <Pane>
                  <Content 
                    title="Main Content"
                    subtitle="Always visible"
                  />
                </Pane>
                
                <Pane v-if="showPanel" :min-size="100" :preferred-size="150">
                  <Content 
                    title="Collapsible Panel"
                    subtitle="Toggle with button above"
                  />
                </Pane>
              </Allotment>
            </Pane>
          </Allotment>
        </div>
      </div>
    `,
  }),
}
