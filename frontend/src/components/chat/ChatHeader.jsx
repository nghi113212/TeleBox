import React from 'react'

const ChatHeader = ({ selectedChat, onOpenSidebar, onDeleteChat, isDeleting, onShowGroupInfo }) => {
  const isGroup = selectedChat?.raw?.isGroup
  const memberCount = selectedChat?.raw?.members?.length || 0

  return (
    <div className="p-3 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Avatar */}
        <div 
          className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden cursor-pointer ${
            isGroup ? 'bg-gradient-to-br from-green-400 to-blue-500' : 'bg-gray-300'
          }`}
          onClick={isGroup ? onShowGroupInfo : undefined}
        >
          {selectedChat.avatar ? (
            <img 
              src={selectedChat.avatar} 
              alt={selectedChat.name} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <span className={`font-semibold ${isGroup ? 'text-white' : 'text-gray-600'}`}>
              {selectedChat.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        {/* User/Group Info */}
        <div 
          className={isGroup ? 'cursor-pointer' : ''}
          onClick={isGroup ? onShowGroupInfo : undefined}
        >
          <div className="flex items-center space-x-2">
            <h2 className="font-semibold text-gray-900">{selectedChat.name}</h2>
            {isGroup && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Nhóm
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {isGroup ? `${memberCount} thành viên` : 'Online'}
          </p>
        </div>

        <div className="ml-auto flex items-center space-x-2">
          {isGroup && (
            <button
              onClick={onShowGroupInfo}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
              title="Thông tin nhóm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDeleteChat}
            disabled={isDeleting}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Xóa cuộc trò chuyện"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m-4 0h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatHeader
