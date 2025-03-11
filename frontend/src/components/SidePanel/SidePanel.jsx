import React from 'react';
import PropTypes from 'prop-types';
import './SidePanel.css';

const SidePanel = ({
  project,
  users,
  visible,
  onClose,
  currentUser
}) => {
  if (!visible) return null;

  return (
    <div className={`side-panel w-full h-full bg-slate-300 flex flex-col transition-all duration-300 absolute ${
      visible ? 'left-0' : '-left-full'
    }`}>
      <header className="flex items-center justify-between p-4 w-full bg-slate-200">
        <h1 className="text-2xl font-bold">Project Details</h1>
        <button
          className="text-2xl font-bold"
          onClick={onClose}
        >
          <i className="ri-close-fill"></i>
        </button>
      </header>

      {project && (
        <div className="project-details p-4">
          <h2 className="text-xl font-semibold mb-2">Project Information</h2>
          <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
            <p><strong>Name:</strong> {project.name}</p>
            <p><strong>Created:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
            <p><strong>Description:</strong> {project.description || 'No description'}</p>
          </div>
        </div>
      )}

      <div className="users flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold mb-2">Collaborators</h2>
        {users
          .filter((projectUser) => projectUser.email !== currentUser.email)
          .map((projectUser) => (
            <div
              key={projectUser._id}
              className="user flex items-center gap-2 cursor-pointer hover:bg-slate-400 p-2 rounded-xl bg-slate-200"
            >
              <div className="aspect-square rounded-full p-2 bg-slate-400 flex items-center justify-center">
                <i className="ri-user-fill text-white"></i>
              </div>
              <div className="user-info">
                <h3 className="font-semibold text-lg font-sans">
                  {projectUser.name || projectUser.email || "No email"}
                </h3>
                {projectUser.name && <p className="text-sm text-gray-600">{projectUser.email}</p>}
              </div>
            </div>
          ))}
        
        {/* Current user */}
        <div className="user flex items-center gap-2 p-2 rounded-xl bg-blue-100 border border-blue-300">
          <div className="aspect-square rounded-full p-2 bg-blue-400 flex items-center justify-center">
            <i className="ri-user-fill text-white"></i>
          </div>
          <div className="user-info">
            <h3 className="font-semibold text-lg font-sans">
              {currentUser.name || currentUser.email || "You"}
              <span className="ml-2 text-sm bg-blue-500 text-white px-2 py-0.5 rounded-full">You</span>
            </h3>
            {currentUser.name && <p className="text-sm text-gray-600">{currentUser.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

SidePanel.propTypes = {
  project: PropTypes.object,
  users: PropTypes.array.isRequired,
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired
};

export default SidePanel; 