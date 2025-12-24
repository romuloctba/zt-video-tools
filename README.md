# Z Video Tools - Web Video Editor

A simple and modern, 100% browser-based video editor built with React, TypeScript, and Vite. Create professional-looking video edits directly in your web browser with support for multiple video formats, smooth transitions, and high-quality export.
No uploads, no data collection, it all runs in user's browser.

![Z Video Tools](https://img.shields.io/badge/Z%20Video%20Tools-Web%20Editor-blue?style=for-the-badge)

![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff?style=flat-square)

## ✨ Features

### 🎬 Core Video Editing
- **Drag & Drop Import**: Support for MP4, WebM, MOV, AVI, MKV formats
- **Timeline Management**: Intuitive clip arrangement and editing
- **Real-time Preview**: Smooth playback with canvas rendering
- **Professional Transitions**: fade to black, fade to white effects
- **Audio Crossfading**: Synchronized audio transitions between clips

### 🌍 Internationalization
- **Multi-language Support**: English and Portuguese (Brazil)
- **Automatic Language Detection**: Based on browser preferences
- **Persistent Language Settings**: Remembers your language choice

### 🎨 Modern UI/UX
- **Dark Theme**: Professional video editing interface
- **Responsive Design**: Works on desktop and tablet devices
- **Clean Architecture**: Well-organized, maintainable codebase
- **Performance Optimized**: Efficient rendering and memory management

### 🔧 Technical Excellence
- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **TypeScript**: Full type safety and excellent developer experience
- **State Management**: Zustand for predictable state updates
- **Build Optimization**: Vite for fast development and optimized production builds

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd video-editor
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📖 How to Use

### 1. Import Videos
- **Drag & Drop**: Simply drag video files onto the dropzone area
- **Click to Browse**: Click the dropzone to open a file picker
- **Supported Formats**: MP4, WebM, MOV, AVI, MKV

### 2. Arrange Clips on Timeline
- Videos appear as clips in the timeline below the preview
- Drag clips to reorder them
- Each clip shows a thumbnail and duration

### 3. Add Transitions
- Click between two clips to open the transition picker
- Choose from: None, Crossfade, Fade to Black, Fade to White
- Adjust transition duration (0.5s to 2.0s)
- Transitions create smooth overlaps between clips

### 4. Preview Your Edit
- Use the play/pause button in the preview controls
- Scrub through the timeline by clicking on the timeline
- See real-time preview with smooth transitions

### 5. Export Your Video
- Click the "Export Video" button in the top-right
- Wait for the export progress to complete
- Download your edited video as WebM format

## 🏗️ Project Structure

```
src/
├── domain/           # Business logic and entities
│   ├── entities/     # Core business objects (Clip, Timeline, Transition)
│   └── types/        # TypeScript type definitions
├── application/      # Application layer (use cases, state management)
│   ├── hooks/        # Custom React hooks
│   └── store/        # Zustand state management
├── infrastructure/   # External services and implementations
│   └── video/        # Video processing utilities
├── presentation/     # UI layer (React components)
│   ├── components/   # Reusable UI components
│   ├── layouts/      # Page layouts
│   └── pages/        # Main application pages
└── shared/           # Shared utilities and configurations
    ├── constants/    # Application constants
    ├── i18n/         # Internationalization setup
    └── utils/        # Utility functions
```

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm preview          # Preview production build locally

# Building
pnpm build            # Build for production
pnpm build:root       # Build for root deployment (/)
pnpm build:video-tools # Build for subpath deployment (/video-tools/)

# Code Quality
pnpm lint             # Run ESLint
```

### Architecture Principles

This project follows **Clean Architecture** principles:

- **Domain Layer**: Contains business entities and rules (Clip, Timeline, Transition)
- **Application Layer**: Orchestrates domain entities and manages application state
- **Infrastructure Layer**: Handles external concerns (video processing, file I/O)
- **Presentation Layer**: React components and UI logic

### Key Technologies

- **React 19**: Latest React with concurrent features
- **TypeScript**: Full type safety and better DX
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **i18next**: Internationalization framework
- **Canvas API**: Hardware-accelerated video rendering

## 🌐 Internationalization

The application supports English and Portuguese (Brazil). Language preferences are automatically detected from your browser and can be changed using the language switcher in the top-right corner.

### Adding New Languages

1. Create a new JSON file in `src/shared/i18n/locales/`
2. Add the language to `LANGUAGES` constant in `src/shared/i18n/index.ts`
3. Update the language switcher component if needed

## 📦 Deployment

### Production Build

```bash
pnpm build
```

### Subpath Deployment

For deploying to a subpath (e.g., `https://example.com/video-tools/`):

```bash
pnpm build:video-tools
```

### Root Deployment

For deploying to the root domain:

```bash
pnpm build:root
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is a free tool offered by [Zoch Tecnologia](https://zochtecnologia.com.br).

## 🙏 Acknowledgments

- Built with modern web technologies for the best user experience
- Canvas-based rendering for smooth video playback
- Clean Architecture for maintainable and testable code
- Internationalization support for global accessibility

---

**Made with ❤️ by Zoch Tecnologia**
