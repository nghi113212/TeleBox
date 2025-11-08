import React from 'react'

const ConversationItem = ({ conversation, isSelected, onSelect }) => {
  const isGroup = conversation?.raw?.isGroup
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors ${
        isSelected ? 'bg-gray-300 border-l-4 border-l-green-500' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-sm ${
          isGroup 
            ? 'bg-gradient-to-br from-green-400 to-blue-500 border-green-300' 
            : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-200'
        }`}>
          {conversation.avatar ? (
            <img 
              src={conversation.avatar} 
              alt={conversation.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className={`font-bold text-lg ${isGroup ? 'text-white' : 'text-gray-700'}`}>
              {conversation.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {conversation.name}
              </h3>
              {isGroup && (
                <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded flex-shrink-0">
                  Nhóm
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {conversation.timestamp}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 truncate">
              {conversation.lastMessage}
            </p>
                    {conversation.unread > 0 && (
              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationItem
