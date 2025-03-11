# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Frontend Application

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0.5-646CFF.svg?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC.svg?logo=tailwind-css)

A modern React application built with Vite, featuring WebContainer integration for in-browser development environments.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [WebContainer Integration](#webcontainer-integration)
- [Available Scripts](#available-scripts)
- [Code Style and Linting](#code-style-and-linting)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- React 18 with modern hooks and patterns
- Fast development with Vite
- WebContainer integration for in-browser development environments
- Responsive design with TailwindCSS
- Monaco Editor integration for code editing
- Markdown rendering capabilities
- Socket.IO for real-time communication
- React Router for client-side routing

## 🛠️ Tech Stack

- **Core**: React 18, React Router
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Code Editor**: Monaco Editor
- **WebContainer**: @webcontainer/api
- **HTTP Client**: Axios
- **Real-time Communication**: Socket.IO
- **Code Quality**: ESLint
- **Markdown**: markdown-to-jsx, react-syntax-highlighter

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name/frontend

# Install dependencies
npm install
# or with pnpm
pnpm install
```

### Running the Application

#### Standard Development Mode

```bash
npm run dev
```

This starts the application in standard development mode. However, WebContainer features will not work due to missing security headers.

#### WebContainer-Compatible Mode

```bash
npm run dev:webcontainer
```

This starts the application with the necessary security headers (COOP and COEP) that enable WebContainer functionality.

## 📁 Project Structure

```
└── frontend
    ├── public/                # Static assets
    ├── src/
    │   ├── assets/            # Images, fonts, etc.
    │   ├── auth/              # Authentication related components
    │   ├── config/            # Configuration files (e.g., axios)
    │   ├── context/           # React context providers
    │   ├── hooks/             # Custom React hooks
    │   ├── routes/            # Route definitions
    │   ├── screens/           # Page components
    │   ├── App.jsx            # Main application component
    │   ├── index.css          # Global styles
    │   └── main.jsx           # Application entry point
    ├── .env                   # Environment variables
    ├── .gitignore             # Git ignore file
    ├── eslint.config.js       # ESLint configuration
    ├── index.html             # HTML entry point
    ├── package.json           # Dependencies and scripts
    ├── postcss.config.js      # PostCSS configuration
    ├── tailwind.config.js     # TailwindCSS configuration
    └── vite.config.js         # Vite configuration
```

## 🔌 WebContainer Integration

### WebContainer Requirements

WebContainer requires Cross-Origin Isolation to be enabled, which means the following HTTP headers must be set:

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

These headers enable the use of `SharedArrayBuffer`, which is required by WebContainer.

## ⌨️ Keyboard Shortcuts

The application provides various keyboard shortcuts to enhance productivity:

### Editor Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current file |
| `Ctrl+Shift+S` | Save all files |

### Terminal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+`` | Toggle terminal visibility |
| `Ctrl+Shift+`` | Create new terminal |
| `Ctrl+Shift+W` | Close current terminal |
| `Ctrl+L` | Clear current terminal |
| `Alt+1`, `Alt+2`, etc. | Switch between terminals |

### File Management

| Shortcut | Description |
|----------|-------------|
| Double-click on terminal name | Rename terminal |
| Click on file in explorer | Open file in editor |
| Click on directory in explorer | Expand/collapse directory |

### Other Tips

- You can drag the resize handle between panels to adjust their sizes
- Double-click on a file tab to rename it
- Right-click on files in the explorer for additional options
- Use the command palette (accessible via `Ctrl+P`) to quickly navigate between files

## 📜 Available Scripts

- `npm run dev` - Start the development server
- `npm run dev:webcontainer` - Start with WebContainer compatibility
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build

## 💅 Code Style and Linting

This project uses ESLint for code quality and consistency. The configuration is in `eslint.config.js`.

To run the linter:

```bash
npm run lint
```

## 🌐 Browser Compatibility

### General Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### WebContainer Compatibility

WebContainer works best in:

- Chrome (latest version)
- Edge (latest version)

Firefox and Safari may have limited or no support for WebContainer.

## ❓ Troubleshooting

### Common Issues

If you see the error:

```
SharedArrayBuffer transfer requires self.crossOriginIsolated
```

It means you're running the application without the required security headers. Please use `npm run dev:webcontainer` instead of `npm run dev`.

If you see the error:

```
ReferenceError: __dirname is not defined
```

This is related to ES modules. The fix is already implemented in the latest version of the code, which uses `import.meta.url` instead of `__dirname`.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
