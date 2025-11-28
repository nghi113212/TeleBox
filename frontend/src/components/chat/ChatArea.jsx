import React from 'react'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

const ChatArea = ({ 
  selectedChat, 
  messages, 
  message, 
  onMessageChange, 
  onSendMessage, 
  onOpenSidebar,
  isLoading = false,
  isSending = false,
  listRef,
  onDeleteChat,
  isDeleting = false,
  onShowGroupInfo,
  onCloseChat,
}) => {
  const isGroup = selectedChat?.raw?.isGroup || false

  return (
    <div className="flex-1 flex flex-col lg:ml-0">
      <ChatHeader 
        selectedChat={selectedChat} 
        onOpenSidebar={onOpenSidebar} 
        onDeleteChat={onDeleteChat} 
        isDeleting={isDeleting}
        onShowGroupInfo={onShowGroupInfo}
        onCloseChat={onCloseChat}
      />
      
      <MessageList messages={messages} isLoading={isLoading} listRef={listRef} isGroup={isGroup} />
      
      <MessageInput
        message={message}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        isSending={isSending}
      />
    </div>
  )
}

export default ChatArea
