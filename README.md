# Descam - AI Image Description App

A responsive, accessible Svelte + TypeScript web application that captures images from your camera and describes them using OpenAI's GPT-4 Vision API.

## Features

- **Camera Capture**: Capture images directly from your device's camera
- **AI-Powered Descriptions**: Get detailed image descriptions using OpenAI's GPT-4o model with smart prompts that read text and analyze face positioning
- **Multi-language Support**: Available in English, Spanish, German, French, and Italian with language selector
- **Language Persistence**: Your language preference is saved locally and remembered across sessions
- **Editable Prompts**: Pre-filled default prompt that you can customize before each capture
- **History Tracking**: View all previous descriptions in the current session
- **Privacy-First**: API key and language preference stored locally in your browser, never sent to our servers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: High contrast, ARIA labels, keyboard navigation, screen reader support, and proper focus management
- **Smart Error Handling**: Helpful error messages for camera permission issues and browser compatibility

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- An OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (accessible from phone on local network)
npm run dev
```

The app will be available at `http://localhost:5173` and on your local network IP.

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **First Time Setup**: Enter your OpenAI API key when prompted
2. **Grant Camera Access**: Allow camera permissions when requested
3. **Capture Images**: Click the "Capture Image" button to take a photo
4. **Optional Custom Prompt**: Enter a custom prompt before capturing if desired
5. **View Descriptions**: See AI-generated descriptions appear below
6. **Check History**: Scroll down to see all descriptions from the current session

## Security & Privacy

- Your OpenAI API key is stored **locally** in your browser's localStorage
- The API key **never leaves your device** except when making requests to OpenAI
- Images are captured **locally** and sent directly to OpenAI's API
- No data is stored on any server
- Session history is cleared when you close the browser

## Technology Stack

- **Framework**: Svelte 5 with TypeScript
- **Build Tool**: Vite 6
- **API**: OpenAI GPT-4o Vision
- **Styling**: Component-scoped CSS with high contrast
- **Internationalization**: Custom i18n system with locale detection

## Project Structure

```
descam_web/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── CameraCapture.svelte
│   │   │   ├── Footer.svelte
│   │   │   ├── History.svelte
│   │   │   └── Onboarding.svelte
│   │   ├── i18n/
│   │   │   ├── store.ts
│   │   │   └── translations.ts
│   │   ├── camera.ts
│   │   ├── openai.ts
│   │   └── storage.ts
│   ├── App.svelte
│   ├── app.css
│   ├── main.ts
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── svelte.config.js
```

## Accessibility Features

- Semantic HTML with proper heading hierarchy
- ARIA labels and live regions for status updates
- High contrast text for better readability
- Keyboard navigation support
- Focus indicators for interactive elements
- Responsive design that works on all screen sizes
- Support for reduced motion preferences

## Adding More AI Providers

The code is structured to make it easy to add support for other AI providers:

1. Create a new service file in `src/lib/` (e.g., `anthropic.ts`, `google.ts`)
2. Implement the same interface as `describeImage` in `openai.ts`
3. Add provider selection in the UI
4. Update the storage system to handle multiple API keys

## License

© 2025 Oriol Gómez

## Support

For issues or questions, visit [oriolgomez.com](https://oriolgomez.com)
