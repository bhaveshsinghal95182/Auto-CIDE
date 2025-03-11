# Project Page Documentation

This document provides a comprehensive overview of the Project page component in the Auto-CIDE application. The Project page is the main workspace where users can collaborate on code, manage files, and interact with the development environment.

## Table of Contents

1. [Component Overview](#component-overview)
2. [State Management](#state-management)
3. [Socket Communication](#socket-communication)
4. [File Management](#file-management)
5. [WebContainer Integration](#webcontainer-integration)
6. [UI Components](#ui-components)
7. [Event Handlers](#event-handlers)
8. [Hooks and Effects](#hooks-and-effects)
9. [Recent Additions](#recent-additions)

## Component Overview

The Project component is the main workspace of the Auto-CIDE application. It provides a collaborative coding environment with features like:

- Real-time file editing and collaboration
- Project file tree management
- Chat functionality between collaborators
- WebContainer for running and previewing code
- Terminal integration
- User management and collaboration
- File creation and deletion directly from the file explorer

## State Management

The Project component uses React's useState hook to manage various aspects of the application state:

### User Management
```javascript
const [users, setUsers] = useState([]);
const [sidePanel, setSidePanel] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedUserId, setSelectedUserId] = useState([]);
```
- `users`: List of users collaborating on the project
- `sidePanel`: Controls visibility of the side panel
- `isModalOpen`: Controls visibility of the user modal
- `selectedUserId`: Tracks selected users for operations

### Project Information
```javascript
const [project, setProject] = useState(null);
const [projectId, setProjectId] = useState(location.state?._id || '');
```
- `project`: Stores project details
- `projectId`: The ID of the current project

### Messaging System
```javascript
const [message, setMessage] = useState("");
const [messages, setMessages] = useState([]);
const messageBoxRef = useRef(null);
const [messageBoxWidth, setMessageBoxWidth] = useState(20);
const [isResizing, setIsResizing] = useState(false);
```
- `message`: Current message being typed
- `messages`: List of all messages in the chat
- `messageBoxRef`: Reference to the message box DOM element
- `messageBoxWidth`: Width of the message box as percentage
- `isResizing`: Flag indicating if message box is being resized

### File Management
```javascript
const [fileTree, setFileTree] = useState([]);
const [CurrentFile, setCurrentFile] = useState(null);
const [openFiles, setOpenFiles] = useState([]);
```
- `fileTree`: Hierarchical representation of project files
- `CurrentFile`: The file currently being edited
- `openFiles`: List of files currently open in tabs

### WebContainer
```javascript
const [webContainer, setWebContainer] = useState(null);
const [webContainerStatus, setWebContainerStatus] = useState('initializing');
```
- `webContainer`: Instance of the WebContainer
- `webContainerStatus`: Current status of the WebContainer ('initializing', 'initialized', 'error')

## Socket Communication

The Project component uses Socket.IO for real-time communication between collaborators.

### Socket Initialization
```javascript
useEffect(() => {
  // Initialize socket connection
  const socket = initializeSocket(projectId);
  // ...
}, [projectId]);
```

### Socket Event Handlers

#### handleProjectMessage
```javascript
const handleProjectMessage = (message) => {
  addMessage(message, "incoming");
};
```
Handles incoming chat messages from other users.

#### handleFileUpdate
```javascript
const handleFileUpdate = (data) => {
  // Skip if this update was triggered by the current user
  if (data.userId === user._id) return;
  
  // Update the file tree, current file, and open files
  // ...
  
  // Update the file in WebContainer
  // ...
  
  // Show notification
  showNotification(`File ${data.file.filename} was updated by ${data.userName}`, "info");
};
```
Handles real-time file updates from other users, ensuring that:
- The file tree is updated
- The current file is updated if open
- Open files are updated
- The WebContainer is updated with the new file content
- Unsaved changes are not overwritten

### Emitting Socket Events
```javascript
// When saving a file
if (socketInstance) {
  socketInstance.emit("file-update", {
    projectId,
    userId: user._id,
    userName: user.name || user.email,
    file: {
      filename: file.filename,
      content: file.content,
      _id: response.data._id
    }
  });
}
```
Notifies other users when a file is saved.

## File Management

### File Operations

#### openFile
```javascript
const openFile = useCallback((file) => {
  // Check if file is already open
  // Add to open files if not
  // Set as current file
}, [openFiles, setOpenFiles, setCurrentFile]);
```
Opens a file in the editor.

#### saveFileChanges / saveFile
```javascript
const saveFileChanges = useCallback((file) => {
  saveFile(file);
}, [saveFile]);

const saveFile = useCallback((file) => {
  // Save file to backend
  // Update file tree
  // Update WebContainer
  // Emit socket event
}, [projectId, webContainer, webContainerStatus, showNotification, user]);
```
Saves changes to a file and updates all relevant state.

#### saveAllChanges
```javascript
const saveAllChanges = useCallback(() => {
  // Find all files with unsaved changes
  // Save each file
}, [openFiles, saveFile]);
```
Saves all files with unsaved changes.

#### handleCloseFile
```javascript
const handleCloseFile = useCallback((filename) => {
  // Confirm if file has unsaved changes
  // Remove from open files
  // Update current file if needed
}, [CurrentFile, openFiles]);
```
Closes a file tab, with confirmation if there are unsaved changes.

#### createNewFile
```javascript
const createNewFile = useCallback(() => {
  // Prompt the user for a filename
  const filename = prompt("Enter the filename (including path if needed):");
  
  // Return if the user cancels or enters an empty filename
  if (!filename || filename.trim() === '') return;
  
  // Determine the language based on the file extension
  const language = detectLanguageFromFilename(filename);
  
  // Create a new file object
  const newFile = {
    filename: filename.trim(),
    content: '',
    language,
    isSymlink: false,
    hasUnsavedChanges: true,
    mountedToWebContainer: false
  };
  
  // Add the file to the file tree
  setFileTree(prev => [...prev, newFile]);
  
  // Open the file in the editor
  setOpenFiles(prev => {
    // Check if the file is already open
    if (prev.some(f => f.filename === newFile.filename)) {
      return prev;
    }
    return [...prev, newFile];
  });
  
  // Set the new file as the current file
  setCurrentFile(newFile);
  
  // Show a notification
  showNotification(`Created new file: ${newFile.filename}`, 'success');
}, [detectLanguageFromFilename, showNotification]);
```
Creates a new file in the project. This function is triggered by clicking the "+" button in the file explorer header.

#### deleteFile
```javascript
const deleteFile = useCallback((filename, e) => {
  // Stop event propagation to prevent opening the file when clicking delete
  if (e) {
    e.stopPropagation();
  }
  
  // Confirm deletion
  const confirmDelete = window.confirm(`Are you sure you want to delete ${filename}?`);
  if (!confirmDelete) return;
  
  // Find the file in the file tree
  const fileToDelete = fileTree.find(f => f.filename === filename);
  if (!fileToDelete) {
    showNotification(`File ${filename} not found`, 'error');
    return;
  }
  
  // If the file has an ID (saved to backend), delete it from the backend
  if (fileToDelete._id) {
    axios.delete(`/filetree/${projectId}/${fileToDelete._id}`)
      .then(() => {
        // Show success notification
        showNotification(`File ${filename} deleted successfully`, 'success');
        
        // Remove from file tree
        setFileTree(prev => prev.filter(f => f.filename !== filename));
        
        // Close the file if it's open
        if (openFiles.some(f => f.filename === filename)) {
          handleCloseFile(filename);
        }
      })
      .catch(error => {
        console.error('Error deleting file:', error);
        showNotification(`Error deleting file: ${error.message}`, 'error');
      });
  } else {
    // If the file is not saved to backend yet, just remove it from the UI
    setFileTree(prev => prev.filter(f => f.filename !== filename));
    
    // Close the file if it's open
    if (openFiles.some(f => f.filename === filename)) {
      handleCloseFile(filename);
    }
    
    showNotification(`File ${filename} removed`, 'success');
  }
}, [fileTree, projectId, openFiles, handleCloseFile, showNotification]);
```
Deletes a file from the project. This function is triggered by clicking the delete button in the file item.

## WebContainer Integration

The Project component integrates with WebContainer to provide a live development environment.

### Initialization
```javascript
useEffect(() => {
  // Initialize WebContainer
  initializeWebContainer()
    .then(container => {
      setWebContainer(container);
      setWebContainerStatus('initialized');
    })
    .catch(error => {
      console.error('WebContainer initialization error:', error);
      setWebContainerStatus('error');
    });
}, []);
```

### File Mounting
```javascript
const mountFilesToWebContainer = useCallback(async (container, files) => {
  // Mount files to WebContainer
  // Handle symlinks
  // Update file state
}, []);
```
Mounts files to the WebContainer filesystem.

### Server Management
```javascript
const startServer = useCallback(async () => {
  // Start development server in WebContainer
  // Update server status
  // Show notification
}, [webContainer, webContainerStatus, showNotification]);
```
Starts a development server in the WebContainer.

## UI Components

### Editor
```javascript
<Editor
  height="100%"
  width="100%"
  language={CurrentFile.language}
  theme="vs-dark"
  value={CurrentFile.content}
  onChange={(value) => {
    // Update file content
    // Mark as having unsaved changes
  }}
  options={{
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
  }}
/>
```
Monaco Editor component for editing code.

### File Tree
```javascript
const renderDirectory = (dir, path = '', level = 0) => {
  // Render directory structure
  // Handle file/folder clicks
  // Show context menu options
};
```
Renders the hierarchical file tree with context menu options.

#### File Explorer Header
```javascript
<div className="explorer-header p-2 border-b flex justify-between items-center">
  <h1 className="font-bold">File Explorer</h1>
  <button 
    className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
    onClick={createNewFile}
    title="Create new file"
  >
    <i className="ri-add-line"></i>
  </button>
</div>
```
The file explorer header contains a title and a "+" button for creating new files.

#### File Item
```javascript
<div 
  key={currentPath}
  className="file-item flex items-center py-1 hover:bg-slate-300 cursor-pointer group"
  style={{ paddingLeft: `${paddingLeft}px` }}
  onClick={() => {
    // Open file logic
  }}
>
  <i className="ri-file-fill mr-1 text-blue-600"></i>
  <span className="text-sm">{name}</span>
  <div className="flex-grow"></div>
  {/* Delete button */}
  <button
    type="button"
    className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
    onClick={(e) => {
      e.stopPropagation();
      deleteFile(item.data.filename, e);
    }}
    title="Delete file"
  >
    <i className="ri-delete-bin-line"></i>
  </button>
</div>
```
Each file item in the file explorer includes a delete button that appears on hover.

### Chat
```javascript
<div className="message-box">
  {messages.map((msg, index) => (
    <div key={index} className={`message ${msg.sender === user.email ? 'sent' : 'received'}`}>
      {renderMessage(msg.message)}
    </div>
  ))}
</div>
```
Renders the chat interface for collaborator communication.

### Terminal
```javascript
<div className="terminal">
  {terminal.output.map((line, index) => (
    <div key={index} className={`terminal-line ${line.type}`}>
      {line.content}
    </div>
  ))}
</div>
```
Renders the terminal interface for command execution.

## Event Handlers

### Mouse Events

#### handleMouseMove
```javascript
const handleMouseMove = (e) => {
  if (!isResizing) return;
  // Calculate new width as percentage
  // Update message box width
};
```
Handles mouse movement during message box resizing.

#### handleMouseUp
```javascript
const handleMouseUp = () => {
  setIsResizing(false);
};
```
Handles mouse up event to stop resizing.

### Keyboard Events

#### handleKeyDown (Editor)
```javascript
const handleKeyDown = (e) => {
  // Handle keyboard shortcuts
  // Ctrl+S for save
  // Ctrl+Shift+S for save all
};
```
Handles keyboard shortcuts in the editor.

#### handleKeyDown (Terminal)
```javascript
const handleKeyDown = (e) => {
  // Handle terminal input
  // Enter to execute command
  // Up/Down for command history
};
```
Handles keyboard input in the terminal.

## Hooks and Effects

### Data Fetching
```javascript
useEffect(() => {
  // Fetch project data
  // Fetch file tree
  // Fetch collaborators
}, [projectId]);
```
Fetches initial data when the component mounts or projectId changes.

### Socket Connection
```javascript
useEffect(() => {
  // Initialize socket
  // Set up event handlers
  // Clean up on unmount
}, [projectId]);
```
Manages socket connection lifecycle.

### WebContainer Initialization
```javascript
useEffect(() => {
  // Initialize WebContainer
  // Handle initialization status
}, []);
```
Initializes the WebContainer when the component mounts.

### File Mounting
```javascript
useEffect(() => {
  // Mount files to WebContainer when fileTree changes
  // Only mount files that haven't been mounted yet
}, [fileTree, webContainer, webContainerStatus]);
```
Mounts files to the WebContainer when the file tree changes.

### Message Processing
```javascript
useEffect(() => {
  // Process incoming messages
  // Extract file content from AI messages
  // Update file tree
}, [messages]);
```
Processes incoming messages, especially AI-generated code.

### Auto-Saving
```javascript
useEffect(() => {
  // Set up auto-save interval
  // Save files with unsaved changes
  // Clean up interval on unmount
}, [openFiles, saveFile]);
```
Automatically saves files at regular intervals.

## Recent Additions

### File Creation Button
A "+" button has been added to the file explorer header to allow users to quickly create new files. When clicked, it prompts the user to enter a filename (including path if needed) and creates an empty file with that name. The file is automatically opened in the editor for editing.

### File Deletion Button
Each file item in the file explorer now includes a delete button that appears when hovering over the file. When clicked, it prompts the user to confirm the deletion and then removes the file from both the UI and the backend (if it was already saved). This provides a convenient way to manage files directly from the file explorer.

These additions enhance the user experience by providing intuitive ways to manage files without having to use external tools or commands. The visual feedback (notifications) keeps users informed about the result of their actions, and the confirmation dialogs help prevent accidental deletions.

## Conclusion

The Project component is a complex and feature-rich part of the Auto-CIDE application. It integrates various technologies like Socket.IO for real-time collaboration, WebContainer for code execution, and Monaco Editor for code editing. The component manages a significant amount of state and provides a comprehensive set of features for collaborative coding.

This documentation provides an overview of the main aspects of the Project component, but the actual implementation contains many more details and edge cases that are handled to provide a smooth user experience. 