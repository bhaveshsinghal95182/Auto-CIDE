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
  const messageBox = React.createRef();

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
      appendIncomingMessage(message);
    });

    // Cleanup socket connection on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [projectId, user, navigate]);

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

    appendOutgoingMessage({
      message: message,
      sender: user.email,
      projectId: projectId,
    });

    setMessage("");
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  function appendIncomingMessage(message) {
    scrollToBottom();
    const messageBox = document.querySelector(".message-box");
    const messageElement = document.createElement("div");
    messageElement.classList.add("incoming");
    messageElement.innerHTML = `<div class="incoming flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
    <small class="opacity-65 text-xs">${message.sender}</small>
    <p class="p-2">${message.message}</p>
    </div>`;
    messageBox.appendChild(messageElement);
  }

  function appendOutgoingMessage(message) {
    const messageBox = document.querySelector(".message-box");
    const messageElement = document.createElement("div");
    messageElement.classList.add("outgoing");
    messageElement.innerHTML = `<div class="outgoing flex flex-col p-2 bg-slate-50 w-fit rounded-xl ml-auto">
    <small class="opacity-65 text-xs">${message.sender}</small>
    <p class="p-2">${message.message}</p>
    </div>`;
    messageBox.appendChild(messageElement);
    scrollToBottom();
  }

  function scrollToBottom() {
    const messageBox = document.querySelector(".message-box");
    if (messageBox) {
      messageBox.scrollTop = messageBox.scrollHeight;
    }
  }

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full w-1/5 bg-slate-700">
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
            ref={messageBox}
            className="message-box flex-grow overflow-y-auto p-2 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          ></div>
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
