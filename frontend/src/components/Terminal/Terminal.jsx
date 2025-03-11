import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Terminal.css';

const Terminal = ({
  terminals,
  activeTerminalId,
  onSwitchTerminal,
  onRenameTerminal,
  onCloseTerminal,
  onCreateTerminal,
  onRunCommand,
  visible,
  onToggleVisibility
}) => {
  const terminalRefs = useRef({});
  const inputRef = useRef(null);

  // Scroll to bottom when terminal output changes
  useEffect(() => {
    if (visible && activeTerminalId && terminalRefs.current[activeTerminalId]) {
      const terminalOutput = terminalRefs.current[activeTerminalId];
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }, [visible, activeTerminalId, terminals]);

  // Focus input when terminal becomes visible or active terminal changes
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible, activeTerminalId]);

  // Get the active terminal
  const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0];

  // Handle key down in the input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      onRunCommand(activeTerminalId, e.target.value.trim());
      e.target.value = '';
    }
  };

  if (!visible) return null;

  return (
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
              onClick={() => onSwitchTerminal(terminal.id)}
            >
              <span 
                className="mr-2"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const newName = prompt('Enter new terminal name:', terminal.name);
                  if (newName) {
                    onRenameTerminal(terminal.id, newName);
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
                    onCloseTerminal(terminal.id);
                  }}
                  title="Close terminal"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="terminal-actions flex space-x-2">
          <button
            className="p-1 rounded hover:bg-gray-700 focus:outline-none"
            onClick={onCreateTerminal}
            title="New terminal"
          >
            +
          </button>
          <button
            className="p-1 rounded hover:bg-gray-700 focus:outline-none"
            onClick={onToggleVisibility}
            title="Close terminal panel"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Terminal output */}
      <div 
        className="terminal-output flex-grow p-2 overflow-y-auto font-mono text-sm"
        ref={el => {
          if (el && activeTerminalId) {
            terminalRefs.current[activeTerminalId] = el;
          }
        }}
      >
        {activeTerminal && activeTerminal.output.map((line, index) => (
          <div key={index} className={`terminal-line ${line.type}`}>
            {line.content}
          </div>
        ))}
      </div>
      
      {/* Terminal input */}
      <div className="terminal-input-container flex items-center p-2 border-t border-gray-700">
        <span className="terminal-prompt mr-2">$</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input flex-grow bg-transparent border-none outline-none text-white font-mono"
          placeholder="Type a command..."
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

Terminal.propTypes = {
  terminals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      output: PropTypes.arrayOf(
        PropTypes.shape({
          type: PropTypes.string.isRequired,
          content: PropTypes.string.isRequired
        })
      ).isRequired
    })
  ).isRequired,
  activeTerminalId: PropTypes.string,
  onSwitchTerminal: PropTypes.func.isRequired,
  onRenameTerminal: PropTypes.func.isRequired,
  onCloseTerminal: PropTypes.func.isRequired,
  onCreateTerminal: PropTypes.func.isRequired,
  onRunCommand: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
  onToggleVisibility: PropTypes.func.isRequired
};

export default Terminal; 