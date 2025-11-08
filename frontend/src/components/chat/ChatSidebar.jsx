import React from 'react'
import ConversationList from './ConversationList'

const ChatSidebar = ({ 
  conversations = [], 
  selectedChat, 
  onSelectChat, 
  sidebarOpen, 
  onCloseSidebar, 
  isLoading = false,
  searchTerm = '',
  onSearchTermChange = () => {},
  searchResults = [],
  onSelectUser = () => {},
  isSearching = false,
  onCreateGroup = () => {},
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onCloseSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`w-80 bg-gray-50 border-r border-gray-300 flex flex-col fixed lg:relative inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        {/* Header */}
        <div className="p-5 border-b border-gray-300 bg-gray-700 text-white flex items-center justify-between">
          <h1 className="text-xl font-bold">Chat</h1>
          <button
            onClick={onCreateGroup}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            title="Tạo nhóm mới"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-300 bg-gray-100">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Tìm kiếm theo email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Conversations / Search Results */}
        <div className="flex-1 overflow-y-auto">
          {searchTerm.trim() ? (
            isSearching ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Đang tìm kiếm người dùng...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-200 flex items-center space-x-3 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-sm">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-700 font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                        {user.existingRoomId && (
                          <span className="text-xs text-green-600 font-medium">Đã trò chuyện</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 px-4 text-center">
                Không tìm thấy người dùng nào. Thử từ khóa khác nhé!
              </div>
            )
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Đang tải hội thoại...
            </div>
          ) : conversations.length > 0 ? (
            <ConversationList
              conversations={conversations}
              selectedChat={selectedChat}
              onSelectChat={onSelectChat}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 p-4 text-center">
              Không có hội thoại nào. Hãy bắt đầu cuộc trò chuyện mới!
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ChatSidebar
