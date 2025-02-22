import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Project = () => {
  const location = useLocation();
  console.log(location.state);
  const [sidePanel, setSidePanel] = useState(false);

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full w-1/5 bg-slate-700">
        {/* Project Header */}
        <header className="flex items-center justify-between p-4 w-full bg-slate-200">
          <h1 className="text-2xl font-bold">{location.state.name}</h1>
          <button
            className="text-2xl font-bold"
            onClick={() => setSidePanel(!sidePanel)}
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
          className={`side-panel w-full h-full bg-slate-300 flex flex-col transition-all duration-3000 absolute top-0 left-[-100%] ${
            sidePanel ? "left-0" : ""
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
    </main>
  );
};

export default Project;
