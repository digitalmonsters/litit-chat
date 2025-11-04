# DM2Pay Builder

A comprehensive payment builder component for configuring and initializing DM2Pay integration in your Next.js application.

## Features

- ✅ Configuration management for DM2Pay
- ✅ Environment selection (Sandbox/Production)
- ✅ Real-time validation
- ✅ Persistent configuration storage
- ✅ TypeScript support
- ✅ Dark mode support
- ✅ Responsive design

## Installation

The DM2Pay Builder is already integrated into your project. No additional installation required.

## Usage

### Basic Usage

```tsx
import { DM2PayBuilder } from '@/components/dm2pay-builder';

export default function Page() {
  return (
    <div>
      <DM2PayBuilder />
    </div>
  );
}
```

### With Configuration

```tsx
import { DM2PayBuilder } from '@/components/dm2pay-builder';
import type { DM2PayConfig } from '@/components/dm2pay-builder';

export default function Page() {
  const handleConfigChange = (config: DM2PayConfig) => {
    console.log('Config updated:', config);
  };

  const initialConfig: DM2PayConfig = {
    apiKey: 'your-api-key',
    merchantId: 'your-merchant-id',
    environment: 'sandbox',
    enabled: true,
  };

  return (
    <div>
      <DM2PayBuilder
        config={initialConfig}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
}
```

### Programmatic Initialization

```tsx
import { initDM2PayBuilder } from '@/components/dm2pay-builder/init';

async function initialize() {
  const result = await initDM2PayBuilder({
    apiKey: 'your-api-key',
    merchantId: 'your-merchant-id',
    environment: 'sandbox',
    enabled: true,
  });

  if (result.success) {
    console.log('DM2Pay Builder initialized:', result.config);
  }
}
```

## API Reference

### DM2PayBuilder Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `DM2PayConfig` | `undefined` | Initial configuration object |
| `onConfigChange` | `(config: DM2PayConfig) => void` | `undefined` | Callback when configuration changes |
| `className` | `string` | `''` | Additional CSS classes |

### DM2PayConfig

```typescript
interface DM2PayConfig {
  apiKey?: string;
  environment?: 'sandbox' | 'production';
  merchantId?: string;
  enabled?: boolean;
}
```

## Files Structure

```
components/dm2pay-builder/
├── DM2PayBuilder.tsx    # Main component
├── types.ts             # TypeScript type definitions
├── utils.ts             # Utility functions
├── init.ts              # Initialization functions
├── index.ts             # Exports
└── README.md            # Documentation
```

## Configuration Storage

The component automatically saves configuration to `localStorage` when initialized. You can customize this behavior by modifying the `saveDM2PayConfig` and `loadDM2PayConfig` functions in `utils.ts`.

## Next Steps

1. Integrate the actual DM2Pay SDK in the `initializeDM2PayBuilder` function
2. Add API endpoints for secure configuration storage
3. Implement additional validation rules as needed
4. Add more configuration options as required





