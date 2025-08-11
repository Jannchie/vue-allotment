import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Allotment, Pane } from '../lib'
import Content from './Content.vue'

const meta = {
  title: 'Styling/Theming',
  component: Allotment,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Allotment>

export default meta
type Story = StoryObj<typeof meta>

// Custom separator styling
export const CustomSeparator: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 100dvh;">
        <style>
          .custom-separator .allotment-separator {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 4px;
          }
          
          .custom-separator .allotment-separator:hover {
            background: linear-gradient(45deg, #ff5252, #26c6da);
            transform: scale(1.1);
            transition: all 0.2s ease;
          }
        </style>
        
        <Allotment class="custom-separator">
          <Pane>
            <Content 
              title="Custom Separator"
              subtitle="Gradient colored separator with hover effects"
              :style="{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }"
            />
          </Pane>
          <Pane>
            <Content 
              title="Themed Content"
              subtitle="Hover over the separator to see the effect"
              :style="{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}

// Dark theme
export const DarkTheme: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 500px; border: 1px solid #333; background: #1a1a1a;">
        <style>
          .dark-theme {
            --allotment-separator-border: 1px solid #404040;
            --allotment-separator-background-color: #2d2d2d;
            --allotment-separator-hover-background-color: #404040;
            --allotment-separator-active-background-color: #4a90e2;
          }
          
          .dark-theme .allotment-separator {
            background: var(--allotment-separator-background-color);
            border: var(--allotment-separator-border);
          }
          
          .dark-theme .allotment-separator:hover {
            background: var(--allotment-separator-hover-background-color);
          }
        </style>
        
        <Allotment class="dark-theme" vertical>
          <Pane :preferred-size="60">
            <Content 
              title="Dark Header"
              subtitle="Header panel with dark theme"
              :style="{ 
                background: '#252525', 
                color: '#e0e0e0',
                borderBottom: '1px solid #404040'
              }"
            />
          </Pane>
          
          <Pane>
            <Allotment class="dark-theme">
              <Pane :preferred-size="200">
                <Content 
                  title="Dark Sidebar"
                  subtitle="Navigation panel"
                  :style="{ 
                    background: '#2d2d2d', 
                    color: '#e0e0e0',
                    borderRight: '1px solid #404040'
                  }"
                >
                  <div style="margin-top: 16px;">
                    <div style="padding: 8px; margin: 4px 0; background: #404040; border-radius: 4px;">
                      📁 Folder 1
                    </div>
                    <div style="padding: 8px; margin: 4px 0; background: #353535; border-radius: 4px;">
                      📄 File 1
                    </div>
                    <div style="padding: 8px; margin: 4px 0; background: #353535; border-radius: 4px;">
                      📄 File 2
                    </div>
                  </div>
                </Content>
              </Pane>
              
              <Pane>
                <Allotment class="dark-theme" vertical>
                  <Pane>
                    <Content 
                      title="Dark Editor"
                      subtitle="Main content area"
                      :style="{ 
                        background: '#1e1e1e', 
                        color: '#d4d4d4',
                        fontFamily: 'Monaco, Consolas, monospace'
                      }"
                    >
                      <div style="margin-top: 16px; padding: 12px; background: #0d1117; border-radius: 4px; font-size: 13px; line-height: 1.6;">
                        <div style="color: #7c3aed;">function</div>
                        <div style="color: #22d3ee;">createAllotment</div>
                        <div style="color: #a855f7;">(</div>
                        <div style="color: #fbbf24;">options</div>
                        <div style="color: #a855f7;">: AllotmentOptions) {</div>
                        <div style="color: #10b981; margin-left: 20px;">// Dark themed code editor</div>
                        <div style="color: #a855f7;">}</div>
                      </div>
                    </Content>
                  </Pane>
                  
                  <Pane :preferred-size="120">
                    <Content 
                      title="Dark Terminal"
                      subtitle="Output panel"
                      :style="{ 
                        background: '#0c0c0c', 
                        color: '#00ff00',
                        fontFamily: 'Monaco, Consolas, monospace',
                        fontSize: '12px'
                      }"
                    >
                      <div style="margin-top: 16px;">
                        <div>$ npm run dev</div>
                        <div style="color: #00aa00;">✓ Server running on http://localhost:5173</div>
                        <div>$ build successful ✨</div>
                        <div style="color: #888;">Ready in 234ms</div>
                      </div>
                    </Content>
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

// Minimalist theme
export const MinimalistTheme: Story = {
  render: () => ({
    components: { Allotment, Pane, Content },
    template: `
      <div style="height: 400px; border: none; box-shadow: 0 2px 20px rgba(0,0,0,0.1);">
        <style>
          .minimalist-theme {
            --allotment-separator-border: none;
            --allotment-separator-background-color: transparent;
            --allotment-separator-hover-background-color: rgba(0, 0, 0, 0.05);
            --allotment-separator-active-background-color: rgba(0, 0, 0, 0.1);
          }
          
          .minimalist-theme .allotment-separator {
            background: var(--allotment-separator-background-color);
            border: var(--allotment-separator-border);
          }
          
          .minimalist-theme .allotment-separator::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 4px;
            background: #e0e0e0;
            border-radius: 2px;
            transform: translate(-50%, -50%);
            transition: all 0.2s ease;
          }
          
          .minimalist-theme .allotment-separator:hover::before {
            background: #bbb;
          }
          
          .minimalist-theme .allotment-separator.horizontal::before {
            width: 4px;
            height: 20px;
          }
        </style>
        
        <Allotment class="minimalist-theme">
          <Pane>
            <Content 
              title="Clean Design"
              subtitle="Minimalist separator with subtle handle"
              :style="{ background: '#fdfdfd', border: 'none', borderRadius: 0 }"
            />
          </Pane>
          <Pane>
            <Content 
              title="Simple & Clean"
              subtitle="Focus on content, not dividers"
              :style="{ background: '#fafafa', border: 'none', borderRadius: 0 }"
            />
          </Pane>
          <Pane>
            <Content 
              title="Elegant Layout"
              subtitle="Hover to see the subtle indicators"
              :style="{ background: '#f7f7f7', border: 'none', borderRadius: 0 }"
            />
          </Pane>
        </Allotment>
      </div>
    `,
  }),
}