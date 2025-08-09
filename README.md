# Allotment Vue

A Vue 3 port of the popular React [Allotment](https://github.com/johnwalley/allotment) component library. This library provides resizable split views for Vue applications, perfect for creating complex layouts with draggable dividers.

## Features

- 🎯 **Vue 3 Composition API** - Built with modern Vue 3 and TypeScript
- 📱 **Responsive** - Works on desktop and mobile devices  
- 🎨 **Customizable** - Full CSS customization support
- 🔧 **TypeScript** - Complete type safety and IntelliSense
- ⚡ **Performant** - Optimized for smooth interactions
- 🧩 **Flexible** - Supports horizontal, vertical, and nested layouts

## Installation

```bash
npm install allotment-vue
# or
pnpm add allotment-vue
# or
yarn add allotment-vue
```

## Quick Start

```vue
<template>
  <Allotment>
    <Pane>
      <div>Left Panel</div>
    </Pane>
    <Pane>
      <div>Right Panel</div>
    </Pane>
  </Allotment>
</template>

<script setup>
import { Allotment, Pane } from 'allotment-vue'
</script>
```

## Basic Usage

### Horizontal Split (Default)

```vue
<template>
  <Allotment>
    <Pane minSize={200}>
      <div>Left side</div>
    </Pane>
    <Pane>
      <div>Right side</div>
    </Pane>
  </Allotment>
</template>
```

### Vertical Split

```vue
<template>
  <Allotment vertical>
    <Pane>
      <div>Top panel</div>
    </Pane>
    <Pane>
      <div>Bottom panel</div>
    </Pane>
  </Allotment>
</template>
```

### Custom Sizes

```vue
<template>
  <Allotment :defaultSizes="[200, 300, 100]">
    <Pane>
      <div>200px wide</div>
    </Pane>
    <Pane>
      <div>300px wide</div>  
    </Pane>
    <Pane>
      <div>100px wide</div>
    </Pane>
  </Allotment>
</template>
```

## Component Props

### Allotment Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultSizes` | `number[]` | - | Initial sizes for each pane |
| `vertical` | `boolean` | `false` | Split direction |  
| `separator` | `boolean` | `true` | Show separator between panes |
| `proportionalLayout` | `boolean` | `true` | Resize proportionally |
| `minSize` | `number` | `30` | Global minimum pane size |
| `maxSize` | `number` | `Infinity` | Global maximum pane size |
| `snap` | `boolean` | `false` | Enable snapping to zero |
| `className` | `string` | - | Custom CSS class |

### Pane Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `minSize` | `number` | - | Minimum size for this pane |
| `maxSize` | `number` | - | Maximum size for this pane |
| `preferredSize` | `number \| string` | - | Preferred size (px or %) |
| `priority` | `'Normal' \| 'Low' \| 'High'` | `'Normal'` | Resize priority |
| `snap` | `boolean` | `false` | Enable snapping for this pane |
| `visible` | `boolean` | `true` | Pane visibility |
| `className` | `string` | - | Custom CSS class |

## Events

```vue
<template>
  <Allotment 
    @change="onSizeChange"
    @dragStart="onDragStart"
    @dragEnd="onDragEnd"
    @reset="onReset"
  >
    <!-- panes -->
  </Allotment>
</template>

<script setup>
const onSizeChange = (sizes) => {
  console.log('New sizes:', sizes)
}

const onDragStart = (sizes) => {
  console.log('Drag started with sizes:', sizes)
}

const onDragEnd = (sizes) => {
  console.log('Drag ended with sizes:', sizes)
}

const onReset = () => {
  console.log('Panes were reset')
}
</script>
```

## Programmatic Control

```vue
<template>
  <div>
    <button @click="reset">Reset</button>
    <button @click="resize">Custom Resize</button>
    
    <Allotment ref="allotmentRef">
      <Pane>Panel 1</Pane>
      <Pane>Panel 2</Pane>
    </Allotment>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Allotment, Pane } from 'allotment-vue'

const allotmentRef = ref()

const reset = () => {
  allotmentRef.value?.reset()
}

const resize = () => {
  allotmentRef.value?.resize([300, 400])
}
</script>
```

## Styling

The component uses CSS modules and provides CSS custom properties for theming:

```css
:root {
  --focus-border: #007fd4;
  --separator-border: rgba(128, 128, 128, 0.35);
  --sash-size: 8px;
  --sash-hover-size: 4px;
  --sash-hover-transition-duration: 0.1s;
}
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run type checking
pnpm vue-tsc
```

## Credits

This Vue port is based on the excellent [Allotment](https://github.com/johnwalley/allotment) React library by [John Walley](https://github.com/johnwalley).

## License

MIT
