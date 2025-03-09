import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  socketInstance,
} from "../config/socket";
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
  const [projectId, setProjectId] = useState(location.state._id);

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

  // Web Containers
  const [webContainer, setWebContainer] = useState([]);
  
  // First useEffect to handle user authentication
  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
      }
    }
  }, [user, navigate]);

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

    // Initialize socket with projectId
    initializeSocket(projectId);

    // Existing project fetch
    axios
      .get(`/projects/get-project/${projectId}`)
      .then((res) => {
        setProject(res.data.project);
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
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
    receiveMessage("project-message", handleProjectMessage);

    // Cleanup socket connection on unmount
    return () => {
      if (socketInstance) {
        // Remove the specific event handler
        socketInstance.off("project-message", handleProjectMessage);
        socketInstance.disconnect();
      }
    };
  }, [projectId, user, navigate]);

  // Add useEffect to handle filetree updates from AI messages
  useEffect(() => {
    // Process messages to extract filetree data
    const aiMessages = messages.filter(msg => msg.sender === "AI");
    if (aiMessages.length > 0) {
      try {
        // Get the latest AI message
        const latestMessage = aiMessages[aiMessages.length - 1];
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
          
          // Update the file tree state
          if (processedFiles.length > 0) {
            setFileTree(processedFiles);
          }
        }
      } catch (e) {
        // Ignore parsing errors
        console.log("Error processing AI message for filetree:", e);
      }
    }
  }, [messages]);

  // Helper function to detect language from filename
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

    // Send the message with context to the server
    sendMessage("project-message", {
      message: serverMessage,
      sender: user.email,
      projectId: projectId,
    });

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
                            // Add file to openFiles if not already there
                            if (!openFiles.some(f => f.filename === file.filename)) {
                              setOpenFiles(prev => [...prev, file]);
                            }
                            // Set as current file
                            setCurrentFile(file);
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
  }, [openFiles, detectLanguageFromFilename]);

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

  // Add a function to save file changes
  const saveFileChanges = useCallback((file) => {
    if (!file || !file.hasUnsavedChanges) return;
    
    console.log(`Saving changes to ${file.filename}`);
    
    // Send the updated file content to the backend
    axios.post('/api/files/save', {
      projectId,
      filename: file.filename,
      content: file.content
    })
    .then(response => {
      console.log('File saved successfully:', response.data);
      
      // Update the UI to show it's saved
      setOpenFiles(prev => 
        prev.map(f => 
          f.filename === file.filename 
            ? { ...f, hasUnsavedChanges: false } 
            : f
        )
      );
      
      if (CurrentFile && CurrentFile.filename === file.filename) {
        setCurrentFile(prev => ({
          ...prev,
          hasUnsavedChanges: false
        }));
      }
      
      // Show a save confirmation
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
      el.textContent = `${file.filename} saved successfully!`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    })
    .catch(error => {
      console.error('Error saving file:', error);
      
      // Show an error notification
      const el = document.createElement('div');
      el.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      el.textContent = `Error saving ${file.filename}. Please try again.`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    });
  }, [CurrentFile, projectId]);

  // Add a function to save all files with unsaved changes
  const saveAllChanges = useCallback(() => {
    // Get all files with unsaved changes
    const unsavedFiles = openFiles.filter(file => file.hasUnsavedChanges);
    
    if (unsavedFiles.length === 0) return;
    
    // Create an array of promises for saving each file
    const savePromises = unsavedFiles.map(file => {
      return axios.post('/api/files/save', {
        projectId,
        filename: file.filename,
        content: file.content
      });
    });
    
    // Wait for all files to be saved
    Promise.all(savePromises)
      .then(responses => {
        console.log('All files saved successfully:', responses);
        
        // Update the UI to show all files are saved
        setOpenFiles(prev => 
          prev.map(file => ({ ...file, hasUnsavedChanges: false }))
        );
        
        if (CurrentFile) {
          setCurrentFile(prev => ({
            ...prev,
            hasUnsavedChanges: false
          }));
        }
        
        // Show a save confirmation
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        el.textContent = `All files saved successfully!`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      })
      .catch(error => {
        console.error('Error saving files:', error);
        
        // Show an error notification
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        el.textContent = `Error saving files. Please try again.`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 3000);
      });
  }, [openFiles, CurrentFile, projectId]);

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

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <main className="h-screen w-screen flex">
      {/* Left Side */}
      <section
        className="left relative flex flex-col h-full bg-slate-700"
        style={{ width: `${messageBoxWidth}%` }}
      >
        {/* Project Header */}
        <header className="flex items-center justify-between p-4 w-full bg-slate-200">
          <h1 className="text-2xl font-bold">{location.state.name}</h1>
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
                                  // Add file to openFiles if not already there
                                  if (!openFiles.some(f => f.filename === item.data.filename)) {
                                    setOpenFiles(prev => [...prev, item.data]);
                                  }
                                  // Set as current file
                                  setCurrentFile(item.data);
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
                        role="button"
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
