# Storybook Documentation

This project includes a comprehensive Storybook setup for documenting and testing the Vue Allotment components.

## Available Commands

```bash
# Start development server
pnpm storybook

# Build for production
pnpm storybook:build

# Preview built storybook
pnpm storybook:preview
```

## Stories Organization

### Basic Components

- **Basic/Allotment** - Core component examples with all basic configurations
- **Basic/Pane** - Individual pane examples with different sizing and constraints

### Advanced Examples

- **Advanced/Complex Layouts** - Nested layouts, code editor layouts, dashboard layouts
- **Interactive/Programmatic Control** - Dynamic resizing, visibility controls, real-time monitoring

### Styling & Theming

- **Styling/Theming** - Custom separators, dark theme, minimalist theme

## Key Features Demonstrated

1. **Basic Usage**
   - Horizontal and vertical splits
   - Multiple panes
   - Size constraints (min/max)
   - Preferred sizes (pixels and percentages)

2. **Advanced Features**
   - Nested layouts
   - Programmatic control (reset, resize)
   - Dynamic visibility
   - Real-time size monitoring

3. **Styling Options**
   - Custom separator themes
   - Dark mode implementation
   - Minimalist design patterns

4. **Interactive Controls**
   - All stories include Storybook controls for live editing
   - Action logging for event monitoring
   - Background and viewport testing

## Vercel Deployment

The Storybook is configured for automatic deployment to Vercel using the `vercel.json` configuration:

```json
{
  "buildCommand": "pnpm storybook:build",
  "outputDirectory": "storybook-static",
  "installCommand": "pnpm install"
}
```

### Deploy to Vercel

1. **Automatic Deployment**: Connect your repository to Vercel - it will automatically deploy on every push
2. **Manual Deployment**: Run `vercel --prod` from the project root

### Environment Configuration

The Storybook build is optimized for production with:

- Static file generation
- Optimized bundles
- Asset optimization
- Responsive viewport testing

## Development Tips

1. **Adding New Stories**: Create `.stories.ts` files in `src/stories/`
2. **Custom Addons**: Additional Storybook addons can be added in `.storybook/main.ts`
3. **Global Styling**: Modify `.storybook/preview.ts` for global styles and parameters
4. **TypeScript Support**: Full TypeScript support with proper type checking

## Storybook Addons Included

- `@storybook/addon-docs` - Auto-generated documentation
- `@storybook/addon-controls` - Interactive control
s
- `@storybook/addon-actions` - Event logging
- `@storybook/addon-viewport` - Responsive testing
- `@storybook/addon-measure` - Element measurement
- `@storybook/addon-outline` - Layout visualization
