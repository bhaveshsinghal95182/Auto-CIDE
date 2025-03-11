import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ChatPanel.css';

const ChatPanel = ({
  messages,
  message,
  onMessageChange,
  onSendMessage,
  renderMessage,
  width,
  onResizeStart,
  user
}) => {
  const messageBoxRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; // Let default behavior handle new line
      } else if (message.trim()) {
        e.preventDefault();
        onSendMessage(message);
        // Reset textarea height
        e.target.style.height = "40px";
      }
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    e.target.style.height = "40px";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <section className="chat-panel h-full" style={{ width: `${width}%` }}>
      {/* Header */}
      <header className="chat-header flex items-center justify-between p-4 bg-slate-200">
        <h1 className="text-2xl font-bold">Chat</h1>
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
                      ? renderMessage(msg.message)
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
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            className="px-4 p-2 rounded-xl outline-none bg-white w-full mr-2 resize-none overflow-hidden"
            style={{
              minHeight: "40px",
              height: "40px",
            }}
            rows={1}
          />
          <button
            onClick={() => {
              if (message.trim()) {
                onSendMessage(message);
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

      {/* Resize Handle */}
      <div
        className="resize-handle w-2 h-full bg-gray-300 cursor-col-resize hover:bg-gray-400 active:bg-gray-500 z-10 absolute right-0 top-0"
        onMouseDown={onResizeStart}
      ></div>
    </section>
  );
};

ChatPanel.propTypes = {
  messages: PropTypes.array.isRequired,
  message: PropTypes.string.isRequired,
  onMessageChange: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  renderMessage: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  onResizeStart: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
};

export default ChatPanel; 