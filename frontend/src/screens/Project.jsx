import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage,
  socketInstance,
} from "../config/socket";
import UserContext from "../context/user.context";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [sidePanel, setSidePanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [project, setProject] = useState(null);
  const [projectId, setProjectId] = useState(location.state._id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messageBoxRef = useRef(null);
  const [messageBoxWidth, setMessageBoxWidth] = useState(20);
  const [isResizing, setIsResizing] = useState(false);

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

    receiveMessage("project-message", (message) => {
      addMessage(message, "incoming");
    });

    // Cleanup socket connection on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [projectId, user, navigate]);

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
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleUserClick = (id) => {
    setSelectedUserId((prevIds) =>
      prevIds.includes(id)
        ? prevIds.filter((uid) => uid !== id)
        : [...prevIds, id]
    );
  };

  const addCollaborators = () => {
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
  };

  const sendSomeMessage = (message) => {
    if (!user) {
      console.error("User is not logged in.");
      return;
    }

    if (!user._id) {
      console.error("User ID is not available:", user);
      return;
    }

    sendMessage("project-message", {
      message: message,
      sender: user.email,
      projectId: projectId,
    });

    addMessage({
      message: message,
      sender: user.email,
      projectId: projectId,
    }, "outgoing");

    setMessage("");
  };

  // New function to add messages to state
  const addMessage = (messageData, type) => {
    setMessages(prevMessages => [
      ...prevMessages, 
      { ...messageData, type }
    ]);
  };

  function scrollToBottom() {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }

  // Function to render AI message content
  const renderAIMessage = (messageContent) => {
    try {
      // Try to parse the message as JSON
      const parsedMessage = JSON.parse(messageContent);
      
      // Check if it has the expected structure
      if (parsedMessage.text && parsedMessage.code?.filetree) {
        return (
          <div className="ai-message-container">
            {/* Text part */}
            <div className="text-part mb-3">
              {parsedMessage.text}
            </div>
            
            {/* Code part - for each file in filetree */}
            {parsedMessage.code.filetree.map((file, fileIndex) => {
              // Determine language from file extension or language field
              let language = 'text';
              
              // Check if language is specified directly
              if (file.language) {
                language = file.language;
              } else {
                // Try to determine from filename extension
                const extension = file.filename.split('.').pop();
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
              }
              
              return (
                <div key={fileIndex} className="code-file mb-4">
                  <div className="file-header bg-gray-800 text-white text-xs px-3 py-1 rounded-t-md flex justify-between items-center">
                    <span>{file.filename}</span>
                    <span className="language-badge px-2 py-0.5 bg-gray-700 rounded text-xs">
                      {language}
                    </span>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: '0.375rem',
                      borderBottomRightRadius: '0.375rem',
                    }}
                  >
                    {file.content}
                  </SyntaxHighlighter>
                </div>
              );
            })}
            
            {/* Build Commands Section */}
            {parsedMessage.buildcommands && Array.isArray(parsedMessage.buildcommands) && parsedMessage.buildcommands.length > 0 && (
              <div className="build-commands mt-4">
                <div className="build-header bg-gray-800 text-white text-xs px-3 py-1 rounded-t-md flex justify-between items-center">
                  <span>Build Commands</span>
                  <span className="language-badge px-2 py-0.5 bg-gray-700 rounded text-xs">
                    shell
                  </span>
                </div>
                <div className="commands-list">
                  {parsedMessage.buildcommands.map((command, cmdIndex) => (
                    <div key={cmdIndex} className={cmdIndex !== 0 ? "mt-2" : ""}>
                      <div className="command-number bg-gray-700 text-gray-300 text-xs px-2 py-0.5">
                        Command {cmdIndex + 1}
                      </div>
                      <SyntaxHighlighter
                        language="shell"
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                          borderBottomLeftRadius: cmdIndex === parsedMessage.buildcommands.length - 1 ? '0.375rem' : 0,
                          borderBottomRightRadius: cmdIndex === parsedMessage.buildcommands.length - 1 ? '0.375rem' : 0,
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
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <main className="h-screen w-screen flex">
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
                      {msg.sender === "AI" ? renderAIMessage(msg.message) : msg.message}
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
        className="resize-handle w-1 h-full bg-gray-300 cursor-col-resize hover:bg-gray-400 active:bg-gray-500"
        onMouseDown={() => setIsResizing(true)}
      ></div>

      {/* Content area (can be used for the main project content) */}
      <section className="right flex-grow h-full bg-white">
        {/* Content can be added here */}
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
              {console.log("Current users:", users)}
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
