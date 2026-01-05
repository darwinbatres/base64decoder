# Base64 Utils

A modern web application for encoding, decoding, and previewing base64 files with a clean tabbed interface.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

### 🔓 Decode Base64

- Paste any base64 string and instantly decode it
- Auto-detect file types from binary signatures
- Preview decoded files directly in the browser
- Download decoded files

### 📤 Encode to Base64

- Drag & drop or click to upload any file
- Get raw base64 or data URI format
- One-click copy to clipboard
- Download base64 as text file

### 👁️ File Viewer

- Preview files with coordinate tracking
- Full-featured PDF viewer with:
  - Page navigation
  - Zoom controls (50% - 400%)
  - Fullscreen mode
  - PDF coordinate overlay (useful for developers)
- Image viewer with fullscreen support
- Video and audio playback
- Syntax-highlighted text/JSON/XML preview

### ✨ User Experience

- **Tabbed interface** — Switch between Decode, Encode, and View modes
- **Dark/Light mode** — Theme toggle with system preference detection
- **Privacy-first** — All data cleared when you close the tab
- **No file size limits** — Browser's natural limits apply
- **Responsive design** — Works on desktop and mobile
- **Accessible** — Full keyboard navigation and screen reader support

## Supported File Types

| Type   | Extensions                                                |
| ------ | --------------------------------------------------------- |
| PDF    | `.pdf`                                                    |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`, `.webp` |
| Video  | `.mp4`, `.webm`                                           |
| Audio  | `.mp3`, `.wav`                                            |
| Text   | `.json`, `.xml`, `.html`, `.js`, `.txt`                   |
| Other  | Any file type (download available)                        |

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/darwinbatres/base64decoder.git
cd base64decoder

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with Turbopack
- **UI**: [React 19](https://react.dev/) with Server Components
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with OKLCH color system
- **Components**: [Radix UI](https://radix-ui.com/) primitives for accessibility
- **PDF Rendering**: [PDF.js](https://mozilla.github.io/pdf.js/) (CDN)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

## Project Structure

```
app/
  globals.css          # Global styles with OKLCH design tokens
  layout.tsx           # Root layout with theme provider
  page.tsx             # Home page

components/
  base64-app.tsx       # Main app with tabbed navigation
  base64-decoder.tsx   # Decode tab component
  file-to-base64.tsx   # Encode tab component
  file-viewer.tsx      # View tab component
  file-dropzone.tsx    # Reusable drag & drop component
  document-preview.tsx # File preview with PDF/image viewers
  file-type-indicator.tsx
  theme-provider.tsx
  theme-toggle.tsx
  ui/                  # Reusable UI primitives
    button.tsx
    card.tsx
    tabs.tsx

lib/
  file-utils.ts        # Shared utilities (MIME detection, storage, base64)
  utils.ts             # Tailwind class utilities
```

## Privacy

This application prioritizes your privacy:

- **No server uploads** — All processing happens in your browser
- **No tracking** — Only Vercel Analytics for basic page views
- **Auto-cleanup** — All file data is cleared from localStorage when you close the tab
- **No cookies** — Only theme preference is stored

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 15+

## License

MIT

---

Made with ☕ by [@darwinbatres](https://x.com/darwinbatres)
