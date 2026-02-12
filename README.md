# Planwerk Editor

A modern documentation viewer and editor built with Next.js, featuring Claude Code session support and real-time markdown editing capabilities.

## Features

- 📝 **MDX Editor** - Rich markdown editing with live preview
- 📚 **Documentation Viewer** - Browse and navigate documentation with sidebar navigation
- 🖥️ **Claude Code Shell** - Integrated Claude Code terminal with WebSocket support
- 🎨 **Syntax Highlighting** - CodeMirror-powered syntax highlighting for multiple languages (CSS, HTML, JavaScript, JSON, Python, YAML)
- 📖 **Table of Contents** - Auto-generated navigation for document sections
- 🎯 **Resizable Panels** - Customizable layout with draggable resize handles
- ⚡ **Modern Stack** - Built with Next.js 15, React 19, and TypeScript

## Tech Stack

- **Framework**: Next.js 15 with Turbopack
- **UI**: React 19, Tailwind CSS 4
- **Editor**: @mdxeditor/editor, CodeMirror
- **Shell**: Claude Code via xterm.js, node-pty, WebSocket
- **Language**: TypeScript

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd planwerk-editor
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (optional):
```bash
cp .env.example .env.local
```

## Configuration

Configure the application using environment variables in `.env.local`:

```env
# Port for the development server (optional)
# Default: 3000
PORT=3000

# Path to the docs/ directory (optional)
# Default: docs/ (relative to project directory)
DOCS_PATH=docs/

# Application title (optional)
# Default: Planwerk Editor
NEXT_PUBLIC_APP_TITLE=Planwerk Editor

# Application description (optional)
# Default: Documentation for the planwerk-editor project
NEXT_PUBLIC_APP_DESCRIPTION=Documentation for the planwerk-editor project
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your environment variables).

Alternative development mode (Next.js only, without custom server):
```bash
npm run dev:next
```

## Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
planwerk-editor/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── docs/              # Documentation pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Header.tsx         # Application header
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── MarkdownEditor.tsx # MDX editor component
│   ├── TerminalPanel.tsx  # Claude Code shell panel
│   ├── TableOfContents.tsx # TOC navigation
│   └── ResizeHandle.tsx   # Panel resize handles
├── lib/                   # Utility functions
│   └── docs.ts           # Documentation utilities
├── server.ts             # Custom server with WebSocket
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Scripts

- `npm run dev` - Start development server with custom WebSocket server
- `npm run dev:next` - Start Next.js development server only (Turbopack)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Documentation Viewer
- Automatic navigation tree generation from docs directory
- Markdown/MDX support with syntax highlighting
- Responsive sidebar with collapsible sections

### Markdown Editor
- Real-time preview
- Toolbar with formatting options
- Code block support with syntax highlighting
- Table editing support

### Claude Code Shell
- Direct integration with Claude Code CLI
- Full terminal emulation using xterm.js
- WebSocket-based communication for real-time interaction
- PTY support for native shell experience
- Resizable panel for flexible workspace layout

## License

Private project
