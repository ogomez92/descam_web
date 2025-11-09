# Descam Web - Implementation Details

## Overview

Descam is a web application that uses AI to describe images captured from the user's camera. It leverages OpenAI's GPT-4 Vision API to analyze images in real-time and provide detailed descriptions in multiple languages.

## Technology Stack

- **Framework**: Svelte 5 (with runes)
- **Build Tool**: Vite
- **Language**: TypeScript
- **API**: OpenAI GPT-4o (Vision)
- **Styling**: Component-scoped CSS

## Architecture

### Svelte 5 Migration

This application has been fully migrated to **Svelte 5** using the new runes system. The key changes from Svelte 4 include:

#### State Management

Instead of using Svelte stores (`writable`, `derived`), the application now uses Svelte 5 runes:

- `$state` - For reactive state
- `$derived` - For computed values
- `$effect` - For side effects
- `$props` - For component props

#### Module-Level State

Shared state is managed through `.svelte.ts` files that export reactive state using runes:

**storage.svelte.ts**:
```typescript
let apiKey = $state<string | null>(getApiKeyFromStorage());

export function getApiKey(): string | null {
  return apiKey;
}

export function setApiKey(key: string): void {
  apiKey = key;
  setApiKeyToStorage(key);
}
```

**i18n/store.svelte.ts**:
```typescript
let currentLanguage = $state<Language>(detectUserLanguage());

export const t = $derived<Translations>(translations[currentLanguage]);

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  saveLanguage(lang);
}
```

This pattern allows for reactive, module-level state without the complexity of stores.

## Component Structure

### App.svelte (Main Entry Point)

The root component that orchestrates the entire application:

- Checks for API key presence
- Conditionally renders Onboarding or main interface
- Manages description history
- Uses `$derived` to reactively determine if user has API key

Key reactive state:
```typescript
let descriptions = $state<string[]>([]);
let hasApiKey = $derived(!!getApiKey());
```

### Onboarding.svelte

First-time user experience for API key setup:

- Simple form with password input
- Validates and saves API key to localStorage
- Uses Svelte 5 `$state` for form input
- Removed autofocus attribute for better accessibility

### CameraCapture.svelte

Core functionality component:

- Accesses device camera via MediaDevices API
- Captures video frames as base64 images
- Sends images to OpenAI Vision API
- Customizable prompt system
- Real-time status messages and error handling

Key features:
- Uses `onMount` to initialize camera stream
- Uses `onDestroy` to clean up media streams
- Reactive translations via `t` (derived state)
- Gets API key on-demand from storage

### LanguageSelector.svelte

Multi-language support:

- Dropdown selector with keyboard navigation
- Supports: English, Spanish, German, French, Italian
- Saves language preference to localStorage
- Uses reactive `getCurrentLanguage()` function

### History.svelte

Displays captured image descriptions:

- Shows all descriptions in reverse chronological order
- Accessible with ARIA live regions
- Conditionally rendered when descriptions exist

### Footer.svelte

Status indicators and credits:

- Camera permission status (granted/denied/unknown)
- API key configuration status
- Copyright and website link
- Uses `$derived` for reactive status text

## State Management Details

### API Key Storage

The API key is managed through `storage.svelte.ts`:

```typescript
// Reactive state
let apiKey = $state<string | null>(getApiKeyFromStorage());

// Exported functions
export function getApiKey(): string | null
export function setApiKey(key: string): void
export function removeApiKey(): void
```

**Storage mechanism**: `localStorage` with error handling
**Key**: `descam_openai_api_key`

### Internationalization (i18n)

Managed through `i18n/store.svelte.ts`:

```typescript
// Reactive state
let currentLanguage = $state<Language>(detectUserLanguage());

// Derived translations
export const t = $derived<Translations>(translations[currentLanguage]);

// Language functions
export function getCurrentLanguage(): Language
export function setLanguage(lang: Language): void
```

**Features**:
- Auto-detects browser language on first visit
- Falls back to English if unsupported language
- Persists selection to localStorage
- Reactive translation object via `$derived`

## API Integration

### OpenAI Vision API (openai.ts)

The application uses OpenAI's GPT-4o model with vision capabilities:

**Endpoint**: `https://api.openai.com/v1/chat/completions`

**Request structure**:
```typescript
{
  model: 'gpt-4o',
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ]
  }],
  max_tokens: 500
}
```

**Error handling**:
- Network errors
- API errors (authentication, rate limits, etc.)
- Malformed responses

## Camera Integration

### MediaDevices API (camera.ts)

**Functions**:

1. `getCameraStream()`: Requests camera access
   - Prefers back camera on mobile (`facingMode: 'environment'`)
   - Ideal resolution: 1920x1080
   - Returns MediaStream

2. `captureFrame(video)`: Captures current video frame
   - Creates canvas element
   - Draws video frame
   - Returns base64 JPEG (90% quality)

3. `checkCameraPermission()`: Checks permission status
   - Uses Permissions API
   - Returns: 'granted', 'denied', or 'unknown'

4. `stopStream(stream)`: Cleanup function
   - Stops all media tracks

**Error handling**:
- Browser compatibility checks
- Permission denied scenarios
- HTTPS requirement warnings

## Key Implementation Patterns

### 1. Reactive State Without Stores

All reactive state is managed via runes, eliminating the need for store subscriptions:

**Before (Svelte 4)**:
```typescript
let value = $state($someStore);

$effect(() => {
  const unsub = someStore.subscribe((v) => value = v);
  return unsub;
});
```

**After (Svelte 5)**:
```typescript
// Just use the exported getter
let value = $derived(getValue());
```

### 2. Component Props

Using Svelte 5's `$props` rune:

```typescript
interface Props {
  onDescriptionComplete: (description: string) => void;
}

let { onDescriptionComplete }: Props = $props();
```

### 3. Derived Values

Computing values reactively:

```typescript
let hasApiKey = $derived(!!getApiKey());
let websiteUrl = $derived(getWebsiteUrl(getCurrentLanguage()));
```

### 4. Effects for Side Effects

Using `$effect` for cleanup and initialization:

```typescript
onMount(async () => {
  stream = await getCameraStream();
  // ... setup
});

onDestroy(() => {
  if (stream) stopStream(stream);
});
```

## Accessibility Features

- ARIA labels on interactive elements
- ARIA live regions for status messages
- Keyboard navigation support
- Screen reader announcements for camera status
- High contrast text for readability
- Responsive design for mobile devices

## Security Considerations

1. **API Key Storage**:
   - Stored in localStorage (client-side only)
   - Never sent to any server except OpenAI
   - User has full control

2. **Camera Access**:
   - Requires explicit user permission
   - Permission status tracked and displayed
   - Streams properly cleaned up on component unmount

3. **HTTPS Requirement**:
   - Camera API requires secure context
   - Error messages guide users to HTTPS

## Build Configuration

**vite.config.ts**:
- Uses `@sveltejs/vite-plugin-svelte`
- TypeScript support via `tsconfig.json`
- Hot module replacement (HMR)

**Development**:
```bash
npm run dev      # Start dev server with --host flag
npm run build    # Production build
npm run preview  # Preview production build
```

## File Structure

```
src/
├── App.svelte                    # Root component
├── lib/
│   ├── components/
│   │   ├── CameraCapture.svelte  # Camera interface
│   │   ├── Footer.svelte         # Status footer
│   │   ├── History.svelte        # Description history
│   │   ├── LanguageSelector.svelte # Language switcher
│   │   └── Onboarding.svelte     # API key setup
│   ├── i18n/
│   │   ├── store.svelte.ts       # Language state (Svelte 5)
│   │   └── translations.ts       # Translation data
│   ├── camera.ts                 # Camera utilities
│   ├── openai.ts                 # OpenAI API client
│   └── storage.svelte.ts         # API key storage (Svelte 5)
└── main.ts                       # Entry point
```

## Translation Support

Fully translated to 5 languages:
- English (en) - Default
- Spanish (es)
- German (de)
- French (fr)
- Italian (it)

All UI strings are externalized in `translations.ts` with strong TypeScript typing.

## Performance Optimizations

1. **Lazy Loading**: Components only render when needed (e.g., History only when descriptions exist)
2. **Efficient State**: Svelte 5 runes provide fine-grained reactivity
3. **Proper Cleanup**: Media streams and event listeners properly disposed
4. **Image Compression**: JPEG at 90% quality for reasonable file sizes
5. **Debouncing**: Language changes update localStorage synchronously but UI reactively

## Future Enhancements

Potential improvements:
- Support for file upload (not just camera)
- Description export functionality
- Multiple image comparison
- Offline mode with service workers
- Advanced prompt templates
- Image annotation overlay
- Support for other AI providers

## Troubleshooting Common Issues

### Blank Screen After Entering API Key

**Fixed**: This was caused by mixing Svelte 4 store syntax (`$store`) with Svelte 5 runes. Solution was to use getter functions instead of store subscriptions.

### Autofocus Errors

**Fixed**: Removed `autofocus` attribute from input field as it's not recommended for accessibility and can cause issues in some browsers.

### Camera Not Working

**Common causes**:
1. Not using HTTPS (required for camera access)
2. Permission denied by user
3. Camera in use by another application
4. Browser doesn't support MediaDevices API

**Solution**: Application provides clear error messages for each scenario.

## Development Notes

- All components use TypeScript for type safety
- CSS is component-scoped (no global styles)
- Follows Svelte 5 best practices
- Mobile-first responsive design
- Progressive enhancement approach

## Conclusion

Descam demonstrates a modern Svelte 5 application with:
- Clean, reactive state management using runes
- Modular component architecture
- Strong TypeScript typing
- Accessibility-first approach
- Real-world API integration
- Multi-language support
- Proper error handling and user feedback
