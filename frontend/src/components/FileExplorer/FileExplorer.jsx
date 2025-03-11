import React from 'react';
import PropTypes from 'prop-types';
import './FileExplorer.css';

const FileExplorer = ({ 
  fileTree, 
  onFileClick, 
  onCreateFile, 
  onDeleteFile 
}) => {
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
            className="file-item flex items-center py-1 hover:bg-slate-300 cursor-pointer group"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => onFileClick(item.data)}
          >
            {item.data.isSymlink ? (
              <i className="ri-link mr-1 text-blue-500"></i>
            ) : (
              <i className="ri-file-fill mr-1 text-blue-600"></i>
            )}
            <span className="text-sm">{name}</span>
            <div className="flex-grow"></div>
            {/* Delete button */}
            <button
              type="button"
              className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(item.data.filename, e);
              }}
              title="Delete file"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        );
      }
      return null;
    });
  };

  // Create a directory structure from flat file list
  const createDirectoryStructure = () => {
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
    
    return dirStructure;
  };

  return (
    <div className="explorer w-full h-full bg-slate-200 flex flex-col">
      <div className="explorer-header p-2 border-b flex justify-between items-center">
        <h1 className="font-bold">File Explorer</h1>
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
          onClick={onCreateFile}
          title="Create new file"
        >
          <i className="ri-add-line"></i>
        </button>
      </div>
      <div className="explorer-body overflow-y-auto" style={{ maxHeight: 'calc(100vh - 40px)' }}>
        <div className="file-tree p-2">
          {fileTree.length > 0 ? (
            <div className="directory">
              {renderDirectory(createDirectoryStructure())}
            </div>
          ) : (
            <div className="empty-state text-center py-4 text-gray-500">
              <p>No files available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

FileExplorer.propTypes = {
  fileTree: PropTypes.array.isRequired,
  onFileClick: PropTypes.func.isRequired,
  onCreateFile: PropTypes.func.isRequired,
  onDeleteFile: PropTypes.func.isRequired
};

export default FileExplorer; 