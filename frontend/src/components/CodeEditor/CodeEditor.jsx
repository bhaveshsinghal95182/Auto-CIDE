import React from 'react';
import PropTypes from 'prop-types';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({
  currentFile,
  openFiles,
  onFileChange,
  onFileSelect,
  onFileClose,
  onFileSave,
  onSaveAll
}) => {
  return (
    <div className="code-editor w-full h-full bg-slate-100 overflow-hidden flex flex-col">
      <div className="code-editor-header p-2 border-b flex items-center">
        <div className="flex-grow overflow-x-auto whitespace-nowrap">
          {openFiles.map((file, index) => (
            <div
              key={index}
              className={`file-tab inline-block cursor-pointer p-1 mx-1 border border-black rounded ${
                currentFile && currentFile.filename === file.filename
                  ? "bg-slate-400 text-white font-semibold"
                  : "bg-slate-200 hover:bg-slate-300"
              }`}
              onClick={() => onFileSelect(file)}
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
                    onFileClose(file.filename);
                  }}
                  title="Close file"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onFileClose(file.filename);
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
          {currentFile && currentFile.hasUnsavedChanges && (
            <button
              className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
              onClick={() => onFileSave(currentFile)}
              title="Save file (Ctrl+S)"
            >
              Save
            </button>
          )}
          {openFiles.some(file => file.hasUnsavedChanges) && (
            <button
              className="ml-2 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
              onClick={onSaveAll}
              title="Save all files (Ctrl+Shift+S)"
            >
              Save All
            </button>
          )}
        </div>
      </div>
      <div className="code-editor-body flex-grow overflow-hidden">
        {currentFile ? (
          <div className="code-editor-content h-full overflow-auto">
            <Editor
              height="100%"
              width="100%"
              language={currentFile.language}
              theme="vs-dark"
              value={currentFile.content}
              onChange={(value) => onFileChange(currentFile.filename, value)}
              options={{
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                fontSize: 14,
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No file selected</p>
          </div>
        )}
      </div>
    </div>
  );
};

CodeEditor.propTypes = {
  currentFile: PropTypes.object,
  openFiles: PropTypes.array.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  onFileClose: PropTypes.func.isRequired,
  onFileSave: PropTypes.func.isRequired,
  onSaveAll: PropTypes.func.isRequired
};

export default CodeEditor; 