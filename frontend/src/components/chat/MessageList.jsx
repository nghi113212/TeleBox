import React from 'react'
import MessageItem from './MessageItem'

const MessageList = ({ messages = [], isLoading = false, listRef, isGroup = false }) => {
  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Đang tải tin nhắn...
        </div>
      ) : messages.length > 0 ? (
        messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message}
            isGroup={isGroup}
          />
        ))
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên!
        </div>
      )}
    </div>
  )
}

export default MessageList
