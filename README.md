# Base64 Viewer

A modern web application for decoding, previewing, and downloading base64 encoded documents.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Decode Base64** — Paste any base64 string and instantly decode it
- **Auto-detect file types** — Automatically detects MIME types including PDF, images, video, audio, JSON, XML, HTML, and text
- **Preview documents** — View decoded files directly in the browser
- **PDF viewer** — Full-featured PDF viewing with:
  - Page navigation
  - Zoom controls (25% - 400%)
  - Fullscreen mode
  - Coordinate tracking on hover (useful for developers working with PDF positioning)
- **Download files** — Save decoded documents to your device
- **Dark/Light mode** — Theme toggle with system preference detection
- **Responsive design** — Works on desktop and mobile

## Supported File Types

| Type   | Extensions                                                |
| ------ | --------------------------------------------------------- |
| PDF    | `.pdf`                                                    |
| Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`, `.webp` |
| Video  | `.mp4`, `.webm`                                           |
| Audio  | `.mp3`, `.wav`                                            |
| Text   | `.json`, `.xml`, `.html`, `.js`, `.txt`                   |

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm (recommended) or npm

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
- **UI**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with OKLCH color system
- **PDF Rendering**: [PDF.js](https://mozilla.github.io/pdf.js/) (loaded from CDN)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

## Project Structure

```
app/
  globals.css        # Global styles and design tokens
  layout.tsx         # Root layout with theme provider
  page.tsx           # Home page
components/
  base64-decoder.tsx     # Main decoder component
  document-preview.tsx   # File preview with PDF viewer
  file-type-indicator.tsx # File type icons
  theme-provider.tsx     # Theme context wrapper
  theme-toggle.tsx       # Dark/light mode toggle
  ui/                    # Reusable UI components
lib/
  utils.ts           # Utility functions
```

## License

MIT

---

Made with coffee by [@darwinbatres](https://x.com/darwinbatres)
