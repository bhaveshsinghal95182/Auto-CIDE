import React, { useContext, useState, useEffect } from "react";
import UserContext from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const user = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);

  useEffect(() => {
    axios.get("/projects/all").then((res) => {
      console.log(res.data.projects);
      setProject(res.data.projects);
    })
      .catch((err) => console.log(err));
  }, []);

  function handleModalOpen() {
    setIsModalOpen(true);
  }

  async function handleCreateProject(e) {
    e.preventDefault();
    const response = await axios.post("/projects/create", {
      name: projectName,
    }).then((res) => {
      console.log(res);
    })
      .catch((err) => console.log(err));

    setIsModalOpen(false);
    setProjectName("");
  }

  const navigate = useNavigate();

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Projects</h1>
        <p className="text-gray-600">Create and manage your coding projects</p>
      </div>

      <div className="projects grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <button
          onClick={handleModalOpen}
          className="project p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
            <i className="ri-add-line text-2xl text-blue-600"></i>
          </div>
          <span className="text-lg font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300">New Project</span>
        </button>

        {project.map((project) => (
          <div key={project._id}
            onClick={() => navigate(`/project`, { state: project })}
            className="project p-6 border border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">{project.name}</h2>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <i className="ri-folder-fill text-xl text-gray-600"></i>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <i className="ri-team-fill"></i>
              <p className="text-sm">{project.users.length} members</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-[480px] shadow-xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Project</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
