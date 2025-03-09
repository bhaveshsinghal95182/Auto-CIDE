# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Frontend Application

## Running the Application

### Standard Development Mode

```bash
npm run dev
```

This starts the application in standard development mode. However, WebContainer features will not work due to missing security headers.

### WebContainer-Compatible Mode

```bash
npm run dev:webcontainer
```

This starts the application with the necessary security headers (COOP and COEP) that enable WebContainer functionality.

## WebContainer Requirements

WebContainer requires Cross-Origin Isolation to be enabled, which means the following HTTP headers must be set:

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

These headers enable the use of `SharedArrayBuffer`, which is required by WebContainer.

## Troubleshooting

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

## Browser Compatibility

WebContainer works best in:

- Chrome (latest version)
- Edge (latest version)

Firefox and Safari may have limited or no support for WebContainer.
