import { WebContainer } from '@webcontainer/api';

// Call only once
let webContainerInstance = null;
let serverUrl = null;

// Check if WebContainer is supported in this browser
const isWebContainerSupported = () => {
    try {
        return !!WebContainer;
    } catch (e) {
        return false;
    }
};

// Convert our file tree format to WebContainer's file system format
export const convertToWebContainerFileSystem = (fileTree) => {
    const fileSystem = {};
    
    fileTree.forEach(file => {
        // Split the path into parts
        const pathParts = file.filename.split('/');
        
        // Start at the root of the file system
        let current = fileSystem;
        
        // Process each part of the path except the last (filename)
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            
            // Create the directory if it doesn't exist
            if (!current[part]) {
                current[part] = {
                    directory: {}
                };
            }
            
            // Move to the next level
            current = current[part].directory;
        }
        
        // Get the filename (last part of the path)
        const fileName = pathParts[pathParts.length - 1];
        
        // Add the file to the current directory
        if (file.isSymlink) {
            current[fileName] = {
                file: {
                    symlink: file.symlink
                }
            };
        } else {
            current[fileName] = {
                file: {
                    contents: file.content
                }
            };
        }
    });
    
    return fileSystem;
};

// Default file system for WebContainer
const defaultFileSystem = {
    'index.html': {
        file: {
            contents: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebContainer App</title>
</head>
<body>
    <h1>Welcome to WebContainer!</h1>
    <p>Your files will be mounted here. Use the terminal to run commands.</p>
</body>
</html>`
        }
    },
    'package.json': {
        file: {
            contents: JSON.stringify({
                name: 'webcontainer-project',
                version: '1.0.0',
                description: 'Project running in WebContainer',
                main: 'index.js',
                type: "module",
                scripts: {
                    start: 'node index.js',
                    dev: 'npx serve -p 3001'
                },
                keywords: [],
                author: '',
                license: 'ISC',
                dependencies: {},
                devDependencies: {
                    serve: '^14.0.0'
                }
            }, null, 2)
        }
    },
    'index.js': {
        file: {
            contents: `console.log('Hello from WebContainer!');`
        }
    },
    'README.md': {
        file: {
            contents: `# WebContainer Project

This project is running in a WebContainer environment.

## Getting Started

1. Use the terminal to run commands
2. Install dependencies with \`npm install\`
3. Start the server with \`npm run dev\`

## Files

Your project files will be mounted in this environment.
`
        }
    }
};

// Mount files to the WebContainer
export const mountFilesToWebContainer = async (webContainer, fileTree) => {
    try {
        if (!webContainer) {
            throw new Error("WebContainer is not initialized");
        }
        
        console.log("Converting file tree to WebContainer format...");
        const fileSystem = convertToWebContainerFileSystem(fileTree);
        
        console.log("Mounting files to WebContainer...");
        await webContainer.mount(fileSystem);
        
        console.log("Files mounted successfully");
        return true;
    } catch (error) {
        console.error("Error mounting files to WebContainer:", error);
        throw error;
    }
};

// Run a command in the WebContainer
export const runCommandInWebContainer = async (webContainer, command, options = {}) => {
    try {
        if (!webContainer) {
            throw new Error("WebContainer is not initialized");
        }
        
        console.log(`Running command in WebContainer: ${command}`);
        
        // Create a new shell session
        // Note: webContainer.shell() is not a function, we need to use spawn instead
        const shellProcess = await webContainer.spawn('sh', ['-c', command]);
        
        // Return the process for further interaction
        return {
            process: shellProcess,
            exit: shellProcess.exit,
            output: shellProcess.output,
            input: shellProcess.input
        };
    } catch (error) {
        console.error(`Error running command in WebContainer: ${error.message}`);
        throw error;
    }
};

// Get a WebContainer shell
export const getWebContainerShell = async (webContainer) => {
    try {
        if (!webContainer) {
            throw new Error("WebContainer is not initialized");
        }
        
        // Create a new shell process
        // Note: webContainer.shell() is not a function, we need to use spawn with bash
        const shellProcess = await webContainer.spawn('bash');
        
        // Return the shell process
        return shellProcess;
    } catch (error) {
        // If bash fails, try with sh
        try {
            console.log("Bash not available, trying with sh...");
            const shellProcess = await webContainer.spawn('sh');
            return shellProcess;
        } catch (fallbackError) {
            console.error(`Error getting WebContainer shell: ${fallbackError.message}`);
            throw fallbackError;
        }
    }
};

// Start a server in the WebContainer
export const startDevServer = async (webContainer) => {
    try {
        if (!webContainer) {
            throw new Error("WebContainer is not initialized");
        }
        
        // Install dependencies first
        console.log("Installing dependencies...");
        const installProcess = await webContainer.spawn('npm', ['install']);
        
        // Wait for the installation to complete
        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
            throw new Error(`npm install failed with exit code ${installExitCode}`);
        }
        
        // Start the server
        console.log("Starting development server...");
        await webContainer.spawn('npm', ['run', 'dev']);
        
        // Wait for server to start and get the URL
        return new Promise((resolve) => {
            // The server-ready event will fire when the server starts
            webContainer.on('server-ready', (port, url) => {
                console.log(`Server started at ${url} on port ${port}`);
                serverUrl = url;
                resolve(url);
            });
        });
    } catch (error) {
        console.error(`Error starting dev server: ${error.message}`);
        throw error;
    }
};

// Get the server URL if available
export const getServerUrl = () => serverUrl;

export const initializeWebContainer = async () => {
    try {
        console.log("WebContainer initialization started...");
        
        // Check if WebContainer is supported
        if (!isWebContainerSupported()) {
            throw new Error("WebContainer is not supported in this browser. Please use Chrome or Edge.");
        }
        
        // Check if the page is cross-origin isolated (required for SharedArrayBuffer)
        if (!window.crossOriginIsolated) {
            throw new Error(
                "Cross-Origin Isolation is not enabled. WebContainer requires the COOP and COEP headers. " +
                "Please run the application with 'npm run dev:webcontainer' instead of 'npm run dev'."
            );
        }
        
        if (!webContainerInstance) {
            console.log("Booting WebContainer...");
            webContainerInstance = await WebContainer.boot();
            console.log("WebContainer boot completed successfully");
            
            // Mount default file system
            console.log("Mounting default file system...");
            await webContainerInstance.mount(defaultFileSystem);
        } else {
            console.log("Using existing WebContainer instance");
        }
        
        return webContainerInstance;
    } catch (error) {
        console.error("Error initializing WebContainer:", error);
        throw error; // Re-throw to allow handling in the component
    }
}