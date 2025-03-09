import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  socketInstance,
} from "../config/socket";
import { 
  initializeWebContainer, 
  mountFilesToWebContainer as mountFilesToWebContainerOriginal,
  startDevServer,
  getServerUrl
} from "../config/webContainer";
import UserContext from "../context/user.context";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import Editor from "@monaco-editor/react";

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Users
  const [users, setUsers] = useState([]);
  const [sidePanel, setSidePanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);

  // Project
  const [project, setProject] = useState(null);
  const [projectId, setProjectId] = useState(location.state?._id || '');

  // Messages
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageBoxRef = useRef(null);
  const [messageBoxWidth, setMessageBoxWidth] = useState(20);
  const [isResizing, setIsResizing] = useState(false);

  // File Tree
  const [fileTree, setFileTree] = useState([]);
  const [CurrentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const processedMessagesRef = useRef(new Set());

  // Web Containers
  const [webContainer, setWebContainer] = useState(null);
  const [webContainerStatus, setWebContainerStatus] = useState('not-initialized');
  const [serverUrl, setServerUrl] = useState('');
  const [isServerRunning, setIsServerRunning] = useState(false);
  
  // Terminal state
  const [terminals, setTerminals] = useState([
    {
      id: 'terminal-1',
      name: 'Terminal 1',
      output: [],
      command: '',
      isLoading: false,
      process: null,
      visible: false
    }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState('terminal-1');
  const [terminalVisible, setTerminalVisible] = useState(false);
  const terminalRefs = useRef({});
  
  // Preview state
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  
  // Add a ref to store the current fileTree
  const fileTreeRef = useRef([]);

  // Update the ref whenever fileTree changes
  useEffect(() => {
    fileTreeRef.current = fileTree;
  }, [fileTree]);

  // Function to detect language from filename
  const detectLanguageFromFilename = useCallback((filename) => {
    let language = 'text';
    const extension = filename.split('.').pop();
    if (extension) {
      // Map common extensions to languages
      const extensionMap = {
        'js': 'javascript',
        'jsx': 'jsx',
        'ts': 'typescript',
        'tsx': 'tsx',
        'py': 'python',
        'java': 'java',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'md': 'markdown',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'c': 'c',
        'cpp': 'cpp',
        'cs': 'csharp',
      };
      language = extensionMap[extension.toLowerCase()] || 'text';
    }
    return language;
  }, []);

  // Memoize the mountFilesToWebContainer function to prevent unnecessary re-renders
  const mountFilesToWebContainer = useCallback((container, files) => {
    return mountFilesToWebContainerOriginal(container, files);
  }, []);

  // Check if we have valid project data on component mount
  useEffect(() => {
    if (!location.state) {
      // If no project data was passed, redirect to projects page
      navigate("/projects");
    }
  }, [location.state, navigate]);

  // First useEffect to handle user authentication
  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
      }
    }
  }, [user, navigate]);

  // Helper function to show notifications
  const showNotification = useCallback((message, type = 'info', duration = 5000, actions = null) => {
    const el = document.createElement('div');
    el.className = `fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg z-50 flex items-center ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      type === 'warning' ? 'bg-yellow-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    
    // Add icon based on notification type
    const iconDiv = document.createElement('div');
    iconDiv.className = 'mr-3 flex-shrink-0';
    
    if (type === 'success') {
      iconDiv.innerHTML = `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>`;
    } else if (type === 'error') {
      iconDiv.innerHTML = `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
      </svg>`;
    } else if (type === 'warning') {
      iconDiv.innerHTML = `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>`;
    } else {
      iconDiv.innerHTML = `<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
      </svg>`;
    }
    
    el.appendChild(iconDiv);
    
    // Add message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex-grow';
    messageDiv.textContent = message;
    el.appendChild(messageDiv);
    
    // Add actions if provided
    if (actions) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'ml-4 flex-shrink-0';
      
      actions.forEach(action => {
        const button = document.createElement('button');
        button.className = 'ml-2 bg-white text-gray-800 hover:bg-gray-100 text-xs px-2 py-1 rounded';
        button.textContent = action.label;
        button.onclick = () => {
          action.onClick();
          if (action.closeNotification) {
            document.body.removeChild(el);
          }
        };
        actionsDiv.appendChild(button);
      });
      
      el.appendChild(actionsDiv);
    }
    
    document.body.appendChild(el);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (document.body.contains(el)) {
          document.body.removeChild(el);
        }
      }, duration);
    }
    
    return el;
  }, []);

  // Function to initialize or retry WebContainer initialization
  const initializeWebContainerWithNotifications = useCallback(() => {
    setWebContainerStatus('initializing');
    
    // Show initializing notification
    showNotification('Initializing WebContainer...', 'info');
    
    initializeWebContainer()
      .then((container) => {
        setWebContainer(container);
        setWebContainerStatus('initialized');
        console.log("Web container initialized");
        
        // Mount the file tree to the WebContainer
        // Use the ref to access the current fileTree state
        const currentFileTree = fileTreeRef.current;
        mountFilesToWebContainer(container, currentFileTree)
          .then(() => {
            console.log("Files mounted to WebContainer");
          })
          .catch((error) => {
            console.error("Error mounting files to WebContainer:", error);
          });
        
        // Show success notification
        showNotification('WebContainer initialized successfully!', 'success', 3000);
      })
      .catch((error) => {
        setWebContainerStatus('error');
        console.error("Failed to initialize WebContainer:", error);
        
        // Check if this is a cross-origin isolation error
        const isCrossOriginError = error.message.includes('SharedArrayBuffer') || 
                                  error.message.includes('crossOriginIsolated');
        
        // Show error notification with retry button
        showNotification(
          isCrossOriginError 
            ? `WebContainer requires cross-origin isolation. Please run the app with 'npm run dev:webcontainer' instead.` 
            : `WebContainer initialization failed: ${error.message}`, 
          'error', 
          0, // Don't auto-dismiss
          [
            { 
              label: 'Retry', 
              onClick: () => initializeWebContainerWithNotifications(), 
              closeNotification: true 
            },
            { 
              label: 'Dismiss', 
              onClick: () => {}, 
              closeNotification: true 
            }
          ]
        );
      });
  }, [showNotification, mountFilesToWebContainer]);

  // Second useEffect to handle data fetching and socket initialization
  useEffect(() => {
    if (!user) {
      return; // Don't proceed if no user
    }

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // If projectId is empty, redirect to projects page
    if (!projectId) {
      navigate("/projects");
      return;
    }

    // Initialize socket with projectId
    const socket = initializeSocket(projectId);
    if (!socket) {
      console.warn("Socket initialization failed. Some features may not work properly.");
    }

    // Initialize web container
    if (webContainerStatus === 'not-initialized') {
      initializeWebContainerWithNotifications();
    }

    // Fetch project data
    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        setProject(res.data.project);
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
      });

    // Fetch file tree data
    axios
      .get(`/filetree/${projectId}`)
      .then((res) => {
        // Convert the file tree data to our internal format
        const processedFiles = Array.isArray(res.data) ? res.data.map(node => ({
          filename: node.path,
          content: node.content || '',
          language: detectLanguageFromFilename(node.path),
          isSymlink: false,
          hasUnsavedChanges: false,
          mountedToWebContainer: false,
          _id: node._id // Store the node ID for future updates
        })) : [];
        
        setFileTree(processedFiles);
      })
      .catch((err) => {
        console.error("Error fetching file tree:", err);
        showNotification("Error loading file tree", "error");
      });

    // Existing users fetch
    axios
      .get("/users/all")
      .then((res) => {
        if (res.data && Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res.data && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else {
          console.error("Unexpected data format:", res.data);
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error("API Error:", err.response?.data || err.message);
        setUsers([]);
      });

    // Set up socket message handler
    const handleProjectMessage = (message) => {
      addMessage(message, "incoming");
    };

    // Register socket event handler
    if (socketInstance) {
      receiveMessage("project-message", handleProjectMessage);
    }

    // Cleanup socket connection on unmount
    return () => {
      if (socketInstance) {
        // Remove the specific event handler
        socketInstance.off("project-message", handleProjectMessage);
        socketInstance.disconnect();
      }
    };
  }, [projectId, user, navigate, webContainerStatus, detectLanguageFromFilename, showNotification]);

  // Helper function to merge new files with existing files
  const mergeFileTree = useCallback((newFiles, existingFiles) => {
    if (!newFiles || newFiles.length === 0) return existingFiles;
    if (!existingFiles || existingFiles.length === 0) {
      // If there are no existing files, mark all new files as needing to be mounted
      return newFiles.map(file => ({
        ...file,
        hasUnsavedChanges: true,
        mountedToWebContainer: false
      }));
    }
    
    // Create a map of existing files by filename for quick lookup
    const existingFilesMap = existingFiles.reduce((map, file) => {
      map[file.filename] = file;
      return map;
    }, {});
    
    // Process each new file
    const mergedFiles = [...existingFiles]; // Start with existing files
    const updatedFiles = []; // Track which files were updated
    let hasChanges = false; // Track if any changes were made
    
    newFiles.forEach(newFile => {
      const existingFile = existingFilesMap[newFile.filename];
      
      if (existingFile) {
        // File exists - handle based on file type and content
        if (!existingFile.isSymlink && !newFile.isSymlink) {
          // Both are regular files
          
          // Check if content is identical
          if (existingFile.content === newFile.content) {
            console.log(`File ${newFile.filename} already exists with identical content`);
            return; // Skip this file
          }
          
          // Check if new content is already a subset of existing content
          if (existingFile.content.includes(newFile.content)) {
            console.log(`File ${newFile.filename} already contains the new content`);
            return; // Skip this file
          }
          
          // Check if existing content is a subset of new content
          if (newFile.content.includes(existingFile.content)) {
            // Replace with new content as it's more comprehensive
            const index = mergedFiles.findIndex(f => f.filename === newFile.filename);
            if (index !== -1) {
              mergedFiles[index] = {
                ...existingFile,
                content: newFile.content,
                hasUnsavedChanges: true,
                mountedToWebContainer: false
              };
              updatedFiles.push(newFile.filename);
              hasChanges = true;
              console.log(`Replaced content in ${newFile.filename} with more comprehensive version`);
            }
            return;
          }
          
          // Default: append content with a separator
          const index = mergedFiles.findIndex(f => f.filename === newFile.filename);
          if (index !== -1) {
            mergedFiles[index] = {
              ...existingFile,
              content: existingFile.content + '\n\n// New content from AI:\n\n' + newFile.content,
              hasUnsavedChanges: true,
              mountedToWebContainer: false
            };
            
            updatedFiles.push(newFile.filename);
            hasChanges = true;
            console.log(`Appended content to existing file: ${newFile.filename}`);
          }
        }
        // If either is a symlink, don't modify (symlinks can't be appended to)
        else if (existingFile.isSymlink !== newFile.isSymlink) {
          console.log(`Skipping ${newFile.filename}: Can't convert between regular file and symlink`);
        }
      } else {
        // File doesn't exist - add it to the merged array
        mergedFiles.push({
          ...newFile,
          hasUnsavedChanges: true,
          mountedToWebContainer: false
        });
        updatedFiles.push(newFile.filename);
        hasChanges = true;
        console.log(`Added new file: ${newFile.filename}`);
      }
    });
    
    // Update current file if it was modified
    if (CurrentFile && updatedFiles.includes(CurrentFile.filename)) {
      const updatedFile = mergedFiles.find(f => f.filename === CurrentFile.filename);
      if (updatedFile) {
        setCurrentFile({
          ...updatedFile,
          hasUnsavedChanges: true
        });
      }
    }
    
    // Show notification about the changes
    if (updatedFiles.length > 0) {
      showNotification(
        `Updated ${updatedFiles.length} files: ${updatedFiles.slice(0, 3).join(', ')}${updatedFiles.length > 3 ? '...' : ''}`, 
        'info', 
        5000
      );
    }
    
    // Only return the new merged files if changes were made
    // This prevents unnecessary state updates
    return hasChanges ? mergedFiles : existingFiles;
  }, [CurrentFile, showNotification, setCurrentFile]);

  // Add useEffect to handle filetree updates from AI messages
  useEffect(() => {
    // Process messages to extract filetree data
    const aiMessages = messages.filter(msg => msg.sender === "AI");
    if (aiMessages.length > 0) {
      try {
        // Get the latest AI message
        const latestMessage = aiMessages[aiMessages.length - 1];
        
        // Generate a unique ID for the message (or use an existing one)
        const messageId = latestMessage.id || latestMessage.timestamp || JSON.stringify(latestMessage).slice(0, 100);
        
        // Skip if we've already processed this message
        if (processedMessagesRef.current.has(messageId)) {
          console.log("Skipping already processed AI message:", messageId);
          return;
        }
        
        const parsedMessage = JSON.parse(latestMessage.message);
        
        // Update filetree if it exists in the message
        if (parsedMessage.code?.filetree) {
          // The filetree is now a flat array of files and directories
          // Convert it to our internal format
          const processedFiles = parsedMessage.code.filetree
            .filter(item => item.type === 'file') // Only process files
            .map(item => ({
              filename: item.path,
              content: item.content || '',
              language: item.language || detectLanguageFromFilename(item.path),
              isSymlink: item.isSymlink || false,
              symlink: item.symlink || ''
            }));
          
          // Merge with existing files instead of replacing them
          if (processedFiles.length > 0) {
            console.log(`Processing ${processedFiles.length} files from AI message:`, messageId);
            setFileTree(prevFileTree => {
              const mergedFiles = mergeFileTree(processedFiles, prevFileTree);
              return mergedFiles;
            });
            // Notification is now handled in mergeFileTree
          }
          
          // Mark the message as processed to prevent reprocessing
          processedMessagesRef.current.add(messageId);
        }
      } catch (e) {
        // Ignore parsing errors
        console.log("Error processing AI message for filetree:", e);
      }
    }
  }, [messages, mergeFileTree, detectLanguageFromFilename]);

  // Add useEffect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add useEffect to handle resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Calculate new width as percentage of window width
      const newWidth = (e.clientX / window.innerWidth) * 100;

      // Limit the width between 15% and 50%
      if (newWidth >= 15 && newWidth <= 50) {
        setMessageBoxWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Memoize callback functions
  const handleUserClick = useCallback((id) => {
    setSelectedUserId((prevIds) =>
      prevIds.includes(id)
        ? prevIds.filter((uid) => uid !== id)
        : [...prevIds, id]
    );
  }, []);

  const addCollaborators = useCallback(() => {
    axios
      .put("/projects/add-user", {
        projectId: projectId,
        users: selectedUserId,
      })
      .then(() => {
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.error("Error adding collaborators:", err);
      });
  }, [projectId, selectedUserId]);

  // Memoize addMessage function - define this first
  const addMessage = useCallback((messageData, type) => {
    // Use a function to update state based on previous state
    setMessages((prevMessages) => {
      const newMessage = { ...messageData, type };
      
      // Check if this exact message already exists to prevent duplicates
      const messageExists = prevMessages.some(
        (msg) => 
          msg.message === newMessage.message && 
          msg.sender === newMessage.sender && 
          msg.type === newMessage.type
      );
      
      // Only add if it doesn't exist
      return messageExists ? prevMessages : [...prevMessages, newMessage];
    });
  }, []);

  // Helper function to prepare message with context if needed
  const prepareMessageWithContext = useCallback((message) => {
    if (message.includes("@ai")) {
      // Only include essential file information to keep the context smaller
      const essentialFileInfo = fileTree.map(file => ({
        filename: file.filename,
        language: file.language,
        isSymlink: file.isSymlink,
        // Include only a preview of content (first 100 chars) to reduce size
        contentPreview: file.content?.substring(0, 100) + (file.content?.length > 100 ? '...' : '')
      }));
      
      return message + `\nfilecontext: ${JSON.stringify(essentialFileInfo)}`;
    }
    return message;
  }, [fileTree]);

  // Now define sendSomeMessage which depends on addMessage
  const sendSomeMessage = useCallback((message) => {
    if (!user) {
      console.error("User is not logged in.");
      return;
    }

    if (!user._id) {
      console.error("User ID is not available:", user);
      return;
    }

    // Create a copy of the message for display
    const displayMessage = message;
    
    // Prepare the message with context for the server
    const serverMessage = prepareMessageWithContext(message);

    // Send the message with context to the server if socket is connected
    if (socketInstance) {
    sendMessage("project-message", {
        message: serverMessage,
      sender: user.email,
      projectId: projectId,
    });
    } else {
      console.warn("Socket not connected. Message not sent to server.");
    }

    // Add the original message (without context) to the UI
    addMessage(
      {
        message: displayMessage,
        sender: user.email,
        projectId: projectId,
      },
      "outgoing"
    );

    setMessage("");
  }, [user, projectId, addMessage, prepareMessageWithContext]);

  const scrollToBottom = useCallback(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }, []);

  // Function to render AI message content - memoize to prevent re-renders
  const renderAIMessage = useCallback((messageContent) => {
    try {
      // Try to parse the message as JSON
      const parsedMessage = JSON.parse(messageContent);

      // Check if it has the expected structure
      if (parsedMessage.text && parsedMessage.code?.filetree) {
        // Process the flat array of files and directories
        const processedFiles = parsedMessage.code.filetree
          .filter(item => item.type === 'file') // Only process files
          .map(item => ({
            filename: item.path,
            content: item.content || '',
            language: item.language || detectLanguageFromFilename(item.path),
            isSymlink: item.isSymlink || false,
            symlink: item.symlink || ''
          }));

        return (
          <div className="ai-message-container">
            {/* Text part */}
            <div className="text-part mb-3">{parsedMessage.text}</div>

            {/* Code part - for each processed file */}
            {processedFiles.map((file, fileIndex) => {
              return (
                <div key={fileIndex} className="code-file mb-4 cursor-pointer">
                  <div className="file-header bg-gray-800 text-white text-xs px-3 py-1 rounded-t-md flex justify-between items-center">
                    <span>{file.filename}</span>
                    <div className="flex items-center">
                      <span 
                        className="language-badge px-2 py-0.5 bg-gray-700 rounded text-xs cursor-pointer hover:bg-gray-600"
                      >
                        {file.isSymlink ? 'symlink' : file.language}
                    </span>
                      {!file.isSymlink && (
                        <button
                          className="ml-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded"
                          onClick={() => {
                            // Check if the file already exists in the file tree
                            const existingFile = fileTree.find(f => f.filename === file.filename);
                            
                            if (existingFile) {
                              // If it exists, use that version instead of the one from the message
                              // This prevents overwriting any changes the user might have made
                              if (!openFiles.some(f => f.filename === file.filename)) {
                                setOpenFiles(prev => [...prev, existingFile]);
                              }
                              setCurrentFile(existingFile);
                            } else {
                              // If it doesn't exist, add it to the file tree first with proper flags
                              const newFile = {
                                ...file,
                                hasUnsavedChanges: true,
                                mountedToWebContainer: false
                              };
                              
                              // Add to file tree
                              setFileTree(prev => [...prev, newFile]);
                              
                              // Add to open files
                              if (!openFiles.some(f => f.filename === file.filename)) {
                                setOpenFiles(prev => [...prev, newFile]);
                              }
                              
                              // Set as current file
                              setCurrentFile(newFile);
                            }
                          }}
                          title="Open in editor"
                        >
                          Open
                        </button>
                      )}
                    </div>
                  </div>
                  <SyntaxHighlighter
                    language={file.isSymlink ? 'text' : file.language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: '0.375rem',
                      borderBottomRightRadius: '0.375rem',
                    }}
                    onClick={() => {
                      if (file.isSymlink) {
                        navigator.clipboard.writeText(file.symlink);
                      } else {
                        navigator.clipboard.writeText(file.content);
                      }
                      // Optional: Add visual feedback
                      const el = document.createElement('div');
                      el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      el.textContent = 'Code copied to clipboard!';
                      document.body.appendChild(el);
                      setTimeout(() => el.remove(), 2000);
                    }}
                    title="Click to copy code"
                  >
                    {file.isSymlink ? `Symlink to: ${file.symlink}` : file.content}
                  </SyntaxHighlighter>
                </div>
              );
            })}

            {/* Build Commands Section */}
            {parsedMessage.buildcommands &&
              Array.isArray(parsedMessage.buildcommands) &&
              parsedMessage.buildcommands.length > 0 && (
                <div className="build-commands mt-4">
                  <div className="build-header bg-gray-800 text-white text-xs px-3 py-1 rounded-t-md flex justify-between items-center">
                    <span>Build Commands</span>
                    <span className="language-badge px-2 py-0.5 bg-gray-700 rounded text-xs">
                      shell
                    </span>
                  </div>
                  <div className="commands-list">
                    {parsedMessage.buildcommands.map((command, cmdIndex) => (
                      <div
                        key={cmdIndex}
                        className={cmdIndex !== 0 ? "mt-2" : ""}
                      >
                        <div className="command-number bg-gray-700 text-gray-300 text-xs px-2 py-0.5">
                          Command {cmdIndex + 1}
                        </div>
                        <SyntaxHighlighter
                          language="shell"
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            borderBottomLeftRadius:
                              cmdIndex ===
                              parsedMessage.buildcommands.length - 1
                                ? "0.375rem"
                                : 0,
                            borderBottomRightRadius:
                              cmdIndex ===
                              parsedMessage.buildcommands.length - 1
                                ? "0.375rem"
                                : 0,
                          }}
                        >
                          {command}
                        </SyntaxHighlighter>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );
      }
    } catch (e) {
      // If parsing fails, just return the message as is
      console.log("Not a valid JSON message:", e);
    }

    // Default: return the message as plain text
    return messageContent;
  }, [openFiles, fileTree, setOpenFiles, setCurrentFile, setFileTree, detectLanguageFromFilename]);

  // Memoize the file closing function
  const handleCloseFile = useCallback((filename) => {
    // Find the file to check if it has unsaved changes
    const fileToClose = openFiles.find(f => f.filename === filename);
    
    // If the file has unsaved changes, confirm before closing
    if (fileToClose && fileToClose.hasUnsavedChanges) {
      const confirmClose = window.confirm(`${filename} has unsaved changes. Close anyway?`);
      if (!confirmClose) {
        return; // Don't close if the user cancels
      }
    }
    
    setOpenFiles(prev => {
      const remainingFiles = prev.filter(f => f.filename !== filename);
      
      // If the current file is being closed, set current file to the next available file or null
      if (CurrentFile && CurrentFile.filename === filename) {
        setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null);
      }
      
      return remainingFiles;
    });
  }, [CurrentFile, openFiles]);

  // Add useEffect to mount files to WebContainer when fileTree changes
  useEffect(() => {
    // Only proceed if WebContainer is initialized and we have files
    if (webContainerStatus === 'initialized' && webContainer && fileTree.length > 0) {
      console.log("File tree changed, checking for files to mount...");
      
      // Find files that have unsaved changes AND haven't been mounted yet
      // This prevents the circular mounting issue
      const changedFiles = fileTree.filter(file => 
        file.hasUnsavedChanges && !file.mountedToWebContainer
      );
      
      if (changedFiles.length > 0) {
        console.log(`Found ${changedFiles.length} files to mount`);
        
        // Use a timeout to debounce multiple rapid changes
        // This prevents mounting the same files multiple times in quick succession
        const timeoutId = setTimeout(() => {
          console.log(`Mounting ${changedFiles.length} files to WebContainer...`);
          
          // Only mount the changed files for efficiency
          mountFilesToWebContainer(webContainer, changedFiles)
            .then(() => {
              console.log(`Mounted ${changedFiles.length} changed files to WebContainer`);
              
              // Mark files as mounted in WebContainer (but still unsaved in UI)
              // This prevents remounting the same files repeatedly
              setFileTree(prev => 
                prev.map(file => 
                  changedFiles.some(cf => cf.filename === file.filename)
                    ? { ...file, mountedToWebContainer: true }
                    : file
                )
              );
              
              // Optional: Show a notification for large changes
              if (changedFiles.length > 3) {
                showNotification(`Mounted ${changedFiles.length} files to WebContainer`, 'info', 3000);
              }
            })
            .catch((error) => {
              console.error("Error mounting files after file tree change:", error);
              showNotification(`Error updating files in WebContainer: ${error.message}`, 'error', 10000);
            });
        }, 300); // 300ms debounce
        
        // Clean up the timeout if the component unmounts or fileTree changes again
        return () => clearTimeout(timeoutId);
      } else {
        console.log("No changed files to mount to WebContainer");
      }
    }
  }, [fileTree, webContainer, webContainerStatus, showNotification, mountFilesToWebContainer]);

  // Add a function to save file changes that also updates the WebContainer
  const saveFileChanges = useCallback((file) => {
    if (!file || !file.hasUnsavedChanges) return;
    
    console.log(`Saving changes to ${file.filename}`);
    
    // Create the node data according to the new schema
    const nodeData = {
      name: file.filename.split('/').pop(), // Get just the filename without path
      type: 'file',
      path: file.filename,
      content: file.content,
      projectId: projectId
    };
    
    // Check if this file already exists in the file tree
    const existingFile = fileTree.find(f => f.filename === file.filename);
    
    // If the file exists, update it; otherwise, create a new one
    const savePromise = existingFile && existingFile._id
      ? axios.put(`/filetree/${projectId}/${existingFile._id}`, nodeData)
      : axios.post(`/filetree/${projectId}`, nodeData);
    
    savePromise
    .then(response => {
      console.log('File saved successfully:', response.data);
      
      // Update the UI to show it's saved
      setOpenFiles(prev => 
        prev.map(f => 
          f.filename === file.filename 
            ? { ...f, hasUnsavedChanges: false, mountedToWebContainer: true, _id: response.data._id } 
            : f
        )
      );
      
      // Update the file tree to mark the file as saved
      setFileTree(prev => {
        const fileIndex = prev.findIndex(f => f.filename === file.filename);
        if (fileIndex >= 0) {
          // Update existing file
          const updatedTree = [...prev];
          updatedTree[fileIndex] = { 
            ...updatedTree[fileIndex], 
            hasUnsavedChanges: false, 
            mountedToWebContainer: true,
            _id: response.data._id,
            content: file.content
          };
          return updatedTree;
        } else {
          // Add new file to tree
          return [...prev, { 
            filename: file.filename, 
            content: file.content,
            language: detectLanguageFromFilename(file.filename),
            isSymlink: false,
            hasUnsavedChanges: false, 
            mountedToWebContainer: true,
            _id: response.data._id
          }];
        }
      });
      
      if (CurrentFile && CurrentFile.filename === file.filename) {
        setCurrentFile(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          mountedToWebContainer: true,
          _id: response.data._id
        }));
      }
      
      // Update the file in WebContainer if it's initialized
      if (webContainerStatus === 'initialized' && webContainer) {
        // Create a mini file tree with just this file
        const singleFileTree = [{
          filename: file.filename,
          content: file.content,
          isSymlink: file.isSymlink,
          symlink: file.symlink,
          mountedToWebContainer: true // Mark as already mounted
        }];
        
        mountFilesToWebContainer(webContainer, singleFileTree)
          .then(() => {
            console.log(`File ${file.filename} updated in WebContainer`);
          })
          .catch((error) => {
            console.error(`Error updating file in WebContainer: ${error.message}`);
          });
      }
      
      // Show a save confirmation
      showNotification(`${file.filename} saved successfully!`, 'success');
    })
    .catch(error => {
      console.error('Error saving file:', error);
      
      // Show an error notification
      showNotification(`Error saving ${file.filename}. Please try again.`, 'error', 10000);
    });
  }, [CurrentFile, projectId, webContainer, webContainerStatus, showNotification, fileTree, detectLanguageFromFilename, mountFilesToWebContainer]);

  // Add a function to save all files with unsaved changes
  const saveAllChanges = useCallback(() => {
    // Get all files with unsaved changes
    const unsavedFiles = openFiles.filter(file => file.hasUnsavedChanges);
    
    if (unsavedFiles.length === 0) return;
    
    // Create an array of promises for saving each file
    const savePromises = unsavedFiles.map(file => {
      const nodeData = {
        name: file.filename.split('/').pop(), // Get just the filename without path
        type: 'file',
        path: file.filename,
        content: file.content,
        projectId: projectId
      };
      
      // Check if this file already exists in the file tree
      const existingFile = fileTree.find(f => f.filename === file.filename);
      
      // If the file exists, update it; otherwise, create a new one
      return existingFile && existingFile._id
        ? axios.put(`/filetree/${projectId}/${existingFile._id}`, nodeData)
        : axios.post(`/filetree/${projectId}`, nodeData);
    });
    
    // Wait for all files to be saved
    Promise.all(savePromises)
      .then(responses => {
        console.log('All files saved successfully:', responses);
        
        // Create a map of filename to response data for easy lookup
        const responseMap = {};
        responses.forEach((response, index) => {
          responseMap[unsavedFiles[index].filename] = response.data;
        });
        
        // Update the UI to show all files are saved
        setOpenFiles(prev => 
          prev.map(file => {
            const responseData = responseMap[file.filename];
            return responseData 
              ? { ...file, hasUnsavedChanges: false, mountedToWebContainer: true, _id: responseData._id }
              : file;
          })
        );
        
        // Update the file tree
        setFileTree(prev => {
          const updatedTree = [...prev];
          
          // Update existing files and collect new files
          const newFiles = [];
          unsavedFiles.forEach(file => {
            const responseData = responseMap[file.filename];
            if (!responseData) return;
            
            const fileIndex = updatedTree.findIndex(f => f.filename === file.filename);
            if (fileIndex >= 0) {
              // Update existing file
              updatedTree[fileIndex] = { 
                ...updatedTree[fileIndex], 
                hasUnsavedChanges: false, 
                mountedToWebContainer: true,
                _id: responseData._id,
                content: file.content
              };
            } else {
              // Add to new files array
              newFiles.push({ 
                filename: file.filename, 
                content: file.content,
                language: detectLanguageFromFilename(file.filename),
                isSymlink: false,
                hasUnsavedChanges: false, 
                mountedToWebContainer: true,
                _id: responseData._id
              });
            }
          });
          
          // Return updated tree with new files
          return [...updatedTree, ...newFiles];
        });
        
        if (CurrentFile) {
          const responseData = responseMap[CurrentFile.filename];
          setCurrentFile(prev => ({
            ...prev,
            hasUnsavedChanges: false,
            mountedToWebContainer: true,
            _id: responseData ? responseData._id : prev._id
          }));
        }
        
        // Update the files in WebContainer if it's initialized
        if (webContainerStatus === 'initialized' && webContainer) {
          // Create a file tree with just the saved files
          const savedFilesTree = unsavedFiles.map(file => ({
            filename: file.filename,
            content: file.content,
            isSymlink: file.isSymlink,
            symlink: file.symlink
          }));
          
          mountFilesToWebContainer(webContainer, savedFilesTree)
            .then(() => {
              console.log('All files updated in WebContainer');
            })
            .catch((error) => {
              console.error(`Error updating files in WebContainer: ${error.message}`);
              showNotification(`Error updating files in WebContainer: ${error.message}`, 'warning', 5000);
            });
        }
        
        // Show a save confirmation
        showNotification('All files saved successfully!', 'success');
      })
      .catch(error => {
        console.error('Error saving files:', error);
        
        // Show an error notification
        showNotification('Error saving files. Please try again.', 'error', 10000);
      });
  }, [openFiles, CurrentFile, projectId, webContainer, webContainerStatus, showNotification, fileTree, detectLanguageFromFilename, mountFilesToWebContainer]);

  // Add keyboard shortcut for saving (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (CurrentFile) {
          saveFileChanges(CurrentFile);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [CurrentFile, saveFileChanges]);

  // Add keyboard shortcut for saving all files (Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        saveAllChanges();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveAllChanges]);

  // Function to retry WebContainer initialization - now just calls the shared function
  const retryWebContainerInit = useCallback(() => {
    if (webContainerStatus === 'error' || webContainerStatus === 'not-initialized') {
      initializeWebContainerWithNotifications();
    }
  }, [webContainerStatus, initializeWebContainerWithNotifications]);

  // Run a command in the WebContainer
  const runCommand = useCallback(async (command) => {
    if (!webContainer || webContainerStatus !== 'initialized') {
      showNotification('WebContainer is not initialized. Please wait...', 'warning');
      return;
    }
    
    try {
      // Get the active terminal
      const activeTerminal = terminals.find(t => t.id === activeTerminalId);
      if (!activeTerminal) return;
      
      // Update the terminal state to show it's loading and add the command to output
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId 
          ? {
              ...terminal,
              isLoading: true,
              output: [...terminal.output, { type: 'command', content: command }],
              command: '' // Clear the command input
            }
          : terminal
      ));
      
      // Run the command
      const shellProcess = await webContainer.spawn('sh', ['-c', command]);
      
      // Store the process in the terminal state
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId 
          ? { ...terminal, process: shellProcess }
          : terminal
      ));
      
      // Listen for output
      shellProcess.output.pipeTo(new WritableStream({
        write(data) {
          setTerminals(prev => prev.map(terminal => 
            terminal.id === activeTerminalId 
              ? { ...terminal, output: [...terminal.output, { type: 'output', content: data }] }
              : terminal
          ));
          
          // Scroll to bottom
          const terminalOutputEl = terminalRefs.current[activeTerminalId];
          if (terminalOutputEl) {
            terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
          }
        }
      }));
      
      // Wait for the command to complete
      const exitCode = await shellProcess.exit;
      
      // Add exit code to terminal output
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId 
          ? { 
              ...terminal, 
              isLoading: false,
              output: [...terminal.output, { type: 'system', content: `Command exited with code ${exitCode}` }] 
            }
          : terminal
      ));
      
      // Scroll terminal to bottom
      const terminalOutputEl = terminalRefs.current[activeTerminalId];
      if (terminalOutputEl) {
        terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
      }
    } catch (error) {
      console.error('Error running command:', error);
      
      // Add error to terminal output
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId 
          ? { 
              ...terminal, 
              isLoading: false,
              output: [...terminal.output, { type: 'error', content: `Error: ${error.message}` }] 
            }
          : terminal
      ));
      
      showNotification(`Error running command: ${error.message}`, 'error');
    }
  }, [webContainer, webContainerStatus, showNotification, terminals, activeTerminalId]);

  // Function to start the development server
  const startServer = useCallback(async () => {
    if (!webContainer || webContainerStatus !== 'initialized') {
      showNotification('WebContainer is not initialized. Please wait...', 'warning');
      return;
    }
    
    try {
      showNotification('Starting development server...', 'info');
      setIsServerRunning(true);
      
      // Get the active terminal or create one if none exists
      let activeTerminal = terminals.find(t => t.id === activeTerminalId);
      if (!activeTerminal) {
        // Create a new terminal directly instead of calling createTerminal
        const newId = `terminal-${terminals.length + 1}`;
        const newTerminal = {
          id: newId,
          name: `Terminal ${terminals.length + 1}`,
          output: [],
          command: '',
          isLoading: false,
          process: null
        };
        
        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(newId);
        terminalRefs.current[newId] = null;
        
        activeTerminal = newTerminal;
      }
      
      // Make sure the terminal is visible
      setTerminalVisible(true);
      
      // Add terminal output for better visibility
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId
          ? {
              ...terminal,
              output: [
                ...terminal.output,
                { type: 'system', content: '--- Starting development server ---' },
                { type: 'command', content: 'npm run dev' }
              ]
            }
          : terminal
      ));
      
      const url = await startDevServer(webContainer);
      
      setServerUrl(url);
      setPreviewUrl(url);
      setPreviewVisible(true);
      
      // Add server URL to terminal output
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId
          ? {
              ...terminal,
              output: [
                ...terminal.output,
                { type: 'system', content: `Server started at: ${url}` }
              ]
            }
          : terminal
      ));
      
      showNotification(`Development server started at ${url}`, 'success');
    } catch (error) {
      console.error('Error starting server:', error);
      setIsServerRunning(false);
      
      // Add error to terminal output
      setTerminals(prev => prev.map(terminal => 
        terminal.id === activeTerminalId
          ? {
              ...terminal,
              output: [
                ...terminal.output,
                { type: 'error', content: `Error starting server: ${error.message}` }
              ]
            }
          : terminal
      ));
      
      showNotification(`Error starting server: ${error.message}`, 'error');
    }
    
    // Scroll terminal to bottom
    const terminalOutputEl = terminalRefs.current[activeTerminalId];
    if (terminalOutputEl) {
      terminalOutputEl.scrollTop = terminalOutputEl.scrollHeight;
    }
  }, [webContainer, webContainerStatus, showNotification, terminals, activeTerminalId]);
  
  // Check for server URL on WebContainer initialization
  useEffect(() => {
    if (webContainerStatus === 'initialized' && webContainer) {
      const url = getServerUrl();
      if (url) {
        setServerUrl(url);
        setPreviewUrl(url);
        setIsServerRunning(true);
      }
    }
  }, [webContainerStatus, webContainer]);

  // Function to switch to a specific terminal
  const switchToTerminal = useCallback((terminalId) => {
    setActiveTerminalId(terminalId);
  }, []);

  // Function to close a terminal
  const closeTerminal = useCallback((terminalId) => {
    // Don't allow closing the last terminal
    if (terminals.length <= 1) {
      return;
    }
    
    // If closing the active terminal, switch to another one
    if (terminalId === activeTerminalId) {
      const remainingTerminals = terminals.filter(t => t.id !== terminalId);
      if (remainingTerminals.length > 0) {
        setActiveTerminalId(remainingTerminals[0].id);
      }
    }
    
    // Remove the terminal
    setTerminals(prev => prev.filter(t => t.id !== terminalId));
    
    // Clean up the ref
    delete terminalRefs.current[terminalId];
  }, [terminals, activeTerminalId]);

  // Function to rename a terminal
  const renameTerminal = useCallback((terminalId, newName) => {
    if (!newName.trim()) return;
    
    setTerminals(prev => prev.map(terminal => 
      terminal.id === terminalId
        ? { ...terminal, name: newName.trim() }
        : terminal
    ));
  }, []);

  // Add keyboard shortcuts for terminal operations
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+` to toggle terminal visibility
      if (e.ctrlKey && e.key === '`') {
        setTerminalVisible(prev => !prev);
      }
      
      // Ctrl+Shift+` to create a new terminal
      if (e.ctrlKey && e.shiftKey && e.key === '`') {
        // Create a new terminal directly instead of calling createTerminal
        const newId = `terminal-${terminals.length + 1}`;
        const newTerminal = {
          id: newId,
          name: `Terminal ${terminals.length + 1}`,
          output: [],
          command: '',
          isLoading: false,
          process: null
        };
        
        setTerminals(prev => [...prev, newTerminal]);
        setActiveTerminalId(newId);
        terminalRefs.current[newId] = null;
        setTerminalVisible(true);
      }
      
      // Ctrl+Shift+W to close the current terminal
      if (e.ctrlKey && e.shiftKey && e.key === 'w') {
        closeTerminal(activeTerminalId);
      }
      
      // Ctrl+L to clear the current terminal (like in bash/zsh)
      if (e.ctrlKey && e.key === 'l' && terminalVisible) {
        // Clear terminal output directly instead of calling clearTerminal
        setTerminals(prev => prev.map(terminal => 
          terminal.id === activeTerminalId
            ? { ...terminal, output: [{ type: 'system', content: 'Terminal cleared' }] }
            : terminal
        ));
        e.preventDefault(); // Prevent browser's "select address bar" action
      }
      
      // Alt+1, Alt+2, etc. to switch between terminals
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index < terminals.length) {
          switchToTerminal(terminals[index].id);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTerminalVisible, closeTerminal, switchToTerminal, terminals, activeTerminalId, terminalVisible]);

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <main className="h-screen w-screen flex">
      {/* Add a style tag for SVG icons */}
      <style jsx="true">{`
        svg {
          display: inline-block;
          vertical-align: middle;
          fill: currentColor;
        }
        .terminal-button svg,
        .preview-button svg {
          stroke: currentColor;
          stroke-width: 2;
          fill: none;
        }
      `}</style>
      
      {/* Left Side */}
      <section
        className="left relative flex flex-col h-full bg-slate-700"
        style={{ width: `${messageBoxWidth}%` }}
      >
        {/* Project Header */}
        <header className="flex items-center justify-between p-4 w-full bg-slate-200">
          <h1 className="text-2xl font-bold">{location.state?.name || 'Project'}</h1>
          <div className="flex items-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-2xl font-bold ml-auto mr-2"
          >
            <i className="ri-user-add-fill"></i>
          </button>
          <button
            className="text-2xl font-bold"
            onClick={() => setSidePanel(true)}
          >
            <i className="ri-group-fill"></i>
          </button>
          </div>
        </header>

        {/* Conversation Area */}
        <div className="conversation-area flex-grow overflow-y-auto flex flex-col">
          {/* Message Box */}
          <div
            ref={messageBoxRef}
            className="message-box flex-grow overflow-y-auto p-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {messages.map((msg, index) => (
              <div key={index} className={msg.type}>
                {msg.type === "incoming" ? (
                  <div className="incoming flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
                    <small className="opacity-65 text-xs">{msg.sender}</small>
                    <div className="p-2 whitespace-pre-wrap break-words">
                      {msg.sender === "AI"
                        ? renderAIMessage(msg.message)
                        : msg.message}
                    </div>
                  </div>
                ) : (
                  <div className="outgoing flex flex-col p-2 bg-slate-50 w-fit rounded-xl ml-auto">
                    <small className="opacity-65 text-xs">{msg.sender}</small>
                    <p className="p-2">{msg.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="input-field w-full flex items-center justify-between bg-white p-2">
            <textarea
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) {
                    return; // Let default behavior handle new line
                  } else if (message.trim()) {
                    e.preventDefault();
                    sendSomeMessage(message);
                    // Reset textarea height
                    e.target.style.height = "40px";
                  }
                }
              }}
              className="px-4 p-2 rounded-xl outline-none bg-white w-full mr-2 resize-none overflow-hidden"
              style={{
                minHeight: "40px",
                height: "40px",
              }}
              rows={1}
              onInput={(e) => {
                e.target.style.height = "40px";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
            <button
              onClick={() => {
                if (message.trim()) {
                  sendSomeMessage(message);
                  // Reset textarea height when sending via button
                  const textarea = document.querySelector("textarea");
                  if (textarea) textarea.style.height = "40px";
                }
              }}
              className="send-button bg-[#25D366] text-white p-2 px-4 rounded-[1vw] hover:bg-[#128C7E]"
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        {/* Side Panel */}
        <div
          className={`side-panel w-full h-full bg-slate-300 flex flex-col transition-all duration-300 absolute ${
            sidePanel ? "left-0" : "-left-full"
          }`}
        >
          <header className="flex items-center justify-between p-4 w-full bg-slate-200">
            <h1 className="text-2xl font-bold">Project Details</h1>
            <button
              className="text-2xl font-bold"
              onClick={() => setSidePanel(!sidePanel)}
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className="users flex flex-col gap-2 p-4">
            {project?.users
              ?.filter((projectUser) => projectUser.email !== user.email)
              .map((projectUser) => (
                <div
                  key={projectUser._id}
                  className="user flex items-center gap-2 cursor-pointer hover:bg-slate-400 p-2 rounded-xl bg-slate-200"
                >
                  <div className="aspect-square rounded-full p-2 bg-slate-400 flex items-center justify-center">
                    <i className="ri-user-fill text-white"></i>
                  </div>
                  <h1 className="font-semibold text-lg font-sans">
                    {projectUser.email || "No email"}
                  </h1>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Resize Handle */}
      <div
        className="resize-handle w-2 h-full bg-gray-300 cursor-col-resize hover:bg-gray-400 active:bg-gray-500 z-10"
        onMouseDown={() => setIsResizing(true)}
      ></div>

      {/* Right Side */}
      {/* Content area (can be used for the main project content) */}
      <section className="right flex-grow h-full bg-white">
        {/* Content can be added here */}
        <div className="flex h-full">
          <div className="explorer w-1/5 h-full bg-slate-200">
            <div className="explorer-header p-2 border-b">
              <h1 className="font-bold">File Explorer</h1>
            </div>
            <div className="explorer-body overflow-y-auto" style={{ maxHeight: 'calc(100vh - 40px)' }}>
              <div className="file-tree p-2">
                {fileTree.length > 0 ? (
                  <div className="directory">
                    {/* Group files by directory */}
                    {(() => {
                      // Create a directory structure from flat file list
                      const dirStructure = {};
                      
                      // Process each file path into a nested structure
                      fileTree.forEach(file => {
                        const parts = file.filename.split('/');
                        let current = dirStructure;
                        
                        // Process each part of the path except the last (filename)
                        for (let i = 0; i < parts.length - 1; i++) {
                          const part = parts[i];
                          if (!current[part]) {
                            current[part] = { 
                              type: 'directory',
                              children: {} 
                            };
                          }
                          current = current[part].children;
                        }
                        
                        // Add the file to the current directory
                        const fileName = parts[parts.length - 1];
                        current[fileName] = { 
                          type: 'file',
                          data: file
                        };
                      });
                      
                      // Recursive function to render the directory structure
                      const renderDirectory = (dir, path = '', level = 0) => {
                        return Object.entries(dir).map(([name, item], index) => {
                          const currentPath = path ? `${path}/${name}` : name;
                          const paddingLeft = level * 12; // Increase padding for each level
                          
                          if (item.type === 'directory') {
                            return (
                              <div key={currentPath} className="directory-item">
                                <div 
                                  className="directory-name flex items-center py-1 hover:bg-slate-300 cursor-pointer"
                                  style={{ paddingLeft: `${paddingLeft}px` }}
                                >
                                  <i className="ri-folder-fill mr-1 text-yellow-600"></i>
                                  <span className="text-sm font-medium">{name}</span>
                                </div>
                                <div className="directory-children">
                                  {renderDirectory(item.children, currentPath, level + 1)}
                                </div>
                              </div>
                            );
                          } else if (item.type === 'file') {
                            return (
                              <div 
                                key={currentPath}
                                className="file-item flex items-center py-1 hover:bg-slate-300 cursor-pointer"
                                style={{ paddingLeft: `${paddingLeft}px` }}
                    onClick={() => {
                                  // Check if the file already exists in the file tree
                                  const existingFile = fileTree.find(f => f.filename === item.data.filename);
                                  
                                  if (existingFile) {
                                    // If it exists, use that version instead of the one from the message
                                    // This prevents overwriting any changes the user might have made
                                    if (!openFiles.some(f => f.filename === item.data.filename)) {
                                      setOpenFiles(prev => [...prev, existingFile]);
                                    }
                                    setCurrentFile(existingFile);
                                  } else {
                                    // If it doesn't exist, add it to the file tree first with proper flags
                                    const newFile = {
                                      ...item.data,
                                      hasUnsavedChanges: true,
                                      mountedToWebContainer: false
                                    };
                                    
                                    // Add to file tree
                                    setFileTree(prev => [...prev, newFile]);
                                    
                                    // Add to open files
                                    if (!openFiles.some(f => f.filename === item.data.filename)) {
                                      setOpenFiles(prev => [...prev, newFile]);
                                    }
                                    
                                    // Set as current file
                                    setCurrentFile(newFile);
                                  }
                                }}
                              >
                                {item.data.isSymlink ? (
                                  <i className="ri-link mr-1 text-blue-500"></i>
                                ) : (
                                  <i className="ri-file-fill mr-1 text-blue-600"></i>
                                )}
                                <span className="text-sm">{name}</span>
              </div>
                            );
                          }
                          return null;
                        });
                        
                      };
                      
                      // Render the root directory
                      return renderDirectory(dirStructure);
                    })()}
                  </div>
                ) : (
                  <div className="empty-state text-center py-4 text-gray-500">
                    <p>No files available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="code-editor w-4/5 h-full bg-slate-100 overflow-hidden flex flex-col">
            <div className="code-editor-header p-2 border-b flex items-center">
              <div className="flex-grow overflow-x-auto whitespace-nowrap">
              {openFiles.map((file, index) => (
                  <div
                  key={index}
                  className={`file-tree-item inline-block cursor-pointer p-1 mx-1 border border-black rounded ${
                    CurrentFile && CurrentFile.filename === file.filename
                      ? "bg-slate-400 text-white font-semibold"
                      : "bg-slate-200 hover:bg-slate-300"
                  }`}
                  onClick={() => {
                    setCurrentFile(file);
                  }}
                >
                    <div className="flex items-center">
                      <h1 className="font-bold text-sm">
                        {file.filename}
                        {file.hasUnsavedChanges && <span className="ml-1 text-red-500">*</span>}
                      </h1>
                      <div
                        className="ml-2 text-xs hover:text-red-500 focus:outline-none rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent div's onClick
                          handleCloseFile(file.filename);
                        }}
                        title="Close file"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCloseFile(file.filename);
                          }
                        }}
                      >
                        ✕
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center">
                {CurrentFile && CurrentFile.hasUnsavedChanges && (
                  <button
                    className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    onClick={() => saveFileChanges(CurrentFile)}
                    title="Save file (Ctrl+S)"
                  >
                    Save
                  </button>
                )}
                {openFiles.some(file => file.hasUnsavedChanges) && (
                  <button
                    className="ml-2 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                    onClick={saveAllChanges}
                    title="Save all files (Ctrl+Shift+S)"
                  >
                    Save All
                  </button>
                )}
              </div>
            </div>
            <div className="code-editor-body flex-grow overflow-hidden">
              {CurrentFile && (
                <div className="code-editor-content h-full overflow-auto">
                  <Editor
                    height="100%"
                    width="100%"
                    language={CurrentFile.language}
                    theme="vs-dark"
                    value={CurrentFile.content}
                    onChange={(value) => {
                      // Update the file content in the openFiles array
                      setOpenFiles(prev => 
                        prev.map(file => 
                          file.filename === CurrentFile.filename 
                            ? { ...file, content: value, hasUnsavedChanges: true } 
                            : file
                        )
                      );
                      
                      // Also update the CurrentFile
                      setCurrentFile(prev => ({
                        ...prev,
                        content: value,
                        hasUnsavedChanges: true
                      }));
                    }}
                    options={{
                      minimap: { enabled: true },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      automaticLayout: true,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Terminal and Preview Buttons */}
            <div className="absolute bottom-4 right-4 flex space-x-2 z-50">
              {/* Terminal Button */}
              <div className="fixed bottom-4 right-4 z-40">
                <button
                  className={`terminal-button w-12 h-12 rounded-full shadow-xl flex items-center justify-center ${
                    terminalVisible ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-700'
                  } text-white focus:outline-none border-2 border-gray-600`}
                  onClick={() => setTerminalVisible(!terminalVisible)}
                  title={terminalVisible ? "Hide Terminal" : "Show Terminal"}
                >
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                    </svg>
                    {terminals.length > 1 && (
                      <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {terminals.length}
                      </span>
                    )}
                  </div>
                </button>
              </div>
              
              <button
                className={`preview-button p-2 rounded-full shadow-xl ${isServerRunning ? 'bg-green-600 hover:bg-green-700 border-2 border-green-500' : 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500'} text-white flex items-center justify-center`}
                onClick={() => {
                  if (isServerRunning) {
                    setPreviewVisible(!previewVisible);
                  } else {
                    startServer();
                  }
                }}
                title={isServerRunning ? (previewVisible ? "Hide Preview" : "Show Preview") : "Start Server"}
                style={{ width: '44px', height: '44px' }}
              >
                {/* Simpler globe/server icon */}
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </button>
            </div>
            
            {/* Terminal */}
            {terminalVisible && (
              <div className="terminal-container fixed bottom-4 right-4 w-2/3 h-2/5 bg-gray-900 text-white rounded-lg shadow-2xl flex flex-col overflow-hidden z-50 border-2 border-gray-600">
                {/* Terminal header with tabs */}
                <div className="terminal-header flex items-center justify-between bg-gray-800 p-2 border-b border-gray-700">
                  <div className="terminal-tabs flex space-x-1 overflow-x-auto flex-grow">
                    {terminals.map(terminal => (
                      <div 
                        key={terminal.id}
                        className={`terminal-tab flex items-center px-3 py-1 rounded-t cursor-pointer ${
                          terminal.id === activeTerminalId 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        onClick={() => switchToTerminal(terminal.id)}
                      >
                        <span 
                          className="mr-2"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt('Enter new terminal name:', terminal.name);
                            if (newName) {
                              renameTerminal(terminal.id, newName);
                            }
                          }}
                          title="Double-click to rename"
                        >
                          {terminal.name}
                        </span>
                        {terminals.length > 1 && (
                          <button
                            className="text-gray-400 hover:text-white focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              closeTerminal(terminal.id);
                            }}
                            title="Close terminal"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className="new-terminal-btn px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 hover:text-white"
                      onClick={() => {
                        // Create a new terminal directly
                        const newId = `terminal-${terminals.length + 1}`;
                        const newTerminal = {
                          id: newId,
                          name: `Terminal ${terminals.length + 1}`,
                          output: [],
                          command: '',
                          isLoading: false,
                          process: null
                        };
                        
                        setTerminals(prev => [...prev, newTerminal]);
                        setActiveTerminalId(newId);
                        terminalRefs.current[newId] = null;
                      }}
                      title="New terminal"
                    >
                      +
                    </button>
                  </div>
                  <div className="terminal-controls flex space-x-2">
                    <button
                      className="terminal-control p-1 hover:bg-gray-700 rounded"
                      onClick={() => {
                        // Clear terminal output directly
                        setTerminals(prev => prev.map(terminal => 
                          terminal.id === activeTerminalId
                            ? { ...terminal, output: [{ type: 'system', content: 'Terminal cleared' }] }
                            : terminal
                        ));
                      }}
                      title="Clear terminal"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button
                      className="terminal-control p-1 hover:bg-gray-700 rounded"
                      onClick={() => {
                        showNotification(
                          <div>
                            <div className="font-bold mb-1">Terminal Keyboard Shortcuts:</div>
                            <div>Ctrl+` - Toggle terminal visibility</div>
                            <div>Ctrl+Shift+` - Create new terminal</div>
                            <div>Ctrl+Shift+W - Close current terminal</div>
                            <div>Ctrl+L - Clear current terminal</div>
                            <div>Alt+1, Alt+2, etc. - Switch between terminals</div>
                            <div className="mt-2 font-bold">Tips:</div>
                            <div>Double-click on terminal name to rename it</div>
                            <div>Click the + button to create a new terminal</div>
                            <div>Use the trash icon to clear terminal output</div>
                          </div>,
                          'info',
                          10000
                        );
                      }}
                      title="Keyboard shortcuts"
                    >
                      ?
                    </button>
                    <button
                      className="terminal-control p-1 hover:bg-gray-700 rounded"
                      onClick={() => setTerminalVisible(false)}
                      title="Hide terminal"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* Terminal content */}
                <div className="terminal-content flex-grow flex flex-col overflow-hidden">
                  {/* Terminal output */}
                  <div 
                    ref={el => terminalRefs.current[activeTerminalId] = el}
                    className="terminal-output flex-grow p-2 overflow-y-auto font-mono text-sm"
                    style={{ zIndex: 51 }}
                  >
                    {terminals.find(terminal => terminal.id === activeTerminalId)?.output.map((line, index) => (
                      <div key={index} className={`mb-1 ${
                        line.type === 'command' ? 'text-green-400' : 
                        line.type === 'error' ? 'text-red-400' : 
                        line.type === 'system' ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {line.type === 'command' ? `$ ${line.content}` : line.content}
                      </div>
                    ))}
                    {terminals.find(terminal => terminal.id === activeTerminalId)?.isLoading && (
                      <div className="loading-indicator text-yellow-400">
                        Processing...
                      </div>
                    )}
                  </div>
                  
                  {/* Terminal input */}
                  <div className="terminal-input flex items-center p-2 border-t border-gray-700">
                    <span className="text-green-400 mr-2">$</span>
                    <input
                      type="text"
                      className="flex-grow bg-transparent border-none outline-none text-white font-mono"
                      value={terminals.find(terminal => terminal.id === activeTerminalId)?.command || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTerminals(prev => prev.map(terminal => 
                          terminal.id === activeTerminalId 
                            ? { ...terminal, command: value }
                            : terminal
                        ));
                      }}
                      onKeyDown={(e) => {
                        const activeTerminal = terminals.find(terminal => terminal.id === activeTerminalId);
                        if (e.key === 'Enter' && activeTerminal?.command.trim() && !activeTerminal?.isLoading) {
                          runCommand(activeTerminal.command.trim());
                        }
                      }}
                      placeholder={terminals.find(terminal => terminal.id === activeTerminalId)?.isLoading ? "Command running..." : "Enter command..."}
                      disabled={terminals.find(terminal => terminal.id === activeTerminalId)?.isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Preview */}
            {previewVisible && previewUrl && (
              <div className="preview-container absolute top-16 right-4 w-2/3 h-2/3 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col z-40">
                <div className="preview-header bg-gray-800 p-2 flex justify-between items-center">
                  <span className="font-mono text-sm text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    {previewUrl}
                  </span>
                  <div className="flex items-center">
                    <button
                      className="text-gray-400 hover:text-white mr-2"
                      onClick={() => {
                        // Open in new tab
                        window.open(previewUrl, '_blank');
                      }}
                      title="Open in new tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5z" />
                      </svg>
                    </button>
                    <button
                      className="text-gray-400 hover:text-white"
                      onClick={() => setPreviewVisible(false)}
                      title="Close preview"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="preview-content flex-grow">
                  <iframe
                    src={previewUrl}
                    title="WebContainer Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="p-2"
              >
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
              {Array.isArray(users) && users.length > 0 ? (
                users
                  .filter((u) => u._id !== user?._id)
                  .map((user) => (
                    <div
                      key={user._id}
                      className={`user cursor-pointer hover:bg-slate-200 ${
                        selectedUserId.includes(user._id) ? "bg-slate-200" : ""
                      } p-2 flex gap-2 items-center`}
                      onClick={() => handleUserClick(user._id)}
                    >
                      <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                        <i className="ri-user-fill absolute"></i>
                      </div>
                      <h1 className="font-semibold text-lg">{user.email}</h1>
                    </div>
                  ))
              ) : (
                <p className="text-center text-gray-500">
                  No users found or loading... ({users?.length || 0} users)
                </p>
              )}
            </div>
            <button
              className="bg-slate-600 text-white p-2 rounded-md"
              onClick={addCollaborators}
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
