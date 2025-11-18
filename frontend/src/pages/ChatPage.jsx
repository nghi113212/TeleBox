import React, { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import LeftSidebar from '../components/layout/LeftSidebar'
import ChatSidebar from '../components/chat/ChatSidebar'
import ChatArea from '../components/chat/ChatArea'
import WelcomeScreen from '../components/chat/WelcomeScreen'
import CreateGroupModal from '../components/chat/CreateGroupModal'
import GroupInfoModal from '../components/chat/GroupInfoModal'
import apiClient from '../lib/apiClient.js'

// Dùng same-origin (nginx sẽ proxy /socket.io -> backend:8386)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

// API calls
const fetchChatRooms = async () => {
  const res = await apiClient.get('/chat/rooms')
  return res.data.rooms || []
}

const fetchRoomMessages = async (roomId) => {
  const res = await apiClient.get(`/chat/rooms/${roomId}/messages`, { params: { limit: 50 } })
  return res.data.messages || []
}

const searchUsersApi = async (term) => {
  if (!term?.trim()) return []
  const res = await apiClient.get('/chat/users', { params: { q: term.trim() } })
  return res.data.users || []
}

// Formatters
const formatName = (user) => {
  if (!user) return 'Unknown user'
  const { familyName = '', givenName = '' } = user.profile || {}
  const fullName = `${familyName} ${givenName}`.trim()
  return fullName || user.username || 'Unknown user'
}

const formatTimestamp = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const isToday = 
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString()
}

const buildConversation = (room, currentUserId) => {
  if (!room) return null
  const otherMembers = room.members?.filter((m) => m._id !== currentUserId) || []
  const primaryMember = room.isGroup ? null : otherMembers[0]
  const roomName = room.isGroup
    ? room.roomName || otherMembers.map(formatName).join(', ')
    : formatName(primaryMember)

  let lastMsgPrefix = ''
  if (room.lastMessage?.senderId?._id === currentUserId) {
    lastMsgPrefix = 'Bạn: '
  } else if (room.isGroup && room.lastMessage?.senderId) {
    // Show sender name in group chats for other people's messages
    lastMsgPrefix = `${formatName(room.lastMessage.senderId)}: `
  }
  const lastMsgText = room.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'

  // For groups, use groupAvatar if available, otherwise null for gradient
  // For direct chats, use the other person's avatar
  const avatar = room.isGroup 
    ? (room.groupAvatar || null)
    : (primaryMember?.profile?.imageUrl || null)

  return {
    id: room._id,
    name: roomName,
    lastMessage: `${lastMsgPrefix}${lastMsgText}`.trim(),
    timestamp: formatTimestamp(room.lastMessage?.createdAt || room.updatedAt),
    unread: room.unreadCount || 0,
    avatar: avatar,
    raw: room,
  }
}

const buildMessage = (message, currentUserId) => ({
  id: message._id,
  text: message.content,
  sender: message.senderId?._id === currentUserId ? 'me' : 'them',
  senderName: formatName(message.senderId),
  senderAvatar: message.senderId?.profile?.imageUrl || null,
  timestamp: formatTimestamp(message.createdAt),
  isRead: Boolean(message.isRead),
  senderId: message.senderId?._id,
})

const ChatPage = () => {
  const [selectedRoomId, setSelectedRoomId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [draftMessage, setDraftMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false)
  const [groupSearchTerm, setGroupSearchTerm] = useState('')
  const [groupSearchResults, setGroupSearchResults] = useState([])
  const [isGroupSearching, setIsGroupSearching] = useState(false)

  const queryClient = useQueryClient()
  const authUser = queryClient.getQueryData(['me'])
  const currentUserId = authUser?.userId

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['chatRooms'],
    queryFn: fetchChatRooms,
  })

  const selectedRoom = useMemo(
    () => rooms.find((r) => r._id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  )

  const conversations = useMemo(() => {
    return [...rooms]
      .sort((a, b) => {
        const aDate = new Date(a?.lastMessage?.createdAt || a?.updatedAt || 0)
        const bDate = new Date(b?.lastMessage?.createdAt || b?.updatedAt || 0)
        return bDate - aDate
      })
      .map((room) => buildConversation(room, currentUserId))
      .filter(Boolean)
  }, [rooms, currentUserId])

  const selectedConversation = useMemo(
    () => buildConversation(selectedRoom, currentUserId),
    [selectedRoom, currentUserId]
  )

  const directRoomByUserId = useMemo(() => {
    const map = new Map()
    rooms.forEach((room) => {
      if (room.isGroup) return
      const otherMember = room.members?.find((m) => m._id !== currentUserId)
      if (otherMember?._id) map.set(otherMember._id, room._id)
    })
    return map
  }, [rooms, currentUserId])

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedRoomId],
    queryFn: () => fetchRoomMessages(selectedRoomId),
    enabled: Boolean(selectedRoomId),
    refetchOnWindowFocus: false,
  })

  const messageListRef = useRef(null)
  const previousRoomIdRef = useRef(null)
  const messageCountRef = useRef(new Map())

  const formattedMessages = useMemo(
    () => messages.map((msg) => buildMessage(msg, currentUserId)),
    [messages, currentUserId]
  )

  // User search with debounce
  useEffect(() => {
    const trimmed = searchTerm.trim()
    if (!trimmed) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    let cancelled = false

    const timeoutId = setTimeout(async () => {
      try {
        const users = await searchUsersApi(trimmed)
        if (cancelled) return

        const results = users.map((user) => ({
          id: user?._id?.toString?.() ?? user?._id ?? '',
          username: user?.username || '',
          name: formatName(user),
          avatar: user?.profile?.imageUrl || null,
          existingRoomId: user?._id ? directRoomByUserId.get(user._id) || null : null,
        }))

        setSearchResults(results)
      } catch (error) {
        if (!cancelled) {
          console.error('User search failed:', error)
          setSearchResults([])
        }
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [searchTerm, directRoomByUserId])

  // Group user search with debounce
  useEffect(() => {
    const trimmed = groupSearchTerm.trim()
    if (!trimmed) {
      setGroupSearchResults([])
      setIsGroupSearching(false)
      return
    }

    setIsGroupSearching(true)
    let cancelled = false

    const timeoutId = setTimeout(async () => {
      try {
        const users = await searchUsersApi(trimmed)
        if (cancelled) return

        const results = users.map((user) => ({
          id: user?._id?.toString?.() ?? user?._id ?? '',
          username: user?.username || '',
          name: formatName(user),
          avatar: user?.profile?.imageUrl || null,
        }))

        setGroupSearchResults(results)
      } catch (error) {
        if (!cancelled) {
          console.error('Group user search failed:', error)
          setGroupSearchResults([])
        }
      } finally {
        if (!cancelled) setIsGroupSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [groupSearchTerm])

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: (roomId) => apiClient.post(`/chat/rooms/${roomId}/read`),
    onSuccess: ({ data }, roomId) => {
      const updatedIds = data?.messageIds || []
      if (updatedIds.length > 0) {
        queryClient.setQueryData(['messages', roomId], (prev = []) =>
          prev.map((msg) => (updatedIds.includes(msg._id) ? { ...msg, isRead: true } : msg))
        )
      }
      queryClient.setQueryData(['chatRooms'], (prev = []) =>
        prev.map((room) => (room._id === roomId ? { ...room, unreadCount: 0 } : room))
      )
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: ({ roomId, content }) => apiClient.post(`/chat/rooms/${roomId}/messages`, { content }),
    onSuccess: ({ data }, variables) => {
      const newMessage = data?.message
      if (!newMessage) return

      queryClient.setQueryData(['messages', variables.roomId], (prev = []) => {
        if (prev.some((msg) => msg._id === newMessage._id)) return prev
        return [...prev, newMessage]
      })

      queryClient.setQueryData(['chatRooms'], (prev = []) =>
        prev.map((room) =>
          room._id === variables.roomId
            ? { ...room, lastMessage: newMessage, unreadCount: 0 }
            : room
        )
      )
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: ({ memberId }) => apiClient.post('/chat/rooms', { memberIds: [memberId], isGroup: false }),
    onSuccess: ({ data }) => {
      const room = data?.room
      if (!room) return

      queryClient.setQueryData(['chatRooms'], (prev = []) => {
        const idx = prev.findIndex((r) => r._id === room._id)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = room
          return next
        }
        return [room, ...prev]
      })

      setSelectedRoomId(room._id)
      setSidebarOpen(false)
      setSearchTerm('')
      setSearchResults([])
      setIsSearching(false)
    },
    onError: (err) => console.error('Create room failed:', err),
  })

  const createGroupMutation = useMutation({
    mutationFn: async ({ roomName, memberIds, groupAvatar }) => {
      const formData = new FormData()
      formData.append('isGroup', 'true')
      formData.append('roomName', roomName)
      memberIds.forEach((id) => formData.append('memberIds[]', id))
      
      if (groupAvatar) {
        formData.append('groupAvatar', groupAvatar)
      }

      return apiClient.post('/chat/rooms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: ({ data }) => {
      const room = data?.room
      if (!room) return

      queryClient.setQueryData(['chatRooms'], (prev = []) => {
        const idx = prev.findIndex((r) => r._id === room._id)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = room
          return next
        }
        return [room, ...prev]
      })

      setSelectedRoomId(room._id)
      setShowCreateGroupModal(false)
      setGroupSearchTerm('')
      setGroupSearchResults([])
      setIsGroupSearching(false)
    },
    onError: (err) => {
      console.error('Create group failed:', err)
      alert('Không thể tạo nhóm. Vui lòng thử lại!')
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: (roomId) => apiClient.delete(`/chat/rooms/${roomId}`),
    onSuccess: ({ data }, roomId) => {
      const deletedId = data?.roomId || roomId
      if (!deletedId) return

      queryClient.setQueryData(['chatRooms'], (prev = []) => prev.filter((r) => r._id !== deletedId))
      queryClient.removeQueries({ queryKey: ['messages', deletedId], exact: true })
      messageCountRef.current?.delete?.(deletedId)
      setSelectedRoomId((curr) => (curr === deletedId ? null : curr))
    },
    onError: (err) => console.error('Delete room failed:', err),
  })

  const updateGroupAvatarMutation = useMutation({
    mutationFn: async ({ roomId, avatarFile }) => {
      const formData = new FormData()
      formData.append('groupAvatar', avatarFile)
      return apiClient.put(`/chat/rooms/${roomId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: ({ data }) => {
      const updatedRoom = data?.room
      if (!updatedRoom) return

      // Update in chat rooms list
      queryClient.setQueryData(['chatRooms'], (prev = []) =>
        prev.map((room) => (room._id === updatedRoom._id ? updatedRoom : room))
      )
    },
    onError: (err) => {
      console.error('Update avatar failed:', err)
      alert('Không thể cập nhật ảnh đại diện. Vui lòng thử lại!')
    },
  })

  // Auto-mark as read when viewing messages
  useEffect(() => {
    if (!selectedRoomId || !messages.length || !currentUserId) return
    const hasUnread = messages.some((msg) => msg.sender?._id !== currentUserId && !msg.isRead)
    if (hasUnread && !markReadMutation.isPending) {
      markReadMutation.mutate(selectedRoomId)
    }
  }, [messages, selectedRoomId, currentUserId, markReadMutation])

  // Auto-scroll
  const scrollToBottom = (force = false) => {
    const container = messageListRef.current
    if (!container) return

    const nearBottom = force || container.scrollHeight - container.scrollTop - container.clientHeight < 100
    if (nearBottom) container.scrollTop = container.scrollHeight
  }

  useEffect(() => {
    if (!selectedRoomId) {
      previousRoomIdRef.current = null
      return
    }

    const countMap = messageCountRef.current
    const prevCount = countMap.get(selectedRoomId) ?? 0
    const newCount = formattedMessages.length

    const isNewRoom = previousRoomIdRef.current !== selectedRoomId
    const isInitialLoad = prevCount === 0 && newCount > 0

    previousRoomIdRef.current = selectedRoomId
    countMap.set(selectedRoomId, newCount)

    if (isNewRoom || isInitialLoad) {
      scrollToBottom(true)
    } else {
      scrollToBottom()
    }
  }, [formattedMessages, selectedRoomId])

  // Socket.io
  const socketRef = useRef(null)
  const selectedRoomRef = useRef(selectedRoomId)
  const currentUserRef = useRef(currentUserId)
  const markReadRef = useRef(() => {})

  useEffect(() => { selectedRoomRef.current = selectedRoomId }, [selectedRoomId])
  useEffect(() => { currentUserRef.current = currentUserId }, [currentUserId])
  useEffect(() => {
    markReadRef.current = () => {
      const roomId = selectedRoomRef.current
      if (roomId && !markReadMutation.isPending) {
        markReadMutation.mutate(roomId)
      }
    }
  }, [markReadMutation])

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    const handleNewMessage = ({ roomId, message }) => {
      if (!roomId || !message) return

      const currentRoomId = selectedRoomRef.current
      const userId = currentUserRef.current

      queryClient.setQueryData(['messages', roomId], (prev = []) => {
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })

      let roomFound = false
      queryClient.setQueryData(['chatRooms'], (prev = []) =>
        prev.map((room) => {
          if (room._id !== roomId) return room
          roomFound = true
          const isOwn = message.senderId?._id === userId
          const unread = roomId === currentRoomId && !isOwn ? 0 : isOwn ? room.unreadCount || 0 : (room.unreadCount || 0) + 1
          return { ...room, lastMessage: message, unreadCount: unread }
        })
      )

      if (!roomFound) queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      if (roomId === currentRoomId && message.senderId?._id !== userId) markReadRef.current()
    }

    const handleRoomCreated = ({ room }) => {
      if (!room) return
      queryClient.setQueryData(['chatRooms'], (prev = []) => {
        if (prev.some((r) => r._id === room._id)) return prev
        return [room, ...prev]
      })
      socketRef.current?.emit('joinRoom', room._id)
    }

    const handleMessagesRead = ({ roomId, readerId, messageIds }) => {
      if (!roomId || !Array.isArray(messageIds) || !messageIds.length) return
      const userId = currentUserRef.current

      queryClient.setQueryData(['messages', roomId], (prev = []) =>
        prev.map((msg) => (messageIds.includes(msg._id) ? { ...msg, isRead: true } : msg))
      )

      if (readerId === userId) {
        queryClient.setQueryData(['chatRooms'], (prev = []) =>
          prev.map((room) => (room._id === roomId ? { ...room, unreadCount: 0 } : room))
        )
      }
    }

    const handleRoomDeleted = ({ roomId }) => {
      if (!roomId) return
      messageCountRef.current?.delete?.(roomId)
      queryClient.setQueryData(['chatRooms'], (prev = []) => prev.filter((r) => r._id !== roomId))
      queryClient.removeQueries({ queryKey: ['messages', roomId], exact: true })
      setSelectedRoomId((curr) => (curr === roomId ? null : curr))
    }

    const handleRoomUpdated = ({ room }) => {
      if (!room) return
      queryClient.setQueryData(['chatRooms'], (prev = []) =>
        prev.map((r) => (r._id === room._id ? room : r))
      )
    }

    socket.on('message:new', handleNewMessage)
    socket.on('room:created', handleRoomCreated)
    socket.on('messages:read', handleMessagesRead)
    socket.on('room:deleted', handleRoomDeleted)
    socket.on('room:updated', handleRoomUpdated)

    return () => {
      socket.off('message:new', handleNewMessage)
      socket.off('room:created', handleRoomCreated)
      socket.off('messages:read', handleMessagesRead)
      socket.off('room:deleted', handleRoomDeleted)
      socket.off('room:updated', handleRoomUpdated)
      socket.disconnect()
    }
  }, [queryClient])

  useEffect(() => {
    if (socketRef.current && selectedRoomId) {
      socketRef.current.emit('joinRoom', selectedRoomId)
      return () => socketRef.current?.emit('leaveRoom', selectedRoomId)
    }
  }, [selectedRoomId])

  // Handlers
  const clearSearchState = () => {
    setSearchTerm('')
    setSearchResults([])
    setIsSearching(false)
  }

  const handleSelectUser = (user) => {
    if (!user) return
    if (user.existingRoomId) {
      setSelectedRoomId(user.existingRoomId)
      setSidebarOpen(false)
      clearSearchState()
      return
    }
    if (!createRoomMutation.isPending) {
      createRoomMutation.mutate({ memberId: user.id })
    }
  }

  const handleSelectChat = (conversation) => {
    setSelectedRoomId(conversation?.id || null)
    setSidebarOpen(false)
    clearSearchState()
  }

  const handleDeleteConversation = () => {
    if (!selectedRoomId || deleteRoomMutation.isPending) return
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return
    deleteRoomMutation.mutate(selectedRoomId)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!draftMessage.trim() || !selectedRoomId || sendMessageMutation.isPending) return
    sendMessageMutation.mutate(
      { roomId: selectedRoomId, content: draftMessage.trim() },
      { onSuccess: () => setDraftMessage('') }
    )
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'chat') {
      setSelectedRoomId(null)
      clearSearchState()
    }
  }

  const handleCreateGroup = (groupData) => {
    if (!createGroupMutation.isPending) {
      createGroupMutation.mutate(groupData)
    }
  }

  const handleShowGroupInfo = () => {
    if (selectedConversation?.raw?.isGroup) {
      setShowGroupInfoModal(true)
    }
  }

  const handleUpdateGroupAvatar = (avatarFile) => {
    if (!selectedRoomId || updateGroupAvatarMutation.isPending) return
    updateGroupAvatarMutation.mutate({
      roomId: selectedRoomId,
      avatarFile: avatarFile,
    })
  }

  const renderMainContent = () => {
    if (activeTab === 'settings') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">Configure your preferences</p>
          </div>
        </div>
      )
    }

    return (
      <>
        <ChatSidebar
          conversations={conversations}
          selectedChat={selectedConversation}
          onSelectChat={handleSelectChat}
          sidebarOpen={sidebarOpen}
          onCloseSidebar={() => setSidebarOpen(false)}
          isLoading={roomsLoading}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchResults={searchResults}
          onSelectUser={handleSelectUser}
          isSearching={isSearching || createRoomMutation.isPending}
          onCreateGroup={() => setShowCreateGroupModal(true)}
        />

        {selectedConversation ? (
          <ChatArea
            selectedChat={selectedConversation}
            messages={formattedMessages}
            message={draftMessage}
            onMessageChange={setDraftMessage}
            onSendMessage={handleSendMessage}
            onOpenSidebar={() => setSidebarOpen(true)}
            isLoading={messagesLoading}
            isSending={sendMessageMutation.isPending}
            listRef={messageListRef}
            onDeleteChat={handleDeleteConversation}
            isDeleting={deleteRoomMutation.isPending}
            onShowGroupInfo={handleShowGroupInfo}
          />
        ) : (
          <WelcomeScreen onOpenSidebar={() => setSidebarOpen(true)} />
        )}

        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroup}
          searchTerm={groupSearchTerm}
          onSearchTermChange={setGroupSearchTerm}
          searchResults={groupSearchResults}
          isSearching={isGroupSearching || createGroupMutation.isPending}
        />

        <GroupInfoModal
          isOpen={showGroupInfoModal}
          onClose={() => setShowGroupInfoModal(false)}
          group={selectedConversation}
          currentUserId={currentUserId}
          onUpdateAvatar={handleUpdateGroupAvatar}
          isUpdatingAvatar={updateGroupAvatarMutation.isPending}
        />
      </>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <LeftSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={{
          name: formatName(authUser),
          avatar: authUser?.profile?.imageUrl || null,
          about: authUser?.profile?.about ?? 'Hey there! I am using TeleBox.',
          phone: authUser?.profile?.phone || '',
        }}
      />
      {renderMainContent()}
    </div>
  )
}

export default ChatPage
