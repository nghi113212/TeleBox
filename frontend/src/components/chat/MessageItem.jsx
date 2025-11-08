import React from 'react'

const MessageItem = ({ message, isGroup = false }) => {
  const isMyMessage = message.sender === 'me'
  const showSenderInfo = !isMyMessage && isGroup

  return (
    <div className={`flex items-end space-x-2 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for other's messages in group chats */}
      {showSenderInfo && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden border-2 border-white shadow-md mb-1 flex-shrink-0">
          {message.senderAvatar ? (
            <img 
              src={message.senderAvatar} 
              alt={message.senderName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className="text-white font-bold text-xs">
              {message.senderName?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col max-w-xs lg:max-w-md">
        {/* Sender name for group chats */}
        {showSenderInfo && (
          <p className="text-xs text-gray-600 mb-1 ml-1 font-semibold">
            {message.senderName || 'Unknown user'}
          </p>
        )}
        
        <div
          className={`px-4 py-2 rounded-lg shadow-sm ${
            isMyMessage
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
          }`}
        >
          <p className="text-sm break-words">{message.text}</p>
          <p className={`text-xs mt-1 ${
            isMyMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp}
          </p>
        </div>
      </div>

      {/* Placeholder for my messages to maintain alignment */}
      {isMyMessage && <div className="w-8"></div>}
    </div>
  )
}

export default MessageItem
