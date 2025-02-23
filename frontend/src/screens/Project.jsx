import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../config/axios";

const Project = () => {
  const location = useLocation();
  const [sidePanel, setSidePanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("/users/all")
    .then((res) => {
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        console.error("Unexpected data format:", res.data);
        setUsers([]);
      }
    })
    .catch((err) => {
      console.error("API Error:", err);
      setUsers([]);
    });
  }, []);

  const handleUserClick = (id) => {
    setSelectedUserId((prevIds) =>
      prevIds.includes(id) ? prevIds.filter((uid) => uid !== id) : [...prevIds, id]
    );
  };
  
  // console log the selected users
  // useEffect(() => {
  //   console.log("Updated selected users:", selectedUserId);
  // }, [selectedUserId]);

  const addCollaborators = () => {
    axios.put("/projects/add-user", {
      projectId: location.state._id,
      users: selectedUserId,
    })
    .then((res) => {
      console.log(res);
      setIsModalOpen(false);
    })
    .catch((err) => {
      console.log(err);
    });
  };

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
          <div className="message-box flex-grow overflow-y-auto p-2">
            <div className="incoming flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="p-2">Lorem ipsum dolor sit amet.</p>
            </div>
            <div className="outgoing ml-auto flex flex-col p-2 bg-slate-50 w-fit rounded-xl">
              <small className="opacity-65 text-xs">example@gmail.com</small>
              <p className="p-2">Lorem ipsum dolor sit amet.</p>
            </div>
          </div>
          <div className="input-field w-full flex items-center justify-between bg-white p-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="px-4 p-2 rounded-full outline-none bg-white w-full mr-2"
            />
            <button className="send-button bg-[#25D366] text-white p-2 px-4 rounded-[1vw] hover:bg-[#128C7E]">
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

          <div className="users flex flex-col gap-2">
            <div className="user flex items-center gap-2 cursor-pointer hover:bg-slate-400 p-2 rounded-xl">
              <div className="aspect-square rounded-full p-2 bg-slate-400">
                <i className="ri-user-fill "></i>
              </div>
              <h1 className="font-semibold text-lg font-sans">username</h1>
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
              {users && Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                  <div
                    key={user._id}
                    className={`user cursor-pointer hover:bg-slate-200 ${
                      Array.from(selectedUserId).indexOf(user._id) !== -1
                        ? "bg-slate-200"
                        : ""
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
                  No users found or loading...
                </p>
              )}
            </div>
            <button className="bg-slate-600 text-white p-2 rounded-md" onClick={addCollaborators}>
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
