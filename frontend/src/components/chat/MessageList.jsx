import React from 'react'
import MessageItem from './MessageItem'

const DateSeparator = ({ date }) => (
  <div className="flex items-center justify-center my-4">
    <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full shadow-sm">
      {date}
    </div>
  </div>
)

const MessageList = ({ messages = [], isLoading = false, listRef, isGroup = false }) => {
  // Track which date separators have been shown
  const renderMessagesWithDateSeparators = () => {
    let lastDateKey = null
    const elements = []

    messages.forEach((message, index) => {
      // Get date key, fallback to index-based key if missing
      const currentDateKey = message.dateKey || `unknown-${index}`
      const dateSeparatorText = message.dateSeparator || ''
      
      // Show date separator when date changes (and we have valid date info)
      if (currentDateKey !== lastDateKey && dateSeparatorText) {
        elements.push(
          <DateSeparator 
            key={`date-${currentDateKey}`} 
            date={dateSeparatorText} 
          />
        )
        lastDateKey = currentDateKey
      }

      elements.push(
        <MessageItem 
          key={message.id || `msg-${index}`} 
          message={message}
          isGroup={isGroup}
        />
      )
    })

    return elements
  }

  return (
    <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          Đang tải tin nhắn...
        </div>
      ) : messages.length > 0 ? (
        renderMessagesWithDateSeparators()
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên!
        </div>
      )}
    </div>
  )
}

export default MessageList
