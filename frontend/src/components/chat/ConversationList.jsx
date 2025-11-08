import React from 'react'
import ConversationItem from './ConversationItem'

const ConversationList = ({ conversations, selectedChat, onSelectChat }) => {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedChat?.id === conversation.id}
          onSelect={() => onSelectChat(conversation)}
        />
      ))}
    </div>
  )
}

export default ConversationList
